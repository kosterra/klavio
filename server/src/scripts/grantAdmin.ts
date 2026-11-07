/**
 * Grant (or revoke) the global admin role.
 *   npm run admin:grant -- <userId|email>
 *   npm run admin:grant -- <userId|email> --revoke
 * The user id is shown in the app under "Konto".
 */
import { isValidObjectId } from 'mongoose';
import { User } from '../models/index.js';
import { connectDb, disconnectDb } from '../db.js';

const [target, flag] = process.argv.slice(2);
if (!target) {
  console.error('Usage: admin:grant <userId|email> [--revoke]');
  process.exit(1);
}
await connectDb(process.env.MONGO_URL ?? 'mongodb://localhost:27017/klavio');
const filter = isValidObjectId(target) ? { _id: target } : { email: target.toLowerCase() };
const role = flag === '--revoke' ? 'user' : 'admin';
const user = await User.findOneAndUpdate(filter, { role }, { returnDocument: 'after' });
if (!user) {
  console.error(`No user found for "${target}"`);
  process.exitCode = 1;
} else {
  console.log(`${user.displayName} (${user._id.toString()}) is now "${role}".`);
}
await disconnectDb();
