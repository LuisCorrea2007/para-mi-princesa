const prisma = require('../config/database');

// Get all milestones
exports.getMilestones = async (req, res, next) => {
  try {
    const milestones = await prisma.milestone.findMany({
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        photo: { select: { id: true, thumbnailPath: true } }
      },
      orderBy: { date: 'desc' }
    });
    
    res.json({ milestones });
  } catch (error) {
    next(error);
  }
};

// Create milestone
exports.createMilestone = async (req, res, next) => {
  try {
    const { title, description, date, photoId } = req.body;
    
    const milestone = await prisma.milestone.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        photoId: photoId || null,
        creatorId: req.user.id
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        photo: { select: { id: true, thumbnailPath: true } }
      }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('milestone:created', { milestone });
    }
    
    res.status(201).json({ message: 'Milestone created successfully', milestone });
  } catch (error) {
    next(error);
  }
};

// Get single milestone
exports.getMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        photo: { 
          select: { 
            id: true, 
            thumbnailPath: true, 
            compressedPath: true,
            caption: true
          } 
        }
      }
    });
    
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    
    res.json({ milestone });
  } catch (error) {
    next(error);
  }
};

// Update milestone
exports.updateMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, date, photoId } = req.body;
    
    const milestone = await prisma.milestone.findUnique({ where: { id } });
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    if (milestone.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date) updateData.date = new Date(date);
    if (photoId !== undefined) updateData.photoId = photoId;
    
    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: updateData,
      include: { photo: { select: { id: true, thumbnailPath: true } } }
    });
    
    res.json({ message: 'Milestone updated successfully', milestone: updatedMilestone });
  } catch (error) {
    next(error);
  }
};

// Delete milestone
exports.deleteMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const milestone = await prisma.milestone.findUnique({ where: { id } });
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    if (milestone.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.milestone.delete({ where: { id } });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('milestone:deleted', { milestoneId: id });
    }
    
    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
