const app = require('./app');
const { testConnection } = require('./config/db');
const campaignRepository = require('./repositories/campaignRepository');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('🚀 Starting HR Bulk Email Sender Portal Server...');
  console.log('----------------------------------------------------');

  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('❌ Database connection failed. Please ensure MySQL is running in XAMPP on port 3306.');
  }

  // Stale jobs recovery after server restart
  try {
    await campaignRepository.recoverStaleJobs();
  } catch (err) {
    console.warn('[Server Startup] Warning during queue recovery:', err.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`✅ Backend API Server running successfully on http://localhost:${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log('----------------------------------------------------');
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\nGracefully shutting down server...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();

