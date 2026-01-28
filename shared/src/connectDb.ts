import { connect } from 'mongoose';

const cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectDb() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = connect(process.env.DATABASE_URI || '').then(
      (mongoose) => {
        return mongoose;
      }
    );
  }

  try {
    cached.conn = await cached.promise;
    (global as any).mongoose = cached;
    console.info('Connected to MongoDB with Mongoose');
  } catch (error) {
    cached.promise = null;
    // Only exit if we are NOT in a Next.js/Browser environment
    console.error('Mongoose connection error:', error);
    if (process.env.APP_TYPE === 'bot') {
      process.exit(1);
    }
    throw new Error('Database connection failed');
  }

  return cached.conn;
}
