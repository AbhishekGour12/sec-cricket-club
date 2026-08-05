import { Request, Response } from 'express';
import User from '../../user/models/User';
import { logger } from '../../utils/logger';
import {
  normalizeAchievements,
  normalizePrivacy,
  serializeSelf,
} from '../../user/serializers/user.serializer';
import { validateUniqueMobile } from '../../utils/phone';

/** Fields an administrator may overwrite on a member record. */
const TEXT_FIELDS = [
  'full_name',
  'phone',
  'alternate_phone',
  'contact_email',
  'instagram_url',
  'facebook_url',
  'linkedin_url',
  'membership_number',
  'designation',
  'business_name',
  'business_category',
  'business_description',
  'business_address',
  'city',
  'state',
  'country',
  'website',
  'profile_image',
  'business_logo',
] as const;

const trimOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AdminProfileController {
  /**
   * PUT /api/admin/member/:id
   * Full member profile edit from the admin panel.
   */
  public static async updateMember(req: Request, res: Response): Promise<void> {
    try {
      const member = await User.findByPk(req.params.id);
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'Member not found' });
        return;
      }

      const body = req.body ?? {};
      const updateData: Record<string, unknown> = {};

      TEXT_FIELDS.forEach((field) => {
        if (body[field] !== undefined) {
          updateData[field] = trimOrNull(body[field]);
        }
      });

      // Mobile numbers identify members, so they must stay unique —
      // but only against *other* members. Keeping the same number on edit is fine.
      if (body.phone !== undefined) {
        const check = await validateUniqueMobile(body.phone, member.id, member.phone);
        if (!check.ok) {
          res.status(409).json({ error: 'Conflict', message: check.message });
          return;
        }
        updateData.phone = check.normalized || null;
      }

      // Email and membership number are unique — validate before writing.
      if (body.email !== undefined) {
        const email = trimOrNull(body.email)?.toLowerCase() ?? null;
        if (email && !EMAIL_PATTERN.test(email)) {
          res.status(400).json({ error: 'Bad Request', message: 'Invalid email format.' });
          return;
        }
        if (email && email !== member.email) {
          const clash = await User.findOne({ where: { email } });
          if (clash && clash.id !== member.id) {
            res.status(409).json({ error: 'Conflict', message: `Another member already uses ${email}.` });
            return;
          }
        }
        updateData.email = email;
      }

      if (updateData.membership_number) {
        const clash = await User.findOne({
          where: { membership_number: updateData.membership_number as string },
        });
        if (clash && clash.id !== member.id) {
          res.status(409).json({
            error: 'Conflict',
            message: `Membership number ${updateData.membership_number} is already assigned.`,
          });
          return;
        }
      }

      if (body.contact_email !== undefined) {
        const contactEmail = trimOrNull(body.contact_email);
        if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) {
          res.status(400).json({ error: 'Bad Request', message: 'Invalid contact email format.' });
          return;
        }
        updateData.contact_email = contactEmail;
      }

      if (body.achievements !== undefined) {
        updateData.achievements = normalizeAchievements(body.achievements);
      }
      if (body.privacy_settings !== undefined) {
        updateData.privacy_settings = normalizePrivacy(body.privacy_settings);
      }
      if (Array.isArray(body.business_images)) {
        updateData.business_images = body.business_images
          .filter((item: unknown): item is string => typeof item === 'string')
          .slice(0, 5);
      }
      if (body.status === 'active' || body.status === 'inactive') {
        updateData.status = body.status;
      }
      if (['pending', 'approved', 'rejected'].includes(body.approval_status)) {
        updateData.approval_status = body.approval_status;
      }
      if (['member', 'admin', 'moderator'].includes(body.role)) {
        updateData.role = body.role;
      }
      if (typeof body.is_profile_completed === 'boolean') {
        updateData.is_profile_completed = body.is_profile_completed;
      }

      await member.update(updateData);
      logger.info(`Admin updated member profile ${member.id}`);

      res.status(200).json({
        message: 'Member profile updated successfully.',
        member: serializeSelf(member),
      });
    } catch (error) {
      logger.error('Admin updateMember error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update member profile.' });
    }
  }

  /**
   * DELETE /api/admin/member/:id
   * Permanently removes a member record.
   */
  public static async deleteMember(req: Request, res: Response): Promise<void> {
    try {
      const member = await User.findByPk(req.params.id);
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'Member not found' });
        return;
      }

      if (member.role === 'admin') {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Administrator accounts cannot be deleted from the members list.',
        });
        return;
      }

      const label = member.full_name || member.email || `member #${member.id}`;
      await member.destroy();
      logger.info(`Admin deleted member ${label}`);

      res.status(200).json({ message: `${label} has been permanently deleted.` });
    } catch (error) {
      logger.error('Admin deleteMember error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete member.' });
    }
  }
}

export default AdminProfileController;
