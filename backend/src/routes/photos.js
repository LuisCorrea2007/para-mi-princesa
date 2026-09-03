const express = require('express');
const router = express.Router();
const photosController = require('../controllers/photosController');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../services/fileService');

// All routes are protected
router.use(authMiddleware);

router.get('/', photosController.getPhotos);
router.get('/search', photosController.searchPhotos);
router.post('/upload', upload.single('photo'), photosController.uploadPhoto);
router.get('/:id', photosController.getPhoto);
router.get('/:id/metadata', photosController.getMetadata);
router.get('/:id/:type', photosController.servePhoto); // type: original, compressed, thumbnail
router.put('/:id', photosController.updatePhoto);
router.delete('/:id', photosController.deletePhoto);
router.post('/:id/favorite', photosController.toggleFavorite);
router.post('/:id/tags', photosController.addTag);

module.exports = router;
