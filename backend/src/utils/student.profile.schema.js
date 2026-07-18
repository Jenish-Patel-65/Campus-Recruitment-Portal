const { z } = require('zod');

// Schema for updating personal profile fields
// Name and Institute Email are excluded to prevent updates
// Academic fields are also excluded
const updatePersonalProfileSchema = z.object({
  phone_number: z.string().max(20).optional().nullable(),
  personal_email: z.string().email('Invalid email format').optional().nullable(),
  github_url: z.string().url('Invalid URL format').optional().nullable(),
  linkedin_url: z.string().url('Invalid URL format').optional().nullable(),
});

module.exports = {
  updatePersonalProfileSchema
};
