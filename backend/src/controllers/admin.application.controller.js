const db = require('../db');
const archiver = require('archiver');

// Get Applicants
const getApplicants = async (req, res, next) => {
  try {
    const { id } = req.params;

    const oppCheck = await db.query('SELECT 1 FROM opportunities WHERE id = $1', [id]);
    if (oppCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found' });
    }

    const query = `
      SELECT 
        a.id AS application_id, 
        a.result, 
        a.applied_at,
        s.name, 
        u.email AS institute_email, 
        s.personal_email, 
        s.phone_number,
        s.profile_photo_url,
        s.student_id, 
        s.degree, 
        s.branch, 
        s.academic_year, 
        s.cgpa, 
        s.active_backlogs,
        s.tenth_percentage,
        s.twelfth_percentage,
        r.resume_name,
        r.file_url AS resume_url
      FROM applications a
      INNER JOIN students s ON a.student_id = s.id
      INNER JOIN users u ON s.user_id = u.id
      LEFT JOIN resumes r ON a.resume_id = r.id
      WHERE a.opportunity_id = $1
      ORDER BY a.applied_at DESC
    `;
    
    const result = await db.query(query, [id]);

    const supabase = require('../config/supabase');
    
    const applicants = await Promise.all(result.rows.map(async (app) => {
      if (app.profile_photo_url) {
        try {
          const { data } = await supabase.storage
            .from('profile-photos')
            .createSignedUrl(app.profile_photo_url, 3600);
          if (data && data.signedUrl) {
            app.profile_photo_url = data.signedUrl;
          }
        } catch (err) {
          console.error('Error signing photo URL:', err);
        }
      }
      return app;
    }));

    res.status(200).json({ status: 'success', data: applicants });
  } catch (error) {
    next(error);
  }
};

// Update Application Result
const updateApplicationResult = async (req, res, next) => {
  try {
    const { id, applicationId } = req.params;
    const { result } = req.body;

    const appCheck = await db.query('SELECT 1 FROM applications WHERE id = $1 AND opportunity_id = $2', [applicationId, id]);
    if (appCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Application not found for this opportunity' });
    }

    const updateQuery = `
      UPDATE applications
      SET result = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    await db.query(updateQuery, [result, applicationId]);

    res.status(200).json({ status: 'success', message: 'Application result updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Get Applicant Resume View
const getApplicantResumeView = async (req, res, next) => {
  try {
    const { id, applicationId } = req.params;
    const supabase = require('../config/supabase');

    const appQuery = `
      SELECT r.file_url 
      FROM applications a
      INNER JOIN resumes r ON a.resume_id = r.id
      WHERE a.id = $1 AND a.opportunity_id = $2
    `;
    const appResult = await db.query(appQuery, [applicationId, id]);
    
    if (appResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Application or resume not found' });
    }

    const fileUrl = appResult.rows[0].file_url;
    if (!fileUrl) {
      return res.status(404).json({ status: 'error', message: 'Resume file path not found' });
    }

    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(fileUrl, 3600); // 1 hour expiry

    if (error || !data) {
      return res.status(500).json({ status: 'error', message: 'Failed to generate signed URL' });
    }

    res.status(200).json({ status: 'success', data: { signedUrl: data.signedUrl } });
  } catch (error) {
    next(error);
  }
};

const escapeCSV = (str) => {
  if (str === null || str === undefined) return '';
  const stringified = String(str);
  if (/[",\n\r]/.test(stringified)) {
    return `"${stringified.replace(/"/g, '""')}"`;
  }
  return stringified;
};

// Export Applicants CSV
const exportApplicantsCSV = async (req, res, next) => {
  try {
    const { id } = req.params;

    const oppCheck = await db.query('SELECT company_name, role FROM opportunities WHERE id = $1', [id]);
    if (oppCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found' });
    }
    const opp = oppCheck.rows[0];

    const query = `
      SELECT 
        s.name, 
        s.student_id,
        u.email AS institute_email, 
        s.personal_email,
        s.phone_number,
        s.degree, 
        s.branch, 
        s.academic_year, 
        s.cgpa, 
        s.active_backlogs,
        s.tenth_percentage,
        s.twelfth_percentage
      FROM applications a
      INNER JOIN students s ON a.student_id = s.id
      INNER JOIN users u ON s.user_id = u.id
      WHERE a.opportunity_id = $1
      ORDER BY a.applied_at ASC
    `;
    
    const result = await db.query(query, [id]);

    const headers = [
      'Student ID', 'Name', 'Institute Email', 'Alternate Email', 'Phone Number', 
      'Degree', 'Branch', 'Academic Year', 'CGPA', 'Active Backlogs', 
      '10th Percentage', '12th Percentage'
    ];
    
    let csvContent = headers.map(escapeCSV).join(',') + '\r\n';

    result.rows.forEach(row => {
      const rowData = [
        row.student_id,
        row.name,
        row.institute_email,
        row.personal_email,
        row.phone_number,
        row.degree,
        row.branch,
        row.academic_year,
        row.cgpa,
        row.active_backlogs,
        row.tenth_percentage,
        row.twelfth_percentage
      ];
      csvContent += rowData.map(escapeCSV).join(',') + '\r\n';
    });

    const safeFilename = `${opp.company_name}-${opp.role}-Applicants`.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-') + '.csv';
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.status(200).send(csvContent);

  } catch (error) {
    next(error);
  }
};

// Export Applicant Resumes Zip
const exportApplicantResumesZip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const oppCheck = await db.query('SELECT company_name, role FROM opportunities WHERE id = $1', [id]);
    if (oppCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found' });
    }
    const opp = oppCheck.rows[0];

    const query = `
      SELECT s.student_id, s.name, r.file_url 
      FROM applications a
      INNER JOIN students s ON a.student_id = s.id
      INNER JOIN resumes r ON a.resume_id = r.id
      WHERE a.opportunity_id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No applicants found' });
    }

    const supabase = require('../config/supabase');
    const safeFilename = `${opp.company_name}-${opp.role}-Resumes`.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-') + '.zip';
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    const archive = new archiver.ZipArchive({ zlib: { level: 5 } });
    
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) res.status(500).json({ status: 'error', message: 'Failed to create zip file' });
    });

    archive.pipe(res);

    for (const app of result.rows) {
      if (!app.file_url) continue;
      
      try {
        const { data, error } = await supabase.storage.from('resumes').download(app.file_url);
        if (data) {
          const buffer = await data.arrayBuffer();
          const ext = app.file_url.split('.').pop();
          const identifier = app.student_id || app.name.replace(/\s+/g, '_');
          archive.append(Buffer.from(buffer), { name: `${identifier}.${ext}` });
        } else if (error) {
          console.error(`Error downloading resume for ${app.student_id}:`, error);
        }
      } catch (err) {
        console.error(`Exception downloading resume for ${app.student_id}:`, err);
      }
    }

    await archive.finalize();

  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      console.error('Error after headers sent:', error);
    }
  }
};

module.exports = {
  getApplicants,
  updateApplicationResult,
  exportApplicantsCSV,
  getApplicantResumeView,
  exportApplicantResumesZip
};
