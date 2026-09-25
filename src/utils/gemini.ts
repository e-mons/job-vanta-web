/**
 * Shared Gemini AI utility using @google/genai SDK.
 * Provides self-healing model fallback and auto-discovery for all API routes.
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

const STATIC_ACTIVE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-pro-latest",
];

let _cachedModel: string | null = null;
let _dynamicallyDiscoveredModels: string[] | null = null;
let _lastDiscoveryTime = 0;
const DISCOVERY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cache for model list

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

/**
 * Discovers currently available Gemini models from the Google API.
 * Ensures the system never permanently breaks when Google deprecates/updates models.
 */
async function discoverLiveModels(): Promise<string[]> {
  const now = Date.now();
  if (_dynamicallyDiscoveredModels && now - _lastDiscoveryTime < DISCOVERY_COOLDOWN_MS) {
    return _dynamicallyDiscoveredModels;
  }
  try {
    const list = await getAI().models.list();
    const discovered: string[] = [];
    for await (const m of list) {
      const name = m.name?.replace(/^models\//, "") || "";
      if (
        name.startsWith("gemini") &&
        (name.includes("flash") || name.includes("pro")) &&
        !name.includes("image") &&
        !name.includes("tts") &&
        !name.includes("robotics") &&
        !name.includes("computer-use") &&
        !name.includes("embedding") &&
        !name.includes("transcribe") &&
        !name.includes("native-audio")
      ) {
        discovered.push(name);
      }
    }
    if (discovered.length > 0) {
      // Prioritize flash models, then pro models, sorted descending by version
      discovered.sort((a, b) => {
        const aFlash = a.includes("flash");
        const bFlash = b.includes("flash");
        if (aFlash && !bFlash) return -1;
        if (!aFlash && bFlash) return 1;
        return b.localeCompare(a);
      });
      _dynamicallyDiscoveredModels = discovered;
      _lastDiscoveryTime = now;
      console.log(`[Gemini Discovery] Auto-discovered ${discovered.length} active models:`, discovered);
      return discovered;
    }
  } catch (err: any) {
    console.warn("[Gemini Discovery] Failed to query live models:", err.message);
  }
  return STATIC_ACTIVE_MODELS;
}

function getModelCandidates(): string[] {
  const source = _dynamicallyDiscoveredModels && _dynamicallyDiscoveredModels.length > 0
    ? _dynamicallyDiscoveredModels
    : STATIC_ACTIVE_MODELS;
  if (_cachedModel && source.includes(_cachedModel)) {
    return [_cachedModel, ...source.filter((m) => m !== _cachedModel)];
  }
  return source;
}

function isModelUnavailableError(err: any): boolean {
  const msg: string = (err?.message || "").toLowerCase();
  const status = err?.status;
  return (
    status === 404 ||
    msg.includes("not_found") ||
    msg.includes("not found") ||
    msg.includes("no longer available") ||
    msg.includes("not supported")
  );
}

export async function callGeminiWithFallback(
  prompt: string,
  options: { responseMimeType?: string; timeoutMs?: number } = {}
): Promise<string> {
  let models = getModelCandidates();
  const timeoutMs = options.timeoutMs || 60000;
  let lastError: any;
  let hasTriedDiscovery = false;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
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
      _cachedModel = null;
      console.warn(`[Gemini] Model ${model} failed: ${msg}`);

      // If this was the last model in the list and we haven't discovered yet, discover live models and retry
      if (i === models.length - 1 && !hasTriedDiscovery && isModelUnavailableError(err)) {
        hasTriedDiscovery = true;
        const live = await discoverLiveModels();
        const newModels = live.filter((m) => !models.includes(m));
        if (newModels.length > 0) {
          console.log("[Gemini] Retrying with newly discovered models:", newModels);
          models = newModels;
          i = -1; // restart loop with new models
        }
      }
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
  let models = getModelCandidates();
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
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
          ...(options.responseMimeType
            ? { config: { responseMimeType: options.responseMimeType } }
            : {}),
        }),
        timeoutMs,
        `Gemini (${model}) audio analysis`
      );

      const text = response.text;
      if (text && text.trim()) {
        _cachedModel = model;
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
  let models = getModelCandidates();
  const timeoutMs = options.timeoutMs || 45000;
  let lastError: any;
  let hasTriedDiscovery = false;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
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

      // If this was the last model in the list and we haven't discovered yet, discover live models and retry
      if (i === models.length - 1 && !hasTriedDiscovery && isModelUnavailableError(err)) {
        hasTriedDiscovery = true;
        const live = await discoverLiveModels();
        const newModels = live.filter((m) => !models.includes(m));
        if (newModels.length > 0) {
          console.log("[Gemini Inline] Retrying with newly discovered models:", newModels);
          models = newModels;
          i = -1; // restart loop with new models
        }
      }
    }
  }

  throw lastError ?? new Error("All Gemini models failed to process the document.");
}
