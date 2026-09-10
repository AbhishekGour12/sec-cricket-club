import { sequelize, connectDatabase } from '../config/database';
import User from '../user/models/User';
import { logger } from '../utils/logger';

/**
 * Migration Script:
 * Re-indexes all existing member records in the database with sequential
 * membership numbers starting from SEC-1, SEC-2, SEC-3... ordered by user ID.
 */
export async function migrateMembershipNumbers(): Promise<void> {
  logger.info('Starting membership number migration...');
  
  const users = await User.findAll({
    order: [['id', 'ASC']],
  });

  logger.info(`Found ${users.length} members to re-index.`);

  if (users.length === 0) {
    logger.info('No members found in database.');
    return;
  }

  await sequelize.transaction(async (t) => {
    // Phase 1: Set temporary numbers to avoid unique constraint collisions
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      await User.update(
        { membership_number: `TEMP-${user.id}-${Date.now()}` },
        { where: { id: user.id }, transaction: t, hooks: false }
      );
    }

    // Phase 2: Assign clean sequential SEC-1, SEC-2, SEC-3...
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const newMembershipNumber = `SEC-${i + 1}`;
      await User.update(
        { membership_number: newMembershipNumber },
        { where: { id: user.id }, transaction: t, hooks: false }
      );
      logger.info(`Member ID ${user.id} (${user.full_name || user.email}) assigned -> ${newMembershipNumber}`);
    }
  });

  logger.info(`✅ Successfully updated all ${users.length} members with sequential SEC-N membership numbers.`);
}

// Run standalone if executed directly via node/ts-node
if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      await migrateMembershipNumbers();
      process.exit(0);
    } catch (err) {
      logger.error('Migration failed:', err);
      process.exit(1);
    }
  })();
}
