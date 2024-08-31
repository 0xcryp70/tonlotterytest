import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WebApp from '@twa-dev/sdk';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css'; // Import react-toastify styles
import './Withdrawal.scss';

const Withdrawal: React.FC = () => {
  const [amount, setAmount] = useState<string>('0');
  const [balance, setBalance] = useState<number>(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<number>(0);
  const [claimedBalance, setClaimedBalance] = useState<number>(0);
  const UserId = WebApp.initDataUnsafe?.user?.id;
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    fetchUserBalance();
    if (userAddress) {
      storeWalletAddress(userAddress);
    }
    
    // Enable the native Telegram back button
    WebApp.BackButton.show();

    // Handle the back button click event
    WebApp.BackButton.onClick(() => {
      window.history.back(); // Navigate to the previous page
    });

    // Cleanup: Hide back button when component unmounts
    return () => {
      WebApp.BackButton.hide();
    };
  }, [userAddress]);

  const fetchUserBalance = async () => {
    try {
      const { data } = await axios.get(`https://api2.tonlottery.info/api/getUserBalance?telegramId=${UserId}`);
      setBalance(data.balance ?? 0);
      setPendingWithdrawals(data.pendingWithdrawals ?? 0);
      setClaimedBalance(data.claimedBalance ?? 0); // Set the claimed balance
    } catch (error) {
      console.error('Error fetching user balance:', error);
     // toast.error('Error fetching user balance'); // Optionally add a toast for this error
      setBalance(0);
      setPendingWithdrawals(0);
      setClaimedBalance(0); // Handle error case for claimed balance
    }
  };

  const storeWalletAddress = async (address: string) => {
    try {
      await axios.get(`https://api2.tonlottery.info/api/storeWalletAddress?telegramId=${UserId}&walletAddress=${encodeURIComponent(address)}`);
      console.log('Wallet address stored successfully');
    //  toast.success('Wallet address stored successfully'); // Optionally add a success toast
    } catch (error) {
      console.error('Error storing wallet address:', error);
    //  toast.error('Error storing wallet address'); // Optionally add an error toast
    }
  };

  const handleWithdrawal = async () => {
    if (!userAddress) {
      toast.warning('Please connect your wallet first'); // Use toast.warning instead of alert
      return;
    }
    try {
      const withdrawalAmount = parseFloat(amount);
      const response = await axios.get(`https://api2.tonlottery.info/api/withdraw?telegramId=${UserId}&amount=${withdrawalAmount}&walletAddress=${encodeURIComponent(userAddress)}`);
      if (response.data.success) {
        toast.success('Withdrawal request submitted successfully!'); // Use toast.success instead of alert
        setAmount('0');
        fetchUserBalance();
      } else {
        toast.error('Withdrawal request failed. Please try again.'); // Use toast.error instead of alert
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('An error occurred. Please try again later.'); // Use toast.error instead of alert
    }
  };

  const availableBalance = balance - pendingWithdrawals;
  const isAmountValid = parseFloat(amount) >= 1 && parseFloat(amount) <= availableBalance;

  return (
    <div className="withdrawal-container">
      <div className="wallet-info">
        <div className="wallet-address">
          <span className="warning-icon">⚠️</span>
          {userAddress ? (
            <span>Send TON to {userAddress.slice(0, 4)}...{userAddress.slice(-4)}</span>
          ) : (
            <span>Please connect your wallet</span>
          )}
          <span className="copy-icon" onClick={() => navigator.clipboard.writeText(userAddress || '')}></span>
        </div>
        <div className="balance-display">
        <div className="balance-item">
          <span className="balance-label">Available:</span>
          <span className="balance-value">{availableBalance.toFixed(2)} TON</span>
        </div>
        {pendingWithdrawals > 0 && (
          <div className="balance-item">
            <span className="balance-label">Pending:</span>
            <span className="balance-value">{pendingWithdrawals.toFixed(2)} TON</span>
          </div>
        )}
        {claimedBalance > 0 && (
          <div className="balance-item">
            <span className="balance-label">Claimed:</span>
            <span className="balance-value">{claimedBalance.toFixed(2)} TON</span>
          </div>
        )}
      </div>
      </div>
      <div className="amount-input">
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
        />
        <span className="currency">TON</span>
      </div>
      <div className="info-box">
        <div className="info-item">
          <span>Min withdrawal</span>
          <span>1 TON</span>
        </div>
        <div className="info-item">
          <span>Gas fee</span>
          <span>0.1 TON</span>
        </div>
      </div>
      <div className="info-box">
        <div className="info-item">
          <span>Withdrawal processing</span>
          <span>up to 10 days</span>
        </div>
      </div>
      <button 
        className={`submit-button ${!isAmountValid || !userAddress ? 'disabled' : ''}`}
        onClick={handleWithdrawal}
        disabled={!isAmountValid || !userAddress}
      >
        {!userAddress ? 'Connect Wallet' : 
         !isAmountValid ? 'Not enough for withdrawal' : 
         'Submit Withdrawal'}
      </button>

      {/* Add ToastContainer */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default Withdrawal;
