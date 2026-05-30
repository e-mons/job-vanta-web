import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  console.error("[Gemini] CRITICAL: GEMINI_API_KEY is missing or empty.");
} else {
  console.log(`[Gemini] Initialized with key starting with: ${apiKey.substring(0, 7)}...`);
}
const genAI = new GoogleGenerativeAI(apiKey || "");

interface GeminiOptions {
  modelNames?: string[];
  maxRetries?: number;
  responseMimeType?: string;
}

// Caching the last working model & version globally in this module to skip fallback scanning on future calls
let cachedModel: { name: string; apiVersion: string } | null = null;

export async function callGeminiWithFallback(
  prompt: string | (string | Part)[],
  options: GeminiOptions = {}
) {
  const {
    modelNames = [
      "gemini-2.5-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-1.5-flash",
      "gemini-2.0-flash"
    ],
    maxRetries = 1,
    responseMimeType
  } = options;

  let lastError: any;

  // 1. If we have a cached working model, try it first to respond instantly
  if (cachedModel) {
    let attempts = 0;
    while (attempts <= maxRetries) {
      try {
        console.log(`[Gemini] Trying cached model ${cachedModel.name} (${cachedModel.apiVersion})...`);
        const model = genAI.getGenerativeModel(
          { 
            model: cachedModel.name,
            ...(responseMimeType ? { generationConfig: { responseMimeType } } : {})
          },
          { apiVersion: cachedModel.apiVersion }
        );

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (text) {
          console.log(`[Gemini] Cache Hit Success: ${cachedModel.name} (${cachedModel.apiVersion})`);
          return text;
        }
      } catch (err: any) {
        attempts++;
        lastError = err;
        console.warn(`[Gemini] Cached model attempt ${attempts} failed: ${err.message}`);
        
        if (err.status === 429) {
          if (attempts <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        
        console.log(`[Gemini] Invalidating cached model: ${cachedModel.name}`);
        cachedModel = null;
        break;
      }
    }
  }

  // 2. Fallback scan loop if cache is empty or failed
  for (const modelName of modelNames) {
    // Try v1beta first as newer/preview models are there, then try stable v1
    for (const apiVersion of ["v1beta", "v1"]) {
      let attempts = 0;
      while (attempts <= maxRetries) {
        try {
          console.log(`[Gemini] Scanning model ${modelName} (${apiVersion})...`);
          
          const model = genAI.getGenerativeModel(
            { 
              model: modelName,
              ...(responseMimeType ? { generationConfig: { responseMimeType } } : {})
            },
            { apiVersion }
          );

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          if (text) {
            console.log(`[Gemini] Success: ${modelName} (${apiVersion})`);
            cachedModel = { name: modelName, apiVersion };
            return text;
          }
        } catch (err: any) {
          attempts++;
          lastError = err;
          
          console.warn(`[Gemini] Scan attempt ${attempts} failed for ${modelName} (${apiVersion}): Status ${err.status} - ${err.message}`);

          if (err.status === 429) {
            if (attempts <= maxRetries) {
              console.log(`[Gemini] Quota hit for ${modelName}. Waiting 2s before retry...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            break;
          }

          if (err.status === 404) {
            break; 
          }

          if (attempts <= maxRetries) {
            const delay = Math.pow(2, attempts) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          break;
        }
      }
    }
  }

  const errorMsg = lastError?.message || "All Gemini models failed";
  console.error(`[Gemini] Fatal error: ${errorMsg}`);
  
  if (errorMsg.includes("fetch failed")) {
    throw new Error("Gemini API connection failed. This is usually a network issue. Please check your internet connection or try again in a few minutes.");
  }
  
  throw new Error(errorMsg);
}
