const { z } = require('zod');

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
  BREVO_API_KEY: z.string().optional(),
  BREVO_FROM_EMAIL: z.string().email('BREVO_FROM_EMAIL must be a valid email address').default('noreply@yourdomain.com'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

const validateEnv = () => {
  try {
    const parsedEnv = envSchema.parse(process.env);

    // Attach validated env variables back to process.env
    for (const key in parsedEnv) {
      if (parsedEnv[key] !== undefined) {
        process.env[key] = parsedEnv[key];
      }
    }

    console.log('Environment variables validated successfully.');
  } catch (error) {
    console.error('Invalid environment variables:');
    console.error(JSON.stringify(error.format(), null, 2));
    process.exit(1); // Crash the app if env vars are invalid
  }
};

module.exports = validateEnv;
