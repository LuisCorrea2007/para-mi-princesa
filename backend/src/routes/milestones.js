const express = require('express');
const router = express.Router();
const milestonesController = require('../controllers/milestonesController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', milestonesController.getMilestones);
router.post('/', milestonesController.createMilestone);
router.get('/:id', milestonesController.getMilestone);
router.put('/:id', milestonesController.updateMilestone);
router.delete('/:id', milestonesController.deleteMilestone);

module.exports = router;
