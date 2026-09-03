import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import path from 'path';

const app: Express = express();

// Middlewares
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve Static Uploads (both at /uploads and /api/uploads for Nginx reverse-proxy compatibility)
const uploadsDirectory = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDirectory));
app.use('/api/uploads', express.static(uploadsDirectory));
// Fallback alias for legacy/direct flyers paths
app.use('/uploads/flyers', express.static(path.join(uploadsDirectory, 'userprofile')));
app.use('/api/uploads/flyers', express.static(path.join(uploadsDirectory, 'userprofile')));

// Setup Morgan Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Public Privacy Policy page for Google Play Console and App Store
const renderPrivacyPolicy = (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - SEC Cricket Club</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h1 { color: #1A2744; margin-top: 0; font-size: 28px; }
    h2 { color: #1A2744; font-size: 20px; margin-top: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    p, li { font-size: 15px; color: #475569; }
    ul { padding-left: 20px; }
    .updated { font-size: 13px; color: #64748b; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Privacy Policy</h1>
    <div class="updated">Last Updated: August 2026</div>

    <p>Welcome to <strong>SEC Cricket Club</strong>. We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our mobile application and related services.</p>

    <h2>1. Information We Collect</h2>
    <p>We collect information that you voluntarily provide to us when registering an account, updating your member profile, or interacting with club features:</p>
    <ul>
      <li><strong>Personal Information:</strong> Full name, phone number, email address, and profile photo.</li>
      <li><strong>Professional & Business Information:</strong> Business name, designation, category, business logo, visiting cards, showcase photos, and promotional flyers.</li>
      <li><strong>Activity & Usage Data:</strong> Event RSVPs, announcements viewed, and saved member bookmarks.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use your information strictly to support and enhance your club experience, including:</p>
    <ul>
      <li>Managing member verification and membership directory access.</li>
      <li>Facilitating member-to-member networking and business directory discovery.</li>
      <li>Sending push notifications for club events, announcements, and administrative updates.</li>
    </ul>

    <h2>3. Data Sharing & Security</h2>
    <p>We do not sell, rent, or trade your personal data to third parties. Member directory information is visible only to approved, authenticated members of SEC Cricket Club. We use industry-standard encryption and security measures to protect your data.</p>

    <h2>4. Account & Data Deletion</h2>
    <p>You may request the deletion of your account and personal data at any time by contacting club administration or submitting a deletion request through the app settings.</p>

    <h2>5. Contact Us</h2>
    <p>If you have any questions or concerns regarding this Privacy Policy, please contact:</p>
    <p><strong>SEC Cricket Club Administration</strong><br>Email: support@seccricketclub.com</p>
  </div>
</body>
</html>`);
};

app.get('/privacy', renderPrivacyPolicy);
app.get('/api/privacy', renderPrivacyPolicy);

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  const error: any = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Error handling middleware
app.use(errorHandler);

export default app;
