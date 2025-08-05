// src/lib/opencv/cropScript.ts

import { detectDocument, cropDocument } from "./documentDetection";

/**
 * Given a full-frame DataURL, try to detect & crop the document.
 * If detection fails, fall back to returning the original full-frame image.
 */
export async function cropImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      let bounds = null;
      try {
        bounds = await detectDocument(canvas);
      } catch (e) {
        console.warn("detectDocument threw:", e);
      }

      if (!bounds) {
        console.warn("No document detected—returning full frame");
        return resolve(canvas.toDataURL("image/jpeg", 0.95));
      }

      // we have bounds, do the warp-crop
      const cropped = cropDocument(canvas, bounds);
      resolve(cropped);
    };
    img.onerror = () => {
      console.warn("Failed to load image, falling back to original");
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}
