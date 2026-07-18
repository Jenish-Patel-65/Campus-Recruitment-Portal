const db = require('../db');

// Get Statistics
const getStatistics = async (req, res, next) => {
  try {
    const studentsResult = await db.query(`
      SELECT academic_year, count(*) as count 
      FROM students 
      GROUP BY academic_year
    `);

    const companiesResult = await db.query(`
      SELECT opportunity_type, count(DISTINCT company_name) as count 
      FROM opportunities
      GROUP BY opportunity_type
    `);

    const opportunitiesResult = await db.query(`
      SELECT opportunity_type, count(*) as count 
      FROM opportunities 
      GROUP BY opportunity_type
    `);

    const applicationsResult = await db.query(`
      SELECT o.opportunity_type, count(a.id) as count 
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      GROUP BY o.opportunity_type
    `);

    const selectionsResult = await db.query(`
      SELECT o.opportunity_type, count(a.id) as count 
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      WHERE a.result = 'selected'
      GROUP BY o.opportunity_type
    `);

    let preFinalYearStudents = 0;
    let finalYearStudents = 0;
    studentsResult.rows.forEach(row => {
      if (row.academic_year === 'pre_final_year') preFinalYearStudents = parseInt(row.count, 10);
      if (row.academic_year === 'final_year') finalYearStudents = parseInt(row.count, 10);
    });

    const aggregateOpps = (rows) => {
      let preFinal = 0;
      let final = 0;
      rows.forEach(row => {
        if (row.opportunity_type === 'summer_internship') preFinal += parseInt(row.count, 10);
        else final += parseInt(row.count, 10);
      });
      return { preFinal, final };
    };

    const companies = aggregateOpps(companiesResult.rows);
    const opps = aggregateOpps(opportunitiesResult.rows);
    const apps = aggregateOpps(applicationsResult.rows);
    const selections = aggregateOpps(selectionsResult.rows);

    const statistics = {
      preFinalYearStudents,
      finalYearStudents,
      preFinalYearCompanies: companies.preFinal,
      finalYearCompanies: companies.final,
      preFinalYearOpportunities: opps.preFinal,
      finalYearOpportunities: opps.final,
      preFinalYearApplications: apps.preFinal,
      finalYearApplications: apps.final,
      preFinalYearSelections: selections.preFinal,
      finalYearSelections: selections.final
    };

    res.status(200).json({ status: 'success', data: statistics });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatistics
};
