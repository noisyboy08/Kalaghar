const mongoose = require('mongoose');
const logger = require('./logger');

async function connectDB() {
  const userName = process.env.DB_USERNAME;
  const password = encodeURIComponent(process.env.DB_PASSWORD || '');
  const dbHost = process.env.DB_HOST || 'cluster0.fkliyeh.mongodb.net';

  let primaryURI = process.env.MONGODB_URI;
  if (!primaryURI && userName && password && userName !== 'admin' && userName !== 'your_atlas_db_username') {
    primaryURI = `mongodb+srv://${userName}:${password}@${dbHost}/kalaghar?retryWrites=true&w=majority`;
  }

  const localURI = 'mongodb://127.0.0.1:27017/kalaghar';

  // 1. Try primary cloud Atlas connection if configured
  if (primaryURI) {
    try {
      await mongoose.connect(primaryURI);
      logger.info('MongoDB connected to Cloud Atlas database');
      return;
    } catch (err) {
      logger.warn(`Cloud MongoDB connection failed (${err.message}). Trying local MongoDB...`);
    }
  }

  // 2. Try local mongod service if running
  try {
    await mongoose.connect(localURI, { serverSelectionTimeoutMS: 2000 });
    logger.info('MongoDB connected to local MongoDB service (port 27017)');
    return;
  } catch (err) {
    logger.warn('Local MongoDB service not running. Starting in-memory local MongoDB server...');
  }

  // 3. Fallback to MongoMemoryServer for 100% offline local execution
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memoryURI = mongod.getUri();
    await mongoose.connect(memoryURI);
    logger.info(`MongoDB connected to In-Memory Local Database: ${memoryURI}`);

    // Auto-seed in-memory database with test accounts & products
    try {
      const seedFunc = require('../seed');
      if (typeof seedFunc === 'function') {
        await seedFunc({ skipDisconnect: true });
        logger.info('In-Memory Local Database auto-seeded successfully!');
      }
    } catch (seedErr) {
      logger.warn(`Auto-seeding in-memory DB skipped: ${seedErr.message}`);
    }
  } catch (memErr) {
    logger.error('Failed to start in-memory MongoDB server', { error: memErr.message });
  }
}

module.exports = connectDB;
