/**
 * Resizes and compresses an image file using the Canvas API.
 * - Caps the longest dimension at maxDimension (default 800px) to keep file sizes small.
 * - Outputs a JPEG (or WebP if supported) data URL at the given quality level.
 * - Works entirely in the browser; no server round-trip needed.
 *
 * @param file       The raw File object from an <input type="file"> element.
 * @param maxDimension Maximum width or height in pixels (default: 800).
 * @param quality    JPEG compression quality 0–1 (default: 0.82).
 * @returns          A Promise that resolves to a base64 data URL string.
 */
export function compressProfileImage(
  file: File,
  maxDimension = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions while preserving aspect ratio
      let { width, height } = img;
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context not available."));
        return;
      }

      // Fill white background first (handles transparent PNGs cleanly)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP for even smaller sizes; fall back to JPEG
      const supportsWebP = canvas.toDataURL("image/webp").startsWith("data:image/webp");
      const mimeType = supportsWebP ? "image/webp" : "image/jpeg";

      const dataUrl = canvas.toDataURL(mimeType, quality);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression."));
    };

    img.src = url;
  });
}
