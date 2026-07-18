const express = require('express');
const { z } = require('zod');
const adminStudentController = require('../controllers/admin.student.controller');
const validateRequest = require('../middleware/validate.middleware');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

const { addStudentSchema, updateStudentSchema } = require('../utils/admin.student.schema');

// Protected routes (Admin only)
router.use(authenticateToken, authorizeRoles('admin'));

// CSV Template download
router.get('/csv-template', adminStudentController.getCsvTemplate);

// CSV Import
router.post('/import', upload.single('file'), adminStudentController.importStudentsCSV);

// CRUD
router.get('/', adminStudentController.getStudents);
router.get('/:id', adminStudentController.getStudentById);
router.post('/', validateRequest(addStudentSchema), adminStudentController.addStudent);
router.put('/:id', validateRequest(updateStudentSchema), adminStudentController.updateStudent);
router.delete('/:id', adminStudentController.deleteStudent);

module.exports = router;
