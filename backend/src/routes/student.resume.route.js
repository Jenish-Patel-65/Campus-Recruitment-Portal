const express = require('express');
const studentResumeController = require('../controllers/student.resume.controller');
const validateRequest = require('../middleware/validate.middleware');
const { uploadResumeSchema } = require('../utils/student.resume.schema');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const uploadPdf = require('../middleware/uploadPdf.middleware');

const router = express.Router();

// All routes protected and limited to students
router.use(authenticateToken, authorizeRoles('student'));

router.get('/', studentResumeController.getResumes);

// Multer must run before validateRequest so that req.body is populated from multipart form data
router.post(
  '/', 
  uploadPdf.single('file'), 
  validateRequest(uploadResumeSchema), 
  studentResumeController.uploadResume
);

router.delete('/:id', studentResumeController.deleteResume);

module.exports = router;
