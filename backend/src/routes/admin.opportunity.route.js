const express = require('express');
const adminOpportunityController = require('../controllers/admin.opportunity.controller');
const validateRequest = require('../middleware/validate.middleware');
const { opportunitySchema } = require('../utils/admin.opportunity.schema');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// All endpoints restricted to Placement Cell Admin
router.use(authenticateToken, authorizeRoles('admin'));

router.get('/', adminOpportunityController.getOpportunities);
router.get('/:id', adminOpportunityController.getOpportunityById);
router.post('/', validateRequest(opportunitySchema), adminOpportunityController.createOpportunity);
router.put('/:id', validateRequest(opportunitySchema), adminOpportunityController.updateOpportunity);
router.delete('/:id', adminOpportunityController.deleteOpportunity);

module.exports = router;
