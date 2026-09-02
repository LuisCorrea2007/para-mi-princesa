// ===========================================
// APLICACIÓN PRINCIPAL - EXPRESS SERVER
// ===========================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const cron = require('node-cron');

const config = require('./config');
const { connectDB, disconnectDB } = require('./config/database');
const { globalErrorHandler } = require('./middleware/errorHandler');
const fileService = require('./services/fileService');

// Importar rutas
const authRoutes = require('./routes/auth');

// Crear app Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.CORS.ORIGIN,
    credentials: true,
  },
});

// ===========================================
// MIDDLEWARE GLOBAL
// ===========================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado para desarrollo
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.CORS.ORIGIN,
  credentials: config.CORS.CREDENTIALS,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX_REQUESTS,
  message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => console.log(message.trim()),
    },
  }));
}

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ===========================================
// RUTAS API
// ===========================================

app.use('/api/auth', authRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Nuestro Espacio API',
    version: '1.0.0',
  });
});

// ===========================================
// SOCKET.IO - NOTIFICACIONES EN TIEMPO REAL
// ===========================================

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Unirse a room de usuario
  socket.on('join-user', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined room`);
  });

  // Unirse a room de pareja
  socket.on('join-couple', (coupleRoomId) => {
    socket.join(`couple:${coupleRoomId}`);
    console.log(`Joined couple room: ${coupleRoomId}`);
  });

  // Enviar notificación
  socket.on('send-notification', (data) => {
    io.to(`user:${data.userId}`).emit('notification', data);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Función para emitir notificaciones
const emitNotification = (userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

module.exports.emitNotification = emitNotification;
module.exports.io = io;

// ===========================================
// MANEJO DE ERRORES 404
// ===========================================

app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// Error handler global
app.use(globalErrorHandler);

// ===========================================
// TAREAS PROGRAMADAS (CRON)
// ===========================================

// Limpieza de archivos temporales (diario a las 3 AM)
cron.schedule('0 3 * * *', async () => {
  console.log('🧹 Running temp files cleanup...');
  await fileService.cleanupTempFiles();
});

// Backup automático (semanal - Domingos 2 AM)
cron.schedule('0 2 * * 0', async () => {
  console.log('💾 Running automatic backup...');
  // Aquí iría la lógica de backup
  // await backupService.createBackup('automatic');
});

// ===========================================
// INICIAR SERVIDOR
// ===========================================

async function startServer() {
  try {
    // Conectar a base de datos
    await connectDB();

    // Iniciar servidor
    server.listen(config.PORT, () => {
      console.log('===========================================');
      console.log(`🚀 Nuestro Espacio API`);
      console.log(`📍 Server running on port ${config.PORT}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log('===========================================');
    });

    // Manejo de señales para cierre graceful
    process.on('SIGTERM', async () => {
      console.log('📴 SIGTERM received. Closing gracefully...');
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('📴 SIGINT received. Closing gracefully...');
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Exportar para tests
module.exports = { app, server, io, startServer };

// Iniciar si no estamos en modo test
if (require.main === module) {
  startServer();
}
