import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Fix for ESM __dirname
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env relative to this script
const envPath = path.resolve(__dirname, '../client/.env');
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

const key = process.env.GEMINI_API_KEY;

if (!key) {
    console.error("No API Key found in client/.env");
    process.exit(1);
}

console.log("Using Key ending in:", key.slice(-4));

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const resp = await fetch(url);
        const data = await resp.json();

        if (data.models) {
            console.log("=== AVAILABLE MODELS (filtered) ===");
            const visual = data.models.filter(m => m.name.includes('imagen') || m.name.includes('veo'));
            if (visual.length === 0) console.log("No Imagen/Veo models found.");
            visual.forEach(m => {
                console.log(`- ${m.name}`);
                console.log(`  Methods: ${JSON.stringify(m.supportedGenerationMethods)}`);
            });
        } else {
            console.error("Error listing models:", data);
        }
    } catch (e) {
        console.error("Request Failed:", e.message);
    }
}

listModels();
