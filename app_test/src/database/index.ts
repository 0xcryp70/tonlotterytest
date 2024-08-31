import { Pool } from 'pg';

const pool = new Pool({
  user: 'ton',
  host: 'localhost',
  database: 'mydb',
  password: 'B14ckc0d3r',
  port: 5432,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

// Create tables if they don't exist
export const initDB = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id BIGINT UNIQUE NOT NULL,
      referral_code UUID UNIQUE NOT NULL,
      referral_count INT DEFAULT 0
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS referrals (
      id SERIAL PRIMARY KEY,
      referrer_id BIGINT NOT NULL,
      referee_id BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

initDB().catch(console.error);

