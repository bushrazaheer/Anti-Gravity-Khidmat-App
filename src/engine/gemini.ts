import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
let currentModel: any = null;

export const initGemini = (apiKey: string) => {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    currentModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
      }
    });
    return true;
  } catch (e) {
    console.error("Failed to init Gemini", e);
    return false;
  }
};

if (process.env.EXPO_PUBLIC_GEMINI_API_KEY && process.env.EXPO_PUBLIC_GEMINI_API_KEY !== 'your_google_gemini_api_key_here') {
  initGemini(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
}

export const hasGeminiKey = () => genAI !== null;

export interface ParsedIntent {
  serviceType: string;
  location: string;
  urgency: 'high' | 'medium' | 'low';
  preferredTime: string;
  priceSensitivity: 'high' | 'medium' | 'low';
  confidenceScore: number;
  needsClarification: boolean;
  clarificationMessage?: string;
  language: string;
}

export const parseIntentWithAI = async (userInput: string): Promise<ParsedIntent> => {
  if (!currentModel) {
    throw new Error('Gemini API not initialized');
  }

  const prompt = `
You are an expert intent parser for the "Khidmat" local service app.
Analyze the user input (can be English, Urdu, or Roman Urdu).
Identify the service requested. Map it to one of these EXACT categories if possible: "AC Repair", "Electrician", "Plumber", "Mechanic".
If they say "i need plumber" or "plumber chahiye", the serviceType is "Plumber".

Return ONLY a raw JSON object. Do not use Markdown formatting, do not use \`\`\`json. Just the JSON.
Schema:
{
  "serviceType": "string",
  "location": "string (e.g. G-13 or Unknown)",
  "urgency": "high|medium|low",
  "preferredTime": "string",
  "priceSensitivity": "high|medium|low",
  "confidenceScore": number (0-100),
  "needsClarification": boolean (true ONLY if you genuinely cannot guess the service type),
  "clarificationMessage": "string (ask politely in the user's language)",
  "language": "string"
}

Input: "${userInput}"
`;

  try {
    const result = await currentModel.generateContent(prompt);
    let responseText = result.response.text();
    responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // Safety check for basic parsing
    const parsed = JSON.parse(responseText) as ParsedIntent;
    if (!parsed.serviceType || parsed.serviceType.toLowerCase() === 'unknown' || parsed.serviceType === '') {
      parsed.needsClarification = true;
    } else {
      parsed.needsClarification = false;
    }
    return parsed;
  } catch (error) {
    console.warn('Gemini API is unavailable or key is restricted. Falling back silently.');
    throw error; // Let the orchestrator handle it gracefully
  }
};
