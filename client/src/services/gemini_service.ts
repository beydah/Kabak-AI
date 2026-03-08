import { GoogleGenerativeAI } from '@google/generative-ai';
// @ts-ignore
import { GoogleGenAI } from "@google/genai";
import { ProductInput, Accessory, BgOption, ApiLog, I_Product_Data } from '../types/interfaces';
import { ModelService, AIModel } from './model_service';
import { F_Build_Imagen_Prompt, F_Get_Negative_Prompt, F_Build_Structured_Prompt } from '../utils/prompt_utils';
import { F_Optimize_Base64_For_Imagen } from '../utils/image_utils';

const LOGS_STORAGE_KEY = 'kabak_ai_logs';

// Singleton Instance Holder
let instance: GeminiService | null = null;

export type I_Generated_Video_Result = {
    playback_url: string;
    source_uri: string;
    fetch_url: string;
    video_blob: Blob;
};

export class GeminiService {
    private ai: GoogleGenerativeAI;
    private apiKey: string;
    private modelService: ModelService;

    constructor() {
        this.apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
        if (!this.apiKey) console.error("FATAL: VITE_GEMINI_API_KEY is missing!");

        this.ai = new GoogleGenerativeAI(this.apiKey);
        this.modelService = ModelService.getInstance();

        console.log("[GeminiService] Initialized (Strict Gemini 2.0 Flash Mode)");
    }

    public static getInstance(): GeminiService {
        if (!instance) {
            instance = new GeminiService();
        }
        return instance;
    }

