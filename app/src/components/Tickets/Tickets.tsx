import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Tickets.scss';
import ticketsimg from '../../assets/images/ticketsimg.png'; // Make sure to replace this path with the actual path to your image

interface PreloadedData {
  balance?: number;
  activeReferrals?: number[];
  ticketNumbers?: number[];
}

const Tickets: React.FC = () => {
  const navigate = useNavigate();
  const [ticketNumbers, setTicketNumbers] = useState<number[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [canClaimPrize, setCanClaimPrize] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const UserId = WebApp.initDataUnsafe?.user?.id; // Get telegramId from Telegram WebApp context

  const fetchUserBalance = async () => {
    try {
      const { data } = await axios.get(`https://api.tonlottery.info/api/getUserBalance?telegramId=${UserId}`);
      const balance = data.balance ?? 0; // Default to 0 if data.balance is undefined or null
      setBalance(balance);
      setCanClaimPrize(balance > 1);
    } catch (error) {
      console.error('Error fetching user balance:', error);
      setBalance(0); // Set default balance to 0 on error
      setCanClaimPrize(false);
    } finally {
      setLoading(false); // Set loading to false after the fetch is complete
    }
  };

  const fetchActiveReferrals = async () => {
    try {
      const { data } = await axios.get(`https://api.tonlottery.info/api/getReferralUsers?telegramId=${UserId}`);
      const activeReferrals = data.activeReferredUsers;
      return activeReferrals;
    } catch (error) {
      console.error('Error fetching active referrals:', error);
      return [];
    }
  };

  const updateBalanceWithReferrals = async () => {
    try {
        const response = await axios.get('https://api.tonlottery.info/api/claimPrizeRef', {
            params: {
                telegramId: UserId
            }
        });

        if (response.data.success) {
            fetchUserBalance();  // Refresh the balance after claiming the prize
        } else {
    //        console.error('Failed to update balance with referrals:', response.data.message);
        }
    } catch (error) {
//        console.error('Error updating balance with referrals:', error);
    }
  };  

  const handleClaimPrize = async () => {
    if (canClaimPrize) {
      try {
        const response = await axios.get('https://api.tonlottery.info/api/claimPrize', {
          params: {
            telegramId: UserId,
            prizeAmount: 1
          }
        });
        const result = response.data;
        if (result.success) {
          alert('Prize claimed successfully!');
          fetchUserBalance(); // Refresh the balance after claiming the prize
        } else {
          alert('Failed to claim prize.');
        }
      } catch (error) {
        console.error('Error claiming prize:', error);
      }
    } else {
      alert('You need more than 1 TON to claim the prize.');
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const initializeComponent = async () => {
      let preloadedData: PreloadedData = {};

      if (typeof Tickets.preload === 'function') {
        preloadedData = await Tickets.preload() || {};
      }
      
      if (preloadedData.balance !== undefined) {
        setBalance(preloadedData.balance);
        setCanClaimPrize(preloadedData.balance > 1);
        setLoading(false);
      } else {
        await fetchUserBalance();
      }

      if (preloadedData.ticketNumbers) {
        setTicketNumbers(preloadedData.ticketNumbers);
      } else {
        const storedTickets = localStorage.getItem('ticketNumbers');
        if (storedTickets) {
          setTicketNumbers(JSON.parse(storedTickets));
        }
      }
      
      await updateBalanceWithReferrals();
    };

    initializeComponent();
  }, []);

  return (
    <div className="ticket-form">
      <div className="balance-section">
        <img src={ticketsimg} alt="Tickets" className="send-transaction-image" />
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <h4>
              <span className="reward-text">Balance : </span>
              <span className="balance"> {balance} TON</span>
            </h4>
            <h5>Claim your rewards when your balance reaches 1 TON or more. Enjoy your weekly rewards and buy tickets to enhance your chances of winning even more TON coin!</h5>
            <button 
              onClick={() => navigate('/withdrawal')} 
            //  disabled={!canClaimPrize}
            >
              Withdrawal
            </button>
          </>
        )}
      </div>
      <div className="ticketnumbers">
        {ticketNumbers.length > 0 ? (
          <div>
            <h4>Your Purchased Ticket Numbers:</h4>
            <ul className="ticketlist">
              {ticketNumbers.map((number, index) => (
                <li key={index}>Ticket {index + 1}: {number}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No tickets purchased yet</p>
        )}
      </div>
    </div>
  );
};

Tickets.preload = async () => {
  try {
    const UserId = WebApp.initDataUnsafe?.user?.id;
    if (UserId) {
      // Preload user balance
      const balanceResponse = await axios.get(`https://api.tonlottery.info/api/getUserBalance?telegramId=${UserId}`);
      console.log('Preloaded user balance:', balanceResponse.data.balance);

      // Preload active referrals
      const referralsResponse = await axios.get(`https://api.tonlottery.info/api/getReferralUsers?telegramId=${UserId}`);
      console.log('Preloaded active referrals:', referralsResponse.data.activeReferredUsers);

      // Optionally, preload ticket numbers if they are not already in localStorage
      const storedTickets = localStorage.getItem('ticketNumbers');
      if (!storedTickets) {
        console.log('No ticket numbers found in localStorage, you might want to preload them here.');
      }

      const img = new Image();
      img.src = ticketsimg;
      console.log('Preloaded tickets image');
      
    }
  } catch (error) {
    console.error('Error preloading Tickets component data:', error);
  }
};

export default Tickets;

