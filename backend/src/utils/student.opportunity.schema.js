const { z } = require('zod');

const applyOpportunitySchema = z.object({
  resume_id: z.string().uuid('Valid Resume ID is required')
});

module.exports = {
  applyOpportunitySchema
};
