const prisma = require('../config/database');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Get dashboard stats
exports.getStats = async (req, res, next) => {
  try {
    const [
      notesCount,
      photosCount,
      eventsCount,
      wishesCount,
      milestonesCount
    ] = await Promise.all([
      prisma.note.count(),
      prisma.photo.count(),
      prisma.event.count(),
      prisma.wish.count(),
      prisma.milestone.count()
    ]);
    
    const upcomingEvents = await prisma.event.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 3
    });
    
    const recentNotes = await prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        author: { select: { id: true, name: true } }
      }
    });
    
    res.json({
      stats: {
        notes: notesCount,
        photos: photosCount,
        events: eventsCount,
        wishes: wishesCount,
        milestones: milestonesCount
      },
      upcomingEvents,
      recentNotes
    });
  } catch (error) {
    next(error);
  }
};

// Get storage usage
exports.getStorage = async (req, res, next) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    const getDirSize = async (dirPath) => {
      let size = 0;
      try {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            size += await getDirSize(fullPath);
          } else {
            const stats = await fs.promises.stat(fullPath);
            size += stats.size;
          }
        }
      } catch (error) {
        console.error('Error calculating dir size:', error);
      }
      return size;
    };
    
    const totalSize = await getDirSize(uploadsDir);
    
    // Count files by type
    const photosCount = await prisma.photo.count();
    const albumsCount = await prisma.album.count();
    
    res.json({
      storage: {
        totalBytes: totalSize,
        totalMB: (totalSize / (1024 * 1024)).toFixed(2),
        photos: photosCount,
        albums: albumsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create backup
exports.createBackup = async (req, res, next) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    const backupsDir = path.join(__dirname, '../../backups');
    const backupPath = path.join(backupsDir, backupName);
    
    // Ensure backups directory exists
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    // Export database to SQL
    const dbUrl = process.env.DATABASE_URL;
    const sqlPath = `${backupPath}.sql`;
    
    // For PostgreSQL: pg_dump
    // For SQLite: .dump
    const isPostgres = dbUrl.startsWith('postgresql');
    
    if (isPostgres) {
      // PostgreSQL backup command
      const pgDumpCmd = `pg_dump "${dbUrl}" > "${sqlPath}"`;
      await execAsync(pgDumpCmd);
    } else {
      // SQLite backup
      const sqlitePath = dbUrl.replace('file:', '').replace('?connection_limit=1', '');
      const sqliteDumpCmd = `sqlite3 "${sqlitePath}" ".dump" > "${sqlPath}"`;
      await execAsync(sqliteDumpCmd);
    }
    
    // Copy uploads folder
    const uploadsDir = path.join(__dirname, '../../uploads');
    const uploadsBackupPath = `${backupPath}-uploads`;
    
    if (fs.existsSync(uploadsDir)) {
      const cpCmd = `cp -r "${uploadsDir}" "${uploadsBackupPath}"`;
      await execAsync(cpCmd);
    }
    
    // Compress backup
    const tarCmd = `cd "${backupsDir}" && tar -czf "${backupName}.tar.gz" "${backupName}.sql" "${backupName}-uploads"`;
    await execAsync(tarCmd);
    
    // Clean up uncompressed files
    fs.unlinkSync(`${backupPath}.sql`);
    fs.rmSync(`${uploadsBackupPath}`, { recursive: true, force: true });
    
    // Record backup in database
    const backup = await prisma.backup.create({
      data: {
        filePath: `/backups/${backupName}.tar.gz`,
        fileSize: fs.statSync(`${backupPath}.tar.gz`).size,
        type: 'full',
        status: 'completed'
      }
    });
    
    res.json({ 
      message: 'Backup created successfully', 
      backup: {
        id: backup.id,
        name: `${backupName}.tar.gz`,
        size: backup.fileSize,
        createdAt: backup.createdAt
      }
    });
  } catch (error) {
    console.error('Backup error:', error);
    next(error);
  }
};

// Get backups list
exports.getBackups = async (req, res, next) => {
  try {
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ backups });
  } catch (error) {
    next(error);
  }
};

// Delete backup
exports.deleteBackup = async (req, res, next) => {
  try {
    const { backupId } = req.params;
    
    const backup = await prisma.backup.findUnique({ where: { id: backupId } });
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    
    // Delete file
    const filePath = path.join(__dirname, '../../', backup.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await prisma.backup.delete({ where: { id: backupId } });
    
    res.json({ message: 'Backup deleted' });
  } catch (error) {
    next(error);
  }
};

// Get activity logs
exports.getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const logs = await prisma.activityLog.findMany({
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });
    
    const total = await prisma.activityLog.count();
    
    res.json({ logs, pagination: { page: parseInt(page), total } });
  } catch (error) {
    next(error);
  }
};

// Cleanup unused files
exports.cleanup = async (req, res, next) => {
  try {
    const { dryRun = true } = req.query;
    
    // Find orphaned photos (photos without valid files)
    const photos = await prisma.photo.findMany({
      select: { id: true, originalPath: true }
    });
    
    let cleanedCount = 0;
    
    for (const photo of photos) {
      const fullPath = path.join(__dirname, '../../', photo.originalPath);
      if (!fs.existsSync(fullPath)) {
        if (dryRun === 'false') {
          await prisma.photo.delete({ where: { id: photo.id } });
        }
        cleanedCount++;
      }
    }
    
    res.json({ 
      message: dryRun === 'false' ? 'Cleanup completed' : 'Dry run completed',
      orphanedPhotosFound: cleanedCount,
      dryRun: dryRun === 'true'
    });
  } catch (error) {
    next(error);
  }
};

// Export all data
exports.exportData = async (req, res, next) => {
  try {
    const data = {
      exportedAt: new Date().toISOString(),
      users: await prisma.user.findMany({
        select: {
          id: true, email: true, name: true, anniversaryDate: true, createdAt: true
        }
      }),
      notes: await prisma.note.findMany({
        include: { replies: true, reactions: true, attachments: true }
      }),
      photos: await prisma.photo.findMany({ include: { tags: true } }),
      albums: await prisma.album.findMany(),
      events: await prisma.event.findMany({ include: { responses: true } }),
      wishes: await prisma.wish.findMany({ include: { votes: true, comments: true } }),
      milestones: await prisma.milestone.findMany()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=nuestro-espacio-export.json');
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
