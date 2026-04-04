import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fearfree';
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};
