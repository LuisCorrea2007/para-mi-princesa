const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { authMiddleware } = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

router.get('/', eventsController.getEvents);
router.get('/upcoming', eventsController.getUpcomingEvents);
router.get('/past', eventsController.getPastEvents);
router.get('/templates', eventsController.getTemplates);
router.get('/export/ical', eventsController.exportIcal);
router.post('/', eventsController.createEvent);
router.get('/:id', eventsController.getEvent);
router.put('/:id', eventsController.updateEvent);
router.delete('/:id', eventsController.deleteEvent);
router.post('/:id/respond', eventsController.respondToEvent);

module.exports = router;
