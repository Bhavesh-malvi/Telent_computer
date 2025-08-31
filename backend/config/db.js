import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    // Support both MONGO_URL and MONGODB_URI for compatibility
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    
    if (!mongoUrl) {
      throw new Error('MongoDB connection URL not found in environment variables (MONGO_URL or MONGODB_URI)');
    }

    const conn = await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    // Handle connection errors after initial connection
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      name: err.name
    });
    
    // Retry connection after 5 seconds
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

export default connectDB; 