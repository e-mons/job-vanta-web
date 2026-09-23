/**
 * Shared Gemini AI utility using @google/genai SDK.
 * Provides model fallback for all API routes.
 */
import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

const ACTIVE_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

let _cachedModel: string | null = null;

/**
 * Bounds external AI calls with a deterministic timeout to prevent hanging connections.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  context: string = "AI operation"
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${context} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

export async function callGeminiWithFallback(
  prompt: string,
  options: { responseMimeType?: string; timeoutMs?: number } = {}
): Promise<string> {
  const models = _cachedModel
    ? [_cachedModel, ...ACTIVE_MODELS.filter((m) => m !== _cachedModel)]
    : ACTIVE_MODELS;

  const timeoutMs = options.timeoutMs || 60000;
  let lastError: any;

  for (const model of models) {
    try {
      const response = await withTimeout(
        getAI().models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          ...(options.responseMimeType
            ? { config: { responseMimeType: options.responseMimeType } }
            : {}),
        }),
        timeoutMs,
        `Gemini (${model}) generation`
      );
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
      // 404, timeout or other → try next model
      _cachedModel = null;
      console.warn(`[Gemini] Model ${model} failed: ${msg}`);
    }
  }

  throw lastError ?? new Error("All Gemini models failed.");
}

export async function callGeminiWithAudioFallback(
  audioBuffer: Buffer,
  mimeType: string,
  prompt: string,
  options: { responseMimeType?: string; timeoutMs?: number } = {}
): Promise<string> {
  const base64Audio = audioBuffer.toString("base64");
  const models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];
  const timeoutMs = options.timeoutMs || 35000; // 35s for audio

  let lastError: any;

  for (const model of models) {
    try {
      const response = await withTimeout(
        getAI().models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    data: base64Audio,
                    mimeType,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          ...(options.responseMimeType
            ? { config: { responseMimeType: options.responseMimeType } }
            : {}),
        }),
        timeoutMs,
        `Gemini Audio (${model}) evaluation`
      );

      const text = response.text;
      if (text && text.trim()) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Audio] Model ${model} failed: ${err?.message}`);
    }
  }

  throw lastError ?? new Error("Audio analysis failed across all models.");
}

export async function callGeminiWithInlineDataFallback(
  base64Data: string,
  mimeType: string,
  prompt: string,
  options: { responseMimeType?: string; timeoutMs?: number } = {}
): Promise<string> {
  const models = _cachedModel
    ? [_cachedModel, ...ACTIVE_MODELS.filter((m) => m !== _cachedModel)]
    : ACTIVE_MODELS;

  const timeoutMs = options.timeoutMs || 45000;
  let lastError: any;

  for (const model of models) {
    try {
      const response = await withTimeout(
        getAI().models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inlineData: { data: base64Data, mimeType } },
              ],
            },
          ],
          ...(options.responseMimeType
            ? { config: { responseMimeType: options.responseMimeType } }
            : {}),
        }),
        timeoutMs,
        `Gemini (${model}) inline generation`
      );

      const text = response.text;
      if (text && text.trim()) {
        _cachedModel = model;
        return text;
      }
    } catch (err: any) {
      lastError = err;
      const msg: string = err?.message ?? "";
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("AI quota exceeded. Please wait a moment and try again.");
      }
      _cachedModel = null;
      console.warn(`[Gemini Inline] Model ${model} failed: ${msg}`);
    }
  }

  throw lastError ?? new Error("All Gemini models failed to process the document.");
}
