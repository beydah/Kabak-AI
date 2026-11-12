import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

// Load ENV
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API Key found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testFlashGen() {
    console.log("Testing Gemini 2.0 Flash Image Gen Capability...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = "Generate a hyper-realistic image of a futuristic red sneaker.";

    try {
        const result = await model.generateContent([
            { text: prompt }
        ]);

        const response = await result.response;

        console.log("\n--- CANDIDATES ---");
        console.log(JSON.stringify(response.candidates, null, 2));

        console.log("\n--- TEXT OUTPUT ---");
        try {
            console.log(response.text());
        } catch (e) {
            console.log("No text returned.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

testFlashGen();