    // --- GÃ–REV 1 & 2: GÃ–RSEL ÃœRETÄ°M (Gemini 3 Pro Image Preview) ---
    async generateProductOnModel(input: ProductInput): Promise<string> {
        return this.modelService.executeWithFailover('image', async () => {
            let attempt = 0;
            const maxAttempts = 2;
            let currentFeedback = "";
            let lastImage = "";

            while (attempt < maxAttempts) {
                attempt++;
                console.log(`[GeminiService] Generation Attempt ${attempt} (Feedback: ${currentFeedback ? 'YES' : 'NONE'})...`);

                const productBase64 = input.frontImage?.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
                if (!productBase64) throw new Error("Input Image Missing");

                let prompt = `Dress the mannequin with the garment from the provided raw_front_img file.
                
                MANDATORY CONFIGURATION:
                - Gender: ${input.gender}
                - Model Age: ${input.age}
                - Body Type: ${input.fit}
                - Product Fit: ${input.productFit}
                - Background: ${input.backgroundColor}
                - Accessory: ${input.accessory}
                - Composition: Full-body shot (boydan Ã§ekim).
                - Aspect Ratio: Vertical 3:4 (Portrait).
                
                CRITICAL OUTFIT LOGIC:
                - COMPLETE THE LOOK: If the product is a top (shirt, jacket), YOU MUST generate matching bottom wear (pants/skirt) and shoes.
                - If the product is bottoms, generate a matching top and shoes.
                - The style should be cohesive and fashionable.
                
                CRITICAL VISUAL INSTRUCTION:
                1. The model MUST be a **HYPER-REALISTIC LIVING HUMAN**.
                2. Skin texture must be natural with pores and imperfections.
                3. EYES must be focused and lifelike.
                4. HAIR must be detailed and realistic.
                5. NO PLASTIC/SHINY SKIN. NO MANNEQUIN JOINTS.
                
                NEGATIVE PROMPT: 
                **PLASTIC MANNEQUIN, ARTIFICIAL SKIN, DOLL, GHOST, HEADLESS, CARTOON, SKETCH, BLURRY FACE, DISTORTED EYES, BAD HANDS, MISSING LIMBS, CROPPED HEAD.**
                Do not use standard store mannequins. The result must look like a high-end fashion magazine photo with a real person.`;

                if (currentFeedback) {
                    prompt += `\n\nCRITICAL FIX INSTRUCTION: The previous generation failed Quality Control. 
                    REASON: ${currentFeedback}. 
                    YOU MUST FIX THIS. Ensure the model is a REAL HUMAN.`;
                }

                const genModel = this.ai.getGenerativeModel({ model: 'models/gemini-3-pro-image-preview' });

                // Prepare inputs (Standard or Retry with Feedback)
                // For retry, we still use the original raw image as source, but with new prompt 
                // OR we could do I2I on the failed image if we wanted to "fix" it, 
                // but usually regenerating from scratch with better prompt is safer for "Ghost" issues.
                // Let's stick to regenerating from Raw Input with Feedback for now to avoid degradation.
                const inputParts: any[] = [{ text: prompt }];

                // If this is a retry and we want to do I2I on the FAILED image to fix it?
                // The plan said: "Input: v1 (The failed image)".
                // Let's try to include the FAILED v1 as context if available, 
                // BUT 'gemini-3-pro' might get confused with 2 images (Raw + Failed).
                // Let's stick to Raw Input + Stronger Prompt for stability first.
                inputParts.push({ inlineData: { data: productBase64, mimeType: 'image/jpeg' } });

                const result = await genModel.generateContent(inputParts);
                const response = await result.response;

                let generatedBase64 = "";

                // Extract Image
                if (result.response.candidates && result.response.candidates[0].content && result.response.candidates[0].content.parts) {
                    const parts = result.response.candidates[0].content.parts;
                    const imagePart = parts.find((p: any) => p.inlineData && p.inlineData.data);
                    if (imagePart && imagePart.inlineData) {
                        generatedBase64 = `data:${imagePart.inlineData.mimeType || 'image/jpeg'};base64,${imagePart.inlineData.data}`;
                    }
                }

                if (!generatedBase64) {
                    try {
                        const text = response.text();
                        const match = text.match(/([A-Za-z0-9+/]{100,})/);
                        if (match && match[0].length > 1000) generatedBase64 = `data:image/jpeg;base64,${match[0]}`;
                    } catch (e) { /* Ignore */ }
                }

                if (!generatedBase64) {
                    // If generation failed completely, throw (will be caught by executeWithFailover or outer try)
                    // But here we are inside executeWithFailover.
                    throw new Error("Gemini 3 Pro Refused/Returned No Image");
                }

                lastImage = generatedBase64;

                // QC Check
                console.log("[GeminiService] Running Quality Control...");
                const qc = await this.checkImageQuality(generatedBase64);

                if (qc.pass) {
                    console.log("[GeminiService] QC PASSED.");
                    return generatedBase64;
                } else {
                    console.warn(`[GeminiService] QC FAILED: ${qc.reason}`);
                    currentFeedback = qc.reason || "Unknown quality issue";

                    if (attempt >= maxAttempts) {
                        console.warn("[GeminiService] Max retries reached. Returning last generated image.");
                        return lastImage; // Return anyway
                    }
                    // Loop continues to Retry
                }
            }

            return lastImage;
        }, 'models/gemini-3-pro-image-preview');
    }

    // --- QC MODULE (Private) ---
    private async checkImageQuality(imageBase64: string): Promise<{ pass: boolean, reason?: string }> {
        try {
            const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
            const model = this.ai.getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `Analyze this fashion image strictly.
            1. Is the model a PHOTOREALISTIC REAL HUMAN? (Plastic mannequins, cartoons, sketches, headless bodies = FAIL).
            2. Are there any severe anatomical hallucinations (bad hands, missing limbs, distorted facial features)?
            3. Is the clothing garment clearly visible?

            Return JSON:
            {
              "is_real_human": boolean,
              "has_severe_errors": boolean,
              "pass": boolean, 
              "reason": "Short explanation of failure if pass is false"
            }`;

            const result = await model.generateContent([
                { text: prompt },
                { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }
            ]);

            const response = JSON.parse(result.response.text());
            return {
                pass: response.pass === true,
                reason: response.reason
            };

        } catch (e) {
            console.error("[GeminiService] QC Check Error (Bypassing):", e);
            return { pass: true }; // Allow pass on QC error to avoid blocking flow
        }
    }

