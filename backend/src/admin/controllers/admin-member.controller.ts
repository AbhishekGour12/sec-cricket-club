import { Request, Response } from 'express';
import User from '../../user/models/User';
import { logger } from '../../utils/logger';
import { validateUniqueMobile } from '../../utils/phone';

export class AdminMemberActionsController {
  /**
   * POST /api/admin/members/create-manual
   * Manual Single Member Creation by Admin
   */
  public static async createManualMember(req: Request, res: Response): Promise<void> {
    try {
      const {
        full_name,
        email,
        phone,
        membership_number,
        designation,
        business_name,
        business_category,
        city,
        state,
        country,
        status,
        approval_status,
      } = req.body;

      // 1. Check required fields
      if (!full_name || !email || !membership_number || !business_name || !business_category) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required fields. Name, Email, Membership Number, Business Name, and Category are required.',
        });
        return;
      }

      // 2. Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Bad Request', message: 'Invalid email format.' });
        return;
      }

      // 3. Unique checks
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        res.status(400).json({ error: 'Conflict', message: `A member with email ${email} already exists.` });
        return;
      }

      const memberNumExists = await User.findOne({ where: { membership_number } });
      if (memberNumExists) {
        res.status(400).json({
          error: 'Conflict',
          message: `A member with membership number ${membership_number} already exists.`,
        });
        return;
      }

      // Two members can never share a mobile number.
      const phoneCheck = await validateUniqueMobile(phone);
      if (!phoneCheck.ok) {
        res.status(409).json({ error: 'Conflict', message: phoneCheck.message });
        return;
      }

      // 4. Create manual member
      // Since they haven't logged in yet, firebase_uid can be generated as a placeholder or temporary value
      const placeholderUid = `manual_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const newMember = await User.create({
        firebase_uid: placeholderUid,
        email: email.trim().toLowerCase(),
        full_name: full_name.trim(),
        phone: phoneCheck.normalized || undefined,
        membership_number: membership_number.trim(),
        designation: designation ? String(designation).trim() : 'Associate Member',
        business_name: business_name.trim(),
        business_category: business_category.trim(),
        city: city ? String(city).trim() : undefined,
        state: state ? String(state).trim() : undefined,
        country: country ? String(country).trim() : undefined,
        status: status === 'active' ? 'active' : 'inactive',
        approval_status: approval_status || 'approved',
        member_source: 'manual',
        is_profile_completed: false, // will complete details like logo, photos on first login
      } as any);

      logger.info(`Admin manually created member: ${newMember.email} (ID: ${newMember.id})`);
      res.status(201).json({
        message: 'Member Created Successfully. Waiting for Google Login.',
        member: newMember,
      });
    } catch (error) {
      logger.error('Error creating manual member:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create manual member record.' });
    }
  }

  /**
   * POST /api/admin/members/bulk-import
   * Bulk Import parsed JSON records
   */
  public static async bulkImportMembers(req: Request, res: Response): Promise<void> {
    try {
      const { records, mode } = req.body; // mode: 'create_only' | 'create_update'

      if (!records || !Array.isArray(records)) {
        res.status(400).json({ error: 'Bad Request', message: 'No records provided for import.' });
        return;
      }

      if (records.length > 5000) {
        res.status(400).json({ error: 'Bad Request', message: 'Maximum limit of 5,000 rows exceeded.' });
        return;
      }

      const results = {
        total: records.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [] as string[],
      };

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNum = i + 2; // spreadsheet header row + 1-indexed

        const mNum = row['Membership Number'] || row['membership_number'];
        const name = row['Full Name'] || row['full_name'];
        const email = row['Email'] || row['email'];
        const phone = row['Mobile Number'] || row['mobile_number'] || row['phone'];
        const designation = row['Designation'] || row['designation'];
        const bizName = row['Business Name'] || row['business_name'];
        const bizCat = row['Business Category'] || row['business_category'];
        const city = row['City'] || row['city'];
        const state = row['State'] || row['state'];
        const country = row['Country'] || row['country'];

        // Row validation
        if (!mNum || !name || !email) {
          results.errors.push(`Row ${rowNum}: Missing required fields (Membership Number, Name, and Email are required).`);
          results.skipped++;
          continue;
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const cleanMNum = String(mNum).trim();

        if (!emailRegex.test(cleanEmail)) {
          results.errors.push(`Row ${rowNum}: Invalid email format (${email}).`);
          results.skipped++;
          continue;
        }

        try {
          // Check for conflicts
          const existingByEmail = await User.findOne({ where: { email: cleanEmail } });
          const existingByMNum = await User.findOne({ where: { membership_number: cleanMNum } });

          const existingUser = existingByEmail || existingByMNum;

          if (existingUser) {
            if (mode === 'create_update') {
              // Update existing user profile properties
              const updatePayload: any = {
                full_name: String(name).trim(),
                phone: phone ? String(phone).trim() : existingUser.phone,
                designation: designation ? String(designation).trim() : existingUser.designation,
                business_name: bizName ? String(bizName).trim() : existingUser.business_name,
                business_category: bizCat ? String(bizCat).trim() : existingUser.business_category,
                city: city ? String(city).trim() : existingUser.city,
                state: state ? String(state).trim() : existingUser.state,
                country: country ? String(country).trim() : existingUser.country,
                // Keep source as excel if updated
                member_source: 'excel',
              };

              await existingUser.update(updatePayload);
              results.updated++;
            } else {
              // Create Only Mode: Skip existing matching profiles
              results.skipped++;
            }
          } else {
            // Create New Member Profile
            const placeholderUid = `excel_${Date.now()}_${Math.floor(Math.random() * 1000)}_${i}`;
            await User.create({
              firebase_uid: placeholderUid,
              email: cleanEmail,
              full_name: String(name).trim(),
              phone: phone ? String(phone).trim() : undefined,
              membership_number: cleanMNum,
              designation: designation ? String(designation).trim() : 'Associate Member',
              business_name: bizName ? String(bizName).trim() : undefined,
              business_category: bizCat ? String(bizCat).trim() : undefined,
              city: city ? String(city).trim() : undefined,
              state: state ? String(state).trim() : undefined,
              country: country ? String(country).trim() : undefined,
              status: 'inactive', // manual imports wait for activation upon Google Login
              approval_status: 'approved', // auto-approve pre-validated excel rosters
              member_source: 'excel',
              is_profile_completed: false,
            } as any);
            results.created++;
          }
        } catch (err: any) {
          logger.error(`Import failed at row ${rowNum}:`, err);
          results.errors.push(`Row ${rowNum}: Database insert error (${err.message}).`);
          results.skipped++;
        }
      }

      logger.info(`Bulk import finished: Created ${results.created}, Updated ${results.updated}, Skipped/Failed ${results.skipped}`);
      res.status(200).json({
        message: 'Import processed successfully.',
        results,
      });
    } catch (error) {
      logger.error('Error during bulk import:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to process bulk import spreadsheet.' });
    }
  }
}
