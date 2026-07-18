const db = require('../db');
const supabase = require('../config/supabase');
const path = require('path');

// Get Profile
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      SELECT s.*, u.email as institute_email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Profile not found' });
    }

    const profile = result.rows[0];

    if (profile.profile_photo_url) {
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .createSignedUrl(profile.profile_photo_url, 3600); // 1 hour expiry
        
      if (!error && data) {
        profile.profile_photo_signed_url = data.signedUrl;
      }
    }

    res.status(200).json({ status: 'success', data: profile });
  } catch (error) {
    next(error);
  }
};

// Update Profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { phone_number, personal_email, github_url, linkedin_url } = req.body;

    const result = await db.query(`
      UPDATE students
      SET phone_number = $1, personal_email = $2, github_url = $3, linkedin_url = $4, updated_at = now()
      WHERE user_id = $5
      RETURNING *
    `, [phone_number || null, personal_email || null, github_url || null, linkedin_url || null, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Profile not found' });
    }

    const profile = result.rows[0];
    

    res.status(200).json({ status: 'success', data: profile });
  } catch (error) {
    next(error);
  }
};

// Upload Profile Photo
const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image file provided' });
    }

    const userId = req.user.id;

    const currentProfileResult = await db.query('SELECT id, profile_photo_url FROM students WHERE user_id = $1', [userId]);
    
    if (currentProfileResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student profile not found' });
    }
    
    const student = currentProfileResult.rows[0];
    const oldPhotoPath = student.profile_photo_url;

    if (oldPhotoPath) {
      const { error: removeError } = await supabase.storage
        .from('profile-photos')
        .remove([oldPhotoPath]);
        
      if (removeError) {
        console.error('Failed to remove old profile photo:', removeError);
      }
    }

    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${student.id}-${Date.now()}${ext}`; // Store by student ID instead of user ID for easier correlation

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false // We use unique filenames so upsert isn't necessary
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    const newPhotoPath = uploadData.path; // e.g., 'UUID-123456789.jpg'

    await db.query(`
      UPDATE students 
      SET profile_photo_url = $1, updated_at = now() 
      WHERE id = $2
    `, [newPhotoPath, student.id]);

    const { data: signedData } = await supabase.storage
      .from('profile-photos')
      .createSignedUrl(newPhotoPath, 3600);

    res.status(200).json({ 
      status: 'success', 
      message: 'Profile photo updated successfully',
      data: {
        profile_photo_path: newPhotoPath,
        profile_photo_signed_url: signedData?.signedUrl
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePhoto
};
