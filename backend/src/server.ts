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


import fs from 'fs';
import path from 'path';

// Ensure upload directories exist on server startup
const uploadDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../uploads/announcements'),
  path.join(__dirname, '../uploads/events'),
  path.join(__dirname, '../uploads/members'),
  path.join(__dirname, '../uploads/visiting_cards'),
  path.join(__dirname, '../uploads/sponsors'),
  path.join(__dirname, '../uploads/business_flyers'),
];
for (const dir of uploadDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDatabase();

    // Ensure tables exist in both production and development
    if (process.env.NODE_ENV === 'production') {
      logger.info('Ensuring database schema tables exist in production...');
      await sequelize.sync();
      logger.info('Database schema verified in production.');
    } else {
      logger.info('Syncing database models with Postgres...');
      await sequelize.sync({ alter: true });
      logger.info('Database tables synchronized successfully.');
    }
    logger.info(
      `Database models initialized: User (${User.name}), BusinessFlyer (${BusinessFlyer.name}), Admin (${Admin.name}), Notification (${Notification.name}), Announcement (${Announcement.name}), AnnouncementRead (${AnnouncementRead.name}), Event (${Event.name}), Sponsor (${Sponsor.name}), EventSponsor (${EventSponsor.name})`,
    );

    // Seed / Ensure Administrator credentials exist (Works in both Dev and Production)
    const adminEmail = process.env.ADMIN_EMAIL || 'sportsentertainmentclub9@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '123456';

    const existingAdmin = await Admin.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      logger.info(`Seeding administrator user (${adminEmail}) in Admins table...`);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await Admin.create({
        email: adminEmail,
        password: hashedPassword,
        full_name: 'Administrator',
      });
      logger.info(`Administrator user (${adminEmail}) created successfully.`);
    } else if (!existingAdmin.password) {
      logger.info(`Updating administrator credentials for ${adminEmail}...`);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await existingAdmin.update({
        password: hashedPassword,
      });
      logger.info('Administrator credentials updated successfully.');
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

