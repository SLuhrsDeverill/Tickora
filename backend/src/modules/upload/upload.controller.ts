import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import prisma from '../../config/database';
import { UPLOAD_DIR, isImage } from '../../config/upload';
import { AppError } from '../../middlewares/error.middleware';
import { AuthRequest } from '../../middlewares/auth.middleware';

async function generateThumbnail(
  filePath: string,
  filename: string,
  size: number,
): Promise<{ thumbnailUrl: string; width: number; height: number }> {
  const thumbDir = path.join(UPLOAD_DIR, 'thumbs');
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const thumbFilename = `thumb_${filename}`;
  const thumbPath = path.join(thumbDir, thumbFilename);

  const metadata = await sharp(filePath)
    .resize(size, size, { fit: 'inside', withoutEnlargement: true })
    .toFile(thumbPath);

  return {
    thumbnailUrl: `/api/uploads/thumbs/${thumbFilename}`,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}

export const uploadTicketFiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ticketId } = req.params;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      throw new AppError('No se recibieron archivos', 400);
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new AppError('Ticket no encontrado', 404);

    const attachments = await Promise.all(
      files.map(async (file) => {
        let thumbnailUrl: string | undefined;
        let width: number | undefined;
        let height: number | undefined;

        if (isImage(file.mimetype)) {
          try {
            const thumb = await generateThumbnail(file.path, file.filename, 300);
            thumbnailUrl = thumb.thumbnailUrl;
            width = thumb.width;
            height = thumb.height;
          } catch {
            // thumbnail generation failure is non-fatal
          }
        }

        return prisma.attachment.create({
          data: {
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: `/api/uploads/tickets/${file.filename}`,
            thumbnailUrl,
            width,
            height,
            ticketId,
            uploadedById: req.user?.userId,
          },
        });
      }),
    );

    res.json({ success: true, data: attachments });
  } catch (err) {
    next(err);
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) throw new AppError('No se recibió imagen', 400);

    const userId = req.user!.userId;

    // Resize to 200x200
    const resizedFilename = `resized_${file.filename}`;
    const resizedPath = path.join(path.dirname(file.path), resizedFilename);
    await sharp(file.path).resize(200, 200, { fit: 'cover' }).toFile(resizedPath);
    fs.unlinkSync(file.path);

    const avatarUrl = `/api/uploads/avatars/${resizedFilename}`;
    await prisma.user.update({ where: { id: userId }, data: { avatar: avatarUrl } });

    res.json({ success: true, data: { avatarUrl } });
  } catch (err) {
    next(err);
  }
};

export const uploadChatFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) throw new AppError('No se recibió archivo', 400);

    let thumbnailUrl: string | undefined;
    if (isImage(file.mimetype)) {
      try {
        const thumb = await generateThumbnail(file.path, file.filename, 300);
        thumbnailUrl = thumb.thumbnailUrl;
      } catch {
        // non-fatal
      }
    }

    res.json({
      success: true,
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/api/uploads/chat/${file.filename}`,
        thumbnailUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const serveFile = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { '*': filePath } = req.params as { '*': string };
    const absolutePath = path.resolve(UPLOAD_DIR, filePath);

    // Security: make sure path stays within upload dir
    if (!absolutePath.startsWith(path.resolve(UPLOAD_DIR))) {
      throw new AppError('Acceso denegado', 403);
    }

    if (!fs.existsSync(absolutePath)) {
      throw new AppError('Archivo no encontrado', 404);
    }

    res.sendFile(absolutePath);
  } catch (err) {
    next(err);
  }
};
