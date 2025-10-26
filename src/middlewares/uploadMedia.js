// src/middlewares/uploadMedia.js
import multer from "multer";
import path from "path";
import fs from "fs";

const allowedMimes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "video/mp4",
  "video/quicktime",
];

// factory: tạo multer với subfolder (ví dụ 'messages', 'categories', 'products')
export const createUploadMiddleware = (subfolder = "messages", opts = {}) => {
  const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      const base = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      cb(null, base + ext);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"), false);
  };

  const limits = opts.limits ?? { fileSize: 50 * 1024 * 1024 }; // 50MB

  return multer({ storage, limits, fileFilter });
};

// helper chuyển multer file -> public path lưu DB (e.g. "/uploads/messages/123.png")
export const fileToPublicPath = (file, subfolder = "messages") => {
  if (!file || !file.filename) return null;
  return `/uploads/${subfolder}/${file.filename}`;
};
