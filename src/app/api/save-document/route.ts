import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { invoices } from "@/lib/db/schema";
import { uploadImage, uploadPDF } from "@/lib/cloudinary/upload";
import jsPDF from "jspdf";

export async function POST(request: NextRequest) {
  try {
    console.log("API called - starting save document process");

    const { imageData, filename } = await request.json();

    if (!imageData || !filename) {
      console.error("Missing required fields:", {
        imageData: !!imageData,
        filename: !!filename,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Processing image and creating PDF...");

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData.split(",")[1], "base64");

    // Get image dimensions from base64 data
    const getImageDimensions = (
      base64Data: string
    ): { width: number; height: number } => {
      // This is a simple approach - we'll use a fixed aspect ratio calculation
      // For more accuracy, you'd need a proper image parsing library

      // Extract just the base64 part
      const base64 = base64Data.split(",")[1];
      const buffer = Buffer.from(base64, "base64");

      // For JPEG, we can try to extract dimensions from the header
      // This is a simplified approach - for production, use a library like 'sharp'

      // Default dimensions if we can't determine them
      let width = 1920;
      let height = 1080;

      // Try to find JPEG SOF marker for dimensions
      if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        // JPEG signature
        for (let i = 2; i < buffer.length - 8; i++) {
          if (
            buffer[i] === 0xff &&
            (buffer[i + 1] === 0xc0 || buffer[i + 1] === 0xc2)
          ) {
            height = (buffer[i + 5] << 8) | buffer[i + 6];
            width = (buffer[i + 7] << 8) | buffer[i + 8];
            break;
          }
        }
      }

      return { width, height };
    };

    // Get image dimensions
    const { width: imgWidth, height: imgHeight } =
      getImageDimensions(imageData);

    // Calculate aspect ratio
    const aspectRatio = imgWidth / imgHeight;

    // Create PDF with proper proportions
    const pdf = new jsPDF();

    // A4 dimensions in mm (minus margins)
    const maxWidth = 190;
    const maxHeight = 270;

    let pdfWidth, pdfHeight;

    if (aspectRatio > maxWidth / maxHeight) {
      // Image is wider - fit to width
      pdfWidth = maxWidth;
      pdfHeight = maxWidth / aspectRatio;
    } else {
      // Image is taller - fit to height
      pdfHeight = maxHeight;
      pdfWidth = maxHeight * aspectRatio;
    }

    // Center the image on A4 page
    const x = (210 - pdfWidth) / 2; // A4 width is 210mm
    const y = (297 - pdfHeight) / 2; // A4 height is 297mm

    pdf.addImage(imageData, "JPEG", x, y, pdfWidth, pdfHeight);

    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    console.log("Uploading to Cloudinary...");

    // Upload both files to Cloudinary
    const [imageUpload, pdfUpload] = await Promise.all([
      uploadImage(imageBuffer, filename),
      uploadPDF(pdfBuffer, filename),
    ]);

    console.log("Saving to database...");

    // Save to database
    const result = await db.insert(invoices).values({
      filename,
      jpgUrl: imageUpload.url,
      pdfUrl: pdfUpload.url,
      fileSize: imageBuffer.length,
      metadata: {
        imageSize: imageUpload.size,
        pdfSize: pdfUpload.size,
        uploadedAt: new Date().toISOString(),
        originalDimensions: { width: imgWidth, height: imgHeight },
        aspectRatio,
      },
    });

    console.log("Document saved successfully");

    return NextResponse.json({
      message: "Document saved successfully",
      filename: filename,
    });
  } catch (error) {
    console.error("Save document error:", error);
    return NextResponse.json(
      {
        error: "Failed to save document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
