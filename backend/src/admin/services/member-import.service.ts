import { Op } from 'sequelize';
import User from '../../user/models/User';
import { INDIAN_MOBILE_PATTERN, normalizeMobile } from '../../utils/phone';

export type ImportMode = 'create_only' | 'create_update';

export type ImportAction = 'create' | 'update' | 'skip';

export interface ImportColumn {
  header: string;
  hint: string;
  sample: string;
  required: boolean;
}

/**
 * The canonical import contract. The downloadable template, the parser and the
 * validator are all generated from this list so they cannot drift apart.
 */
export const IMPORT_COLUMNS: ImportColumn[] = [
  { header: 'Full Name', hint: 'Text — required', sample: 'Rajesh Verma', required: true },
  { header: 'Mobile Number', hint: '10-digit Indian mobile — required', sample: '9876543210', required: true },
  { header: 'Email', hint: 'Text — optional, must be unique', sample: 'rajesh@punjabfasteners.com', required: false },
  { header: 'Business Name', hint: 'Text — optional', sample: 'Punjab Fasteners Pvt. Ltd.', required: false },
  { header: 'Nature of Business', hint: 'Text — optional', sample: 'Industrial fasteners manufacturing', required: false },
  { header: 'Industry Category', hint: 'Text — optional', sample: 'Manufacturing & Production', required: false },
  { header: 'Business Address', hint: 'Text — optional', sample: 'Industrial Area A, Ludhiana', required: false },
  { header: 'City', hint: 'Text — optional', sample: 'Ludhiana', required: false },
  { header: 'Instagram', hint: 'URL or handle — optional', sample: '@punjabfasteners', required: false },
  { header: 'Facebook', hint: 'Profile URL — optional', sample: 'https://facebook.com/punjabfasteners', required: false },
  { header: 'LinkedIn', hint: 'Profile URL — optional', sample: 'https://linkedin.com/in/rajeshverma', required: false },
  { header: 'Designation', hint: 'Text — optional', sample: 'Managing Director', required: false },
];

export interface ParsedRow {
  rowNumber: number;
  full_name: string;
  phone: string;
  email: string;
  business_name: string;
  business_description: string;
  business_category: string;
  business_address: string;
  city: string;
  instagram_url: string;
  facebook_url: string;
  linkedin_url: string;
  designation: string;
}

export interface ValidatedRow extends ParsedRow {
  errors: string[];
  action: ImportAction;
  matchedMemberId: number | null;
}

