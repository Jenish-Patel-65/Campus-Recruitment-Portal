const db = require('../db');

// Helper to determine status based on start/end dates
const deriveStatus = (start, end) => {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (now < startDate) return 'Upcoming';
  if (now >= startDate && now <= endDate) return 'Open';
  return 'Closed';
};

// Get Opportunities
const getOpportunities = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const studentResult = await db.query('SELECT id, degree, academic_year FROM students WHERE user_id = $1', [userId]);
    if (studentResult.rows.length === 0) {
      return res.status(200).json({ status: 'success', data: [] });
    }
    const student = studentResult.rows[0];

    const query = `
      SELECT o.id, o.company_name, o.role, o.opportunity_type, o.location, 
             o.package_stipend, o.registration_start, o.registration_end, o.created_at
      FROM opportunities o
      INNER JOIN opportunity_eligible_degrees od ON o.id = od.opportunity_id
      WHERE od.degree = $1
        AND (
          ($2 = 'pre_final_year' AND o.opportunity_type = 'summer_internship')
          OR
          ($2 = 'final_year' AND o.opportunity_type IN ('job', 'winter_internship', 'winter_internship_job'))
        )
      ORDER BY o.created_at DESC
    `;
    
    const result = await db.query(query, [student.degree, student.academic_year]);

    const opportunities = result.rows.map(opp => ({
      ...opp,
      status: deriveStatus(opp.registration_start, opp.registration_end)
    }));

    res.status(200).json({ status: 'success', data: opportunities });
  } catch (error) {
    next(error);
  }
};

// Get Opportunity by ID
const getOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const studentResult = await db.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student profile not found' });
    }
    const student = studentResult.rows[0];

    const oppResult = await db.query('SELECT * FROM opportunities WHERE id = $1', [id]);
    if (oppResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found' });
    }
    const opportunity = oppResult.rows[0];

    const degreeCheck = await db.query('SELECT 1 FROM opportunity_eligible_degrees WHERE opportunity_id = $1 AND degree = $2', [id, student.degree]);
    
    if (degreeCheck.rows.length === 0) {
      return res.status(403).json({ status: 'error', message: 'You are not eligible for this opportunity (Degree mismatch)' });
    }

    if (student.academic_year === 'pre_final_year' && opportunity.opportunity_type !== 'summer_internship') {
      return res.status(403).json({ status: 'error', message: 'You are not eligible for this opportunity (Academic Year mismatch)' });
    }
    if (student.academic_year === 'final_year' && !['job', 'winter_internship', 'winter_internship_job'].includes(opportunity.opportunity_type)) {
      return res.status(403).json({ status: 'error', message: 'You are not eligible for this opportunity (Academic Year mismatch)' });
    }

    let isEligible = true;
    if (opportunity.min_cgpa && parseFloat(student.cgpa) < parseFloat(opportunity.min_cgpa)) isEligible = false;
    if (opportunity.max_active_backlogs !== null && student.active_backlogs > opportunity.max_active_backlogs) isEligible = false;
    if (opportunity.min_tenth_percentage && parseFloat(student.tenth_percentage) < parseFloat(opportunity.min_tenth_percentage)) isEligible = false;
    if (opportunity.min_twelfth_percentage && parseFloat(student.twelfth_percentage) < parseFloat(opportunity.min_twelfth_percentage)) isEligible = false;

    const appliedCheck = await db.query('SELECT 1 FROM applications WHERE student_id = $1 AND opportunity_id = $2', [student.id, id]);
    const alreadyApplied = appliedCheck.rows.length > 0;

    opportunity.status = deriveStatus(opportunity.registration_start, opportunity.registration_end);
    opportunity.isEligible = isEligible;
    opportunity.alreadyApplied = alreadyApplied;

    res.status(200).json({ status: 'success', data: opportunity });
  } catch (error) {
    next(error);
  }
};

// Apply To Opportunity
const applyToOpportunity = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { resume_id } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN'); // Start transaction for race-condition safety

    const studentResult = await client.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    if (studentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Student profile not found' });
    }
    const student = studentResult.rows[0];

    const oppResult = await client.query('SELECT * FROM opportunities WHERE id = $1 FOR SHARE', [id]);
    if (oppResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Opportunity not found' });
    }
    const opportunity = oppResult.rows[0];

    const status = deriveStatus(opportunity.registration_start, opportunity.registration_end);
    if (status !== 'Open') {
      await client.query('ROLLBACK');
      return res.status(400).json({ status: 'error', message: `Registration is ${status.toLowerCase()}` });
    }

    const degreeCheck = await client.query('SELECT 1 FROM opportunity_eligible_degrees WHERE opportunity_id = $1 AND degree = $2', [id, student.degree]);
    
    if (degreeCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ status: 'error', message: 'Not eligible (Degree criteria mismatch)' });
    }

    if (student.academic_year === 'pre_final_year' && opportunity.opportunity_type !== 'summer_internship') {
      await client.query('ROLLBACK');
      return res.status(403).json({ status: 'error', message: 'Not eligible (Academic Year mismatch)' });
    }
    if (student.academic_year === 'final_year' && !['job', 'winter_internship', 'winter_internship_job'].includes(opportunity.opportunity_type)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ status: 'error', message: 'Not eligible (Academic Year mismatch)' });
    }

    if (opportunity.min_cgpa && parseFloat(student.cgpa) < parseFloat(opportunity.min_cgpa)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ status: 'error', message: 'Not eligible (CGPA requirement)' });
    }
    if (opportunity.max_active_backlogs !== null && student.active_backlogs > opportunity.max_active_backlogs) {
      await client.query('ROLLBACK');
      return res.status(403).json({ status: 'error', message: 'Not eligible (Backlogs limit exceeded)' });
    }
    if (opportunity.min_tenth_percentage && parseFloat(student.tenth_percentage) < parseFloat(opportunity.min_tenth_percentage)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ status: 'error', message: 'Not eligible (10th percentage requirement)' });
    }
    if (opportunity.min_twelfth_percentage && parseFloat(student.twelfth_percentage) < parseFloat(opportunity.min_twelfth_percentage)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ status: 'error', message: 'Not eligible (12th percentage requirement)' });
    }

    const resumeCheck = await client.query('SELECT 1 FROM resumes WHERE id = $1 AND student_id = $2', [resume_id, student.id]);
    if (resumeCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ status: 'error', message: 'Invalid resume selection' });
    }

    const appliedCheck = await client.query('SELECT 1 FROM applications WHERE student_id = $1 AND opportunity_id = $2', [student.id, id]);
    if (appliedCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ status: 'error', message: 'You have already applied to this opportunity' });
    }

    const insertQuery = `
      INSERT INTO applications (student_id, opportunity_id, resume_id, result)
      VALUES ($1, $2, $3, 'pending')
      RETURNING id
    `;
    await client.query(insertQuery, [student.id, id, resume_id]);

    await client.query('COMMIT');
    res.status(201).json({ status: 'success', message: 'Application submitted successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  getOpportunities,
  getOpportunityById,
  applyToOpportunity
};
