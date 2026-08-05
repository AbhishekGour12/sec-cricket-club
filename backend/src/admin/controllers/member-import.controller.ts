import { Request, Response } from 'express';
import { sequelize } from '../../config/database';
import User from '../../user/models/User';
import { logger } from '../../utils/logger';
import {
  buildErrorReportCsv,
  buildTemplateCsv,
  IMPORT_COLUMNS,
  ImportMode,
  parseRows,
  validateRows,
} from '../services/member-import.service';

const MAX_ROWS = 5000;

const resolveMode = (value: unknown): ImportMode =>
  value === 'create_update' ? 'create_update' : 'create_only';

const readRows = (req: Request, res: Response) => {
  const rows = (req.body ?? {}).rows;

  if (!Array.isArray(rows)) {
    res.status(400).json({ error: 'Bad Request', message: 'No spreadsheet rows were provided.' });
    return null;
  }
  if (rows.length === 0) {
    res.status(400).json({ error: 'Bad Request', message: 'The uploaded file contains no data rows.' });
    return null;
  }
  if (rows.length > MAX_ROWS) {
    res.status(400).json({
      error: 'Bad Request',
      message: `The file contains ${rows.length} rows, which exceeds the ${MAX_ROWS} row limit.`,
    });
    return null;
  }

  return rows;
};

export class MemberImportController {
  /**
   * GET /api/admin/members/import-template
   */
  public static getTemplate(_req: Request, res: Response): void {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="sec_member_import_template.csv"');
    res.status(200).send(buildTemplateCsv());
  }

  /**
   * GET /api/admin/members/import-columns
   * Lets the admin UI render the column contract without duplicating it.
   */
  public static getColumns(_req: Request, res: Response): void {
    res.status(200).json({ columns: IMPORT_COLUMNS, maxRows: MAX_ROWS });
  }

  /**
   * POST /api/admin/members/import/validate
   * Dry run. Never writes to the database.
   */
  public static async validate(req: Request, res: Response): Promise<void> {
    try {
      const rows = readRows(req, res);
      if (!rows) return;

      const report = await validateRows(parseRows(rows), resolveMode(req.body.mode));
      res.status(200).json(report);
    } catch (error) {
      logger.error('Member import validation failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to validate the spreadsheet.' });
    }
  }

  /**
   * POST /api/admin/members/import/error-report
   * Returns the failed rows as a downloadable CSV with a reason column.
   */
  public static async errorReport(req: Request, res: Response): Promise<void> {
    try {
      const rows = readRows(req, res);
      if (!rows) return;

      const report = await validateRows(parseRows(rows), resolveMode(req.body.mode));

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="sec_member_import_errors.csv"');
      res.status(200).send(buildErrorReportCsv(report.rows));
    } catch (error) {
      logger.error('Member import error report failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to build the error report.' });
    }
  }

  /**
   * POST /api/admin/members/import/commit
   * All-or-nothing. Re-validates server side, then writes inside a transaction
   * so a failure part-way through leaves no partial roster behind.
   */
  public static async commit(req: Request, res: Response): Promise<void> {
    try {
      const rows = readRows(req, res);
      if (!rows) return;

      const mode = resolveMode(req.body.mode);
      const report = await validateRows(parseRows(rows), mode);

      if (report.summary.errors > 0) {
        res.status(422).json({
          error: 'Validation Failed',
          message: `${report.summary.valid} rows valid, ${report.summary.errors} rows with errors. Nothing was imported.`,
          ...report,
        });
        return;
      }

      const results = { created: 0, updated: 0, skipped: report.summary.toSkip };

      await sequelize.transaction(async (transaction) => {
        for (const row of report.rows) {
          if (row.action === 'skip') continue;

          const payload = {
            full_name: row.full_name,
            phone: row.phone,
            email: row.email || null,
            business_name: row.business_name || undefined,
            business_description: row.business_description || undefined,
            business_category: row.business_category || undefined,
            business_address: row.business_address || undefined,
            city: row.city || undefined,
            instagram_url: row.instagram_url || undefined,
            facebook_url: row.facebook_url || undefined,
            linkedin_url: row.linkedin_url || undefined,
            designation: row.designation || 'Associate Member',
            member_source: 'excel' as const,
          };

          if (row.action === 'update' && row.matchedMemberId) {
            const member = await User.findByPk(row.matchedMemberId, { transaction });
            if (!member) continue;

            // Never blank out existing data with empty spreadsheet cells.
            const patch: Record<string, unknown> = {};
            Object.entries(payload).forEach(([key, value]) => {
              if (value !== undefined && value !== null && value !== '') patch[key] = value;
            });

            await member.update(patch, { transaction });
            results.updated++;
          } else {
            await User.create(
              {
                ...payload,
                firebase_uid: `excel_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
                status: 'inactive',
                approval_status: 'approved',
                is_profile_completed: false,
              } as any,
              { transaction },
            );
            results.created++;
          }
        }
      });

      // Bulk-imported members are pre-loaded silently — no welcome notification.
      logger.info(
        `Bulk import committed (${mode}): created ${results.created}, updated ${results.updated}, skipped ${results.skipped}`,
      );

      res.status(200).json({
        message: `Import complete. Created ${results.created}, updated ${results.updated}, skipped ${results.skipped}.`,
        results,
      });
    } catch (error) {
      logger.error('Member import commit failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'The import was rolled back because of an unexpected error. No members were changed.',
      });
    }
  }
}

export default MemberImportController;
