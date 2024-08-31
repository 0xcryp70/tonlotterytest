import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WebApp from '@twa-dev/sdk';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import userImage from '../../assets/images/pro.png';
import './Pro.scss';

const Pro: React.FC = () => {
  const [amount, setAmount] = useState<string>('0');
  const [balance, setBalance] = useState<number>(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<number>(0);
  const [claimedBalance, setClaimedBalance] = useState<number>(0);

  const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
  const userId = initDataUnsafe?.user?.id;
  const firstName = initDataUnsafe?.user?.first_name;
  const lastName = initDataUnsafe?.user?.last_name;
  const userFullName = `${firstName} ${lastName || ''}`.trim();
  const userPhotoUrl = initDataUnsafe?.user?.photo_url;  // Assuming `photo_url` is provided directly

  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    fetchUserBalance();
    if (userAddress) {
      storeWalletAddress(userAddress);
    }

    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => {
      window.history.back();
    });

    return () => {
      WebApp.BackButton.hide();
    };
  }, [userAddress]);

  const fetchUserBalance = async () => {
    try {
      const { data } = await axios.get(`https://api.yourbackend.com/api/getUserBalance?userId=${userId}`);
      setBalance(data.balance ?? 0);
      setPendingWithdrawals(data.pendingWithdrawals ?? 0);
      setClaimedBalance(data.claimedBalance ?? 0);
    } catch (error) {
      console.error('Error fetching user balance:', error);
      // toast.error('Error fetching user balance');
      setBalance(0);
      setPendingWithdrawals(0);
      setClaimedBalance(0);
    }
  };

  const storeWalletAddress = async (address: string) => {
    try {
      await axios.post(`https://api.yourbackend.com/api/storeWalletAddress`, {
        userId,
        walletAddress: encodeURIComponent(address)
      });
      console.log('Wallet address stored successfully');
    } catch (error) {
      console.error('Error storing wallet address:', error);
     //  toast.error('Error storing wallet address');
    }
  };

  return (
    <div className="profile-container">
      <div className="header">
        <img src={userImage} alt={userFullName || 'User'} className="profile-avatar" />
        <h1 className="username">{userFullName || 'Telegram User'}</h1>
        <div className="balance-info">$647.23</div>
      </div>
      <div className="actions">
        <button className="action-button">Send</button>
        <button className="action-button">Deposit</button>
        <button className="action-button">Swap</button>
      </div>
      <div className="tokens-section">
        <div className="token">
          <span className="token-name">Toncoin</span>
          <span className="token-balance">1.564612011 TON</span>
          <span className="token-usd">$8.25</span>
        </div>
        <div className="token">
          <span className="token-name">Tether USD</span>
          <span className="token-balance">0.0001 USDT</span>
          <span className="token-usd">$0.00</span>
        </div>
      </div>
      <div className="earn-section">
        <div className="earn">
          <span className="earn-label">Staked</span>
          <span className="earn-balance">120.789856823 TON</span>
          <span className="earn-apy">2.54% APY</span>
          <span className="earn-usd">$638.97</span>
        </div>
      </div>
    </div>
  );
};

export default Pro;

