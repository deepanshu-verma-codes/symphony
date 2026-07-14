import connectDB from './config/db.js';
import User from './models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fix() {
  await connectDB();
  try {
    await User.collection.dropIndex('username_1');
    console.log('Index dropped successfully');
  } catch (err) {
    console.log('Error dropping index:', err.message);
  }
  process.exit();
}
fix();
