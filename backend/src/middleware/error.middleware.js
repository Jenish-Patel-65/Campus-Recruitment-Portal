const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (process.env.NODE_ENV !== 'production') {
    require('fs').appendFileSync('debug_error.log', new Date().toISOString() + '\n' + err.stack + '\n\n');
  }
  
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  } else if (err.code === '23505') {
    statusCode = 409;
    if (err.constraint === 'uq_students_student_id') {
      message = 'Student ID already exists';
    } else if (err.constraint === 'uq_applications_student_opportunity') {
      message = 'You have already applied for this opportunity';
    } else if (err.constraint === 'users_email_key') {
      message = 'Email already exists';
    } else {
      message = 'Duplicate entry';
    }
  }

  res.status(statusCode).json({
    status: 'error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
