const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Ensure upload directories exist
const uploadDirs = [
  'uploads/photos/original',
  'uploads/photos/compressed',
  'uploads/photos/thumbnails',
  'uploads/videos/original',
  'uploads/videos/compressed',
  'uploads/avatars',
  'uploads/temp'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '../../', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/temp';
    
    if (file.fieldname === 'avatar') {
      uploadPath = 'uploads/avatars';
    } else if (file.fieldname === 'photo') {
      uploadPath = 'uploads/photos/original';
    } else if (file.fieldname === 'video') {
      uploadPath = 'uploads/videos/original';
    }
    
    cb(null, path.join(__dirname, '../../', uploadPath));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'));
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Process image after upload
const processImage = async (inputPath, outputPaths) => {
  try {
    const { original, compressed, thumbnail } = outputPaths;
    
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    
    // Save original with optimization
    await sharp(inputPath)
      .rotate() // Auto-rotate based on EXIF
      .toFile(original);
    
    // Create compressed version (max 1920px)
    await sharp(inputPath)
      .rotate()
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(compressed);
    
    // Create thumbnail (300px)
    await sharp(inputPath)
      .rotate()
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 70 })
      .toFile(thumbnail);
    
    return { success: true, metadata };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

// Cleanup temp files
const cleanupTempFiles = async () => {
  const tempDir = path.join(__dirname, '../../uploads/temp');
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  try {
    const files = await fs.promises.readdir(tempDir);
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.promises.stat(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        await fs.promises.unlink(filePath);
        console.log(`Deleted old temp file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning temp files:', error);
  }
};

module.exports = {
  upload,
  processImage,
  cleanupTempFiles
};