    // --- GÃ–REV 3, 4 & 5: AKILLI SEO VE METÄ°N ÃœRETÄ°MÄ° (REVISED) ---
    async generateSEOContent(input: ProductInput, lang: string = 'tr'): Promise<{ title: string; description: string }> {
        return this.modelService.executeWithFailover('text', async () => {
            const genModel = this.ai.getGenerativeModel({
                model: 'gemini-2.5-flash', // Updated to 2.5 Flash as requested
                generationConfig: { responseMimeType: "application/json" }
            });

            const rawDesc = input.seo_context || "";

            // SMART EXTRACTION: Catch more patterns for Brand, Size, Defects
            const foundBrandMatch = rawDesc.match(/(Marka|Brand)\s*[:\-\s]?\s*([a-zA-Z0-9\s]+)/i);
            const foundSizeMatch = rawDesc.match(/(Beden|Size|Ã–lÃ§Ã¼)\s*[:\-\s]?\s*([a-zA-Z0-9\s/]+)/i);
            const foundDefectMatch = rawDesc.match(/(defo|leke|yÄ±rtÄ±k|kusur|defect|stain|tear)/i);
            const foundUsageMatch = rawDesc.match(/(yeni|etiketli|ikinci el|kullanÄ±lmÄ±ÅŸ|used|new)/i);

            // Extract the actual values or use regex matches directly if simple
            const brandVal = foundBrandMatch ? foundBrandMatch[2].trim() : "";
            const sizeVal = foundSizeMatch ? foundSizeMatch[2].trim() : "";
            const defectVal = foundDefectMatch ? foundDefectMatch[0].trim() : "";
            const usageVal = foundUsageMatch ? foundUsageMatch[0].trim() : "";

            const prompt = `You are a Senior E-commerce Copywriter and SEO Strategist.
            Task: Write a compelling, high-converting product description and title.
            
            INPUT DATA:
            - Raw Details: "${rawDesc}"
            - Product Fit: ${input.productFit}
            
            CRITICAL GUIDELINES:
            1. Title:
               - Max 5 words.
               - MUST include Brand (${brandVal}) and Size (${sizeVal}) if present.
               - Format: "[Brand] [Size] [Key Feature/Type]" (e.g., "Zara S Beden Ä°pek GÃ¶mlek").
            
            2. Description:
               - Length: ~500 characters.
               - Style: Focus on Comfort & Style. Storytelling approach.
               - Structure: Single engaging paragraph.
               - Tone: Professional, inviting, and trustworthy.
            
            3. MANDATORY INCLUSIONS (Data Preservation):
               ${defectVal ? `- WARNING: You MUST mention the defect ("${defectVal}") clearly but professionally.` : ""}
               ${brandVal ? `- Mention Brand: "${brandVal}".` : ""}
               ${sizeVal ? `- Mention Size: "${sizeVal}".` : ""}
            
            4. Formatting:
               - EMOJI RULE: Use exactly 5 emojis. Place them naturally BETWEEN sentences or clauses. NOT all at the end.
               - End with exactly 5 relevant hashtags.
            
            OUTPUT LANGUAGE: ${lang === 'tr' ? 'TÃ¼rkÃ§e' : 'English'}
            OUTPUT JSON: {"title": "...", "description": "..."}`;

            const result = await genModel.generateContent(prompt);
            return JSON.parse(result.response.text());
        }, 'gemini-2.5-flash'); // Explicitly track usage for SEO
    }

