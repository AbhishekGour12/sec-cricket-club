import { Op, WhereOptions } from 'sequelize';
import User from '../user/models/User';

export const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

/**
 * Reduces "+91 98765 43210", "091-9876543210" etc. to the bare 10 digits so
 * duplicate detection always compares like with like.
 */
export const normalizeMobile = (raw: unknown): string => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

/**
 * Finds any other member already using this mobile number. Compares the
 * normalized form so "+91 98765 43210" and "9876543210" are treated as one.
 */
export const findMemberByPhone = async (
  phone: string,
  excludeUserId?: number,
): Promise<User | null> => {
  const normalized = normalizeMobile(phone);
  if (!normalized) return null;

  const where: WhereOptions = {
    phone: { [Op.in]: [normalized, `+91${normalized}`, `91${normalized}`, `0${normalized}`] },
  };

  const excludeId =
    excludeUserId === undefined || excludeUserId === null || Number.isNaN(Number(excludeUserId))
      ? undefined
      : Number(excludeUserId);

  if (excludeId !== undefined) {
    where.id = { [Op.ne]: excludeId };
  }

  const candidates = await User.findAll({ where });

  return (
    candidates.find((member) => normalizeMobile(member.phone) === normalized) ?? null
  );
};

export interface PhoneCheckResult {
  ok: boolean;
  message?: string;
  normalized: string;
}

/**
 * Validates format and uniqueness for a member-facing mobile number.
 * Pass `excludeUserId` on edit/update so a member keeping their own number
 * is never flagged as a duplicate of themselves.
 * Pass `currentPhone` to short-circuit when the value is unchanged.
 */
export const validateUniqueMobile = async (
  raw: unknown,
  excludeUserId?: number,
  currentPhone?: string | null,
): Promise<PhoneCheckResult> => {
  const normalized = normalizeMobile(raw);

  if (!normalized) {
    return { ok: true, normalized: '' };
  }

  if (!INDIAN_MOBILE_PATTERN.test(normalized)) {
    return {
      ok: false,
      normalized,
      message: `"${String(raw)}" is not a valid 10-digit Indian mobile number.`,
    };
  }

  // Edit/update with the same number — no uniqueness check needed.
  if (currentPhone !== undefined && normalizeMobile(currentPhone) === normalized) {
    return { ok: true, normalized };
  }

  const clash = await findMemberByPhone(normalized, excludeUserId);
  if (clash) {
    return {
      ok: false,
      normalized,
      message: `Mobile number ${normalized} is already registered to ${
        clash.full_name || clash.email || `member #${clash.id}`
      }.`,
    };
  }

  return { ok: true, normalized };
};
