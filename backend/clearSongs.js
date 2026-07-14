import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spotify');
    
    // Drop the entire collection to guarantee 100% deletion of every song
    await mongoose.connection.db.dropCollection('songs');
    
    console.log('SUCCESS: Every single song has been wiped from the database.');
  } catch (err) {
    if (err.code === 26) {
      console.log('Database was already empty.');
    } else {
      console.error(err);
    }
  }
  process.exit(0);
};

run();
