const prisma = require('../config/database');
const path = require('path');
const fs = require('fs');
const { processImage } = require('../services/fileService');

// Get all photos with filters
exports.getPhotos = async (req, res, next) => {
  try {
    const { albumId, isFavorite, tag, search, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (albumId) where.albumId = albumId;
    if (isFavorite !== undefined) where.isFavorite = isFavorite === 'true';
    if (tag) {
      where.tags = { some: { tagName: { contains: tag, mode: 'insensitive' } } };
    }
    if (search) {
      where.caption = { contains: search, mode: 'insensitive' };
    }
    
    const photos = await prisma.photo.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        album: { select: { id: true, name: true } },
        tags: true
      },
      orderBy: { takenAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });
    
    const total = await prisma.photo.count({ where });
    
    res.json({
      photos,
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

// Upload single photo
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { caption, albumId, takenAt, gpsLat, gpsLon } = req.body;
    const originalPath = `/uploads/photos/original/${req.file.filename}`;
    const compressedPath = `/uploads/photos/compressed/${req.file.filename}`;
    const thumbnailPath = `/uploads/photos/thumbnails/${req.file.filename}`;
    
    // Process image (create compressed and thumbnail versions)
    const inputPath = req.file.path;
    await processImage(inputPath, {
      original: path.join(__dirname, '../../', originalPath),
      compressed: path.join(__dirname, '../../', compressedPath),
      thumbnail: path.join(__dirname, '../../', thumbnailPath)
    });
    
    // Delete original temp file
    fs.unlinkSync(inputPath);
    
    const photo = await prisma.photo.create({
      data: {
        authorId: req.user.id,
        albumId: albumId || null,
        originalPath,
        compressedPath,
        thumbnailPath,
        caption: caption || null,
        gpsLat: gpsLat ? parseFloat(gpsLat) : null,
        gpsLon: gpsLon ? parseFloat(gpsLon) : null,
        takenAt: takenAt ? new Date(takenAt) : new Date(),
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('photo:uploaded', { photo });
    }
    
    res.status(201).json({ message: 'Photo uploaded successfully', photo });
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
};

// Get single photo
exports.getPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        album: { select: { id: true, name: true } },
        tags: true
      }
    });
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json({ photo });
  } catch (error) {
    next(error);
  }
};

// Update photo
exports.updatePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { caption, isFavorite, albumId } = req.body;
    
    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    if (photo.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updatedPhoto = await prisma.photo.update({
      where: { id },
      data: {
        caption: caption !== undefined ? caption : undefined,
        isFavorite: isFavorite !== undefined ? isFavorite : undefined,
        albumId: albumId !== undefined ? albumId : undefined
      },
      include: { tags: true }
    });
    
    res.json({ message: 'Photo updated successfully', photo: updatedPhoto });
  } catch (error) {
    next(error);
  }
};

// Delete photo
exports.deletePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    if (photo.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Delete files from disk
    const paths = [photo.originalPath, photo.compressedPath, photo.thumbnailPath];
    paths.forEach(p => {
      const fullPath = path.join(__dirname, '../../', p);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });
    
    await prisma.photo.delete({ where: { id } });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('photo:deleted', { photoId: id });
    }
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Toggle favorite
exports.toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    if (photo.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updatedPhoto = await prisma.photo.update({
      where: { id },
      data: { isFavorite: !photo.isFavorite }
    });
    
    res.json({ message: 'Favorite toggled', photo: updatedPhoto });
  } catch (error) {
    next(error);
  }
};

// Get photo metadata
exports.getMetadata = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const photo = await prisma.photo.findUnique({
      where: { id },
      select: {
        id: true,
        fileSize: true,
        mimeType: true,
        gpsLat: true,
        gpsLon: true,
        takenAt: true,
        createdAt: true
      }
    });
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json({ metadata: photo });
  } catch (error) {
    next(error);
  }
};

// Serve photo files
exports.servePhoto = async (req, res, next) => {
  try {
    const { id, type } = req.params; // type: original, compressed, thumbnail
    
    const photo = await prisma.photo.findUnique({
      where: { id },
      select: {
        originalPath: true,
        compressedPath: true,
        thumbnailPath: true,
        mimeType: true
      }
    });
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    let filePath;
    switch (type) {
      case 'original':
        filePath = photo.originalPath;
        break;
      case 'compressed':
        filePath = photo.compressedPath;
        break;
      case 'thumbnail':
        filePath = photo.thumbnailPath;
        break;
      default:
        filePath = photo.compressedPath;
    }
    
    const fullPath = path.join(__dirname, '../../', filePath);
    res.sendFile(fullPath);
  } catch (error) {
    next(error);
  }
};

// Add tag to photo
exports.addTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tagName } = req.body;
    
    const tag = await prisma.photoTag.create({
      data: {
        tagName,
        photoId: id
      }
    });
    
    res.status(201).json({ message: 'Tag added', tag });
  } catch (error) {
    next(error);
  }
};

// Search photos
exports.searchPhotos = async (req, res, next) => {
  try {
    const { q, tags, dateFrom, dateTo } = req.query;
    
    const where = {};
    
    if (q) {
      where.caption = { contains: q, mode: 'insensitive' };
    }
    
    if (tags) {
      const tagList = tags.split(',');
      where.tags = {
        some: {
          tagName: { in: tagList }
        }
      };
    }
    
    if (dateFrom || dateTo) {
      where.takenAt = {};
      if (dateFrom) where.takenAt.gte = new Date(dateFrom);
      if (dateTo) where.takenAt.lte = new Date(dateTo);
    }
    
    const photos = await prisma.photo.findMany({
      where,
      include: { tags: true },
      orderBy: { takenAt: 'desc' },
      take: 50
    });
    
    res.json({ photos });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
