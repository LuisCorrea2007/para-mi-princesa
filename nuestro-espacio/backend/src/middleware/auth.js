// ===========================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// ===========================================

const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const config = require('../config');

const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = jwt.verify(token, config.JWT.SECRET);

    // Buscar usuario y sesión
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada o inválida',
      });
    }

    // Adjuntar usuario al request
    req.user = session.user;
    req.sessionId = session.id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error de autenticación',
    });
  }
};

// Middleware opcional - no falla si no hay token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.JWT.SECRET);
      
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (session && session.expiresAt > new Date()) {
        req.user = session.user;
        req.sessionId = session.id;
      }
    }
    
    next();
  } catch (error) {
    // Si falla, continuar sin usuario
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuth,
};
