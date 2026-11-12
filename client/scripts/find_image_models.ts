
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = 'c:/Users/BEYDAH/Desktop/Code/kabak-ai/.env';
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            const env: any = {};
            content.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) env[key.trim()] = value.trim().replace(/"/g, '').replace(/'/g, '');
            });
            return env;
        }
        return {};
    } catch (e) { return {}; }
}

const apiKey = loadEnv().GEMINI_API_KEY;
if (!apiKey) process.exit(1);

async function findImageModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const models = (data as any).models || [];

        console.log("--- IMAGE MODELS ---");
        const imageModels = models.filter((m: any) =>
            m.name.includes('image') ||
            m.name.includes('vision') ||
            m.supportedGenerationMethods.some((method: string) => method.includes('image'))
        );

        imageModels.forEach((m: any) => {
            console.log(m.name);
            console.log(m.supportedGenerationMethods);
            console.log('---');
        });

        if (imageModels.length === 0) {
            console.log("No specific 'image' models found. Fallback check for 'gemini-pro-vision' etc.");
            models.forEach((m: any) => {
                if (m.name.includes('gemini')) console.log(m.name);
            });
        }

    } catch (error) { console.error(error); }
}

findImageModels();
