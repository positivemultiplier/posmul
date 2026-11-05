
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs';
import * as path from 'path';

// Load env simply
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envConfig: Record<string, string> = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envConfig[key.trim()] = value.trim();
});

const apiKey = envConfig['GOOGLE_GEMINI_API_KEY'] || process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("API Key not found!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    console.log("Testing gemini-pro...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success gemini-pro:", result.response.text());
        return;
    } catch (e: any) {
        console.error("Fail gemini-pro:", e.message);
    }

    console.log("Testing gemini-1.5-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success gemini-1.5-flash:", result.response.text());
        return;
    } catch (e: any) {
        console.error("Fail gemini-1.5-flash:", e.message);
    }
}

run();
