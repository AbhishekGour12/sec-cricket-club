import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { User } from '../../user/models/User';
import { logger } from '../../utils/logger';

export class NotificationController {
  /**
   * GET /api/admin/notifications
   * Retrieve all admin notifications
   */
  public static async getNotifications(_req: Request, res: Response): Promise<void> {
    try {
      const notifications = await Notification.findAll({
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'profile_image'],
          },
        ],
      });

      res.status(200).json({ notifications });
    } catch (error) {
      logger.error('Error fetching admin notifications:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve notifications.' });
    }
  }

  /**
   * POST /api/admin/notifications/:id/read
   * Mark a notification as read
   */
  public static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await Notification.findByPk(id);

      if (!notification) {
        res.status(404).json({ error: 'Not Found', message: 'Notification not found.' });
        return;
      }

      await notification.update({ read: true });
      res.status(200).json({ message: 'Notification marked as read.', notification });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update notification status.' });
    }
  }
}
