// ===========================================
// MANEJO DE ERRORES GLOBAL
// ===========================================

const config = require('../config');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleValidationError = (err) => {
  const errors = err.errors.map((e) => ({
    field: e.path,
    message: e.message,
  }));

  return new AppError(`Error de validación: ${errors.map(e => e.field).join(', ')}`, 400);
};

const handlePrismaError = (err) => {
  // Constraint violation
  if (err.code === 'P2002') {
    return new AppError('Ya existe un registro con ese valor', 409);
  }

  // Record not found
  if (err.code === 'P2025') {
    return new AppError('Registro no encontrado', 404);
  }

  // Invalid input
  if (err.code === 'P2003') {
    return new AppError('Referencia inválida', 400);
  }

  return new AppError('Error en la base de datos', 500);
};

const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Token inválido', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return new AppError('Token expirado', 401);
  }
  return new AppError('Error de autenticación', 401);
};

const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Errores de validación de express-validator
  if (err.array && typeof err.array === 'function') {
    error = handleValidationError(err);
  }

  // Errores de Prisma
  if (err.code && err.code.startsWith('P')) {
    error = handlePrismaError(err);
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('El archivo excede el tamaño máximo permitido', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new AppError('Demasiados archivos subidos', 400);
  }

  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';

  // Log error en producción
  if (config.NODE_ENV === 'production') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error('🔴 Error:', error);
  }

  res.status(statusCode).json({
    success: false,
    status,
    message: error.message || 'Error interno del servidor',
    ...(config.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

module.exports = {
  AppError,
  globalErrorHandler,
};
