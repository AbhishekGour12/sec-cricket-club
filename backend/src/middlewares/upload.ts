import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Resolve uploads directories relative to src directory
const UPLOADS_USERPROFILE_DIR = path.resolve(__dirname, '../../uploads/userprofile');
const UPLOADS_MEMBERS_DIR = path.resolve(__dirname, '../../uploads/members');
const UPLOADS_ANNOUNCEMENTS_DIR = path.resolve(__dirname, '../../uploads/announcements');
const UPLOADS_EVENTS_DIR = path.resolve(__dirname, '../../uploads/events');
const UPLOADS_SPONSORS_DIR = path.resolve(__dirname, '../../uploads/sponsors');

// Automatically create directories if they do not exist
if (!fs.existsSync(UPLOADS_USERPROFILE_DIR)) {
  fs.mkdirSync(UPLOADS_USERPROFILE_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_MEMBERS_DIR)) {
  fs.mkdirSync(UPLOADS_MEMBERS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_ANNOUNCEMENTS_DIR)) {
  fs.mkdirSync(UPLOADS_ANNOUNCEMENTS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_EVENTS_DIR)) {
  fs.mkdirSync(UPLOADS_EVENTS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_SPONSORS_DIR)) {
  fs.mkdirSync(UPLOADS_SPONSORS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    if (req.path.includes('/sponsors')) {
      cb(null, UPLOADS_SPONSORS_DIR);
    } else if (req.path.includes('/events')) {
      cb(null, UPLOADS_EVENTS_DIR);
    } else if (req.path.includes('/announcements')) {
      cb(null, UPLOADS_ANNOUNCEMENTS_DIR);
    } else if (req.path.includes('/members') && !req.path.includes('/me')) {
      cb(null, UPLOADS_MEMBERS_DIR);
    } else {
      cb(null, UPLOADS_USERPROFILE_DIR);
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const ALLOWED_IMAGE_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.bmp',
  '.tiff',
  '.tif',
  '.heic',
  '.heif',
  '.avif',
  '.ico',
]);

export const isAllowedImage = (file: any): boolean => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || file.filename || '').toLowerCase();
  return (
    mime.startsWith('image/') ||
    ALLOWED_IMAGE_MIMES.has(mime) ||
    ALLOWED_IMAGE_EXTS.has(ext)
  );
};

const imageFileFilter = (_req: any, file: any, cb: any) => {
  if (isAllowedImage(file)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Supported formats: JPG, PNG, WEBP, GIF, SVG, BMP, TIFF, HEIC, AVIF, ICO'), false);
  }
};

const announcementFileFilter = (_req: any, file: any, cb: any) => {
  const isPdf = file.mimetype === 'application/pdf' || path.extname(file.originalname || '').toLowerCase() === '.pdf';
  if (isAllowedImage(file) || isPdf) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Supported formats: Images (JPG, PNG, WEBP, GIF, SVG, AVIF, etc.) and PDF documents'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

/** Announcement cover images + optional PDF attachments. */
export const uploadAnnouncement = multer({
  storage,
  fileFilter: announcementFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

/** Business flyers: all image formats, 10 MB max. */
export const uploadBusinessFlyer = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

/** Event banners: all image formats, 10 MB max. */
export const uploadEvent = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

/** Sponsor logos: all image formats, 5 MB max. */
export const uploadSponsor = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export default upload;
