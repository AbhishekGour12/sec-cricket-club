import { Response } from 'express';
import { logger } from '../../utils/logger';
import fs from 'fs';
import sharp from 'sharp';

export class UploadController {
  /**
   * POST /api/upload/profile-image
   */
  public static async uploadProfileImage(req: any, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Bad Request', message: 'No file uploaded' });
        return;
      }
      const fileUrl = `/uploads/userprofile/${req.file.filename}`;
      res.status(200).json({
        message: 'Profile image uploaded successfully',
        url: fileUrl,
      });
    } catch (error) {
      logger.error('Error uploading profile image:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to upload image' });
    }
  }

  /**
   * POST /api/upload/business-logo
   */
  public static async uploadBusinessLogo(req: any, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Bad Request', message: 'No file uploaded' });
        return;
      }
      const fileUrl = `/uploads/userprofile/${req.file.filename}`;
      res.status(200).json({
        message: 'Business logo uploaded successfully',
        url: fileUrl,
      });
    } catch (error) {
      logger.error('Error uploading business logo:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to upload image' });
    }
  }

  /**
   * POST /api/upload/visiting-card
   */
  public static async uploadVisitingCard(req: any, res: Response): Promise<void> {
    try {
      // Extract file(s)
      let files: any[] = [];
      if (req.file) {
        files = [req.file];
      } else if (req.files) {
        if (Array.isArray(req.files)) {
          files = req.files;
        } else {
          // Object from upload.fields (e.g. { image: [file], front: [file], back: [file] })
          const filesObj = req.files as { [key: string]: any[] };
          for (const key of Object.keys(filesObj)) {
            if (filesObj[key] && filesObj[key].length > 0) {
              files.push(...filesObj[key]);
            }
          }
        }
      }

      if (files.length === 0) {
        res.status(400).json({ error: 'Bad Request', message: 'No file uploaded' });
        return;
      }

      const validationErrors: string[] = [];

      for (const file of files) {
        try {
          const metadata = await sharp(file.path).metadata();
          const width = metadata.width || 0;
          const height = metadata.height || 0;
          const minDimension = Math.min(width, height);
          const maxDimension = Math.max(width, height);

          if (maxDimension < 600 || minDimension < 400) {
            validationErrors.push(
              `Resolution of ${file.originalname} is too low (${width}x${height}). It must be at least 600x400 pixels so the text is clear and readable.`
            );
          }
        } catch (err) {
          logger.error(`Error analyzing image ${file.filename}:`, err);
          validationErrors.push(`Failed to parse image file ${file.originalname}. Please ensure it is a valid image.`);
        }
      }

      if (validationErrors.length > 0) {
        // Delete uploaded files to prevent orphaned invalid files
        for (const file of files) {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (delErr) {
            logger.error(`Failed to delete invalid file ${file.path}:`, delErr);
          }
        }

        res.status(400).json({
          error: 'Bad Request',
          message: 'Visiting card image did not meet quality guidelines.',
          validationErrors,
        });
        return;
      }

      // All files validated successfully
      const urls = files.map((f: any) => `/uploads/userprofile/${f.filename}`);
      const isLiveCapture = req.body.is_live_capture === 'true' || req.body.is_live_capture === true;
      logger.info(`Visiting card uploaded successfully. Live capture: ${isLiveCapture}, URLs: ${urls.join(', ')}`);

      if (urls.length === 1) {
        res.status(200).json({
          message: 'Visiting card uploaded successfully',
          url: urls[0],
          urls,
          isLiveCapture,
        });
      } else {
        res.status(200).json({
          message: 'Visiting cards uploaded successfully',
          urls: urls,
          url: urls.join(','),
          isLiveCapture,
        });
      }
    } catch (error) {
      logger.error('Error uploading visiting card:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to upload visiting card' });
    }
  }

  /**
   * POST /api/upload/business-images
   */
  public static async uploadBusinessImages(req: any, res: Response): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({ error: 'Bad Request', message: 'No files uploaded' });
        return;
      }
      const fileUrls = req.files.map((file: any) => `/uploads/userprofile/${file.filename}`);
      res.status(200).json({
        message: 'Business images uploaded successfully',
        urls: fileUrls,
      });
    } catch (error) {
      logger.error('Error uploading business images:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to upload business images' });
    }
  }
}

export default UploadController;
