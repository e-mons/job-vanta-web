/**
 * Shared Gemini AI utility using @google/genai SDK.
 * Provides model fallback for all API routes.
 */
import { GoogleGenAI } from "@google/genai";

const _apiKey = process.env.GEMINI_API_KEY?.trim() || "";
const _ai = new GoogleGenAI({ apiKey: _apiKey });

const ACTIVE_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
];

let _cachedModel: string | null = null;

export async function callGeminiWithFallback(
  prompt: string,
  options: { responseMimeType?: string } = {}
): Promise<string> {
  const models = _cachedModel
    ? [_cachedModel, ...ACTIVE_MODELS.filter((m) => m !== _cachedModel)]
    : ACTIVE_MODELS;

  let lastError: any;

  for (const model of models) {
    try {
      const response = await _ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        ...(options.responseMimeType
          ? { config: { responseMimeType: options.responseMimeType } }
          : {}),
      });
      const text = response.text;
      if (text && text.trim()) {
        _cachedModel = model;
        return text;
      }
    } catch (err: any) {
      lastError = err;
      const msg: string = err?.message ?? "";
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("AI quota exceeded. Please try again in a moment.");
      }
      // 404 or other → try next model
      _cachedModel = null;
      console.warn(`[Gemini] Model ${model} failed: ${msg}`);
    }
  }

  throw lastError ?? new Error("All Gemini models failed.");
}
