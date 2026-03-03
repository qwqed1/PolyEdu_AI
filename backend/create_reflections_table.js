import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import pool from './src/config/db.js';

async function run() {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS student_reflections (id SERIAL PRIMARY KEY, student_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, lesson_topic VARCHAR(255) NOT NULL, reflection_text TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW());');
    console.log('Done creating table');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
