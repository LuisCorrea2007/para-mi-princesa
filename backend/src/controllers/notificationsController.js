const prisma = require('../config/database');

// Get notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }
    
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });
    
    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    
    res.json({ message: 'Notification marked as read', notification: updated });
  } catch (error) {
    next(error);
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: req.user.id,
        isRead: false
      },
      data: { isRead: true }
    });
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.notification.delete({ where: { id } });
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
