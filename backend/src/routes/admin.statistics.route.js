const express = require('express');
const adminStatisticsController = require('../controllers/admin.statistics.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Only admin can access statistics
router.use(authenticateToken, authorizeRoles('admin'));

router.get('/', adminStatisticsController.getStatistics);

module.exports = router;
