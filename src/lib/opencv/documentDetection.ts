export interface Point {
  x: number;
  y: number;
}

export interface DocumentBounds {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

export const initializeOpenCV = (): Promise<void> => {
  return new Promise((resolve) => {
    console.log("🚀 Simple document detection ready");
    resolve();
  });
};

// פשוט ויעיל - זיהוי על בסיס ניגודיות
export const detectDocument = (
  canvas: HTMLCanvasElement
): DocumentBounds | null => {
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    console.log("🔍 Looking for document...");

    // בדיקת ניגודיות פשוטה
    const hasContrast = checkImageContrast(canvas, ctx);

    if (hasContrast) {
      // מצא גבולות באופן פשוט
      const bounds = findSimpleBounds(canvas);
      console.log("✅ Document found!");
      return bounds;
    }

    console.log("❌ No document detected");
    return null;
  } catch (error) {
    console.error("Detection error:", error);
    return null;
  }
};

// בדיקת ניגודיות - אם יש מסמך יהיה הרבה ניגודיות
function checkImageContrast(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): boolean {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let totalVariance = 0;
  let samples = 0;

  // דגימה של התמונה
  for (let y = 20; y < canvas.height - 20; y += 20) {
    for (let x = 20; x < canvas.width - 20; x += 20) {
      const idx = (y * canvas.width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // בדיקת הניגודיות עם השכנים
      const neighbors = [
        (y * canvas.width + x + 10) * 4, // ימין
        (y * canvas.width + x - 10) * 4, // שמאל
        ((y + 10) * canvas.width + x) * 4, // למטה
        ((y - 10) * canvas.width + x) * 4, // למעלה
      ];

      neighbors.forEach((neighborIdx) => {
        if (neighborIdx >= 0 && neighborIdx < data.length - 3) {
          const neighborBrightness =
            (data[neighborIdx] +
              data[neighborIdx + 1] +
              data[neighborIdx + 2]) /
            3;
          const variance = Math.abs(brightness - neighborBrightness);
          totalVariance += variance;
          samples++;
        }
      });
    }
  }

  const avgVariance = totalVariance / samples;
  console.log(`📊 Average contrast: ${avgVariance.toFixed(1)}`);

  // אם יש ניגודיות גבוהה - כנראה יש מסמך
  return avgVariance > 3; // הורדנו מ-25 ל-3 למצלמת המחשב
}

// מציאת גבולות פשוטים
function findSimpleBounds(canvas: HTMLCanvasElement): DocumentBounds {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let minX = canvas.width,
    maxX = 0,
    minY = canvas.height,
    maxY = 0;
  let edgePoints = 0;

  // חיפוש קצוות
  for (let y = 10; y < canvas.height - 10; y += 5) {
    for (let x = 10; x < canvas.width - 10; x += 5) {
      const idx = (y * canvas.width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // בדיקת קצה
      const rightIdx = (y * canvas.width + x + 5) * 4;
      const bottomIdx = ((y + 5) * canvas.width + x) * 4;

      if (rightIdx < data.length - 3 && bottomIdx < data.length - 3) {
        const rightBrightness =
          (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
        const bottomBrightness =
          (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;

        // אם יש ניגודיות חזקה - זה קצה
        if (
          Math.abs(brightness - rightBrightness) > 15 ||
          Math.abs(brightness - bottomBrightness) > 15
        ) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          edgePoints++;
        }
      }
    }
  }

  console.log(`📐 Found ${edgePoints} edge points`);

  // הוספת padding
  const padding = 30;
  minX = Math.max(0, minX - padding);
  maxX = Math.min(canvas.width, maxX + padding);
  minY = Math.max(0, minY - padding);
  maxY = Math.min(canvas.height, maxY + padding);

  // ודא שהגודל הגיוני
  const width = maxX - minX;
  const height = maxY - minY;
  const area = width * height;
  const totalArea = canvas.width * canvas.height;

  // אם השטח קטן מדי או גדול מדי - השתמש בפדינג קבוע
  if (area < totalArea * 0.1 || area > totalArea * 0.85) {
    const defaultPadding = 60;
    return {
      topLeft: { x: defaultPadding, y: defaultPadding },
      topRight: { x: canvas.width - defaultPadding, y: defaultPadding },
      bottomRight: {
        x: canvas.width - defaultPadding,
        y: canvas.height - defaultPadding,
      },
      bottomLeft: { x: defaultPadding, y: canvas.height - defaultPadding },
    };
  }

  console.log(
    `📏 Document size: ${width}x${height} (${((area / totalArea) * 100).toFixed(
      1
    )}% of image)`
  );

  return {
    topLeft: { x: minX, y: minY },
    topRight: { x: maxX, y: minY },
    bottomRight: { x: maxX, y: maxY },
    bottomLeft: { x: minX, y: maxY },
  };
}

export const cropDocument = (
  canvas: HTMLCanvasElement,
  bounds: DocumentBounds
): string => {
  try {
    console.log("✂️ Cropping document...");

    const croppedCanvas = document.createElement("canvas");
    const ctx = croppedCanvas.getContext("2d")!;

    const cropX = bounds.topLeft.x;
    const cropY = bounds.topLeft.y;
    const cropWidth = bounds.topRight.x - bounds.topLeft.x;
    const cropHeight = bounds.bottomLeft.y - bounds.topLeft.y;

    console.log(`📏 Crop: ${cropWidth}x${cropHeight} at (${cropX},${cropY})`);

    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    // רקע לבן
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, cropWidth, cropHeight);

    // העתקת המסמך
    ctx.drawImage(
      canvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    console.log("✅ Document cropped successfully!");
    return croppedCanvas.toDataURL("image/jpeg", 0.95);
  } catch (error) {
    console.error("Cropping error:", error);
    return canvas.toDataURL("image/jpeg", 0.95);
  }
};
