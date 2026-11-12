
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ No API Key found in .env (Checked GEMINI_API_KEY)");
    process.exit(1);
}

console.log(`✅ API Key Loaded: ${apiKey.substring(0, 8)}...`);

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        console.log("🔍 Querying Google AI for available models...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to access system? No, need listModels on system.

        // Actually, listModels is not directly on the instance in some versions? 
        // Let's try to fetch via REST if SDK doesn't expose it easily or use the SDK method if widely available.
        // GoogleGenerativeAI doesn't have a direct listModels method on the top level class in v0.1. 
        // But let's try the standard REST endpoint as a fallback to be sure.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API Error:", data.error.message);
            return;
        }

        const models = data.models || [];
        console.log(`\n🎉 Found ${models.length} Models available to your key:\n`);

        const validList = [];

        models.forEach(m => {
            const isViable = m.supportedGenerationMethods.includes('generateContent');
            const isImage = m.supportedGenerationMethods.includes('predict') || m.name.includes('vision') || m.name.includes('imagen');

            console.log(`- ${m.name.split('/').pop()} [${m.supportedGenerationMethods.join(', ')}]`);

            validList.push(m.name.split('/').pop());
        });

        console.log("\nRECOMMENDED CONFIGURATION based on discovery:");
        const hasGemini2 = validList.some(m => m.includes('gemini-2.0'));
        const hasImagen3 = validList.some(m => m.includes('imagen-3'));

        console.log(`Text Model: ${hasGemini2 ? 'gemini-2.0-flash' : 'gemini-1.5-pro'}`);
        console.log(`Visual Model: ${hasImagen3 ? 'imagen-3.0-generate-001' : 'gemini-2.0-flash'}`);

    } catch (error) {
        console.error("❌ Validation Failed:", error);
    }
}

listModels();
