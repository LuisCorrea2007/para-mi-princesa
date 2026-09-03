const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../services/fileService');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-2fa', authController.verifyTwoFactor);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);
router.put('/me', authMiddleware, authController.updateProfile);
router.post('/me/avatar', authMiddleware, upload.single('avatar'), authController.uploadAvatar);
router.delete('/me/avatar', authMiddleware, authController.deleteAvatar);
router.post('/enable-2fa', authMiddleware, authController.enableTwoFactor);
router.post('/disable-2fa', authMiddleware, authController.disableTwoFactor);

module.exports = router;
