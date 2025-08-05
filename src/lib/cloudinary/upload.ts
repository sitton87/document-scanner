import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  file: Buffer | string,
  filename: string,
  folder: string = "documents"
) => {
  try {
    const result = await cloudinary.uploader.upload(file as string, {
      folder,
      public_id: filename,
      resource_type: "auto",
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export const uploadPDF = async (pdfBuffer: Buffer, filename: string) => {
  const base64PDF = `data:application/pdf;base64,${pdfBuffer.toString(
    "base64"
  )}`;
  return uploadToCloudinary(base64PDF, `${filename}.pdf`, "documents/pdf");
};

export const uploadImage = async (imageBuffer: Buffer, filename: string) => {
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString(
    "base64"
  )}`;
  return uploadToCloudinary(base64Image, `${filename}.jpg`, "documents/images");
};
