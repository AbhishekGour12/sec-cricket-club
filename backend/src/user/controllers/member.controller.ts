import { Response } from 'express';
import User from '../models/User';
import { Op } from 'sequelize';
import { logger } from '../../utils/logger';
import { sequelize } from '../../config/database';
import { serializePublic } from '../serializers/user.serializer';

export class MemberController {
  /**
   * GET /api/members
   * Retrieve list of members with search, filter, and pagination options
   */
  public static async getMembers(req: any, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      
      const search = req.query.search as string;
      const category = req.query.category as string;

      const whereClause: any = {
        approval_status: 'approved',
        status: 'active',
      };

      // Filter by category
      if (category) {
        whereClause.business_category = category;
      }

      // Perform broad text search
      if (search) {
        whereClause[Op.or] = [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { business_name: { [Op.iLike]: `%${search}%` } },
          { business_category: { [Op.iLike]: `%${search}%` } },
          { membership_number: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      res.status(200).json({
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        members: rows.map((member) => serializePublic(member, req.user?.id)),
      });
    } catch (error) {
      logger.error('Error fetching members list:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve members list' });
    }
  }

  /**
   * GET /api/members/categories
   * Retrieve list of distinct non-empty business categories
   */
  public static async getCategories(_req: any, res: Response): Promise<void> {
    try {
      const categoriesData = await User.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('business_category')), 'business_category']
        ],
        where: {
          approval_status: 'approved',
          status: 'active',
          business_category: {
            [Op.and]: [
              { [Op.ne]: null as any },
              { [Op.ne]: '' }
            ]
          } as any
        },
        raw: true
      });

      const categories = categoriesData
        .map((c: any) => c.business_category)
        .filter((c): c is string => !!c);

      res.status(200).json({ categories });
    } catch (error) {
      logger.error('Error fetching distinct categories:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve business categories' });
    }
  }

  /**
   * GET /api/members/search
   * Quick search endpoint (maps search parameters to filter)
   */
  public static async searchMembers(req: any, res: Response): Promise<void> {
    // Simply proxy to getMembers for unified implementation
    return MemberController.getMembers(req, res);
  }

  /**
   * GET /api/members/:id
   * Retrieve details of a specific member
   */
  public static async getMemberById(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const member = await User.findByPk(id);

      if (!member || member.approval_status !== 'approved' || member.status !== 'active') {
        res.status(404).json({ error: 'Not Found', message: 'Member profile not found' });
        return;
      }

      res.status(200).json({ member: serializePublic(member, req.user?.id) });
    } catch (error) {
      logger.error(`Error fetching member details for ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve member details' });
    }
  }
}

export default MemberController;
