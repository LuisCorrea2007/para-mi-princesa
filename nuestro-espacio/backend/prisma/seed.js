// ===========================================
// SEED DATA - Datos de Prueba
// ===========================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // Encriptar contraseña
  const passwordHash = await bcrypt.hash('password123', 10);

  // Crear usuarios de prueba (pareja)
  const user1 = await prisma.user.upsert({
    where: { email: 'usuario1@ejemplo.com' },
    update: {},
    create: {
      email: 'usuario1@ejemplo.com',
      passwordHash,
      name: 'Alex',
      anniversaryDate: new Date('2023-01-15'),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'usuario2@ejemplo.com' },
    update: {},
    create: {
      email: 'usuario2@ejemplo.com',
      passwordHash,
      name: 'Jamie',
      anniversaryDate: new Date('2023-01-15'),
    },
  });

  console.log('✅ Usuarios creados:', user1.name, 'y', user2.name);

  // Crear notas de ejemplo
  const note1 = await prisma.note.create({
    data: {
      userId: user1.id,
      title: 'Nuestra primera cita 💕',
      content: 'Recuerdo perfectamente ese día. Estaba tan nervioso/a que casi no podía hablar. Pero cuando sonreíste, todo cambió.',
      category: 'recuerdo',
      isFavorite: true,
    },
  });

  const note2 = await prisma.note.create({
    data: {
      userId: user2.id,
      title: 'Gracias por estar ahí',
      content: 'Solo quería decirte gracias por apoyarme siempre. Eres mi roca y mi mayor fortaleza.',
      category: 'agradecimiento',
      isFavorite: true,
    },
  });

  console.log('✅ Notas creadas:', note1.title, '|', note2.title);

  // Crear respuesta a nota
  await prisma.noteReply.create({
    data: {
      noteId: note1.id,
      userId: user2.id,
      content: '¡Yo también lo recuerdo! Fue mágico ✨',
    },
  });

  // Crear álbum de fotos
  const album = await prisma.album.create({
    data: {
      userId: user1.id,
      name: 'Nuestros Viajes',
      description: 'Fotos de todas nuestras aventuras juntos',
    },
  });

  console.log('✅ Álbum creado:', album.name);

  // Crear eventos de ejemplo
  const event1 = await prisma.event.create({
    data: {
      userId: user1.id,
      title: 'Cena de aniversario',
      description: 'Reservar en nuestro restaurante favorito',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
      time: '20:00',
      location: 'Restaurante El Jardín',
      category: 'romantica',
      reminderMinutes: 120,
      createdBy: user1.id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      userId: user1.id,
      title: 'Noche de películas',
      description: 'Maratón de nuestras películas favoritas',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días desde ahora
      time: '19:00',
      location: 'Casa',
      category: 'pelicula',
      reminderMinutes: 30,
      createdBy: user1.id,
    },
  });

  console.log('✅ Eventos creados:', event1.title, '|', event2.title);

  // Crear respuestas a eventos
  await prisma.eventResponse.create({
    data: {
      eventId: event1.id,
      userId: user2.id,
      responseStatus: 'accepted',
    },
  });

  // Crear lista de deseos
  const wish1 = await prisma.wish.create({
    data: {
      userId: user1.id,
      title: 'Visitar París',
      description: 'El viaje de nuestros sueños',
      category: 'viaje',
      priority: 5,
      budget: 3000,
    },
  });

  const wish2 = await prisma.wish.create({
    data: {
      userId: user2.id,
      title: 'Aprender a cocinar juntos',
      description: 'Tomar clases de cocina italiana',
      category: 'actividad',
      priority: 3,
      budget: 200,
    },
  });

  console.log('✅ Deseos creados:', wish1.title, '|', wish2.title);

  // Crear votos para deseos
  await prisma.wishVote.create({
    data: {
      wishId: wish1.id,
      userId: user1.id,
      voteValue: 1,
    },
  });

  await prisma.wishVote.create({
    data: {
      wishId: wish1.id,
      userId: user2.id,
      voteValue: 1,
    },
  });

  // Crear hitos importantes
  await prisma.milestone.create({
    data: {
      userId: user1.id,
      title: 'Primer beso',
      description: 'Bajo las estrellas en el parque',
      date: new Date('2023-02-14'),
    },
  });

  await prisma.milestone.create({
    data: {
      userId: user1.id,
      title: 'Primer viaje juntos',
      description: 'Fin de semana en la playa',
      date: new Date('2023-06-20'),
    },
  });

  console.log('✅ Hitos creados');

  // Crear configuración predeterminada
  await prisma.setting.upsert({
    where: {
      userId_key: {
        userId: user1.id,
        key: 'theme',
      },
    },
    update: {},
    create: {
      userId: user1.id,
      key: 'theme',
      value: 'light',
    },
  });

  await prisma.setting.upsert({
    where: {
      userId_key: {
        userId: user1.id,
        key: 'notifications_enabled',
      },
    },
    update: {},
    create: {
      userId: user1.id,
      key: 'notifications_enabled',
      value: 'true',
    },
  });

  console.log('✅ Configuración creada');

  // Registrar actividad
  await prisma.activityLog.create({
    data: {
      userId: user1.id,
      action: 'system_initialized',
      entityType: 'system',
      metadata: JSON.stringify({ message: 'Sistema inicializado con seed data' }),
    },
  });

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📧 Credenciales de prueba:');
  console.log('   Usuario 1: usuario1@ejemplo.com / password123');
  console.log('   Usuario 2: usuario2@ejemplo.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
