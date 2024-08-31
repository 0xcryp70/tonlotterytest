export interface User {
  telegram_id: number;
  referral_code: string;
  referral_count: number;
}

export interface Referral {
  referrer_id: number;
  referee_id: number;
  created_at?: string;
}

