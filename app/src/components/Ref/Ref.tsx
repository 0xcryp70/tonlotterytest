import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Ref.scss';
import inviteimg from '../../assets/images/inviteimg.png';

const Ref: React.FC = () => {
  const [referralLink, setReferralLink] = useState<string>('');
  const [activeReferredUsers, setActiveReferredUsers] = useState<any[]>([]);
  const [referralTicketsNumbersBought, setReferralTicketsNumbersBought] = useState<number[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to the top of the page when the component mounts
    fetchReferralUsers();
  }, []);

const generateReferralLink = async () => {
    try {
      const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
      const telegramId = initDataUnsafe?.user?.id;
      if (telegramId) {
        const link = `https://t.me/lotterytoncoin_bot?start=${telegramId}`;
        setReferralLink(link);

        // Description text for sharing
        const description = `🎉 Welcome to the Ultimate Lottery Experience! 🎉

Ready to win big? Our lottery bot lets you buy tickets with TON and enter for a chance to win fantastic prizes! 💰

🌟 Highlights:
- Huge Prizes: Life-changing jackpots up for grabs!
- Monthly Draws: Big prizes every month!
- Weekly Prizes: More chances to win, every single week!
- And More!: Stay tuned for special events and surprise rewards!

Don't miss out on your chance to strike it rich! Join now and let the excitement begin! 🚀

Your referral link: ${link}`;

        // Create a URL for sharing the referral link on Telegram
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(description)}`;

        // Open the share URL
        window.open(shareUrl, '_blank');
      } else {
        console.error('Telegram ID not found.');
      }
    } catch (error) {
      console.error('Error generating referral link:', error);
    }
  };

  const fetchReferralUsers = async () => {
    try {
      const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
      const telegramId = initDataUnsafe?.user?.id;
      if (telegramId) {
        const response = await axios.get(`https://api.tonlottery.info/api/getReferralUsers`, { params: { telegramId } });
        setActiveReferredUsers(response.data.activeReferredUsers);
        setReferralTicketsNumbersBought(response.data.referralTicketsNumbersBought);
      }
    } catch (error) {
      console.error('Error fetching referral users:', error);
    }
  };

  return (
    <div className="ref-page">
        <img src={inviteimg} alt="Ref" className="ref-image" />
      <div>
      <p>Here is how it works: Whenever a friend you referred becomes active, you will earn 0.12 TON coin. Additionally, if they win a prize, you earn 10% of their winnings! It’s that simple and rewarding.</p>
      </div>
      <h2>Referral Generator</h2>
      <button className="go-back-button" onClick={generateReferralLink}>Generate Referral Link</button>
      {referralLink && (
        <div>
          <p>Your referral link: <a href={referralLink}>{referralLink}</a></p>
        </div>
      )}
      <div className="referral-info">
        <h2>Active Referred Users:</h2>
        {activeReferredUsers.length > 0 ? (
          activeReferredUsers.map(user => (
            <div key={user.telegramId} className="referral-user">
              <h3>{user.telegramUsername}</h3>
              <p>Tickets Bought by Referral:</p>
              <ul>
                {user.allTickets.map((ticketNumber: number) => (
                  <li key={ticketNumber}>{ticketNumber}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p>No active referrals.</p>
        )}
{/*        <Link to="/">
          <button className="go-back-button">Go Back to Main Page</button>
        </Link>   */}
      </div>
    </div>
  );
};

Ref.preload = async () => {
  try {
    const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
    const telegramId = initDataUnsafe?.user?.id;
    if (telegramId) {
      await axios.get(`https://api.tonlottery.info/api/getReferralUsers`, { params: { telegramId } });
      console.log('Preloaded referral users data');
    }

    const img = new Image();
    img.src = inviteimg;
    console.log('Preloaded tickets image');

  } catch (error) {
    console.error('Error preloading Ref component data:', error);
  }
};

export default Ref;
