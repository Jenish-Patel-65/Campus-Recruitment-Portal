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
    const result = await db.query(`
      SELECT 
        id, company_name, role, opportunity_type, location, 
        package_stipend, registration_start, registration_end, created_at
      FROM opportunities
      ORDER BY created_at DESC
    `);

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

    const oppResult = await db.query('SELECT * FROM opportunities WHERE id = $1', [id]);
    
    if (oppResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found' });
    }
    const opportunity = oppResult.rows[0];



    const degreeResult = await db.query('SELECT degree FROM opportunity_eligible_degrees WHERE opportunity_id = $1', [id]);
    opportunity.eligible_degrees = degreeResult.rows.map(r => r.degree);

    opportunity.status = deriveStatus(opportunity.registration_start, opportunity.registration_end);

    res.status(200).json({ status: 'success', data: opportunity });
  } catch (error) {
    next(error);
  }
};

// Create Opportunity
const createOpportunity = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const {
      company_name, role, opportunity_type, location, package_stipend, 
      registration_start, registration_end, job_description,
      min_cgpa, max_active_backlogs, min_tenth_percentage, 
      min_twelfth_percentage, additional_eligibility_note,
      eligible_degrees
    } = req.body;

    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO opportunities (
        company_name, role, opportunity_type, location, package_stipend, 
        registration_start, registration_end, job_description,
        min_cgpa, max_active_backlogs, min_tenth_percentage, 
        min_twelfth_percentage, additional_eligibility_note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;
    const insertValues = [
      company_name, role, opportunity_type, location, package_stipend, 
      registration_start, registration_end, job_description,
      min_cgpa || null, max_active_backlogs || 0, min_tenth_percentage || null, 
      min_twelfth_percentage || null, additional_eligibility_note || null
    ];

    const result = await client.query(insertQuery, insertValues);
    const opportunityId = result.rows[0].id;



    if (eligible_degrees && eligible_degrees.length > 0) {
      for (const degree of eligible_degrees) {
        await client.query(
          'INSERT INTO opportunity_eligible_degrees (opportunity_id, degree) VALUES ($1, $2)',
          [opportunityId, degree]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ status: 'success', message: 'Opportunity created successfully', data: { id: opportunityId } });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// Update Opportunity
const updateOpportunity = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { 
      company_name, role, opportunity_type, location, package_stipend, 
      registration_start, registration_end, job_description,
      min_cgpa, max_active_backlogs, min_tenth_percentage, 
      min_twelfth_percentage, additional_eligibility_note,
      eligible_degrees
    } = req.body;

    await client.query('BEGIN');

    const checkResult = await client.query('SELECT id FROM opportunities WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Opportunity not found' });
    }

    const updateQuery = `
      UPDATE opportunities SET
        company_name = $1, role = $2, opportunity_type = $3, location = $4, package_stipend = $5, 
        registration_start = $6, registration_end = $7, job_description = $8,
        min_cgpa = $9, max_active_backlogs = $10, min_tenth_percentage = $11, 
        min_twelfth_percentage = $12, additional_eligibility_note = $13,
        updated_at = now()
      WHERE id = $14
    `;
    const updateValues = [
      company_name, role, opportunity_type, location, package_stipend, 
      registration_start, registration_end, job_description,
      min_cgpa || null, max_active_backlogs || 0, min_tenth_percentage || null, 
      min_twelfth_percentage || null, additional_eligibility_note || null,
      id
    ];

    await client.query(updateQuery, updateValues);


    await client.query('DELETE FROM opportunity_eligible_degrees WHERE opportunity_id = $1', [id]);



    if (eligible_degrees && eligible_degrees.length > 0) {
      for (const degree of eligible_degrees) {
        await client.query(
          'INSERT INTO opportunity_eligible_degrees (opportunity_id, degree) VALUES ($1, $2)',
          [id, degree]
        );
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ status: 'success', message: 'Opportunity updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// Delete Opportunity
const deleteOpportunity = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const checkResult = await client.query('SELECT id FROM opportunities WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Opportunity not found' });
    }


    await client.query('DELETE FROM opportunity_eligible_degrees WHERE opportunity_id = $1', [id]);
    
    await client.query('DELETE FROM opportunities WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.status(200).json({ status: 'success', message: 'Opportunity deleted successfully' });
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
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
};
