const express = require('express');
const adminApplicationController = require('../controllers/admin.application.controller');
const validateRequest = require('../middleware/validate.middleware');
const { updateResultSchema } = require('../utils/admin.application.schema');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// All endpoints restricted to Admin
router.use(authenticateToken, authorizeRoles('admin'));

// These routes will be mounted under /api/admin/opportunities
// Example full path: GET /api/admin/opportunities/:id/applicants

router.get('/:id/applicants', adminApplicationController.getApplicants);
router.get('/:id/applicants/export', adminApplicationController.exportApplicantsCSV);
router.get('/:id/applicants/resumes/export', adminApplicationController.exportApplicantResumesZip);
router.get('/:id/applicants/:applicationId/resume', adminApplicationController.getApplicantResumeView);
router.put('/:id/applicants/:applicationId/result', validateRequest(updateResultSchema), adminApplicationController.updateApplicationResult);

module.exports = router;
