import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Resolve uploads directories relative to src directory
const UPLOADS_USERPROFILE_DIR = path.resolve(__dirname, '../../uploads/userprofile');
const UPLOADS_MEMBERS_DIR = path.resolve(__dirname, '../../uploads/members');

// Automatically create directories if they do not exist
if (!fs.existsSync(UPLOADS_USERPROFILE_DIR)) {
  fs.mkdirSync(UPLOADS_USERPROFILE_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_MEMBERS_DIR)) {
  fs.mkdirSync(UPLOADS_MEMBERS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // If the path indicates future member types, write to members folder, otherwise userprofile
    if (req.path.includes('/members') && !req.path.includes('/me')) {
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

const fileFilter = (_req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed (jpg, jpeg, png, webp, gif)'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Allow up to 10MB images
  },
});

export default upload;
