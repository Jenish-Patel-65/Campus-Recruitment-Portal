const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  require('fs').appendFileSync('debug_error.log', new Date().toISOString() + '\\n' + err.stack + '\\n\\n');
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
