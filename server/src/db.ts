import mongoose from 'mongoose';

export async function connectDb(url: string): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(url, { serverSelectionTimeoutMS: 10_000 });
  await mongoose.connection.syncIndexes();
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
