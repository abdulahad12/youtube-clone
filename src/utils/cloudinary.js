import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "dtidq6xgh",
  api_key: "135317815569794",
  api_secret: "Ns4WWV4VOBCUo6nWiCZbRKcIbN0",
});

const uploadToCloudinary = async (localFilePath) => {
  console.log(localFilePath, "localFilePath");

  try {
    if (!localFilePath) return null;
    const responseOfUploadedFFileOnCloudinary =
      await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto",
      });

    console.log(
      responseOfUploadedFFileOnCloudinary.url,
      "file uploaded successfully ............................................"
    );

    console.log(responseOfUploadedFFileOnCloudinary, "response ..........");

    fs.unlinkSync(localFilePath);
    return responseOfUploadedFFileOnCloudinary;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log(error, "error of cloudinary");

    return null;
  }
};

export { uploadToCloudinary };
