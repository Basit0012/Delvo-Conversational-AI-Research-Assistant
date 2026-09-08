import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  const mongoURI = uri || process.env.MONGO_URI || 'mongodb://localhost:27017/delvo';
  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    throw error;
  }
};
