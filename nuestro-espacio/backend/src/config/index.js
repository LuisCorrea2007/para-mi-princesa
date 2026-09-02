// ===========================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ===========================================

require('dotenv').config();
const path = require('path');

module.exports = {
  // Entorno
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Servidor
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || 'localhost',
  
  // Base de datos
  DATABASE_URL: process.env.DATABASE_URL,
  
  // JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  // CORS
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    CREDENTIALS: true,
  },
  
  // Upload de archivos
  UPLOAD: {
    MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    PATH: path.resolve(process.env.UPLOAD_PATH || './uploads'),
    ALLOWED_TYPES: {
      PHOTOS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      VIDEOS: ['video/mp4', 'video/webm', 'video/quicktime'],
      AVATARS: ['image/jpeg', 'image/png', 'image/webp'],
    },
    PHOTOS_DIR: path.resolve(process.env.UPLOAD_PATH || './uploads', 'photos'),
    VIDEOS_DIR: path.resolve(process.env.UPLOAD_PATH || './uploads', 'videos'),
    AVATARS_DIR: path.resolve(process.env.UPLOAD_PATH || './uploads', 'avatars'),
    TEMP_DIR: path.resolve(process.env.UPLOAD_PATH || './uploads', 'temp'),
  },
  
  // Backup
  BACKUP: {
    PATH: path.resolve(process.env.BACKUP_PATH || './backups'),
    RETENTION_DAYS: parseInt(process.env.CLEANUP_BACKUP_DAYS) || 30,
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // SMTP (Email)
  SMTP: {
    HOST: process.env.SMTP_HOST,
    PORT: parseInt(process.env.SMTP_PORT) || 587,
    SECURE: process.env.SMTP_SECURE === 'true',
    USER: process.env.SMTP_USER,
    PASS: process.env.SMTP_PASS,
    FROM: process.env.SMTP_FROM || 'Nuestro Espacio <noreply@nuestro-espacio.local>',
  },
  
  // 2FA
  TWO_FA: {
    ISSUER: process.env.TWO_FA_ISSUER || 'NuestroEspacio',
    PERIOD: parseInt(process.env.TWO_FA_PERIOD) || 30,
    DIGITS: parseInt(process.env.TWO_FA_DIGITS) || 6,
  },
  
  // Limpieza
  CLEANUP: {
    TEMP_HOURS: parseInt(process.env.CLEANUP_TEMP_HOURS) || 24,
  },
  
  // Logs
  LOGS: {
    PATH: path.resolve('./logs'),
    LEVEL: process.env.LOG_LEVEL || 'info',
  },
  
  // Encriptación
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me-32ch',
};
