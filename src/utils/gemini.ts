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

export async function callGeminiWithFallback(
  prompt: string | (string | Part)[],
  options: GeminiOptions = {}
) {
  const {
    modelNames = [
      "gemini-2.0-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-1.5-flash"
    ],
    maxRetries = 1,
    responseMimeType
  } = options;

  let lastError: any;

  // Perform discovery once to see what's actually available
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      const availableModels = listData.models?.map((m: any) => m.name.replace('models/', '')) || [];
      console.log(`[Gemini] DISCOVERY (v1): Available models: ${availableModels.join(', ')}`);
    } else {
      // Try v1beta if v1 fails
      const listResBeta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (listResBeta.ok) {
        const listData = await listResBeta.json();
        const availableModels = listData.models?.map((m: any) => m.name.replace('models/', '')) || [];
        console.log(`[Gemini] DISCOVERY (v1beta): Available models: ${availableModels.join(', ')}`);
      } else {
        const errText = await listResBeta.text();
        console.warn(`[Gemini] Discovery failed. Key might be restricted or API not enabled. Status: ${listResBeta.status}`);
      }
    }
  } catch (e) {
    console.warn("[Gemini] Discovery network error.");
  }

  for (const modelName of modelNames) {
    for (const apiVersion of ["v1", "v1beta"]) {
      let attempts = 0;
      while (attempts <= maxRetries) {
        try {
          console.log(`[Gemini] Trying ${modelName} (${apiVersion})...`);
          
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
            return text;
          }
        } catch (err: any) {
          attempts++;
          lastError = err;
          
          console.warn(`[Gemini] Attempt ${attempts} failed for ${modelName} (${apiVersion}): Status ${err.status} - ${err.message}`);

          // If quota exhausted, wait and retry once, then move to next model
          if (err.status === 429) {
            if (attempts <= maxRetries) {
              console.log(`[Gemini] Quota hit for ${modelName}. Waiting 3s before retry...`);
              await new Promise(resolve => setTimeout(resolve, 3000));
              continue;
            }
            console.warn(`[Gemini] Quota exhausted for ${modelName}. Trying next model...`);
            break;
          }

          // For 404, the model simply doesn't exist on this API version, try the next version/model immediately
          if (err.status === 404) {
            break; 
          }

          // For other errors (network, etc.), retry if attempts left
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

  // If we get here, all models and retries failed
  const errorMsg = lastError?.message || "All Gemini models failed";
  console.error(`[Gemini] Fatal error: ${errorMsg}`);
  
  if (errorMsg.includes("fetch failed")) {
    throw new Error("Gemini API connection failed. This is usually a network issue. Please check your internet connection or try again in a few minutes.");
  }
  
  throw new Error(errorMsg);
}
