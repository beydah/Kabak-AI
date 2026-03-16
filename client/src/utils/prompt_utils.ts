
import { ProductInput, Accessory, BgOption } from '../types/interfaces';

interface TranslatedInput {
    gender: string;
    age: string;
    body_type: string;
    fit: string;
    background: string;
    accessory: string;
    description: string;
}

export const F_Translate_Inputs = (input: ProductInput): TranslatedInput => {
    // 1. Gender
    const gender = input.gender === 'Kadın' ? 'Female' : 'Male';

    // 2. Body Type (Vücut Tipi)
    let body_type = 'Average';
    const rawFit = input.fit.toLowerCase(); // 'fit' in input is actually body type? Checking interface...
    // Input interface says: fit: string; (mapped from 'vücut_tipi')
    // and productFit: string; (mapped from 'kesim')

    if (rawFit.includes('slim') || rawFit.includes('zayıf')) body_type = 'Slender';
    else if (rawFit.includes('plus') || rawFit.includes('büyük')) body_type = 'Curvy/Physique'; // Prompt Smoothing
    else body_type = 'Average';

    // 3. Clothing Fit (Kesim)
    let clothing_fit = 'Regular fit';
    const rawProdFit = input.productFit?.toLowerCase() || '';
    if (rawProdFit.includes('oversize') || rawProdFit.includes('bol')) clothing_fit = 'Oversized';
    else if (rawProdFit.includes('slim') || rawProdFit.includes('dar')) clothing_fit = 'Slim fit';

    // 4. Background
    let background = 'Studio lighting, solid color background';
    const bgInput = input.backgroundColor as string;
    const bgLower = bgInput.toLowerCase();

    // Mapping specific user requests
    if (bgLower === 'coffee' || bgLower === 'kahve') {
        background = 'Solid coffee brown studio background';
    } else if (bgInput === BgOption.URBAN || bgInput === 'urban') {
        background = 'New York city street/avenue, street-level sidewalk scene, natural daylight, no other people';
    } else if (bgInput === BgOption.LUXURY_CAFE || bgInput === 'cafe') {
        background = 'Brandless Starbucks-style cafe interior, warm ambient lighting, modern cafe, no logos, no branding, no text, no other people';
    } else if (bgInput === BgOption.ORANGE || bgInput === 'orange') {
        background = 'Solid orange studio background, professional lighting';
    } else if (bgInput === BgOption.BLACK || bgInput === 'black') {
        background = 'Solid black studio background, dramatic lighting';
    } else if (bgInput === BgOption.WHITE || bgInput === 'white') {
        background = 'Solid white studio background, high key lighting';
    } else if (bgInput === BgOption.STUDIO) {
        background = 'Professional studio background';
    }

    // 5. Accessory
    let accessory = '';
    const accInput = input.accessory as string;

    if (accInput === Accessory.BAG || accInput === 'bag' || accInput === 'Çanta') {
        accessory = gender === 'Male'
            ? 'holding a business briefcase'
            : 'holding a classic women\'s handbag';
    } else if (accInput === Accessory.GLASSES || accInput === 'glasses' || accInput === 'Güneş Gözlüğü') {
        accessory = 'wearing thin black frame glasses with triangular orange lenses, low height and normal width, frames complement the orange lenses, not square';
    } else if (accInput === Accessory.WALLET || accInput === 'wallet') {
        accessory = 'holding an open wallet filled with cash';
    } else if (accInput === Accessory.CAR_KEY || accInput === 'car_key') {
        accessory = 'holding a Maserati logo visible key fob';
    }

    return {
        gender,
        age: input.age,
        body_type,
        fit: clothing_fit,
        background,
        accessory,
        description: input.raw_desc || '' // Assuming raw_desc exists or passed in differently
    };
};

export const F_Get_Negative_Prompt = (): string => {
    return "deformed hands, blurry face, distorted textures, low resolution, watermark, text, messy background, background logos, background signage, background brand text, missing limbs, extra limbs, bad anatomy, cropped head, cropped body, cropped feet, partial body, seated pose, extra people, multiple people, crowd";
};

export const F_Smooth_Prompt = (prompt: string): string => {
    // Replace high-risk words
    let smoothed = prompt
        .replace(/Plus Size/gi, "Curvy/Full-figured")
        .replace(/\bModel\b/g, "Subject")
        .replace(/\bmodel\b/gi, "subject");

    return smoothed;
};

const getSubjectBlock = (t: TranslatedInput, view: 'front' | 'back' | 'side' = 'front'): string => {
    const viewDesc = view === 'back' ? 'seen from behind' : 'front view';
    return `Subject: ${t.gender} model, ${t.age} years old, ${t.body_type} physique, standing full-body (head-to-toe in frame), ${viewDesc}, single subject only, no other people.`;
};

const getApparelBlock = (t: TranslatedInput, seoDesc?: string): string => {
    // fidelity fix: use SEO description if available
    const productDesc = seoDesc
        ? `Wearing the exact following item: ${seoDesc}. The fabric texture, cut, and pattern must match the description perfectly.`
        : `Wearing: ${t.fit} clothing.`;

    return `${productDesc} Fit: ${t.fit}.`;
};

