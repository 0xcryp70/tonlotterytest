import { query } from '../database';
import { User } from '../types';

export const saveReferralCode = async (telegramId: number, referralCode: string) => {
  await query('INSERT INTO users (telegram_id, referral_code) VALUES ($1, $2)', [telegramId, referralCode]);
};

export const getReferrerId = async (referralCode: string): Promise<number | null> => {
  const res = await query('SELECT telegram_id FROM users WHERE referral_code = $1', [referralCode]);
  return res.rows.length ? res.rows[0].telegram_id : null;
};

export const saveReferral = async (refereeId: number, referrerId: number) => {
  await query('INSERT INTO referrals (referrer_id, referee_id) VALUES ($1, $2)', [referrerId, refereeId]);
};

export const rewardReferrer = async (referrerId: number) => {
  await query('UPDATE users SET referral_count = referral_count + 1 WHERE telegram_id = $1', [referrerId]);
};

