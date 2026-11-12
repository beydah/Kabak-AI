import fs from 'fs';
import path from 'path';

// Manual .env parser
function loadEnv() {
    try {
        const envPath = 'c:/Users/BEYDAH/Desktop/Code/kabak-ai/.env';
        const content = fs.readFileSync(envPath, 'utf-8');
        const env: any = {};
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim().replace(/"/g, '').replace(/'/g, '');
            }
        });
        return env;
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
    console.log(`Fetching models from API...`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        console.log("\n--- AVAILABLE MODELS ---");
        const models = (data as any).models || [];

        let output = "--- AVAILABLE MODELS ---\n";
        models.forEach((m: any) => {
            output += `\nName: ${m.name}\n`;
            output += `Display: ${m.displayName}\n`;
            output += `Methods: ${JSON.stringify(m.supportedGenerationMethods)}\n`;
        });

        fs.writeFileSync(path.resolve(__dirname, '../../models_out.txt'), output, 'utf-8');
        console.log("Written to models_out.txt");

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
