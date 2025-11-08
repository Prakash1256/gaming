const mongoose = require('mongoose');
const logger = require('../utils/logger');


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("Connected to Database");
    console.log('MongoDB connected');
  } catch (err) {
    logger.error("something went wrong while connecting to db", err)
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
