const prisma = require('../config/database');

// Get all events with filters
exports.getEvents = async (req, res, next) => {
  try {
    const { month, year, category, isRecurring } = req.query;
    
    const where = {};
    
    if (category) where.category = category;
    if (isRecurring !== undefined) where.isRecurring = isRecurring === 'true';
    
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }
    
    const events = await prisma.event.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        responses: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { date: 'asc' }
    });
    
    res.json({ events });
  } catch (error) {
    next(error);
  }
};

// Get upcoming events
exports.getUpcomingEvents = async (req, res, next) => {
  try {
    const now = new Date();
    
    const events = await prisma.event.findMany({
      where: {
        date: { gte: now }
      },
      include: {
        creator: { select: { id: true, name: true } },
        responses: true
      },
      orderBy: { date: 'asc' },
      take: 10
    });
    
    res.json({ events });
  } catch (error) {
    next(error);
  }
};

// Get past events
exports.getPastEvents = async (req, res, next) => {
  try {
    const now = new Date();
    
    const events = await prisma.event.findMany({
      where: {
        date: { lt: now }
      },
      include: {
        creator: { select: { id: true, name: true } },
        responses: true
      },
      orderBy: { date: 'desc' },
      take: 20
    });
    
    res.json({ events });
  } catch (error) {
    next(error);
  }
};

// Create event
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, date, time, location, category, reminderMinutes, isRecurring, recurrenceRule } = req.body;
    
    const eventDate = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes));
    }
    
    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        date: eventDate,
        location: location || null,
        category: category || 'other',
        reminderMinutes: reminderMinutes ? parseInt(reminderMinutes) : null,
        isRecurring: isRecurring || false,
        recurrenceRule: recurrenceRule || null,
        creatorId: req.user.id
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('event:created', { event });
    }
    
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    next(error);
  }
};

// Get single event
exports.getEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        responses: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ event });
  } catch (error) {
    next(error);
  }
};

// Update event
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, location, category, reminderMinutes } = req.body;
    
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (category) updateData.category = category;
    if (reminderMinutes !== undefined) updateData.reminderMinutes = reminderMinutes;
    
    if (date) {
      const eventDate = new Date(date);
      if (time) {
        const [hours, minutes] = time.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes));
      }
      updateData.date = eventDate;
    }
    
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: { responses: true }
    });
    
    res.json({ message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    next(error);
  }
};

// Delete event
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.event.delete({ where: { id } });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('event:deleted', { eventId: id });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Respond to event
exports.respondToEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { responseStatus } = req.body; // accepted, declined, maybe
    
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Upsert response
    const response = await prisma.eventResponse.upsert({
      where: {
        eventId_userId: {
          eventId: id,
          userId: req.user.id
        }
      },
      update: { responseStatus },
      create: {
        eventId: id,
        userId: req.user.id,
        responseStatus
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('event:response', { eventId: id, response });
    }
    
    res.json({ message: 'Response recorded', response });
  } catch (error) {
    next(error);
  }
};

// Get event templates
exports.getTemplates = async (req, res, next) => {
  try {
    const templates = [
      { id: 'romantic-dinner', title: 'Cena Romántica', category: 'romantic', description: 'Una cena especial juntos' },
      { id: 'movie-night', title: 'Noche de Películas', category: 'entertainment', description: 'Maratón de películas en casa' },
      { id: 'weekend-getaway', title: 'Escapada de Fin de Semana', category: 'travel', description: 'Viaje corto para desconectar' },
      { id: 'anniversary', title: 'Aniversario', category: 'special', description: 'Celebración de aniversario' },
      { id: 'adventure', title: 'Aventura', category: 'outdoor', description: 'Actividad al aire libre' }
    ];
    
    res.json({ templates });
  } catch (error) {
    next(error);
  }
};

// Export events to iCal
exports.exportIcal = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' }
    });
    
    // Simple iCal format
    let icalContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Nuestro Espacio//ES\n';
    
    events.forEach(event => {
      icalContent += 'BEGIN:VEVENT\n';
      icalContent += `UID:${event.id}@nuestro-espacio\n`;
      icalContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      icalContent += `DTSTART:${event.date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      icalContent += `SUMMARY:${event.title}\n`;
      if (event.description) icalContent += `DESCRIPTION:${event.description}\n`;
      if (event.location) icalContent += `LOCATION:${event.location}\n`;
      icalContent += 'END:VEVENT\n';
    });
    
    icalContent += 'END:VCALENDAR';
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename=nuestro-espacio-events.ics');
    res.send(icalContent);
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
