import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

/* CV Upload */
const cvStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "interview-platform/cvs",
    resource_type: "raw",
    allowed_formats: ["pdf", "doc", "docx"]
  }
});

/* Recording Upload */
const recordingStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "interview-platform/recordings",
    resource_type: "video"
  }
});

export const uploadCV = multer({ storage: cvStorage });
export const uploadRecording = multer({ storage: recordingStorage });
