import app from './app';
import { connectDatabase, sequelize } from './config/database';
import { logger } from './utils/logger';
import dotenv from 'dotenv';
import { User } from './user/models/User'; // Ensure User model is loaded for database sync
import { Admin } from './admin/models/Admin'; // Ensure Admin model is loaded for database sync
import { Notification } from './admin/models/Notification'; // Ensure Notification model is loaded for database sync
import bcrypt from 'bcryptjs';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDatabase();

    // Sync models
    logger.info('Syncing database models with Supabase Postgres...');
    await sequelize.sync({ alter: true });
    logger.info('Database tables synchronized successfully.');
    logger.info(`Database models initialized: User (${User.name}), Admin (${Admin.name}), Notification (${Notification.name})`);

    // Seed default admin user in Admins table if not exists or update credentials if needed
    const adminEmail = 'admin@gmail.com';
    const existingAdmin = await Admin.findOne({ where: { email: adminEmail } });
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    if (!existingAdmin) {
      logger.info('Seeding default administrator user in Admins table...');
      await Admin.create({
        email: adminEmail,
        password: hashedPassword,
        full_name: 'Administrator',
      });
      logger.info('Default administrator user seeded successfully.');
    } else if (!existingAdmin.password) {
      logger.info('Updating existing admin user credentials...');
      await existingAdmin.update({
        password: hashedPassword,
      });
      logger.info('Admin user credentials updated successfully.');
    }

    // Start Express listener on all network interfaces (0.0.0.0)
    app.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} (bound to 0.0.0.0)`);
    });
  } catch (error) {
    logger.error('Failed to start server due to database connection error:', error);
    process.exit(1);
  }
};

startServer();

