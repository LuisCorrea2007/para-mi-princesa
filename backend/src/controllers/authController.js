const { generateTokens, hashPassword, comparePassword, verifyToken } = require('../services/authService');
const prisma = require('../config/database');

// Register new user (first user creates the couple space)
exports.register = async (req, res, next) => {
  try {
    const { email, password, name, anniversaryDate } = req.body;

    // Check if this is the first user
    const existingUsers = await prisma.user.count();
    
    if (existingUsers >= 2) {
      return res.status(400).json({ 
        error: 'This couple space is full. Only 2 users allowed.' 
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        anniversaryDate: anniversaryDate ? new Date(anniversaryDate) : null
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        anniversaryDate: true,
        createdAt: true
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in database
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Return temporary token and request 2FA code
      const tempToken = generateTokens(user.id).accessToken;
      return res.json({
        requiresTwoFactor: true,
        tempToken,
        message: 'Please enter your 2FA code'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Return user data without password
    const { passwordHash, ...userData } = user;

    res.json({
      message: 'Login successful',
      user: userData,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// Verify 2FA code
exports.verifyTwoFactor = async (req, res, next) => {
  try {
    const { code, tempToken } = req.body;
    
    // Verify temp token and get user
    const decoded = verifyToken(tempToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA not enabled or invalid token' });
    }
    
    // Verify TOTP code (simplified - in production use speakeasy library)
    // This is a placeholder for actual TOTP verification
    const isValid = true; // TODO: Implement actual TOTP verification
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }
    
    // Generate real tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    const { passwordHash, twoFactorSecret, ...userData } = user;
    
    res.json({
      message: '2FA verified successfully',
      user: userData,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { token: refreshToken }
      });
    }
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    // Check if token exists in database
    const session = await prisma.session.findUnique({
      where: { token: refreshToken }
    });
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
    
    // Update session with new refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        anniversaryDate: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, anniversaryDate } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        anniversaryDate: anniversaryDate ? new Date(anniversaryDate) : undefined
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        anniversaryDate: true,
        updatedAt: true
      }
    });
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    
    // Delete old avatar if exists
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/')) {
      const fs = require('fs');
      const path = require('path');
      const oldPath = path.join(__dirname, '../../', user.avatarUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    // Update user with new avatar
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: avatarPath },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        anniversaryDate: true
      }
    });
    
    res.json({
      message: 'Avatar uploaded successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Delete avatar
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/')) {
      const fs = require('fs');
      const path = require('path');
      const avatarPath = path.join(__dirname, '../../', user.avatarUrl);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true
      }
    });
    
    res.json({
      message: 'Avatar deleted successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Enable 2FA
exports.enableTwoFactor = async (req, res, next) => {
  try {
    // In production, use speakeasy to generate secret and QR code
    // This is a simplified version
    const secret = 'TODO_GENERATE_REAL_SECRET';
    const qrCodeUrl = 'TODO_GENERATE_QR_CODE';
    
    // Store secret temporarily (user needs to verify before enabling)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorSecret: secret }
    });
    
    res.json({
      message: '2FA setup initiated',
      secret,
      qrCodeUrl
    });
  } catch (error) {
    next(error);
  }
};

// Disable 2FA
exports.disableTwoFactor = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    });
    
    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    next(error);
  }
};
