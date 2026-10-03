const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bricksoft';
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('👉 Hint: Ensure MongoDB service is running locally (e.g., mongod or MongoDB Compass) or update MONGO_URI in backend/.env with your MongoDB connection string (or MongoDB Atlas cluster URI).');
  }
};

module.exports = connectDB;
