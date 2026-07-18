const { z } = require('zod');

const studentSchemaBase = {
  name: z.string().min(1, 'Name is required'),
  student_id: z.string().min(1, 'Student ID is required'),
  personal_email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
  degree: z.string().min(1, 'Degree is required'),
  branch: z.string().min(1, 'Branch is required'),
  academic_year: z.enum(['pre_final_year', 'final_year'], {
    required_error: 'Academic year is required',
    invalid_type_error: 'Academic year must be either pre_final_year or final_year'
  }),
  cgpa: z.number().min(0).max(10).optional().nullable(),
  tenth_percentage: z.number().min(0).max(100).optional().nullable(),
  twelfth_percentage: z.number().min(0).max(100).optional().nullable(),
  active_backlogs: z.number().int().min(0).optional().nullable(),
};

const addStudentSchema = z.object({
  institute_email: z.string().email('Invalid email format'),
  ...studentSchemaBase
});

const updateStudentSchema = z.object(studentSchemaBase);

module.exports = {
  studentSchemaBase,
  addStudentSchema,
  updateStudentSchema
};
