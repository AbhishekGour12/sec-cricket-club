import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let authInstance: admin.auth.Auth | null = null;

const isKeyValid = (key: string | undefined): boolean => {
  if (!key) return false;
  if (key.includes('PLACEHOLDER')) return false;
  if (key.length < 100) return false; // RSA Private Keys are normally long
  return true;
};

if (projectId && clientEmail && isKeyValid(privateKey)) {
  try {
    // Fix potential issue with escaped newlines in environment variable
    let formattedKey = privateKey!;
    if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
      formattedKey = formattedKey.substring(1, formattedKey.length - 1);
    }
    formattedKey = formattedKey.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
    });
    authInstance = admin.auth();
    logger.info('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
  }
} else {
  logger.warn('---------------------------------------------------------------------------------');
  logger.warn('WARNING: Firebase Admin is running in MOCK/PLACEHOLDER mode.');
  logger.warn('Go to backend/.env and replace placeholders with a valid Firebase private key.');
  logger.warn('---------------------------------------------------------------------------------');
}

export const auth = authInstance;
export default admin;
