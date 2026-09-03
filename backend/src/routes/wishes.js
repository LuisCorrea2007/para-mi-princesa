const express = require('express');
const router = express.Router();
const wishesController = require('../controllers/wishesController');
const { authMiddleware } = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

router.get('/', wishesController.getWishes);
router.post('/', wishesController.createWish);
router.get('/:id', wishesController.getWish);
router.put('/:id', wishesController.updateWish);
router.delete('/:id', wishesController.deleteWish);
router.post('/:id/complete', wishesController.toggleComplete);
router.post('/:id/vote', wishesController.vote);
router.post('/:id/comments', wishesController.addComment);
router.get('/:id/comments', wishesController.getComments);

module.exports = router;
