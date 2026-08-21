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

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const imageFileFilter = (_req: any, file: any, cb: any) => {
  if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only jpg, png, webp, and gif images are allowed'), false);
  }
};

const announcementFileFilter = (_req: any, file: any, cb: any) => {
  if (ALLOWED_IMAGE_TYPES.has(file.mimetype) || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only jpg, png, webp, gif, and PDF files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Allow up to 10MB images
  },
});

/** Announcement cover images + optional PDF attachments. */
export const uploadAnnouncement = multer({
  storage,
  fileFilter: announcementFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/** Stricter filter for business flyers: JPG/JPEG/PNG/WEBP only, 5 MB max. */
const flyerFileFilter = (_req: any, file: any, cb: any) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed'), false);
  }
};

export const uploadBusinessFlyer = multer({
  storage,
  fileFilter: flyerFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/** Event banners: JPG/JPEG/PNG/WEBP, 10 MB max. */
export const uploadEvent = multer({
  storage,
  fileFilter: flyerFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/** Sponsor logos: JPG/PNG/WEBP, 2 MB max. */
export const uploadSponsor = multer({
  storage,
  fileFilter: flyerFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export default upload;
