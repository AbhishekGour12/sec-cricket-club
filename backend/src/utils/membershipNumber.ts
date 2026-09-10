import { Transaction, Op } from 'sequelize';
import User from '../user/models/User';

/**
 * Calculates and returns the next sequential membership number in the pattern SEC-1, SEC-2, SEC-3...
 * Scans all existing members with a membership_number matching SEC-<number> (or numeric),
 * finds the highest number, and increments it by 1.
 */
export async function generateNextMembershipNumber(transaction?: Transaction | null): Promise<string> {
  const users = await User.findAll({
    attributes: ['membership_number'],
    where: {
      membership_number: {
        [Op.ne]: null as any,
      },
    },
    transaction: transaction || undefined,
  });

  let maxId = 0;
  for (const u of users) {
    if (!u.membership_number) continue;
    // Match patterns like SEC-1, SEC-2, SEC12, SEC_3, or plain digits
    const match = u.membership_number.match(/^SEC[-_]?(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
  }

  return `SEC-${maxId + 1}`;
}