export interface ValidationReport {
  mode: ImportMode;
  summary: {
    total: number;
    valid: number;
    errors: number;
    toCreate: number;
    toUpdate: number;
    toSkip: number;
  };
  rows: ValidatedRow[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (row: Record<string, unknown>, ...keys: string[]): string => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

export const parseRows = (raw: unknown[]): ParsedRow[] =>
  raw.map((entry, index) => {
    const row = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;

    return {
      // +2 accounts for the header row and 1-based spreadsheet numbering.
      rowNumber: index + 2,
      full_name: text(row, 'Full Name', 'full_name'),
      phone: normalizeMobile(text(row, 'Mobile Number', 'mobile_number', 'phone')),
      email: text(row, 'Email', 'email').toLowerCase(),
      business_name: text(row, 'Business Name', 'business_name'),
      business_description: text(row, 'Nature of Business', 'nature_of_business', 'business_description'),
      business_category: text(row, 'Industry Category', 'industry_category', 'business_category'),
      business_address: text(row, 'Business Address', 'business_address'),
      city: text(row, 'City', 'city'),
      instagram_url: text(row, 'Instagram', 'instagram', 'instagram_url'),
      facebook_url: text(row, 'Facebook', 'facebook', 'facebook_url'),
      linkedin_url: text(row, 'LinkedIn', 'linkedin', 'linkedin_url'),
      designation: text(row, 'Designation', 'designation'),
    };
  });

/**
 * Validates every row against the spreadsheet itself and against existing
 * members. Nothing is written here — the caller decides what to do next.
 */
export const validateRows = async (rows: ParsedRow[], mode: ImportMode): Promise<ValidationReport> => {
  const phones = rows.map((r) => r.phone).filter(Boolean);
  const emails = rows.map((r) => r.email).filter(Boolean);

  const existing = await User.findAll({
    where: {
      [Op.or]: [
        ...(phones.length ? [{ phone: { [Op.in]: phones } }] : []),
        ...(emails.length ? [{ email: { [Op.in]: emails } }] : []),
      ],
    },
  });

  const byPhone = new Map<string, User>();
  const byEmail = new Map<string, User>();
  existing.forEach((member) => {
    const phone = normalizeMobile(member.phone ?? '');
    if (phone) byPhone.set(phone, member);
    if (member.email) byEmail.set(member.email.toLowerCase(), member);
  });

  const phoneSeen = new Map<string, number>();
  const emailSeen = new Map<string, number>();

  const validated: ValidatedRow[] = rows.map((row) => {
    const errors: string[] = [];

    if (!row.full_name) {
      errors.push('Full Name is required.');
    }

    if (!row.phone) {
      errors.push('Mobile Number is required.');
    } else if (!INDIAN_MOBILE_PATTERN.test(row.phone)) {
      errors.push(`"${row.phone}" is not a valid 10-digit Indian mobile number.`);
    } else {
      const firstSeen = phoneSeen.get(row.phone);
      if (firstSeen) {
        errors.push(`Duplicate mobile number in this file (also on row ${firstSeen}).`);
      } else {
        phoneSeen.set(row.phone, row.rowNumber);
      }
    }

    if (row.email) {
      if (!EMAIL_PATTERN.test(row.email)) {
        errors.push(`"${row.email}" is not a valid email address.`);
      } else {
        const firstSeen = emailSeen.get(row.email);
        if (firstSeen) {
          errors.push(`Duplicate email in this file (also on row ${firstSeen}).`);
        } else {
          emailSeen.set(row.email, row.rowNumber);
        }
      }
    }

    const existingByPhone = row.phone ? byPhone.get(row.phone) : undefined;
    const existingByEmail = row.email ? byEmail.get(row.email) : undefined;

    // An email already used by a *different* member is always a conflict,
    // because the column is unique.
    if (existingByEmail && existingByPhone && existingByEmail.id !== existingByPhone.id) {
      errors.push(`Email ${row.email} already belongs to a different member.`);
    } else if (existingByEmail && !existingByPhone && mode === 'create_only') {
      errors.push(`Email ${row.email} already belongs to an existing member.`);
    }

    let action: ImportAction = 'create';
    let matchedMemberId: number | null = null;

    const match = existingByPhone ?? existingByEmail;
    if (match) {
      matchedMemberId = match.id;
      action = mode === 'create_update' ? 'update' : 'skip';
    }

    return { ...row, errors, action, matchedMemberId };
  });

  const summary = {
    total: validated.length,
    valid: validated.filter((r) => r.errors.length === 0).length,
    errors: validated.filter((r) => r.errors.length > 0).length,
    toCreate: validated.filter((r) => r.errors.length === 0 && r.action === 'create').length,
    toUpdate: validated.filter((r) => r.errors.length === 0 && r.action === 'update').length,
    toSkip: validated.filter((r) => r.errors.length === 0 && r.action === 'skip').length,
  };

  return { mode, summary, rows: validated };
};

/** Builds the CSV an admin downloads to fix and re-upload failed rows. */
export const buildErrorReportCsv = (rows: ValidatedRow[]): string => {
  const headers = ['Row', ...IMPORT_COLUMNS.map((c) => c.header), 'Error Reason'];

  const escape = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const lines = rows
    .filter((row) => row.errors.length > 0)
    .map((row) =>
      [
        row.rowNumber,
        row.full_name,
        row.phone,
        row.email,
        row.business_name,
        row.business_description,
        row.business_category,
        row.business_address,
        row.city,
        row.instagram_url,
        row.facebook_url,
        row.linkedin_url,
        row.designation,
        row.errors.join(' '),
      ]
        .map((cell) => escape(String(cell)))
        .join(','),
    );

  return [headers.map(escape).join(','), ...lines].join('\r\n');
};

/** Builds the blank template with a hint row and a sample row. */
export const buildTemplateCsv = (): string => {
  const escape = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  return [
    IMPORT_COLUMNS.map((c) => escape(c.header)).join(','),
    IMPORT_COLUMNS.map((c) => escape(c.hint)).join(','),
    IMPORT_COLUMNS.map((c) => escape(c.sample)).join(','),
  ].join('\r\n');
};
