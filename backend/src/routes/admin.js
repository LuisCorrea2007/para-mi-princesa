const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/stats', adminController.getStats);
router.get('/storage', adminController.getStorage);
router.post('/backup', adminController.createBackup);
router.get('/backups', adminController.getBackups);
router.delete('/backups/:backupId', adminController.deleteBackup);
router.get('/logs', adminController.getLogs);
router.post('/cleanup', adminController.cleanup);
router.get('/export', adminController.exportData);

module.exports = router;
