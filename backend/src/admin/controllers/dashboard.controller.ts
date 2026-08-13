import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User } from '../../user/models/User';
import Announcement from '../models/Announcement';
import Event from '../models/Event';
import { Notification } from '../models/Notification';
import { sequelize } from '../../config/database';
import { logger } from '../../utils/logger';

/**
 * GET /admin/dashboard/stats
 * Live metrics for the admin home dashboard.
 */
export class DashboardController {
  public static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const prevMonthStart = new Date(monthStart);
      prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

      const [
        totalMembers,
        approvedMembers,
        pendingMembers,
        rejectedMembers,
        membersThisMonth,
        membersPrevMonth,
        upcomingEvents,
        publishedEvents,
        tournamentEvents,
        publishedAnnouncements,
        draftAnnouncements,
        announcementsThisMonth,
        unreadNotifications,
        recentNotifications,
        recentPending,
        upcomingEventRows,
      ] = await Promise.all([
        User.count({ where: { role: 'member' } }),
        User.count({ where: { role: 'member', approval_status: 'approved' } }),
        User.count({ where: { role: 'member', approval_status: 'pending' } }),
        User.count({ where: { role: 'member', approval_status: 'rejected' } }),
        User.count({
          where: {
            role: 'member',
            created_at: { [Op.gte]: monthStart },
          },
        }),
        User.count({
          where: {
            role: 'member',
            created_at: {
              [Op.gte]: prevMonthStart,
              [Op.lt]: monthStart,
            },
          },
        }),
        Event.count({
          where: {
            status: 'Published',
            event_date: { [Op.gte]: today },
          },
        }),
        Event.count({ where: { status: 'Published' } }),
        Event.count({
          where: {
            status: 'Published',
            event_type: 'Tournament',
            event_date: { [Op.gte]: today },
          },
        }),
        Announcement.count({ where: { status: 'Published' } }),
        Announcement.count({ where: { status: 'Draft' } }),
        Announcement.count({
          where: {
            status: 'Published',
            created_at: { [Op.gte]: monthStart },
          },
        }),
        Notification.count({ where: { read: false } }),
        Notification.findAll({
          order: [['created_at', 'DESC']],
          limit: 5,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'full_name', 'email', 'profile_image'],
              required: false,
            },
          ],
        }),
        User.findAll({
          where: { role: 'member', approval_status: 'pending' },
          attributes: ['id', 'full_name', 'email', 'created_at', 'profile_image'],
          order: [['created_at', 'DESC']],
          limit: 5,
        }),
        Event.findAll({
          where: {
            status: 'Published',
            event_date: { [Op.gte]: today },
          },
          attributes: ['id', 'event_name', 'event_type', 'event_date', 'start_time', 'venue_name', 'is_featured'],
          order: [
            ['event_date', 'ASC'],
            ['start_time', 'ASC'],
          ],
          limit: 5,
        }),
      ]);

      let apiOnline = true;
      let dbOnline = true;
      try {
        await sequelize.authenticate();
      } catch {
        dbOnline = false;
        apiOnline = false;
      }

      const memberChangePct =
        membersPrevMonth === 0
          ? membersThisMonth > 0
            ? 100
            : 0
          : Math.round(((membersThisMonth - membersPrevMonth) / membersPrevMonth) * 100);

      res.status(200).json({
        metrics: {
          total_members: totalMembers,
          approved_members: approvedMembers,
          pending_members: pendingMembers,
          rejected_members: rejectedMembers,
          members_this_month: membersThisMonth,
          members_change_pct: memberChangePct,
          upcoming_events: upcomingEvents,
          published_events: publishedEvents,
          active_tournaments: tournamentEvents,
          published_announcements: publishedAnnouncements,
          draft_announcements: draftAnnouncements,
          announcements_this_month: announcementsThisMonth,
          unread_notifications: unreadNotifications,
        },
        recent: {
          notifications: recentNotifications,
          pending_members: recentPending,
          upcoming_events: upcomingEventRows,
        },
        health: {
          api: apiOnline ? 'online' : 'offline',
          database: dbOnline ? 'connected' : 'disconnected',
          checked_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('[Dashboard] getStats failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load dashboard stats',
      });
    }
  }
}

export default DashboardController;
