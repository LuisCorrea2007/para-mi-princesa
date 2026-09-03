const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code) {
    if (err.code === 'P2002') {
      return res.status(409).json({ 
        error: 'A record with this value already exists' 
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Record not found' 
      });
    }
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File size too large. Maximum size is 50MB.' 
      });
    }
    return res.status(400).json({ 
      error: `File upload error: ${err.message}` 
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Invalid token' 
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Token expired' 
    });
  }

  // Validation errors
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    return res.status(400).json({ 
      error: err.message,
      details: err.errors 
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
