const db = require('../db');
const supabase = require('../config/supabase');

// Check Health
const checkHealth = async (req, res, next) => {
  try {
    const dbResult = await db.query('SELECT 1 AS ok');
    const dbStatus = dbResult.rows[0].ok === 1 ? 'connected' : 'error';

    const { data: storageData, error: storageError } = await supabase.storage.listBuckets();
    const storageStatus = !storageError && storageData ? 'connected' : 'error';

    res.status(200).json({
      status: 'success',
      message: 'Backend is running correctly',
      services: {
        database: dbStatus,
        storage: storageStatus,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkHealth,
};
