function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;

  // Auto-detect common user/client errors
  if (err.message && err.message.toLowerCase().includes('not found')) {
    status = 404;
  } else if (err.message && (err.message.includes('already exists') || err.message.includes('Invalid') || err.message.includes('required'))) {
    status = 400;
  }

  // Only log unexpected internal crashes (5xx), avoid cluttering console for normal 404/400 client actions
  if (status >= 500) {
    console.error('[Internal Server Error]', {
      message: err.message,
      path: req.originalUrl,
      method: req.method,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Uploaded file exceeds the maximum allowed size limit.'
    });
  }

  res.status(status).json({
    success: false,
    message: err.message || 'An internal server error occurred.'
  });
}

module.exports = errorHandler;

