const db = require('../db');
const supabase = require('../config/supabase');

// Get Resumes
const getResumes = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentResult.rows.length === 0) {
      return res.status(200).json({ status: 'success', data: [] });
    }
    const studentId = studentResult.rows[0].id;

    const resumesResult = await db.query(
      `SELECT r.id, r.resume_name, r.file_url, r.created_at,
              EXISTS (SELECT 1 FROM applications a WHERE a.resume_id = r.id AND a.result = 'pending') as is_in_use
       FROM resumes r 
       WHERE r.student_id = $1 
       ORDER BY r.created_at DESC`,
      [studentId]
    );

    const resumes = resumesResult.rows;

    for (let resume of resumes) {
      if (resume.file_url) {
        const { data, error } = await supabase.storage
          .from('resumes')
          .createSignedUrl(resume.file_url, 3600); // 1 hour expiry

        if (!error && data) {
          resume.signed_url = data.signedUrl;
        }
      }
    }

    res.status(200).json({ status: 'success', data: resumes });
  } catch (error) {
    next(error);
  }
};

// Upload Resume
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No PDF file provided' });
    }

    const { resume_name } = req.body;
    const userId = req.user.id;

    const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student profile not found' });
    }
    const studentId = studentResult.rows[0].id;

    const countResult = await db.query('SELECT count(*) as count FROM resumes WHERE student_id = $1', [studentId]);
    const currentCount = parseInt(countResult.rows[0].count, 10);

    if (currentCount >= 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum limit of 5 resumes reached. Please delete an existing resume before uploading a new one.'
      });
    }

    const filename = `${studentId}-${Date.now()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filename, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    const fileUrl = uploadData.path;

    const insertResult = await db.query(`
      INSERT INTO resumes (student_id, resume_name, file_url)
      VALUES ($1, $2, $3)
      RETURNING id, resume_name, file_url, created_at
    `, [studentId, resume_name, fileUrl]);

    const newResume = insertResult.rows[0];

    const { data: signedData } = await supabase.storage
      .from('resumes')
      .createSignedUrl(fileUrl, 3600);

    newResume.signed_url = signedData?.signedUrl;

    res.status(201).json({
      status: 'success',
      message: 'Resume uploaded successfully',
      data: newResume
    });

  } catch (error) {
    next(error);
  }
};

// Delete Resume
const deleteResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const checkResult = await db.query(`
      SELECT r.id, r.file_url 
      FROM resumes r
      JOIN students s ON r.student_id = s.id
      WHERE r.id = $1 AND s.user_id = $2
    `, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Resume not found or unauthorized' });
    }

    const resume = checkResult.rows[0];

    const appCheck = await db.query("SELECT id FROM applications WHERE resume_id = $1 AND result = 'pending' LIMIT 1", [id]);
    if (appCheck.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete this resume because it is currently under review for a pending application.'
      });
    }

    if (resume.file_url) {
      const { error: removeError } = await supabase.storage
        .from('resumes')
        .remove([resume.file_url]);

      if (removeError) {
        console.error('Failed to remove resume file from storage:', removeError);
      }
    }

    await db.query('DELETE FROM resumes WHERE id = $1', [id]);

    res.status(200).json({ status: 'success', message: 'Resume deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResumes,
  uploadResume,
  deleteResume
};
