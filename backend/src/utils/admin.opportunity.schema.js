const { z } = require('zod');

// Schema for Opportunity
const opportunitySchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  opportunity_type: z.enum(['job', 'winter_internship', 'winter_internship_job', 'summer_internship']),
  location: z.string().min(1, 'Location is required'),
  package_stipend: z.string().min(1, 'Package/Stipend is required'),
  registration_start: z.string().datetime({ message: 'Valid ISO datetime required for registration_start' }),
  registration_end: z.string().datetime({ message: 'Valid ISO datetime required for registration_end' }),
  job_description: z.string().min(1, 'Job description is required'),
  
  min_cgpa: z.number().min(0).max(10).optional().nullable(),
  max_active_backlogs: z.number().int().min(0).optional().nullable(),
  min_tenth_percentage: z.number().min(0).max(100).optional().nullable(),
  min_twelfth_percentage: z.number().min(0).max(100).optional().nullable(),
  additional_eligibility_note: z.string().optional().nullable(),

  eligible_degrees: z.array(z.string()).min(1, 'At least one eligible degree is required')
}).superRefine((data, ctx) => {
  if (new Date(data.registration_end) <= new Date(data.registration_start)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Registration end time must be after start time',
      path: ['registration_end']
    });
  }
});

module.exports = {
  opportunitySchema
};
