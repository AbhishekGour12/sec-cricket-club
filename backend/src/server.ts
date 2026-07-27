import app from './app';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDatabase();

    // Start Express listener
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server due to database connection error:', error);
    process.exit(1);
  }
};

startServer();
