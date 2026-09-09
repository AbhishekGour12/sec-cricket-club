import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Suggestion, {
  SUGGESTION_TYPES,
  SUGGESTION_STATUSES,
  SuggestionType,
  SuggestionStatus,
} from '../models/Suggestion';
import User from '../../user/models/User';
import { logger } from '../../utils/logger';

export class SuggestionController {
  /**
   * POST /suggestions (or /me/suggestions)
   * Member submits a suggestion, complaint, or feedback.
   */
  public static async create(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      const { type = 'Suggestion', subject, message } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Message / feedback content is required',
        });
        return;
      }

      const trimmedMessage = message.trim();
      if (trimmedMessage.length > 3000) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Message must not exceed 3000 characters',
        });
        return;
      }

      const validTypes: string[] = [...SUGGESTION_TYPES];
      const selectedType: SuggestionType = validTypes.includes(type)
        ? (type as SuggestionType)
        : 'Suggestion';

      const trimmedSubject =
        typeof subject === 'string' && subject.trim()
          ? subject.trim().slice(0, 255)
          : null;

      const suggestion = await Suggestion.create({
        user_id: userId,
        type: selectedType,
        subject: trimmedSubject,
        message: trimmedMessage,
        status: 'Pending',
      });

      res.status(201).json({
        message: 'Your submission has been received. Thank you for your feedback!',
        suggestion,
      });
    } catch (error) {
      logger.error('[SuggestionController] create failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to submit suggestion/complaint',
      });
    }
  }

  /**
   * GET /me/suggestions
   * Returns suggestions submitted by the logged in member.
   */
  public static async getMySuggestions(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized', message: 'User not identified' });
        return;
      }

      const suggestions = await Suggestion.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
      });

      res.status(200).json({ suggestions });
    } catch (error) {
      logger.error('[SuggestionController] getMySuggestions failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch your suggestions',
      });
    }
  }

  /**
   * GET /admin/suggestions
   * Admin lists all suggestions with pagination, filters, and search.
   */
  public static async adminList(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      const { type, status, search } = req.query;

      const where: any = {};

      if (type && type !== 'All' && SUGGESTION_TYPES.includes(type as any)) {
        where.type = type;
      }

      if (status && status !== 'All' && SUGGESTION_STATUSES.includes(status as any)) {
        where.status = status;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const q = `%${search.trim()}%`;
        where[Op.or] = [
          { message: { [Op.iLike]: q } },
          { subject: { [Op.iLike]: q } },
        ];
      }

      const userInclude: any = {
        model: User,
        as: 'user',
        attributes: [
          'id',
          'full_name',
          'email',
          'phone',
          'profile_image',
          'membership_number',
          'business_name',
          'business_category',
          'designation',
        ],
        required: false,
      };

      const { rows, count } = await Suggestion.findAndCountAll({
        where,
        include: [userInclude],
        distinct: true,
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      res.status(200).json({
        suggestions: rows,
        pagination: {
          page,
          limit,
          total: count,
          total_pages: Math.ceil(count / limit) || 1,
        },
      });
    } catch (error) {
      logger.error('[SuggestionController] adminList failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve suggestions',
      });
    }
  }

  /**
   * GET /admin/suggestions/stats
   * Returns aggregated count stats for quick admin overview.
   */
  public static async adminStats(_req: Request, res: Response): Promise<void> {
    try {
      const [
        total,
        pending,
        reviewed,
        resolved,
        archived,
        suggestionsCount,
        complaintsCount,
        feedbackCount,
        generalCount,
      ] = await Promise.all([
        Suggestion.count(),
        Suggestion.count({ where: { status: 'Pending' } }),
        Suggestion.count({ where: { status: 'Reviewed' } }),
        Suggestion.count({ where: { status: 'Resolved' } }),
        Suggestion.count({ where: { status: 'Archived' } }),
        Suggestion.count({ where: { type: 'Suggestion' } }),
        Suggestion.count({ where: { type: 'Complaint' } }),
        Suggestion.count({ where: { type: 'Feedback' } }),
        Suggestion.count({ where: { type: 'General' } }),
      ]);

      res.status(200).json({
        total,
        pending,
        reviewed,
        resolved,
        archived,
        byType: {
          suggestion: suggestionsCount,
          complaint: complaintsCount,
          feedback: feedbackCount,
          general: generalCount,
        },
      });
    } catch (error) {
      logger.error('[SuggestionController] adminStats failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch suggestions statistics',
      });
    }
  }

  /**
   * PATCH /admin/suggestions/:id/status
   * Update status or notes for a suggestion.
   */
  public static async adminUpdate(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const suggestion = await Suggestion.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'phone', 'profile_image'],
          },
        ],
      });

      if (!suggestion) {
        res.status(404).json({ error: 'Not Found', message: 'Suggestion not found' });
        return;
      }

      const { status, admin_notes } = req.body;

      if (status !== undefined) {
        if (!SUGGESTION_STATUSES.includes(status)) {
          res.status(400).json({
            error: 'Validation Error',
            message: `Invalid status. Must be one of: ${SUGGESTION_STATUSES.join(', ')}`,
          });
          return;
        }
        suggestion.status = status as SuggestionStatus;
      }

      if (admin_notes !== undefined) {
        suggestion.admin_notes =
          typeof admin_notes === 'string' ? admin_notes.trim() : null;
      }

      await suggestion.save();

      res.status(200).json({
        message: 'Suggestion updated successfully',
        suggestion,
      });
    } catch (error) {
      logger.error('[SuggestionController] adminUpdate failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update suggestion',
      });
    }
  }

  /**
   * DELETE /admin/suggestions/:id
   * Admin permanently deletes a suggestion.
   */
  public static async adminDelete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const suggestion = await Suggestion.findByPk(id);

      if (!suggestion) {
        res.status(404).json({ error: 'Not Found', message: 'Suggestion not found' });
        return;
      }

      await suggestion.destroy();

      res.status(200).json({ message: 'Suggestion removed successfully' });
    } catch (error) {
      logger.error('[SuggestionController] adminDelete failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete suggestion',
      });
    }
  }
}

export default SuggestionController;