    // --- BACK VIEW (GEMINI 3 PRO - HIGH FIDELITY) ---
    async generateBackView(input: ProductInput, frontViewImage: string, seoContext?: string): Promise<string> {
        // Updated to use the same high-fidelity model as Front View
        const modelName = 'models/gemini-3-pro-image-preview';
        console.log(`[GeminiService] Generating Back View with ${modelName}...`);

        return this.modelService.executeWithFailover('image', async () => {
            let attempt = 0;
            const maxAttempts = 2;
            let currentFeedback = "";
            let lastImage = "";

            while (attempt < maxAttempts) {
                attempt++;
                console.log(`[GeminiService] Back View Attempt ${attempt}...`);

                // Validate Inputs
                const frontBase64 = frontViewImage.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
                const backBase64 = input.backImage?.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

                if (!frontBase64) throw new Error("Missing Front Generated Image for reference");

                const genModel = this.ai.getGenerativeModel({ model: modelName });

                let prompt = `Generate a high-fidelity studio photograph of the BACK VIEW of the mannequin/product.
                 
                 INPUTS:
                 - Image 1: The generated FRONT VIEW (Reference for style, lighting, mannequin details).
                 - Image 2: The RAW BACK IMAGE (Reference for product details like cuts, labels, patterns).
                 
                 MANDATORY CONFIGURATION:
                 - Composition: Full-body shot (boydan Ã§ekim), showing the mannequin from head to toe from the back.
                 - Aspect Ratio: Vertical 3:4 (Portrait).
                 - Consistency: The mannequin, lighting, and background MUST MATCH the Front View exactly.
                 
                 CRITICAL OUTPUT INSTRUCTION:
                 1. Return ONLY a binary image.
                 2. DO NOT include any text.
                 `;

                if (currentFeedback) {
                    prompt += `\n\nCRITICAL FIX INSTRUCTION: The previous generation failed Quality Control. 
                     REASON: ${currentFeedback}. 
                     YOU MUST FIX THIS. Ensure the model is a REALISTIC HUMAN and matches the front view style.`;
                }

                const parts: any[] = [{ text: prompt }];
                parts.push({ inlineData: { data: frontBase64, mimeType: 'image/jpeg' } });
                if (backBase64) parts.push({ inlineData: { data: backBase64, mimeType: 'image/jpeg' } });

                const result = await genModel.generateContent(parts);
                const response = await result.response;

                let generatedBase64 = "";

                // Extract
                if (result.response.candidates && result.response.candidates[0].content && result.response.candidates[0].content.parts) {
                    const parts = result.response.candidates[0].content.parts;
                    const imagePart = parts.find((p: any) => p.inlineData && p.inlineData.data);
                    if (imagePart && imagePart.inlineData) {
                        generatedBase64 = `data:${imagePart.inlineData.mimeType || 'image/jpeg'};base64,${imagePart.inlineData.data}`;
                    }
                }

                if (!generatedBase64) {
                    try {
                        const text = response.text();
                        const match = text.match(/([A-Za-z0-9+/]{100,})/);
                        if (match && match[0].length > 1000) generatedBase64 = `data:image/jpeg;base64,${match[0]}`;
                    } catch (e) { /* Ignore */ }
                }

                if (!generatedBase64) throw new Error("Back View Failed (No Image)");

                lastImage = generatedBase64;

                // QC Check
                console.log("[GeminiService] Running Quality Control (Back View)...");
                const qc = await this.checkImageQuality(generatedBase64);

                if (qc.pass) {
                    console.log("[GeminiService] QC PASSED.");
                    return generatedBase64;
                } else {
                    console.warn(`[GeminiService] QC FAILED: ${qc.reason}`);
                    currentFeedback = qc.reason || "Unknown quality issue";
                    if (attempt >= maxAttempts) return lastImage;
                }
            }
            return lastImage;
        }, 'models/gemini-3-pro-image-preview');
    }

    // --- VIDEO (Veo 3.1 Preview) ---
    async generateVideo(input: ProductInput, imageBase64: string): Promise<I_Generated_Video_Result> {
        console.log("[GeminiService] Generating Video with Veo 3.1 (New SDK)...");

        // @ts-ignore
        const ai = new GoogleGenAI({ apiKey: this.apiKey });

        const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        if (!cleanBase64 || cleanBase64.length < 100) {
            throw new Error("Input image is invalid or too short.");
        }

        console.log("[GeminiService] Video Generation Image Data Length:", cleanBase64.length);

        const textPrompt = 'High-end fashion commercial featuring the model from the image. FRONT VIEW ONLY. The model should slowly move or pose while facing forward. Fabric texture showcase. Cinematic lighting. DO NOT SHOW THE BACK SIDE. Focus on the front design.';

        try {
            const productImage = {
                imageBytes: cleanBase64,
                mimeType: 'image/jpeg',
            };

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-generate-preview',
                // @ts-ignore
                prompt: textPrompt,
                // @ts-ignore
                image: productImage,
                config: {
                    aspectRatio: '9:16',
                },
            });

