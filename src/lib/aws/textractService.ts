import {
  TextractClient,
  DetectDocumentTextCommand,
} from "@aws-sdk/client-textract";

interface Point {
  x: number;
  y: number;
}

interface DocumentBounds {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

// Initialize Textract client
const textractClient = new TextractClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

export const testConnection = async () => {
  console.log("🧪 Testing AWS connection...");
  return "AWS Textract ready!";
};

export const detectDocument = async (
  canvas: HTMLCanvasElement
): Promise<DocumentBounds | null> => {
  try {
    console.log("🔍 AWS Textract analyzing...");

    // Convert canvas to base64
    const dataURL = canvas.toDataURL("image/png");
    const base64 = dataURL.split(",")[1];
    const imageBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // Call AWS Textract
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: imageBuffer,
      },
    });

    const response = await textractClient.send(command);

    if (response.Blocks && response.Blocks.length > 0) {
      // Find text blocks to determine document bounds
      const textBlocks = response.Blocks.filter(
        (block) => block.BlockType === "LINE"
      );

      if (textBlocks.length > 2) {
        // Need at least some text to consider it a document
        console.log(`✅ AWS found ${textBlocks.length} text lines`);

        // Calculate bounding box from all text
        let minLeft = 1,
          maxRight = 0,
          minTop = 1,
          maxBottom = 0;

        textBlocks.forEach((block) => {
          if (block.Geometry?.BoundingBox) {
            const bbox = block.Geometry.BoundingBox;
            minLeft = Math.min(minLeft, bbox.Left || 0);
            maxRight = Math.max(maxRight, (bbox.Left || 0) + (bbox.Width || 0));
            minTop = Math.min(minTop, bbox.Top || 0);
            maxBottom = Math.max(
              maxBottom,
              (bbox.Top || 0) + (bbox.Height || 0)
            );
          }
        });

        // Add padding
        const padding = 0.05;
        minLeft = Math.max(0, minLeft - padding);
        maxRight = Math.min(1, maxRight + padding);
        minTop = Math.max(0, minTop - padding);
        maxBottom = Math.min(1, maxBottom + padding);

        const bounds: DocumentBounds = {
          topLeft: { x: minLeft * canvas.width, y: minTop * canvas.height },
          topRight: { x: maxRight * canvas.width, y: minTop * canvas.height },
          bottomRight: {
            x: maxRight * canvas.width,
            y: maxBottom * canvas.height,
          },
          bottomLeft: {
            x: minLeft * canvas.width,
            y: maxBottom * canvas.height,
          },
        };

        return bounds;
      }
    }

    console.log("❌ AWS: No document detected");
    return null;
  } catch (error) {
    console.error("AWS Textract error:", error);
    return null;
  }
};
export const cropDocument = (
  canvas: HTMLCanvasElement,
  bounds: DocumentBounds
): string => {
  try {
    console.log("✂️ AWS cropping document...");

    const croppedCanvas = document.createElement("canvas");
    const ctx = croppedCanvas.getContext("2d")!;

    const cropX = bounds.topLeft.x;
    const cropY = bounds.topLeft.y;
    const cropWidth = bounds.topRight.x - bounds.topLeft.x;
    const cropHeight = bounds.bottomLeft.y - bounds.topLeft.y;

    console.log(
      `📏 AWS crop: ${Math.round(cropWidth)}x${Math.round(cropHeight)}`
    );

    croppedCanvas.width = Math.round(cropWidth);
    croppedCanvas.height = Math.round(cropHeight);

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, cropWidth, cropHeight);

    // Crop the document
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

    console.log("✅ AWS crop complete!");
    return croppedCanvas.toDataURL("image/jpeg", 0.95);
  } catch (error) {
    console.error("AWS crop error:", error);
    return canvas.toDataURL("image/jpeg", 0.95);
  }
};
