const { z } = require('zod');

const uploadResumeSchema = z.object({
  resume_name: z.string().min(1, 'Resume name is required').max(100, 'Resume name is too long')
});

module.exports = {
  uploadResumeSchema
};
