// ===========================================
// CONEXIÓN A BASE DE DATOS
// ===========================================

const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  } catch (error) {
    console.error('Error disconnecting database:', error.message);
  }
}

module.exports = {
  prisma,
  connectDB,
  disconnectDB,
};
