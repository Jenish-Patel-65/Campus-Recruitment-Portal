const express = require('express');
const studentApplicationController = require('../controllers/student.application.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes protected and limited to students
router.use(authenticateToken, authorizeRoles('student'));

router.get('/', studentApplicationController.getMyApplications);
router.get('/:id', studentApplicationController.getPastOpportunityDetails);

module.exports = router;
