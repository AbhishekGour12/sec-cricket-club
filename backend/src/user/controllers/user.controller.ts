import { Response } from 'express';
import User from '../models/User';
import { logger } from '../../utils/logger';
import { Notification } from '../../admin/models/Notification';
import {
  normalizeAchievements,
  normalizeBookmarks,
  normalizePrivacy,
  serializePublic,
  serializeSelf,
} from '../serializers/user.serializer';
import { validateUniqueMobile } from '../../utils/phone';

const trimOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class UserController {
  /**
   * GET /api/me
   * Retrieve current authenticated user profile
   */
  public static async getMe(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized', message: 'No authenticated user in context' });
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
        return;
      }

      res.status(200).json({ user: serializeSelf(user) });
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve user profile' });
    }
  }

  /**
   * PUT /api/me
   * Update current authenticated user profile details
   */
  public static async updateMe(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized', message: 'No authenticated user in context' });
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
        return;
      }

      const {
        full_name,
        profile_image,
        phone,
        alternate_phone,
        contact_email,
        instagram_url,
        facebook_url,
        linkedin_url,
        achievements,
        privacy_settings,
        membership_number,
        designation,
        business_name,
        business_category,
        business_description,
        business_address,
        business_logo,
        visiting_card,
        visiting_card_is_live_capture,
        business_images,
        city,
        state,
        country,
        website,
        is_profile_completed,
        status,
        approval_status,
        rejection_reason,
      } = req.body;

      const updateData: any = {};

      if (phone !== undefined) {
        // Skip clash check when the member is only re-saving their own number.
        const check = await validateUniqueMobile(phone, user.id, user.phone);
        if (!check.ok) {
          res.status(409).json({ error: 'Conflict', message: check.message });
          return;
        }
        updateData.phone = check.normalized || null;
      }

      if (alternate_phone !== undefined) updateData.alternate_phone = trimOrNull(alternate_phone);
      if (instagram_url !== undefined) updateData.instagram_url = trimOrNull(instagram_url);
      if (facebook_url !== undefined) updateData.facebook_url = trimOrNull(facebook_url);
      if (linkedin_url !== undefined) updateData.linkedin_url = trimOrNull(linkedin_url);
      if (business_address !== undefined) updateData.business_address = trimOrNull(business_address);
      if (achievements !== undefined) updateData.achievements = normalizeAchievements(achievements);
      if (privacy_settings !== undefined) {
        updateData.privacy_settings = {
          ...normalizePrivacy(user.privacy_settings),
          ...normalizePrivacy(privacy_settings),
        };
      }

      if (contact_email !== undefined) {
        const cleaned = trimOrNull(contact_email);
        if (cleaned && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
          res.status(400).json({ error: 'Bad Request', message: 'Please enter a valid contact email address.' });
          return;
        }
        updateData.contact_email = cleaned;
      }

      if (full_name !== undefined) updateData.full_name = full_name;
      if (profile_image !== undefined) updateData.profile_image = profile_image;
      if (membership_number !== undefined) updateData.membership_number = membership_number;
      if (designation !== undefined) updateData.designation = designation;
      if (business_name !== undefined) updateData.business_name = business_name;
      if (business_category !== undefined) updateData.business_category = business_category;
      if (business_description !== undefined) updateData.business_description = business_description;
      if (business_logo !== undefined) updateData.business_logo = business_logo;
      if (visiting_card !== undefined) {
        updateData.visiting_card = visiting_card;
        updateData.visiting_card_status = 'approved';
        updateData.visiting_card_rejection_reason = null;
      }
      if (visiting_card_is_live_capture !== undefined) {
        updateData.visiting_card_is_live_capture = visiting_card_is_live_capture;
      }
      if (business_images !== undefined) updateData.business_images = business_images;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (country !== undefined) updateData.country = country;
      if (website !== undefined) updateData.website = website;
      if (is_profile_completed !== undefined) updateData.is_profile_completed = is_profile_completed;
      if (status !== undefined) updateData.status = status;
      if (approval_status !== undefined) updateData.approval_status = approval_status;
      if (rejection_reason !== undefined) updateData.rejection_reason = rejection_reason;

      const wasProfileCompleted = user.is_profile_completed;

      await user.update(updateData);

      // Trigger notification if user completed profile for the first time by themselves
      if (updateData.is_profile_completed && !wasProfileCompleted) {
        const source = user.member_source || 'self_registration';
        if (source === 'self_registration') {
          await Notification.create({
            type: 'new_registration',
            title: 'New Profile Completed',
            message: `Member ${user.full_name || user.email} has completed their registration and is awaiting approval.`,
            user_id: user.id,
          });
        }
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        user: serializeSelf(user),
      });
    } catch (error) {
      logger.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update profile' });
    }
  }

  /**
   * GET /api/me/bookmarks
   * Members the current user saved to their network.
   */
  public static async getBookmarks(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
        return;
      }

      const ids = normalizeBookmarks(user.bookmarked_members);
      if (ids.length === 0) {
        res.status(200).json({ members: [] });
        return;
      }

      const members = await User.findAll({
        where: { id: ids, approval_status: 'approved', status: 'active' },
        order: [['full_name', 'ASC']],
      });

      res.status(200).json({ members: members.map((m) => serializePublic(m, userId)) });
    } catch (error) {
      logger.error('Error fetching bookmarks:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve your network' });
    }
  }

  /**
   * POST /api/me/bookmarks/:memberId
   * DELETE /api/me/bookmarks/:memberId
   */
  public static async toggleBookmark(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const memberId = Number(req.params.memberId);

      if (!Number.isInteger(memberId) || memberId <= 0) {
        res.status(400).json({ error: 'Bad Request', message: 'A valid member id is required.' });
        return;
      }
      if (memberId === userId) {
        res.status(400).json({ error: 'Bad Request', message: 'You cannot save your own profile.' });
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
        return;
      }

      const shouldAdd = req.method === 'POST';
      const current = normalizeBookmarks(user.bookmarked_members);

      if (shouldAdd) {
        const target = await User.findByPk(memberId);
        if (!target || target.approval_status !== 'approved' || target.status !== 'active') {
          res.status(404).json({ error: 'Not Found', message: 'Member not found' });
          return;
        }
      }

      const next = shouldAdd
        ? Array.from(new Set([...current, memberId]))
        : current.filter((id) => id !== memberId);

      await user.update({ bookmarked_members: next });

      res.status(200).json({
        message: shouldAdd ? 'Member saved to your network.' : 'Member removed from your network.',
        bookmarked_members: next,
      });
    } catch (error) {
      logger.error('Error updating bookmark:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update your network' });
    }
  }
  /**
   * POST /api/me/fcm-token
   * Save or update the FCM push token for the authenticated user
   */
  public static async saveFcmToken(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized', message: 'No authenticated user in context' });
        return;
      }

      const { fcm_token } = req.body;
      if (!fcm_token || typeof fcm_token !== 'string') {
        res.status(400).json({ error: 'Bad Request', message: 'fcm_token is required' });
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
        return;
      }

      await user.update({ fcm_token });
      res.status(200).json({ message: 'FCM token saved successfully' });
    } catch (error) {
      logger.error('Error saving FCM token:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to save FCM token' });
    }
  }

  /**
   * POST /api/me/request-approval
   * Allow user to request administrator review/approval manually
   */
  public static async requestApproval(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized', message: 'No authenticated user in context' });
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
        return;
      }

      if (user.approval_status !== 'pending') {
        res.status(400).json({
          error: 'Bad Request',
          message: `Cannot request approval when profile status is currently '${user.approval_status}'.`,
        });
        return;
      }

      // Check if there is already an active (unread) request_approval notification to avoid spamming
      const existingNotification = await Notification.findOne({
        where: {
          user_id: user.id,
          type: 'approval_request',
          read: false,
        },
      });

      if (existingNotification) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'An active approval request is already pending review with the administrator.',
        });
        return;
      }

      // Create admin notification
      await Notification.create({
        type: 'approval_request',
        title: 'Profile Approval Requested',
        message: `Member ${user.full_name || user.email} (Membership: ${user.membership_number || 'N/A'}) has requested profile approval.`,
        user_id: user.id,
      });

      res.status(200).json({ message: 'Approval request submitted to the administrator successfully.' });
    } catch (error) {
      logger.error('Error requesting profile approval:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to submit approval request.' });
    }
  }
}

export default UserController;