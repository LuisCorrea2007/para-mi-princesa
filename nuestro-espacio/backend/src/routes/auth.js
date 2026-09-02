// ===========================================
// RUTAS DE AUTENTICACIÓN
// ===========================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const config = require('../config');

// Configurar multer para avatares
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.UPLOAD.TEMP_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = config.UPLOAD.ALLOWED_TYPES.AVATARS;
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG y WebP.'));
    }
  },
});

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Rutas protegidas
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getMe);
router.put('/me', authMiddleware, authController.updateProfile);
router.post('/me/avatar', authMiddleware, upload.single('avatar'), authController.uploadAvatar);
router.delete('/me/avatar', authMiddleware, authController.deleteAvatar);
router.post('/me/change-password', authMiddleware, authController.changePassword);

// 2FA
router.post('/me/enable-2fa', authMiddleware, authController.enable2FA);
router.post('/me/verify-2fa', authMiddleware, authController.verify2FA);
router.post('/me/disable-2fa', authMiddleware, authController.disable2FA);

module.exports = router;
