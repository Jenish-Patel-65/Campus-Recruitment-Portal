const { z } = require('zod');

const updatePersonalProfileSchema = z.object({
  phone_number: z.string().max(20).optional().nullable(),
  personal_email: z.string().email('Invalid email format').or(z.literal('')).optional().nullable(),
  github_url: z.string().url('Invalid URL format').or(z.literal('')).optional().nullable(),
  linkedin_url: z.string().url('Invalid URL format').or(z.literal('')).optional().nullable(),
});

module.exports = {
  updatePersonalProfileSchema
};
