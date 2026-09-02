// ===========================================
// SERVICIO DE AUTENTICACIÓN
// ===========================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

class AuthService {
  // Registro de usuario
  async register(email, password, name) {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('El email ya está registrado', 409);
    }

    // Encriptar contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    return this.generateTokens(user);
  }

  // Login
  async login(email, password) {
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Generar tokens
    return this.generateTokens(user);
  }

  // Generar tokens JWT
  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.JWT.SECRET,
      { expiresIn: config.JWT.EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.JWT.REFRESH_SECRET,
      { expiresIn: config.JWT.REFRESH_EXPIRES_IN }
    );

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días por defecto

    return { accessToken, refreshToken, expiresAt };
  }

  // Crear sesión
  async createSession(userId, accessToken, refreshToken, expiresAt) {
    const session = await prisma.session.create({
      data: {
        userId,
        token: accessToken,
        refreshToken,
        expiresAt,
      },
    });

    return session;
  }

  // Logout
  async logout(sessionId) {
    await prisma.session.delete({
      where: { id: sessionId },
    });

    return { success: true };
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, config.JWT.REFRESH_SECRET);

      // Buscar sesión
      const session = await prisma.session.findFirst({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new AppError('Sesión expirada', 401);
      }

      // Generar nuevo access token
      const newAccessToken = jwt.sign(
        { userId: session.user.id, email: session.user.email },
        config.JWT.SECRET,
        { expiresIn: config.JWT.EXPIRES_IN }
      );

      // Actualizar sesión
      await prisma.session.update({
        where: { id: session.id },
        data: { token: newAccessToken },
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Refresh token inválido', 401);
    }
  }

  // Habilitar 2FA
  async enable2FA(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user.twoFaEnabled) {
      throw new AppError('2FA ya está habilitado', 400);
    }

    // Generar secreto
    const secret = speakeasy.generateSecret({
      name: `${config.TWO_FA.ISSUER}:${user.email}`,
      issuer: config.TWO_FA.ISSUER,
      length: 32,
    });

    // Guardar secreto (sin habilitar aún)
    await prisma.user.update({
      where: { id: userId },
      data: { twoFaSecret: secret.base32 },
    });

    // Generar QR
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCodeUrl,
      otpAuthUrl: secret.otpauth_url,
    };
  }

  // Verificar y activar 2FA
  async verifyAndActivate2FA(userId, token) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user.twoFaSecret) {
      throw new AppError('Primero debe configurar 2FA', 400);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token,
      period: config.TWO_FA.PERIOD,
    });

    if (!verified) {
      throw new AppError('Código 2FA inválido', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFaEnabled: true },
    });

    return { success: true };
  }

  // Deshabilitar 2FA
  async disable2FA(userId, token) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user.twoFaEnabled) {
      throw new AppError('2FA no está habilitado', 400);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token,
      period: config.TWO_FA.PERIOD,
    });

    if (!verified) {
      throw new AppError('Código 2FA inválido', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFaEnabled: false,
        twoFaSecret: null,
      },
    });

    return { success: true };
  }

  // Verificar 2FA al login
  verify2FAToken(twoFaSecret, token) {
    return speakeasy.totp.verify({
      secret: twoFaSecret,
      encoding: 'base32',
      token,
      period: config.TWO_FA.PERIOD,
    });
  }

  // Obtener perfil de usuario
  async getUserProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        anniversaryDate: true,
        twoFaEnabled: true,
        createdAt: true,
      },
    });

    return user;
  }

  // Actualizar perfil
  async updateProfile(userId, data) {
    const allowedFields = ['name', 'anniversaryDate'];
    const filteredData = {};

    Object.keys(data).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = data[key];
      }
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: filteredData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        anniversaryDate: true,
        twoFaEnabled: true,
      },
    });

    return user;
  }

  // Cambiar contraseña
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Contraseña actual incorrecta', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidar todas las sesiones excepto la actual
    await prisma.session.deleteMany({
      where: {
        userId,
      },
    });

    return { success: true };
  }
}

module.exports = new AuthService();
