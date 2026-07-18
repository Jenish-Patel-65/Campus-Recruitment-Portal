const express = require('express');
const studentProfileController = require('../controllers/student.profile.controller');
const validateRequest = require('../middleware/validate.middleware');
const { updatePersonalProfileSchema } = require('../utils/student.profile.schema');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const uploadImage = require('../middleware/uploadImage.middleware');

const router = express.Router();

// All routes are protected and strictly limited to students
router.use(authenticateToken, authorizeRoles('student'));

router.get('/', studentProfileController.getProfile);
router.put('/', validateRequest(updatePersonalProfileSchema), studentProfileController.updateProfile);
router.post('/photo', uploadImage.single('photo'), studentProfileController.uploadProfilePhoto);

module.exports = router;
