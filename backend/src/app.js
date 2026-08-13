const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error.middleware');

// Routes
const healthRoutes = require('./routes/health.route');
const authRoutes = require('./routes/auth.route');
const adminStudentRoutes = require('./routes/admin.student.route');
const studentProfileRoutes = require('./routes/student.profile.route');
const studentResumeRoutes = require('./routes/student.resume.route');
const studentOpportunityRoutes = require('./routes/student.opportunity.route');
const studentApplicationRoutes = require('./routes/student.application.route');
const adminOpportunityRoutes = require('./routes/admin.opportunity.route');
const adminApplicationRoutes = require('./routes/admin.application.route');
const adminStatisticsRoutes = require('./routes/admin.statistics.route');

const app = express();

app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Standard HTTP security headers
const allowedOrigins = process.env.FRONTEND_URL
  ? ['http://localhost:5173', process.env.FRONTEND_URL]
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  exposedHeaders: ['Content-Disposition'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Basic request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin/students', adminStudentRoutes);
app.use('/api/admin/opportunities', adminOpportunityRoutes);
app.use('/api/admin/opportunities', adminApplicationRoutes);
app.use('/api/admin/statistics', adminStatisticsRoutes);
app.use('/api/student/profile', studentProfileRoutes);
app.use('/api/student/resumes', studentResumeRoutes);
app.use('/api/student/opportunities', studentOpportunityRoutes);
app.use('/api/student/applications', studentApplicationRoutes);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
