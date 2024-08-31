import { Telegraf, Context } from 'telegraf';
import { v4 as uuidv4 } from 'uuid';

const token = 'YOUR_BOT_TOKEN'; // Replace with your actual bot token
const bot = new Telegraf(token);

interface Referrals {
  [key: string]: string[];
}

const referrals: Referrals = {};

bot.start((ctx: Context) => {
  const referrerId = ctx.message?.text?.split(' ')[1];
  const referredId = ctx.from?.id.toString();

  if (referrerId && referrerId !== referredId) {
    if (!referrals[referrerId]) {
      referrals[referrerId] = [];
    }
    referrals[referrerId].push(referredId);
    ctx.reply(`Thanks for joining via referral! You were referred by user ${referrerId}.`);
  } else {
    ctx.reply('Welcome to the referral bot!');
  }
});

bot.command('referrals', (ctx: Context) => {
  const userId = ctx.from?.id.toString();
  const userReferrals = referrals[userId] || [];
  ctx.reply(`You have referred: ${userReferrals.length} users.`);
});

bot.command('referral_link', (ctx: Context) => {
  const userId = ctx.from?.id.toString();
  const referralCode = uuidv4();
  ctx.reply(`Your referral link: https://t.me/your_bot_username?start=${referralCode}`);
});

bot.launch();

console.log('Bot is running...');

