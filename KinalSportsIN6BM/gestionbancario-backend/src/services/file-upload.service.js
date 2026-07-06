import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../configs/config.js';

const UPLOAD_PATH = config.uploadPath;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_PATH),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }

  const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
  error.message = 'Tipo de archivo no permitido. Solo JPG, PNG y WEBP.';
  return cb(error, false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

export const deleteLocalFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('Error eliminando archivo local:', error);
  }
};

export const handleUploadError = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'El archivo excede el límite permitido de 5MB.'
      : err.message || 'Error en la carga del archivo.';

    return res.status(400).json({ success: false, message });
  }

  return res.status(400).json({ success: false, message: err.message || 'Error en la carga del archivo.' });
};
