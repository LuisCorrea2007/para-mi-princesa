const prisma = require('../config/database');

// Get all notes with filters
exports.getNotes = async (req, res, next) => {
  try {
    const { category, isFavorite, isArchived, search, page = 1, limit = 20 } = req.query;
    
    const where = {};
    
    if (category) where.category = category;
    if (isFavorite !== undefined) where.isFavorite = isFavorite === 'true';
    if (isArchived !== undefined) where.isArchived = isArchived === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const notes = await prisma.note.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true } }
          }
        },
        attachments: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });
    
    const total = await prisma.note.count({ where });
    
    res.json({
      notes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single note
exports.getNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true } }
          }
        },
        attachments: true
      }
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ note });
  } catch (error) {
    next(error);
  }
};

// Create note
exports.createNote = async (req, res, next) => {
  try {
    const { title, content, category, scheduledDate } = req.body;
    
    const note = await prisma.note.create({
      data: {
        title,
        content,
        category: category || 'love',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        authorId: req.user.id
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
    
    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('note:created', { note });
    }
    
    res.status(201).json({ message: 'Note created successfully', note });
  } catch (error) {
    next(error);
  }
};

// Update note
exports.updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, scheduledDate } = req.body;
    
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (note.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: title || undefined,
        content: content || undefined,
        category: category || undefined,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        replies: true,
        reactions: true,
        attachments: true
      }
    });
    
    res.json({ message: 'Note updated successfully', note: updatedNote });
  } catch (error) {
    next(error);
  }
};

// Delete note
exports.deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (note.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.note.delete({ where: { id } });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('note:deleted', { noteId: id });
    }
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Add reply to note
exports.addReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const reply = await prisma.noteReply.create({
      data: {
        content,
        noteId: id,
        authorId: req.user.id
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('note:reply', { noteId: id, reply });
    }
    
    res.status(201).json({ message: 'Reply added successfully', reply });
  } catch (error) {
    next(error);
  }
};

// Get replies for a note
exports.getReplies = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const replies = await prisma.noteReply.findMany({
      where: { noteId: id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json({ replies });
  } catch (error) {
    next(error);
  }
};

// Delete reply
exports.deleteReply = async (req, res, next) => {
  try {
    const { id, replyId } = req.params;
    
    const reply = await prisma.noteReply.findUnique({ where: { id: replyId } });
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    if (reply.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.noteReply.delete({ where: { id: replyId } });
    
    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Add reaction to note
exports.addReaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reactionType } = req.body; // heart, star, smile
    
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Remove existing reaction from this user if any
    await prisma.noteReaction.deleteMany({
      where: {
        noteId: id,
        userId: req.user.id
      }
    });
    
    const reaction = await prisma.noteReaction.create({
      data: {
        reactionType,
        noteId: id,
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('note:reaction', { noteId: id, reaction });
    }
    
    res.status(201).json({ message: 'Reaction added', reaction });
  } catch (error) {
    next(error);
  }
};

// Remove reaction
exports.removeReaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.noteReaction.deleteMany({
      where: {
        noteId: id,
        userId: req.user.id
      }
    });
    
    res.json({ message: 'Reaction removed' });
  } catch (error) {
    next(error);
  }
};

// Toggle favorite
exports.toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (note.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updatedNote = await prisma.note.update({
      where: { id },
      data: { isFavorite: !note.isFavorite }
    });
    
    res.json({ message: 'Favorite toggled', note: updatedNote });
  } catch (error) {
    next(error);
  }
};

// Toggle archive
exports.toggleArchive = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (note.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updatedNote = await prisma.note.update({
      where: { id },
      data: { isArchived: !note.isArchived }
    });
    
    res.json({ message: 'Archive status toggled', note: updatedNote });
  } catch (error) {
    next(error);
  }
};

// Export notes
exports.exportNotes = async (req, res, next) => {
  try {
    const { format = 'json' } = req.params;
    const { category, isFavorite } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (isFavorite !== undefined) where.isFavorite = isFavorite === 'true';
    
    const notes = await prisma.note.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        replies: { include: { author: { select: { id: true, name: true } } } },
        reactions: true,
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=notes-export.json');
      res.json(notes);
    } else {
      // TODO: Implement PDF export
      res.json({ message: 'PDF export coming soon', notes });
    }
  } catch (error) {
    next(error);
  }
};
