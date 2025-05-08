import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const responseOfUploadedFFileOnCloudinary =
      await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto",
      });
    console.log(
      responseOfUploadedFFileOnCloudinary.url,
      "file uploaded successfully"
    );
    console.log(responseOfUploadedFFileOnCloudinary, "response");

    await fs.unlink(localFilePath);
    return responseOfUploadedFFileOnCloudinary.url;
  } catch (error) {
    await fs.unlink(localFilePath);
    return null;
  }
};

export { uploadToCloudinary };
