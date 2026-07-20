import mongoose from 'mongoose';

export let isDemoMode = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/disasterguard';
  
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000 // Quick timeout to fall back to Demo Mode
    });
    console.log('🌐 MongoDB Database Connected successfully.');
  } catch (error: any) {
    isDemoMode = true;
    console.warn('⚠️  MongoDB Connection Failed:', error.message);
    console.warn('⚡ DisasterGuard AI is now running in DEMO MODE (In-memory storage & Mock Data).');
  }
};