            console.log('Waiting for video generation to complete...');
            while (operation.done !== true) {
                await new Promise((resolve) => setTimeout(resolve, 10000));
                // @ts-ignore
                operation = await ai.operations.getVideosOperation({ operation });
                console.log('Polling... Full Operation:', JSON.stringify(operation, null, 2));
            }

            // @ts-ignore
            if (operation.response?.raiMediaFilteredReasons) {
                // @ts-ignore
                const reasons = operation.response.raiMediaFilteredReasons.join(', ');
                throw new Error(`Video generation blocked by safety filters: ${reasons}`);
            }

            // @ts-ignore
            const uri = operation.response?.generatedVideos?.[0]?.video?.uri || operation.result?.response?.generatedVideos?.[0]?.video?.uri;
            if (!uri) {
                throw new Error('Video generation completed but no URI was returned.');
            }

            console.log('[GeminiService] Fetching video blob from URI:', uri);
            const fetchUrl = uri.includes('key=')
                ? uri
                : `${uri}${uri.includes('?') ? '&' : '?'}key=${this.apiKey}`;

            const res = await fetch(fetchUrl, { method: 'GET' });
            console.log('[GeminiService] Video Fetch Status:', res.status, res.statusText);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Video Fetch Error Body:', errorText);

                if (res.status === 403) {
                    const activationUrlMatch = errorText.match(/https?:\/\/[^\s"']+/);
                    if (activationUrlMatch) {
                        throw new Error(`Generative Language API is disabled for this project. Enable it: ${activationUrlMatch[0]}`);
                    }
                    throw new Error('Video fetch was denied (403). Check API enablement, key restrictions, and billing.');
                }

                throw new Error(`Failed to fetch video blob: ${res.status} ${res.statusText}`);
            }

            const contentType = res.headers.get('content-type');
            if (contentType && !contentType.startsWith('video/') && !contentType.startsWith('application/octet-stream')) {
                console.warn(`Unexpected Content-Type: ${contentType}. Continuing anyway.`);
            }

            const blob = await res.blob();
            return {
                playback_url: URL.createObjectURL(blob),
                source_uri: uri,
                fetch_url: fetchUrl,
                video_blob: blob
            };
        } catch (error) {
            console.error('Veo 3.1 Failed:', error);
            throw error;
        }
    }

    // Phase 2: Visual Analysis (Keep Flash)
    async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
        return this.modelService.executeWithFailover('image', async (model) => {
            // Flash is perfect for analysis
            const modelName = 'gemini-2.0-flash';
            console.log(`[GeminiService] ANALYZING with ${modelName}...`);
            const genModel = this.ai.getGenerativeModel({ model: modelName });
            const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

            const result = await genModel.generateContent([
                { text: prompt },
                { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }
            ]);
            return result.response.text();
        }, 'gemini-2.0-flash'); // Explicitly track I2I/Analysis usage
    }

    // --- HELPERS ---
    private async generateImagen(prompt: string): Promise<string> {
        // Updated to Imagen 4.0 Fast based on available models list
        const modelName = 'imagen-4.0-fast-generate-001';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${this.apiKey}`;

        console.log(`[GeminiService] Calling Imagen 4 (${modelName}) via REST...`);

        const payload = {
            instances: [{ prompt: prompt }],
            parameters: {
                sampleCount: 1,
                aspectRatio: "3:4",
                personGeneration: "allow_adult"
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Imagen 4 HTTP ${response.status}: ${errText}`);
            }

            const data = await response.json();

            // Imagen response parsing
            if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
                return `data:image/jpeg;base64,${data.predictions[0].bytesBase64Encoded}`;
            }

            throw new Error(`Imagen 4 No Image Data: ${JSON.stringify(data).slice(0, 100)}...`);

        } catch (e) {
            console.error("[GeminiService] Imagen 4 Failed:", e);
            throw e;
        }
    }

    // Phase 4/5: Pro Image Generation (Hybrid: Flash Logic -> Imagen 4 Pixels)
    async generateProImage(
        prompt: string,
        mainImageBase64: string,
        referenceImageBase64?: string
    ): Promise<string> {
        // We use Imagen 3 for the actual pixel generation
        return this.modelService.executeWithFailover('image', async () => {
            // We inject the "Description" of the input image into the prompt
            // because Imagen 3 (Public) is Text-to-Image.
            // The 'prompt' passed here is usually constructed from attributes.
            // Ideally we would double-check prompt quality.
            return this.generateImagen(prompt);
        }, 'imagen-4.0-fast'); // Explicitly track Imagen usage (if used)
    }
}

