const db = require('../db');
const csv = require('csv-parser');
const stream = require('stream');

const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination.util');

// Fetch all students with their linked user email
const getStudents = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const search = req.query.search || '';

    let countQuery = 'SELECT count(*) FROM students';
    let countParams = [];
    let dataQuery = `
      SELECT s.*, u.email as institute_email 
      FROM students s 
      JOIN users u ON s.user_id = u.id 
    `;
    let dataParams = [limit, offset];

    if (search) {
      countQuery += ' WHERE student_id ILIKE $1';
      countParams.push(`%${search}%`);
      dataQuery += ' WHERE s.student_id ILIKE $3';
      dataParams.push(`%${search}%`);
    }

    dataQuery += ' ORDER BY s.student_id ASC, s.id ASC LIMIT $1 OFFSET $2';

    const countResult = await db.query(countQuery, countParams);
    const totalRecords = countResult.rows[0].count;

    const result = await db.query(dataQuery, dataParams);
    
    res.status(200).json(formatPaginatedResponse(result.rows, totalRecords, page, limit));
  } catch (error) {
    next(error);
  }
};

// Fetch a single student by ID
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT s.*, u.email as institute_email 
      FROM students s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Add Student
const addStudent = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const {
      institute_email, personal_email, name, student_id, degree, branch, academic_year,
      cgpa, tenth_percentage, twelfth_percentage, active_backlogs
    } = req.body;

    await client.query('BEGIN');

    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [institute_email]);
    if (userCheck.rows.length > 0) {
      throw new Error('User with this institute email already exists');
    }

    const userResult = await client.query(`
      INSERT INTO users (email, role) 
      VALUES ($1, 'student') 
      RETURNING id
    `, [institute_email]);
    const userId = userResult.rows[0].id;

    const studentResult = await client.query(`
      INSERT INTO students (
        user_id, name, student_id, personal_email, degree, branch, academic_year,
        cgpa, tenth_percentage, twelfth_percentage, active_backlogs
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      userId, name, student_id, personal_email || null, degree, branch, academic_year,
      cgpa || null, tenth_percentage || null, twelfth_percentage || null, active_backlogs || 0
    ]);

    await client.query('COMMIT');
    res.status(201).json({ status: 'success', data: studentResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505' && error.constraint === 'uq_students_student_id') {
      return res.status(400).json({ status: 'error', message: 'Student with this student ID already exists' });
    }
    res.status(400).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
};

// Update Student
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, student_id, personal_email, degree, branch, academic_year,
      cgpa, tenth_percentage, twelfth_percentage, active_backlogs
    } = req.body;

    const result = await db.query(`
      UPDATE students 
      SET name = $1, student_id = $2, personal_email = $3, degree = $4, branch = $5, academic_year = $6,
          cgpa = $7, tenth_percentage = $8, twelfth_percentage = $9, active_backlogs = $10,
          updated_at = now()
      WHERE id = $11
      RETURNING *
    `, [
      name, student_id, personal_email || null, degree, branch, academic_year,
      cgpa || null, tenth_percentage || null, twelfth_percentage || null, active_backlogs || 0,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'uq_students_student_id') {
      return res.status(400).json({ status: 'error', message: 'Student with this student ID already exists' });
    }
    next(error);
  }
};

// Delete Student
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const studentCheck = await db.query('SELECT user_id FROM students WHERE id = $1', [id]);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    const userId = studentCheck.rows[0].user_id;

    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    res.status(200).json({ status: 'success', message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const { addStudentSchema } = require('../utils/admin.student.schema');

const getCsvTemplate = (req, res) => {
  const headers = Object.keys(addStudentSchema.shape).join(',') + '\n';

  const sampleData = {
    institute_email: 'student@institute.edu',
    personal_email: 'student@gmail.com',
    name: 'John Doe',
    student_id: '2024001',
    degree: 'B.Tech',
    branch: 'CSE',
    academic_year: 'final_year',
    cgpa: '8.5',
    tenth_percentage: '90.0',
    twelfth_percentage: '85.5',
    active_backlogs: '0'
  };

  const sampleRow = Object.keys(addStudentSchema.shape)
    .map(key => sampleData[key] || '')
    .join(',') + '\n';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.csv');
  res.status(200).send(headers + sampleRow);
};

// Import Students CSV
const importStudentsCSV = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }

  const results = [];
  const errors = [];
  let rowCount = 0;

  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  bufferStream
    .pipe(csv())
    .on('data', (data) => {
      rowCount++;
      results.push({ row: rowCount, data });
    })
    .on('end', async () => {
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        
        let inserted = 0;
        let updated = 0;

        for (const item of results) {
          const { row, data } = item;
          
          const studentData = {
            institute_email: data.institute_email?.trim(),
            personal_email: data.personal_email?.trim() || null,
            student_id: data.student_id?.trim(),
            name: data.name?.trim(),
            degree: data.degree?.trim(),
            branch: data.branch?.trim(),
            academic_year: data.academic_year?.trim(),
            cgpa: data.cgpa ? parseFloat(data.cgpa) : null,
            tenth_percentage: data.tenth_percentage ? parseFloat(data.tenth_percentage) : null,
            twelfth_percentage: data.twelfth_percentage ? parseFloat(data.twelfth_percentage) : null,
            active_backlogs: data.active_backlogs ? parseInt(data.active_backlogs, 10) : 0
          };

          const validationResult = addStudentSchema.safeParse(studentData);
          if (!validationResult.success) {
            const errors = validationResult.error.issues.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
            throw new Error(`Row ${row}: ${errors}`);
          }

          const {
            institute_email, personal_email, student_id, name, degree, branch,
            academic_year, cgpa, tenth_percentage: tenth, twelfth_percentage: twelfth,
            active_backlogs: backlogs
          } = studentData;

          const existCheck = await client.query(`
            SELECT s.id, u.id as user_id 
            FROM students s 
            JOIN users u ON s.user_id = u.id 
            WHERE u.email = $1 OR s.student_id = $2
          `, [institute_email, student_id]);

          if (existCheck.rows.length > 0) {
            const studentId = existCheck.rows[0].id;
            await client.query(`
              UPDATE students 
              SET name = $1, degree = $2, branch = $3, academic_year = $4,
                  cgpa = $5, tenth_percentage = $6, twelfth_percentage = $7, active_backlogs = $8,
                  personal_email = $9,
                  updated_at = now()
              WHERE id = $10
            `, [
              name, degree, branch, academic_year,
              cgpa, tenth, twelfth, backlogs, personal_email, studentId
            ]);
            updated++;
          } else {
            const userResult = await client.query(`
              INSERT INTO users (email, role) 
              VALUES ($1, 'student') 
              RETURNING id
            `, [institute_email]);

            await client.query(`
              INSERT INTO students (
                user_id, name, student_id, personal_email, degree, branch, academic_year,
                cgpa, tenth_percentage, twelfth_percentage, active_backlogs
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
              userResult.rows[0].id, name, student_id, personal_email, degree, branch, academic_year,
              cgpa, tenth, twelfth, backlogs
            ]);
            inserted++;
          }
        }

        await client.query('COMMIT');
        res.status(200).json({
          status: 'success',
          message: `CSV Import completed: ${inserted} inserted, ${updated} updated.`,
        });
      } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({
          status: 'error',
          message: err.message
        });
      } finally {
        client.release();
      }
    });
};

module.exports = {
  getStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  getCsvTemplate,
  importStudentsCSV
};
