const express = require('express');
const studentOpportunityController = require('../controllers/student.opportunity.controller');
const validateRequest = require('../middleware/validate.middleware');
const { applyOpportunitySchema } = require('../utils/student.opportunity.schema');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// All endpoints restricted to Student
router.use(authenticateToken, authorizeRoles('student'));

router.get('/', studentOpportunityController.getOpportunities);
router.get('/:id', studentOpportunityController.getOpportunityById);
router.post('/:id/apply', validateRequest(applyOpportunitySchema), studentOpportunityController.applyToOpportunity);

module.exports = router;
