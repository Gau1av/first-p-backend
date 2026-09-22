require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI or MONGO_URI is not configured in .env file');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:');
    console.error(error.message);
    process.exit(1); // Server ko band karne ke liye taaki crash na ho
  }
};

module.exports = connectDB;