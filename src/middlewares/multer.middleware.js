import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { ApiError } from "../utils/apiError.js";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed file types (you can adjust as needed)
const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

// File size limit in bytes (e.g., 2MB = 2 * 1024 * 1024)
const MAX_SIZE = 2 * 1024 * 1024;

// File filter for validation
const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new ApiError(400, "Invalid file type"), false);
  }

  // if (file.size > MAX_SIZE) {
  //   return cb(new ApiError(400, "File size limit exceeded"), false);
  // }

  cb(null, true);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(file, "from multer middleware");
    const uploadPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "temp",
      "uploads"
    );

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE,
  },
  fileFilter,
});
export { upload };
