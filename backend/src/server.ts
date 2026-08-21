import dotenv from 'dotenv';
dotenv.config(); // Environment configuration loaded at startup

import app from './app';
import { connectDatabase, sequelize } from './config/database';
import { logger } from './utils/logger';
import { User } from './user/models/User'; // Ensure User model is loaded for database sync
import { BusinessFlyer } from './user/models/BusinessFlyer'; // Ensure BusinessFlyer model is loaded for database sync
import { Admin } from './admin/models/Admin'; // Ensure Admin model is loaded for database sync
import { Notification } from './admin/models/Notification'; // Ensure Notification model is loaded for database sync
import { Announcement } from './admin/models/Announcement';
import { AnnouncementRead } from './admin/models/AnnouncementRead';
import { Event } from './admin/models/Event';
import { Sponsor } from './admin/models/Sponsor';
import { EventSponsor } from './admin/models/EventSponsor';
import bcrypt from 'bcryptjs';

// Associations
User.hasMany(BusinessFlyer, { foreignKey: 'user_id', as: 'business_flyers', onDelete: 'CASCADE' });
BusinessFlyer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Announcement.hasMany(AnnouncementRead, {
  foreignKey: 'announcement_id',
  as: 'reads',
  onDelete: 'CASCADE',
});
AnnouncementRead.belongsTo(Announcement, { foreignKey: 'announcement_id', as: 'announcement' });
User.hasMany(AnnouncementRead, { foreignKey: 'user_id', as: 'announcement_reads', onDelete: 'CASCADE' });
AnnouncementRead.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Event.hasMany(EventSponsor, { foreignKey: 'event_id', as: 'event_sponsors', onDelete: 'CASCADE' });
EventSponsor.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
Sponsor.hasMany(EventSponsor, { foreignKey: 'sponsor_id', as: 'event_sponsors', onDelete: 'CASCADE' });
EventSponsor.belongsTo(Sponsor, { foreignKey: 'sponsor_id', as: 'sponsor' });
Event.belongsToMany(Sponsor, {
  through: EventSponsor,
  foreignKey: 'event_id',
  otherKey: 'sponsor_id',
  as: 'sponsors',
});
Sponsor.belongsToMany(Event, {
  through: EventSponsor,
  foreignKey: 'sponsor_id',
  otherKey: 'event_id',
  as: 'events',
});


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDatabase();

    // Sync schema in development only. Production must use migrations.
    if (process.env.NODE_ENV === 'production') {
      logger.info('Skipping sequelize.sync({ alter: true }) in production.');
    } else {
      logger.info('Syncing database models with Supabase Postgres...');
      await sequelize.sync({ alter: true });
      logger.info('Database tables synchronized successfully.');
    }
    logger.info(
      `Database models initialized: User (${User.name}), BusinessFlyer (${BusinessFlyer.name}), Admin (${Admin.name}), Notification (${Notification.name}), Announcement (${Announcement.name}), AnnouncementRead (${AnnouncementRead.name}), Event (${Event.name}), Sponsor (${Sponsor.name}), EventSponsor (${EventSponsor.name})`,
    );

    if (process.env.NODE_ENV !== 'production') {
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

