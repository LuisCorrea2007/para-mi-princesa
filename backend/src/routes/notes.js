const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { authMiddleware } = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

router.get('/', notesController.getNotes);
router.get('/export/:format', notesController.exportNotes);
router.post('/', notesController.createNote);
router.get('/:id', notesController.getNote);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);
router.post('/:id/replies', notesController.addReply);
router.get('/:id/replies', notesController.getReplies);
router.delete('/:id/replies/:replyId', notesController.deleteReply);
router.post('/:id/reactions', notesController.addReaction);
router.delete('/:id/reactions', notesController.removeReaction);
router.post('/:id/favorite', notesController.toggleFavorite);
router.post('/:id/archive', notesController.toggleArchive);

module.exports = router;
