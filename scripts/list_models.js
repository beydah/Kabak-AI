const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: 'client/.env' });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No API Key found in client/.env");
        return;
    }
    console.log("Using Key:", key.slice(0, 10) + "...");

    // Fetch using REST for raw list
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (data.models) {
        console.log("=== AVAILABLE MODELS ===");
        data.models.forEach(m => {
            if (m.name.includes('imagen') || m.name.includes('veo')) {
                console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
            }
        });
    } else {
        console.error("Error listing models:", data);
    }
}

listModels();
