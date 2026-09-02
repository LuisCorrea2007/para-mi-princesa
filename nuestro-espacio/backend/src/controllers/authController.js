// ===========================================
// CONTROLADOR DE AUTENTICACIÓN
// ===========================================

const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const fileService = require('../services/fileService');
const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class AuthController {
  // Registro
  register = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),

    async (req, res, next) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new AppError(errors.array()[0].msg, 400);
        }

        const { email, password, name } = req.body;

        // Registrar usuario
        const tokens = await authService.register(email, password, name);

        // Crear sesión
        const session = await authService.createSession(
          tokens.userId || (await prisma.user.findUnique({ where: { email } })).id,
          tokens.accessToken,
          tokens.refreshToken,
          tokens.expiresAt
        );

        res.status(201).json({
          success: true,
          message: 'Usuario registrado exitosamente',
          data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: await authService.getUserProfile(session.userId),
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  // Login
  login = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),

    async (req, res, next) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new AppError(errors.array()[0].msg, 400);
        }

        const { email, password, twoFAToken } = req.body;

        // Login
        const tokens = await authService.login(email, password);
        const user = await prisma.user.findUnique({ where: { email } });

        // Verificar 2FA si está habilitado
        if (user.twoFaEnabled) {
          if (!twoFAToken) {
            return res.status(401).json({
              success: false,
              message: 'Se requiere código 2FA',
              requires2FA: true,
            });
          }

          const verified = authService.verify2FAToken(user.twoFaSecret, twoFAToken);
          if (!verified) {
            throw new AppError('Código 2FA inválido', 401);
          }
        }

        // Crear sesión
        const session = await authService.createSession(
          user.id,
          tokens.accessToken,
          tokens.refreshToken,
          tokens.expiresAt
        );

        res.json({
          success: true,
          message: 'Login exitoso',
          data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: await authService.getUserProfile(user.id),
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  // Logout
  logout = async (req, res, next) => {
    try {
      await authService.logout(req.sessionId);

      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  // Refresh token
  refreshToken = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token requerido', 400);
      }

      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Obtener perfil actual
  getMe = async (req, res, next) => {
    try {
      const user = await authService.getUserProfile(req.user.id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  // Actualizar perfil
  updateProfile = [
    body('name').optional().trim().notEmpty(),
    body('anniversaryDate').optional().isISO8601(),

    async (req, res, next) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new AppError(errors.array()[0].msg, 400);
        }

        const user = await authService.updateProfile(req.user.id, req.body);

        res.json({
          success: true,
          message: 'Perfil actualizado exitosamente',
          data: user,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  // Subir avatar
  uploadAvatar = async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No se proporcionó ningún archivo', 400);
      }

      const result = await fileService.processAvatar(req.file.path, req.file.originalname);

      // Actualizar usuario
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl: result.url },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          anniversaryDate: true,
          twoFaEnabled: true,
        },
      });

      res.json({
        success: true,
        message: 'Avatar actualizado exitosamente',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  // Eliminar avatar
  deleteAvatar = async (req, res, next) => {
    try {
      if (req.user.avatarUrl) {
        const filePath = `./uploads${req.user.avatarUrl}`;
        await fileService.deleteFile(filePath);
      }

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl: null },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          anniversaryDate: true,
          twoFaEnabled: true,
        },
      });

      res.json({
        success: true,
        message: 'Avatar eliminado exitosamente',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  // Cambiar contraseña
  changePassword = [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),

    async (req, res, next) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new AppError(errors.array()[0].msg, 400);
        }

        const { currentPassword, newPassword } = req.body;

        await authService.changePassword(req.user.id, currentPassword, newPassword);

        res.json({
          success: true,
          message: 'Contraseña cambiada exitosamente',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  // Habilitar 2FA
  enable2FA = async (req, res, next) => {
    try {
      const result = await authService.enable2FA(req.user.id);

      res.json({
        success: true,
        message: '2FA configurado. Escanea el QR y verifica el código.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Verificar y activar 2FA
  verify2FA = [
    body('token').isLength({ min: 6, max: 6 }),

    async (req, res, next) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new AppError(errors.array()[0].msg, 400);
        }

        const { token } = req.body;

        await authService.verifyAndActivate2FA(req.user.id, token);

        res.json({
          success: true,
          message: '2FA activado exitosamente',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  // Deshabilitar 2FA
  disable2FA = [
    body('token').isLength({ min: 6, max: 6 }),

    async (req, res, next) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new AppError(errors.array()[0].msg, 400);
        }

        const { token } = req.body;

        await authService.disable2FA(req.user.id, token);

        res.json({
          success: true,
          message: '2FA deshabilitado exitosamente',
        });
      } catch (error) {
        next(error);
      }
    },
  ];
}

module.exports = new AuthController();
