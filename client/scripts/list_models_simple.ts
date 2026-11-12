
import fs from 'fs';
import path from 'path';

// Manual .env parser
function loadEnv() {
    try {
        // Use absolute path to avoid __dirname issues
        const envPath = 'c:/Users/BEYDAH/Desktop/Code/kabak-ai/.env';
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            const env: any = {};
            content.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    env[key.trim()] = value.trim().replace(/"/g, '').replace(/'/g, '');
                }
            });
            return env;
        }
        return {};
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const apiKey = env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API Key found in .env");
    process.exit(1);
}

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log(`Fetching models...`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        console.log("\n--- AVAILABLE MODELS ---");
        const models = (data as any).models || [];

        models.forEach((m: any) => {
            console.log(`Name: ${m.name}`);
            console.log(`Display: ${m.displayName}`);
            console.log(`Methods: ${JSON.stringify(m.supportedGenerationMethods)}`);
            console.log('---');
        });

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