const getEnvironmentBlock = (t: TranslatedInput): string => {
    // Task 3: Absolute Background Hygiene (Studio Killer)
    const bg = t.background.toLowerCase();

    // Check key terms and colors
    if (bg.includes('solid') || bg.includes('studio') ||
        ['orange', 'black', 'white', 'grey', 'coffee', 'kahve', 'turuncu', 'siyah', 'beyaz'].some(c => bg.includes(c))) {

        // REMOVED: "Studio", "Lighting", "Professional", "Soft Shadows"
        return `Background: Abstract solid ${t.background} color field. 2D flat background. Seamless paper. No depth. No horizon. No shadows. No props.`;
    }
    return `Background: ${t.background}. Blurred depth-of-field. No other people.`;
};

export const F_Build_Structured_Prompt = (
    input: ProductInput,
    seoContext?: string,
    viewType: 'front' | 'back' = 'front'
): string => {
    const t = F_Translate_Inputs(input);

    // Task 2: "Fashion Director" Prompt Engineering (Multi-modal)
    // Structure: Header -> Demographics -> Fit -> Environment -> View -> Hygiene

    const header = `TASK: Professional Fashion Photography. Take the clothing item shown in IMAGE 1 and dress it onto a professional model.`;

    const demographics = `Model: ${t.age} year old ${t.gender}, ${t.body_type} physique, standing full-body (head-to-toe in frame), single subject only, no other people.`;

    const fit = `Fit: Ensure the item has a ${t.fit} look on the model as requested.`;

    // Product Fidelity (from SEO or Logic)
    const productInfo = seoContext
        ? `Product Description: ${seoContext}. Texture, logo, and cut must match the reference image exactly.`
        : `Product: ${t.fit} clothing.`;

    const environment = getEnvironmentBlock(t);

    const viewInstruction = viewType === 'back'
        ? `VIEW: Back View (Model facing away from camera). Full body shot, head-to-toe visible. Single subject only.`
        : `VIEW: Front View. Full body shot, head-to-toe visible. Single subject only.`;

    const quality = `Quality: High-end editorial fashion photography. Crisp fabric texture, realistic skin detail, clean focus, balanced lighting, subtle depth of field.`;

    let accessory = '';
    if (t.accessory) accessory = `Accessory: ${t.accessory}.`;

    const hygiene = `Negative Constraints: (NO OBJECTS, NO STUDIO LIGHTS, NO STANDS, NO CHAIRS, NO BODY DISFIGURATION, NO MISSING LIMBS, NO CROPPED BODY, NO CROPPED FEET, NO OTHER PEOPLE, NO CROWD). Image must be a clean, high-fashion photograph.`;

    // Combine
    const fullPrompt = `${header} ${demographics} ${fit} ${productInfo} ${environment} ${viewInstruction} ${quality} ${accessory} ${hygiene}`;

    return F_Smooth_Prompt(fullPrompt);
};

// Deprecated but kept for compatibility if needed elsewhere, mapped to new function
export const F_Build_Imagen_Prompt = (input: ProductInput, contextDescription?: string): string => {
    return F_Build_Structured_Prompt(input, contextDescription, 'front');
};

export const F_Build_Video_Prompt = (input: ProductInput, customInstruction?: string): string => {
    const t = F_Translate_Inputs(input);

    // Cinematic Commercial Structure
    // 1. Movement & Subject
    // 2. Product Focus (Fabric/Details)
    // 3. Lighting & Atmosphere
    // 4. Constraints (Safety/Artifact prevention)

    let movement = "Slowly move or pose while facing forward. Subtle organic movement. Breathing. Gentle swaying.";
    if (customInstruction) {
        movement = `${movement} ${customInstruction}.`;
    }

    const subject = `Subject: ${t.gender} model wearing ${t.fit} clothing, standing full-body (head-to-toe in frame), single subject only, no other people.`;
    const environment = `Environment: ${t.background}.`;
    const accessory = t.accessory ? `Accessory: ${t.accessory}.` : '';

    // Using raw description if available for texture detail
    const productDetail = input.raw_desc ? `Clothing details: ${input.raw_desc}.` : `Focus on the clothing design details.`;

    const lighting = `High-end editorial fashion film. Cinematic lighting, stabilized camera, clean exposure. 1080p resolution. Sharp focus. Shallow depth of field. Bokeh background.`;

    const constraints = `NEGATIVE PROMPT: DO NOT SHOW THE BACK SIDE. FRONT VIEW ONLY. No rotation. No distortion. No text. No watermarks. No background logos or signage. No other people. No crowd. Standing full-body, head-to-toe visible. No voice, no dialogue. Instrumental music only if any.`;

    return `${movement} ${subject} ${environment} ${accessory} ${productDetail} Fabric texture showcase. ${lighting} ${constraints}`;
};

