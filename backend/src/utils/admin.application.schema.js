const { z } = require('zod');

const updateResultSchema = z.object({
  result: z.enum(['pending', 'selected', 'rejected'], {
    errorMap: () => ({ message: "Result must be one of: pending, selected, rejected" })
  })
});

module.exports = {
  updateResultSchema
};
