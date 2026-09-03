const prisma = require('../config/database');

// Get all wishes with filters
exports.getWishes = async (req, res, next) => {
  try {
    const { category, isCompleted, sortBy = 'priority' } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (isCompleted !== undefined) where.isCompleted = isCompleted === 'true';
    
    let orderBy = {};
    switch (sortBy) {
      case 'priority':
        orderBy = { priority: 'desc' };
        break;
      case 'deadline':
        orderBy = { deadline: 'asc' };
        break;
      case 'createdAt':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { priority: 'desc' };
    }
    
    const wishes = await prisma.wish.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        votes: { include: { user: { select: { id: true, name: true } } } },
        comments: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy
    });
    
    res.json({ wishes });
  } catch (error) {
    next(error);
  }
};

// Create wish
exports.createWish = async (req, res, next) => {
  try {
    const { title, description, category, priority, budget, deadline } = req.body;
    
    const wish = await prisma.wish.create({
      data: {
        title,
        description: description || null,
        category: category || 'general',
        priority: priority ? parseInt(priority) : 5,
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline ? new Date(deadline) : null,
        creatorId: req.user.id
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
    
    // Auto-vote by creator
    await prisma.wishVote.create({
      data: {
        wishId: wish.id,
        userId: req.user.id,
        voteValue: 1
      }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('wish:created', { wish });
    }
    
    res.status(201).json({ message: 'Wish created successfully', wish });
  } catch (error) {
    next(error);
  }
};

// Get single wish
exports.getWish = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const wish = await prisma.wish.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        votes: { include: { user: { select: { id: true, name: true } } } },
        comments: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } }
        }
      }
    });
    
    if (!wish) {
      return res.status(404).json({ error: 'Wish not found' });
    }
    
    res.json({ wish });
  } catch (error) {
    next(error);
  }
};

// Update wish
exports.updateWish = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, budget, deadline } = req.body;
    
    const wish = await prisma.wish.findUnique({ where: { id } });
    if (!wish) {
      return res.status(404).json({ error: 'Wish not found' });
    }
    if (wish.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (priority !== undefined) updateData.priority = parseInt(priority);
    if (budget !== undefined) updateData.budget = parseFloat(budget);
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    
    const updatedWish = await prisma.wish.update({
      where: { id },
      data: updateData,
      include: { votes: true, comments: true }
    });
    
    res.json({ message: 'Wish updated successfully', wish: updatedWish });
  } catch (error) {
    next(error);
  }
};

// Delete wish
exports.deleteWish = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const wish = await prisma.wish.findUnique({ where: { id } });
    if (!wish) {
      return res.status(404).json({ error: 'Wish not found' });
    }
    if (wish.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.wish.delete({ where: { id } });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('wish:deleted', { wishId: id });
    }
    
    res.json({ message: 'Wish deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Toggle complete
exports.toggleComplete = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const wish = await prisma.wish.findUnique({ where: { id } });
    if (!wish) {
      return res.status(404).json({ error: 'Wish not found' });
    }
    
    const updatedWish = await prisma.wish.update({
      where: { id },
      data: { isCompleted: !wish.isCompleted, completedAt: !wish.isCompleted ? new Date() : null }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('wish:completed', { wishId: id, isCompleted: updatedWish.isCompleted });
    }
    
    res.json({ message: 'Wish status updated', wish: updatedWish });
  } catch (error) {
    next(error);
  }
};

// Vote on wish
exports.vote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { voteValue } = req.body; // 1 for upvote, -1 for downvote
    
    const wish = await prisma.wish.findUnique({ where: { id } });
    if (!wish) {
      return res.status(404).json({ error: 'Wish not found' });
    }
    
    // Upsert vote
    const vote = await prisma.wishVote.upsert({
      where: {
        wishId_userId: {
          wishId: id,
          userId: req.user.id
        }
      },
      update: { voteValue: parseInt(voteValue) || 1 },
      create: {
        wishId: id,
        userId: req.user.id,
        voteValue: parseInt(voteValue) || 1
      },
      include: { user: { select: { id: true, name: true } } }
    });
    
    // Recalculate priority based on votes
    const totalVotes = await prisma.wishVote.aggregate({
      where: { wishId: id },
      _sum: { voteValue: true }
    });
    
    await prisma.wish.update({
      where: { id },
      data: { priority: Math.max(1, Math.min(10, 5 + (totalVotes._sum.voteValue || 0))) }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('wish:voted', { wishId: id, vote });
    }
    
    res.json({ message: 'Vote recorded', vote });
  } catch (error) {
    next(error);
  }
};

// Add comment to wish
exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const wish = await prisma.wish.findUnique({ where: { id } });
    if (!wish) {
      return res.status(404).json({ error: 'Wish not found' });
    }
    
    const comment = await prisma.wishComment.create({
      data: {
        content,
        wishId: id,
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('wish:comment', { wishId: id, comment });
    }
    
    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    next(error);
  }
};

// Get comments for wish
exports.getComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const comments = await prisma.wishComment.findMany({
      where: { wishId: id },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
