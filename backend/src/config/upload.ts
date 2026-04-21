import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

const UPLOAD_DIR = process.env['UPLOAD_DIR'] || './uploads';
const MAX_SIZE_MB = parseInt(process.env['UPLOAD_MAX_SIZE_MB'] || '10');
const MAX_FILES = parseInt(process.env['UPLOAD_MAX_FILES'] || '5');

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Text
  'text/plain', 'text/csv',
  'application/octet-stream', // log files, generic
]);

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
]);

export function isImage(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.has(mimeType);
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function buildStorage(subfolder: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(UPLOAD_DIR, subfolder);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}_${uuidv4()}${ext}`;
      cb(null, name);
    },
  });
}

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
}

export const ticketUpload = multer({
  storage: buildStorage('tickets'),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024, files: MAX_FILES },
  fileFilter,
});

export const avatarUpload = multer({
  storage: buildStorage('avatars'),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (isImage(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes para el avatar'));
  },
});

export const chatUpload = multer({
  storage: buildStorage('chat'),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter,
});

export { UPLOAD_DIR };