export const F_Generate_SEO_Content = async (p_product: I_Product_Data, lang: 'tr' | 'en', contextOverride?: string) => {
    const service = GeminiService.getInstance();
    const input: ProductInput = {
        gender: p_product.gender ? 'Kadın' : 'Erkek',
        age: p_product.age || '30',
        fit: p_product.vücut_tipi || 'Standart',
        productFit: p_product.kesim || 'Normal',
        backgroundColor: (p_product.background as BgOption) || BgOption.STUDIO,
        accessory: (p_product.aksesuar as Accessory) || Accessory.NONE,
        frontImage: p_product.raw_front,
        backImage: p_product.raw_back || '',
        seo_context: contextOverride || p_product.raw_desc // Use override if provided
    };
    const result = await service.generateSEOContent(input, lang);
    return { title: result.title, description: result.description, tags: [] };
};

export const F_Generate_Model_Image = async (p_product: I_Product_Data): Promise<string | null> => {
    const service = GeminiService.getInstance();
    const input: ProductInput = {
        gender: p_product.gender ? 'Kadın' : 'Erkek',
        age: p_product.age || '30',
        fit: p_product.vücut_tipi || 'Standart',
        productFit: p_product.kesim || 'Normal',
        backgroundColor: (p_product.background as BgOption) || BgOption.STUDIO,
        accessory: (p_product.aksesuar as Accessory) || Accessory.NONE,
        frontImage: p_product.raw_front,
        backImage: p_product.raw_back || ''
    };
    return await service.generateProductOnModel(input);
};

export const F_Generate_Video_Preview = async (p_product: I_Product_Data): Promise<I_Generated_Video_Result | null> => {
    const service = GeminiService.getInstance();
    return await service.generateVideo({} as any, p_product.model_front || p_product.raw_front);
};

export const F_Analyze_Image = async (image: string, prompt: string): Promise<string> => {
    const service = GeminiService.getInstance();
    return await service.analyzeImage(image, prompt);
};

export const F_Generate_Pro_Image = async (prompt: string, front: string, back?: string): Promise<string> => {
    const service = GeminiService.getInstance();
    return await service.generateProImage(prompt, front, back);
};

export const F_Generate_Back_View = async (p_product: I_Product_Data, front_view: string): Promise<string> => {
    const service = GeminiService.getInstance();
    const input: ProductInput = {
        gender: p_product.gender ? 'Kadın' : 'Erkek',
        age: p_product.age || '30',
        fit: p_product.vücut_tipi || 'Standart',
        productFit: p_product.kesim || 'Normal',
        backgroundColor: (p_product.background as BgOption) || BgOption.STUDIO,
        accessory: (p_product.aksesuar as Accessory) || Accessory.NONE,
        frontImage: p_product.raw_front,
        backImage: p_product.raw_back || ''
    };
    return await service.generateBackView(input, front_view);
};

