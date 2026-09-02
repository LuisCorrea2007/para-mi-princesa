// ===========================================
// SERVICIO DE ARCHIVOS Y PROCESAMIENTO DE IMÁGENES
// ===========================================

const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const sanitize = require('sanitize-filename');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

class FileService {
  constructor() {
    this.ensureDirectories();
  }

  // Asegurar que los directorios existan
  ensureDirectories() {
    const dirs = [
      config.UPLOAD.PHOTOS_DIR,
      path.join(config.UPLOAD.PHOTOS_DIR, 'original'),
      path.join(config.UPLOAD.PHOTOS_DIR, 'compressed'),
      path.join(config.UPLOAD.PHOTOS_DIR, 'thumbnails'),
      config.UPLOAD.VIDEOS_DIR,
      path.join(config.UPLOAD.VIDEOS_DIR, 'original'),
      path.join(config.UPLOAD.VIDEOS_DIR, 'compressed'),
      config.UPLOAD.AVATARS_DIR,
      config.UPLOAD.TEMP_DIR,
      config.BACKUP.PATH,
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.ensureDirSync(dir);
      }
    });
  }

  // Generar nombre de archivo único
  generateFilename(originalName, extension) {
    const sanitizedName = sanitize(path.parse(originalName).name);
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0];
    return `${sanitizedName}-${timestamp}-${uniqueId}${extension}`;
  }

  // Guardar archivo temporalmente
  async saveTempFile(buffer, originalName) {
    const extension = path.extname(originalName);
    const filename = this.generateFilename(originalName, extension);
    const filePath = path.join(config.UPLOAD.TEMP_DIR, filename);

    await fs.writeFile(filePath, buffer);

    return { filename, filePath };
  }

  // Procesar imagen (redimensionar, comprimir, generar thumbnail)
  async processImage(filePath, originalName) {
    try {
      const extension = path.extname(originalName).toLowerCase();
      const baseName = path.parse(originalName).name;
      
      // Nombres de archivos
      const originalFilename = this.generateFilename(originalName, extension);
      const compressedFilename = this.generateFilename(originalName, '.jpg');
      const thumbnailFilename = this.generateFilename(originalName, '.jpg');

      // Paths completos
      const originalPath = path.join(config.UPLOAD.PHOTOS_DIR, 'original', originalFilename);
      const compressedPath = path.join(config.UPLOAD.PHOTOS_DIR, 'compressed', compressedFilename);
      const thumbnailPath = path.join(config.UPLOAD.PHOTOS_DIR, 'thumbnails', thumbnailFilename);

      // Obtener metadatos de la imagen
      const metadata = await sharp(filePath).metadata();

      // Guardar original
      await fs.copy(filePath, originalPath);

      // Crear versión comprimida (max 1920px, calidad 85%)
      await sharp(filePath)
        .resize(1920, 1920, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(compressedPath);

      // Crear thumbnail (400x400)
      await sharp(filePath)
        .resize(400, 400, { 
          fit: 'cover', 
          position: 'center' 
        })
        .jpeg({ quality: 80, progressive: true })
        .toFile(thumbnailPath);

      // Obtener tamaños de archivo
      const originalStats = await fs.stat(originalPath);
      const compressedStats = await fs.stat(compressedPath);
      const thumbnailStats = await fs.stat(thumbnailPath);

      // Limpiar archivo temporal
      await fs.remove(filePath);

      return {
        originalPath,
        compressedPath,
        thumbnailPath,
        originalFilename,
        compressedFilename,
        thumbnailFilename,
        width: metadata.width,
        height: metadata.height,
        mimeType: metadata.format ? `image/${metadata.format}` : 'image/jpeg',
        fileSize: originalStats.size,
        compressedSize: compressedStats.size,
        thumbnailSize: thumbnailStats.size,
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new AppError('Error al procesar la imagen', 500);
    }
  }

  // Procesar avatar
  async processAvatar(filePath, originalName) {
    try {
      const extension = '.jpg';
      const avatarFilename = this.generateFilename(originalName, extension);
      const avatarPath = path.join(config.UPLOAD.AVATARS_DIR, avatarFilename);

      // Redimensionar y comprimir avatar (300x300)
      await sharp(filePath)
        .resize(300, 300, { 
          fit: 'cover', 
          position: 'center' 
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(avatarPath);

      // Limpiar archivo temporal
      await fs.remove(filePath);

      return {
        path: avatarPath,
        filename: avatarFilename,
        url: `/uploads/avatars/${avatarFilename}`,
      };
    } catch (error) {
      console.error('Error processing avatar:', error);
      throw new AppError('Error al procesar el avatar', 500);
    }
  }

  // Eliminar archivo
  async deleteFile(filePath) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        await fs.remove(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  // Eliminar foto y sus variantes
  async deletePhoto(photoData) {
    const paths = [
      photoData.originalPath,
      photoData.compressedPath,
      photoData.thumbnailPath,
    ];

    await Promise.all(paths.map((p) => this.deleteFile(p)));
  }

  // Validar tipo de archivo
  validateFileType(mimetype, allowedTypes) {
    return allowedTypes.includes(mimetype);
  }

  // Obtener URL pública de un archivo
  getFileUrl(filePath) {
    const uploadsDir = config.UPLOAD.PATH;
    const relativePath = path.relative(uploadsDir, filePath);
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  // Limpiar archivos temporales antiguos
  async cleanupTempFiles() {
    try {
      const tempFiles = await fs.readdir(config.UPLOAD.TEMP_DIR);
      const now = Date.now();
      const maxAge = config.CLEANUP.TEMP_HOURS * 60 * 60 * 1000;

      for (const file of tempFiles) {
        const filePath = path.join(config.UPLOAD.TEMP_DIR, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.remove(filePath);
        }
      }

      console.log(`✅ Temp files cleaned: ${tempFiles.length} files processed`);
    } catch (error) {
      console.error('Error cleaning temp files:', error);
    }
  }

  // Verificar si un archivo existe
  fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  // Obtener estadísticas de almacenamiento
  async getStorageStats() {
    const dirs = [
      { name: 'photos', path: config.UPLOAD.PHOTOS_DIR },
      { name: 'videos', path: config.UPLOAD.VIDEOS_DIR },
      { name: 'avatars', path: config.UPLOAD.AVATARS_DIR },
    ];

    const stats = {};
    let totalSize = 0;

    for (const dir of dirs) {
      const size = await this.getDirectorySize(dir.path);
      stats[dir.name] = size;
      totalSize += size;
    }

    return {
      ...stats,
      total: totalSize,
    };
  }

  // Obtener tamaño de directorio
  async getDirectorySize(dirPath) {
    let totalSize = 0;

    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        totalSize += await this.getDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  }
}

module.exports = new FileService();
