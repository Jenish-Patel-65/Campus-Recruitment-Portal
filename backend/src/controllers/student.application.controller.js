const db = require('../db');
const supabase = require('../config/supabase');

// Get My Applications
const getMyApplications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const studentResult = await db.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    if (studentResult.rows.length === 0) {
      return res.status(200).json({ status: 'success', data: [] });
    }
    const student = studentResult.rows[0];

    const query = `
      SELECT 
        o.id,
        o.company_name,
        o.role,
        o.opportunity_type,
        o.location,
        o.package_stipend,
        o.registration_start,
        o.registration_end,
        o.min_cgpa,
        o.max_active_backlogs,
        o.min_tenth_percentage,
        o.min_twelfth_percentage,
        o.additional_eligibility_note,
        o.job_description,
        a.id AS application_id,
        a.result,
        a.applied_at,
        r.id AS resume_id,
        r.resume_name,
        r.file_url AS resume_url
      FROM opportunities o
      INNER JOIN opportunity_eligible_degrees od ON o.id = od.opportunity_id
      LEFT JOIN applications a ON o.id = a.opportunity_id AND a.student_id = $1
      LEFT JOIN resumes r ON a.resume_id = r.id
      WHERE od.degree = $2 
        AND (
          ($3 = 'pre_final_year' AND o.opportunity_type = 'summer_internship')
          OR
          ($3 = 'final_year' AND o.opportunity_type IN ('job', 'winter_internship', 'winter_internship_job'))
        )
      ORDER BY o.registration_end DESC
    `;

    const result = await db.query(query, [student.id, student.degree, student.academic_year]);

    const opportunities = result.rows.map(opp => {
      const parseVal = (val) => val === null || val === undefined ? null : parseFloat(val);
      const isEligible = 
        (opp.min_cgpa === null || parseVal(student.cgpa) >= parseVal(opp.min_cgpa)) &&
        (opp.max_active_backlogs === null || parseInt(student.active_backlogs || 0) <= parseInt(opp.max_active_backlogs)) &&
        (opp.min_tenth_percentage === null || parseVal(student.tenth_percentage) >= parseVal(opp.min_tenth_percentage)) &&
        (opp.min_twelfth_percentage === null || parseVal(student.twelfth_percentage) >= parseVal(opp.min_twelfth_percentage));

      return {
        ...opp,
        isEligible: isEligible,
        hasApplied: opp.application_id !== null
      };
    });

    const filteredOpportunities = opportunities.filter(opp => {
      if (opp.hasApplied) return true; // Show immediately if applied
      if (!opp.isEligible) return true; // Show immediately if not eligible
      
      return new Date(opp.registration_end) < new Date();
    });

    res.status(200).json({ status: 'success', data: filteredOpportunities });
  } catch (error) {
    next(error);
  }
};

// Get Past Opportunity Details
const getPastOpportunityDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const studentResult = await db.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student profile not found' });
    }
    const student = studentResult.rows[0];

    const query = `
      SELECT 
        o.*,
        a.id AS application_id,
        a.result,
        a.applied_at,
        r.id AS resume_id,
        r.resume_name,
        r.file_url AS resume_url
      FROM opportunities o
      INNER JOIN opportunity_eligible_degrees od ON o.id = od.opportunity_id
      LEFT JOIN applications a ON o.id = a.opportunity_id AND a.student_id = $1
      LEFT JOIN resumes r ON a.resume_id = r.id
      WHERE o.id = $4 
        AND od.degree = $2 
        AND (
          ($3 = 'pre_final_year' AND o.opportunity_type = 'summer_internship')
          OR
          ($3 = 'final_year' AND o.opportunity_type IN ('job', 'winter_internship', 'winter_internship_job'))
        )
    `;

    const result = await db.query(query, [student.id, student.degree, student.academic_year, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found or not eligible' });
    }

    const opp = result.rows[0];

    if (opp.resume_url) {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(opp.resume_url, 3600); // 1 hour expiry
        
      if (!error && data) {
        opp.resume_signed_url = data.signedUrl;
      }
    }

    const parseVal = (val) => val === null || val === undefined ? null : parseFloat(val);
    
    opp.isEligible = 
      (opp.min_cgpa === null || parseVal(student.cgpa) >= parseVal(opp.min_cgpa)) &&
      (opp.max_active_backlogs === null || parseInt(student.active_backlogs || 0) <= parseInt(opp.max_active_backlogs)) &&
      (opp.min_tenth_percentage === null || parseVal(student.tenth_percentage) >= parseVal(opp.min_tenth_percentage)) &&
      (opp.min_twelfth_percentage === null || parseVal(student.twelfth_percentage) >= parseVal(opp.min_twelfth_percentage));
    
    opp.hasApplied = opp.application_id !== null;

    res.status(200).json({ status: 'success', data: opp });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyApplications,
  getPastOpportunityDetails
};
