import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import BusinessFlyer from '../models/BusinessFlyer';
import User from '../models/User';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../middlewares/verifyJwt';

const MAX_FLYERS = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const uploadsDir = path.resolve(__dirname, '../../../uploads/userprofile');

const serializeFlyer = (flyer: BusinessFlyer) => ({
  id: flyer.id,
  user_id: flyer.user_id,
  image_url: flyer.image_url,
  display_order: flyer.display_order,
  created_at: flyer.created_at,
  updated_at: flyer.updated_at,
});

const resolveAbsolutePath = (imageUrl: string): string => {
  const relative = imageUrl.replace(/^\//, '');
  return path.resolve(__dirname, '../../../', relative);
};

const hashFile = (filePath: string): string => {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const deleteFileQuietly = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    logger.error(`Failed to delete file ${filePath}:`, err);
  }
};

/**
 * Compress flyer image in-place with Sharp (max edge 1600px, JPEG/WebP quality ~80).
 */
const compressImage = async (filePath: string, mimeType: string): Promise<void> => {
  const ext = path.extname(filePath).toLowerCase();
  const tempPath = `${filePath}.tmp`;

  let pipeline = sharp(filePath).rotate().resize({
    width: 1600,
    height: 1600,
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (mimeType === 'image/png' || ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: 8 });
  } else if (mimeType === 'image/webp' || ext === '.webp') {
    pipeline = pipeline.webp({ quality: 80 });
  } else {
    pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
  }

  await pipeline.toFile(tempPath);
  fs.renameSync(tempPath, filePath);
};

