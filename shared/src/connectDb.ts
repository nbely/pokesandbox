import { connect } from 'mongoose';

export async function connectDb() {
  try {
    await connect(process.env.DATABASE_URI || '');
    console.info('Connected to MongoDB with Mongoose');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