export class BusinessFlyerController {
  /**
   * GET /api/profile/business-flyers
   * Own flyers for the authenticated member.
   */
  public static async getMyFlyers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const flyers = await BusinessFlyer.findAll({
        where: { user_id: userId },
        order: [
          ['display_order', 'ASC'],
          ['id', 'ASC'],
        ],
      });
      res.status(200).json({ flyers: flyers.map(serializeFlyer), max: MAX_FLYERS });
    } catch (error) {
      logger.error('Error fetching business flyers:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve business flyers' });
    }
  }

  /**
   * GET /api/members/:id/business-flyers
   * Public flyers for an approved member profile.
   */
  public static async getMemberFlyers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const memberId = parseInt(req.params.id, 10);
      if (!Number.isInteger(memberId) || memberId <= 0) {
        res.status(400).json({ error: 'Bad Request', message: 'Invalid member id' });
        return;
      }

      const member = await User.findByPk(memberId);
      if (!member || member.approval_status !== 'approved' || member.status !== 'active') {
        res.status(404).json({ error: 'Not Found', message: 'Member profile not found' });
        return;
      }

      const flyers = await BusinessFlyer.findAll({
        where: { user_id: memberId },
        order: [
          ['display_order', 'ASC'],
          ['id', 'ASC'],
        ],
      });
      res.status(200).json({ flyers: flyers.map(serializeFlyer) });
    } catch (error) {
      logger.error('Error fetching member business flyers:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve business flyers' });
    }
  }

  /**
   * POST /api/profile/business-flyers
   * Upload a new flyer (or replace an existing one via replace_id).
   */
  public static async uploadFlyer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'Bad Request', message: 'No image uploaded' });
        return;
      }

      const mime = (file.mimetype || '').toLowerCase();
      const ext = path.extname(file.originalname || file.filename).toLowerCase();

      if (!ALLOWED_MIME.has(mime) || !ALLOWED_EXT.has(ext)) {
        deleteFileQuietly(file.path);
        res.status(400).json({
          error: 'Bad Request',
          message: 'Only JPG, JPEG, PNG, and WEBP images are allowed',
        });
        return;
      }

      if (file.size > MAX_FILE_BYTES) {
        deleteFileQuietly(file.path);
        res.status(400).json({
          error: 'Bad Request',
          message: 'Image must be 5 MB or smaller',
        });
        return;
      }

      // Compress before hashing / persisting
      try {
        await compressImage(file.path, mime);
      } catch (compressErr) {
        logger.error('Failed to compress business flyer:', compressErr);
        deleteFileQuietly(file.path);
        res.status(400).json({ error: 'Bad Request', message: 'Invalid image file' });
        return;
      }

      const newHash = hashFile(file.path);
      const existing = await BusinessFlyer.findAll({ where: { user_id: userId } });

      // Reject duplicate content (unless replacing the same flyer)
      const replaceId = req.body?.replace_id ? parseInt(String(req.body.replace_id), 10) : null;

      for (const flyer of existing) {
        if (replaceId && flyer.id === replaceId) continue;
        try {
          const abs = resolveAbsolutePath(flyer.image_url);
          if (fs.existsSync(abs) && hashFile(abs) === newHash) {
            deleteFileQuietly(file.path);
            res.status(409).json({
              error: 'Conflict',
              message: 'This image has already been uploaded',
            });
            return;
          }
        } catch {
          // Skip unreadable existing files
        }
      }

      const imageUrl = `/uploads/userprofile/${file.filename}`;

      // Replace flow: update existing row, delete old file
      if (replaceId && Number.isInteger(replaceId)) {
        const target = existing.find((f) => f.id === replaceId);
        if (!target) {
          deleteFileQuietly(file.path);
          res.status(404).json({ error: 'Not Found', message: 'Flyer to replace was not found' });
          return;
        }

        const oldAbs = resolveAbsolutePath(target.image_url);
        await target.update({ image_url: imageUrl });
        deleteFileQuietly(oldAbs);

        res.status(200).json({
          message: 'Business flyer replaced successfully',
          flyer: serializeFlyer(target),
        });
        return;
      }

      if (existing.length >= MAX_FLYERS) {
        deleteFileQuietly(file.path);
        res.status(400).json({
          error: 'Bad Request',
          message: `Maximum of ${MAX_FLYERS} business flyers allowed`,
        });
        return;
      }

      const nextOrder =
        existing.length === 0
          ? 0
          : Math.max(...existing.map((f) => f.display_order)) + 1;

      const flyer = await BusinessFlyer.create({
        user_id: userId,
        image_url: imageUrl,
        display_order: nextOrder,
      });

      res.status(201).json({
        message: 'Business flyer uploaded successfully',
        flyer: serializeFlyer(flyer),
      });
    } catch (error) {
      if (req.file?.path) deleteFileQuietly(req.file.path);
      logger.error('Error uploading business flyer:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to upload business flyer' });
    }
  }

  /**
   * DELETE /api/profile/business-flyers/:id
   */
  public static async deleteFlyer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const flyerId = parseInt(req.params.id, 10);

      if (!Number.isInteger(flyerId) || flyerId <= 0) {
        res.status(400).json({ error: 'Bad Request', message: 'Invalid flyer id' });
        return;
      }

      const flyer = await BusinessFlyer.findOne({ where: { id: flyerId, user_id: userId } });
      if (!flyer) {
        res.status(404).json({ error: 'Not Found', message: 'Business flyer not found' });
        return;
      }

      const abs = resolveAbsolutePath(flyer.image_url);
      await flyer.destroy();
      deleteFileQuietly(abs);

      res.status(200).json({ message: 'Business flyer deleted successfully' });
    } catch (error) {
      logger.error('Error deleting business flyer:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete business flyer' });
    }
  }

  /**
   * PUT /api/profile/business-flyers/reorder
   * Body: { ordered_ids: number[] }
   */
  public static async reorderFlyers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const orderedIds = req.body?.ordered_ids;

      if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'ordered_ids must be a non-empty array of flyer ids',
        });
        return;
      }

      const ids = orderedIds.map((id: unknown) => parseInt(String(id), 10));
      if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
        res.status(400).json({ error: 'Bad Request', message: 'Invalid flyer id in ordered_ids' });
        return;
      }

      if (new Set(ids).size !== ids.length) {
        res.status(400).json({ error: 'Bad Request', message: 'Duplicate ids in ordered_ids' });
        return;
      }

      const existing = await BusinessFlyer.findAll({ where: { user_id: userId } });
      const existingIds = new Set(existing.map((f) => f.id));

      if (ids.length !== existing.length || ids.some((id) => !existingIds.has(id))) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'ordered_ids must include every flyer exactly once',
        });
        return;
      }

      await Promise.all(
        ids.map((id, index) =>
          BusinessFlyer.update({ display_order: index }, { where: { id, user_id: userId } }),
        ),
      );

      const flyers = await BusinessFlyer.findAll({
        where: { user_id: userId },
        order: [
          ['display_order', 'ASC'],
          ['id', 'ASC'],
        ],
      });

      res.status(200).json({
        message: 'Business flyers reordered successfully',
        flyers: flyers.map(serializeFlyer),
      });
    } catch (error) {
      logger.error('Error reordering business flyers:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to reorder business flyers' });
    }
  }

  /**
   * DELETE /api/admin/member/:memberId/business-flyers/:id
   * Admin removes an inappropriate flyer.
   */
  public static async adminDeleteFlyer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const memberId = parseInt(req.params.memberId, 10);
      const flyerId = parseInt(req.params.id, 10);

      if (!Number.isInteger(memberId) || !Number.isInteger(flyerId)) {
        res.status(400).json({ error: 'Bad Request', message: 'Invalid ids' });
        return;
      }

      const flyer = await BusinessFlyer.findOne({
        where: { id: flyerId, user_id: memberId },
      });

      if (!flyer) {
        res.status(404).json({ error: 'Not Found', message: 'Business flyer not found' });
        return;
      }

      const abs = resolveAbsolutePath(flyer.image_url);
      await flyer.destroy();
      deleteFileQuietly(abs);

      res.status(200).json({ message: 'Business flyer deleted successfully' });
    } catch (error) {
      logger.error('Error admin-deleting business flyer:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete business flyer' });
    }
  }

  /**
   * GET /api/admin/member/:memberId/business-flyers
   */
  public static async adminGetFlyers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const memberId = parseInt(req.params.memberId, 10);
      if (!Number.isInteger(memberId) || memberId <= 0) {
        res.status(400).json({ error: 'Bad Request', message: 'Invalid member id' });
        return;
      }

      const flyers = await BusinessFlyer.findAll({
        where: { user_id: memberId },
        order: [
          ['display_order', 'ASC'],
          ['id', 'ASC'],
        ],
      });

      res.status(200).json({ flyers: flyers.map(serializeFlyer) });
    } catch (error) {
      logger.error('Error admin-fetching business flyers:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve business flyers' });
    }
  }
}

export default BusinessFlyerController;

// Ensure uploads directory exists when module loads
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
