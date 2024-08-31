import React, { useEffect, useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import WebApp from '@twa-dev/sdk';
import { getWalletBalance } from '../../api/ton';
import axios from 'axios';
import './BalanceDisplay.scss';
import diamondImage from '../../assets/images/diamond.png';
import platinumImage from '../../assets/images/platinum.png';
import goldImage from '../../assets/images/gold.png';
import silverImage from '../../assets/images/silver.png';
import bronzeImage from '../../assets/images/bronze.png';
import notVipImage from '../../assets/images/main.png';
import tonImage from '../../assets/images/ton.png';
import dailyRewardImage from '../../assets/images/daily-reward.png';

interface BalanceDisplayProps {
  walletAddress: string;
  memberLevel: string;
}

const vibrate = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'error' | 'warning' | 'success' = 'heavy'): void => {
  switch (style) {
    case 'light':
    case 'medium':
    case 'heavy':
    case 'rigid':
    case 'soft':
      WebApp.HapticFeedback.impactOccurred(style);
      break;
    case 'error':
    case 'warning':
    case 'success':
      WebApp.HapticFeedback.notificationOccurred(style);
      break;
  }
};

const SECONDS_IN_A_DAY = 86400;
const getRemainingTime = (endTime: number) => {
  const total = endTime - Math.floor(Date.now() / 1000);
  const seconds = total % 60;
  const minutes = Math.floor((total / 60) % 60);
  const hours = Math.floor((total / 3600) % 24);
  const days = Math.floor(total / SECONDS_IN_A_DAY);

  return { total, days, hours, minutes, seconds };
};
const targetTime = 1735679013; // New Year 2025 timestamp

const getStartOfWeekUTC = (date: Date) => {
  const start = new Date(date);
  const day = start.getUTCDay(); // Get the day of the week (0 for Sunday, 1 for Monday, etc.)
  const diff = day === 0 ? -6 : 1 - day; // Calculate the difference to the previous Monday
  start.setUTCDate(start.getUTCDate() + diff); // Adjust date to the previous Monday
  start.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00 UTC
  return start;
};

const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  start.setHours(0, 0, 0, 0);
  return start;
};

const isMonday = (date: Date) => date.getDay() === 1;

const getLastResetDate = () => {
  const lastReset = localStorage.getItem('lastResetDate');
  return lastReset ? new Date(lastReset) : null;
};

const setLastResetDate = (date: Date) => {
  localStorage.setItem('lastResetDate', date.toISOString());
};

const getRewardClaimedStatus = () => {
  const status = localStorage.getItem('rewardClaimed');
  return status === 'true';
};

const setRewardClaimedStatus = (status: boolean) => {
  localStorage.setItem('rewardClaimed', status.toString());
};

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ walletAddress, memberLevel }) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showMonthlyCountdown, setShowMonthlyCountdown] = useState(true);
  const [monthlyTime, setMonthlyTime] = useState(getRemainingTime(targetTime));
  const [threeMonthTime, setThreeMonthTime] = useState(getRemainingTime(targetTime));
  const [timeUp, setTimeUp] = useState(false);
  const [clickCount, setClickCount] = useState<number>(0);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(getRewardClaimedStatus());
  const [loading, setLoading] = useState<boolean>(false);
  const [showDailyReward, setShowDailyReward] = useState<boolean>(false);
  const [clickLocked, setClickLocked] = useState<boolean>(false);
  const [morseCode, setMorseCode] = useState<string>('');
  const [isDotOrLineVisible, setIsDotOrLineVisible] = useState<boolean>(false);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const userId = WebApp.initDataUnsafe?.user?.id; // Get telegramId from Telegram WebApp context

  const touchStartRef = useRef<number | null>(null);
  const morseCodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const coinImageRef = useRef<HTMLDivElement>(null);

  const resetMorseCode = () => {
    setMorseCode('');
    setIsDotOrLineVisible(false);
  };


 useEffect(() => {
  const today = new Date();
  const lastResetDate = getLastResetDate();
  const startOfWeekUTC = getStartOfWeekUTC(today);

  if (!lastResetDate || startOfWeekUTC > lastResetDate) {
    setRewardClaimed(false);
    setRewardClaimedStatus(false);
    setLastResetDate(startOfWeekUTC);
  }

  // Preload daily reward image
  const img = new Image();
  img.src = dailyRewardImage;

  const fetchBalance = async () => {
    const result = await getWalletBalance(walletAddress);
    if (typeof result === 'number') {
      setBalance(result + 30000);
      setError(null);
    } else {
      setBalance(30000);
      setError(null);
    }
  };

  fetchBalance();

  const intervalId = setInterval(fetchBalance, 60000);

  return () => clearInterval(intervalId);
 }, [walletAddress]);

  useEffect(() => {
    const updateCountdown = () => {
      const newMonthlyTime = getRemainingTime(targetTime);
      const newThreeMonthTime = getRemainingTime(targetTime);

      if (newMonthlyTime.total <= 0 || newThreeMonthTime.total <= 0) {
        setTimeUp(true);
        setTimeout(() => {
          setTimeUp(false);
          setMonthlyTime(getRemainingTime(targetTime + SECONDS_IN_A_DAY));
          setThreeMonthTime(getRemainingTime(targetTime + SECONDS_IN_A_DAY));
        }, SECONDS_IN_A_DAY * 1000); // Show "Time's up!" for one day
      } else {
        setMonthlyTime(newMonthlyTime);
        setThreeMonthTime(newThreeMonthTime);
      }
    };

    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  const handleCoinTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (clickLocked || !showDailyReward) return; // Only handle if daily reward is shown
    touchStartRef.current = Date.now();
    vibrate('rigid');
    const touch = e.touches[0];
    setTouchPosition({ x: touch.clientX - e.currentTarget.getBoundingClientRect().left, y: touch.clientY - e.currentTarget.getBoundingClientRect().top });

    if (morseCodeTimeoutRef.current) {
      clearTimeout(morseCodeTimeoutRef.current);
    }
  };

  const handleCoinTouchEnd = async (e: React.TouchEvent<HTMLDivElement>) => {
    if (clickLocked || touchStartRef.current === null || !showDailyReward) return;

    const touchDuration = Date.now() - touchStartRef.current;
    const morseSymbol = touchDuration < 300 ? '.' : '_';

    setMorseCode((prev) => prev + morseSymbol);
    setIsDotOrLineVisible(true);
    setTimeout(() => setIsDotOrLineVisible(false), 500);

    touchStartRef.current = null;

    morseCodeTimeoutRef.current = setTimeout(async () => {
      if (morseCode + morseSymbol === '....__') {
        setClickLocked(true);
        setLoading(true);

        try {
          const response = await axios.get('https://api.tonlottery.info/api/claimPrize', {
            params: {
              telegramId: userId,
              prizeAmount: 0.1,
            }
          });
          if (response.status === 200) {
            toast.success('Hi, you got 0.1 TON. Enjoy!');
            setRewardClaimed(true);
            setRewardClaimedStatus(true);
            setTimeout(() => {
              setShowDailyReward(false);
            }, 1000);
          } else {
            toast.error('Failed to claim reward. Please try again.');
          }
        } catch (error) {
          console.error('Error while claiming prize:', error);
          toast.error('Failed to claim reward. Please try again.');
        } finally {
          setLoading(false);
          setClickLocked(false);
        }
      } else {
        resetMorseCode();
        toast.error('Oops, wrong Morse code! Try again! ', {
	autoClose: 3900,});
      }
    }, 2000);
  };

  const handleCoinClick = async (e: React.TouchEvent<HTMLDivElement>) => {
    if (clickLocked) return; // Prevent click if locked

    if (rewardClaimed && clickCount >= 9) {
      toast.warning('You already got your weekly reward.', {
        autoClose: 3900,});
      setClickCount(0);
      return;
    }

    if (!showDailyReward) {
      setClickCount((prev) => prev + 1);
      vibrate('heavy'); // Trigger vibration feedback on click
      // Trigger shake effect
      e.currentTarget.classList.remove('shake');
      void e.currentTarget.offsetWidth; // Trigger reflow
      e.currentTarget.classList.add('shake');

      if (clickCount >= 9) {
        setClickLocked(true); // Lock click
        setShowDailyReward(true); // Show daily reward image
        setTimeout(() => {
          toast.info('Question: What is the smallest unit of Bitcoin called? Click the Morse code and get 0.1 TON'); // Show toast notification
          setClickLocked(false); // Unlock click after 1 second
        }, 1000); // 1 second delay
        setClickCount(0); // Reset click count

        // Trigger shake animation
        if (coinImageRef.current) {
          coinImageRef.current.classList.add('shake');
          setTimeout(() => {
            if (coinImageRef.current) {
              coinImageRef.current.classList.remove('shake');
            }
          }, 100); // Remove shake class after animation duration
        }
      }
    }
  };

  const getImageForRank = (rank: string) => {
    switch (rank) {
      case 'Diamond':
        return diamondImage;
      case 'Platinum':
        return platinumImage;
      case 'Gold':
        return goldImage;
      case 'Silver':
        return silverImage;
      case 'Bronze':
        return bronzeImage;
      default:
        return notVipImage;
    }
  };

  const renderCountdown = (time: ReturnType<typeof getRemainingTime>, label: string) => (
    <div>
      <h2>{label}</h2>
      {time.total <= 0 ? (
        <p>Time's up!</p>
      ) : (
        <p>
          {time.days}d {time.hours}h {time.minutes}m {time.seconds}s
        </p>
      )}
    </div>
  );

  const handleBalanceSectionClick = () => {
    if (!showCountdown) {
      setShowCountdown(true);
      setShowMonthlyCountdown(true);
    } else if (showMonthlyCountdown) {
      setShowMonthlyCountdown(false);
    } else {
      setShowCountdown(false);
    }
  };

  return (
    <div className="balance-display">
      {error && <div className="error">{error}</div>}
      {!error && (
        <div>
          <div className="balance-text" onClick={handleBalanceSectionClick}>
            {showCountdown ? (
              showMonthlyCountdown
                ? renderCountdown(monthlyTime, 'Monthly Prize')
                : renderCountdown(threeMonthTime, 'Full Prize')
            ) : (
              <p>
                BIG PRIZE : + 
                {balance !== null ?
                  <>
                    &nbsp;<span style={{ fontSize: '24px' }}>
                      {(balance).toFixed(1)}
                    </span>&nbsp;
                    <img src={tonImage} alt="TON COIN" style={{ width: '20px', height: '20px', verticalAlign: 'middle' }} />
                  </>
                : 'Loading...'}
              </p>
            )}
          </div>
          <div
            className={`coin-image ${clickCount >= 9 ? 'shake' : ''}`}
            onClick={handleCoinClick}
            onTouchStart={handleCoinTouchStart}
            onTouchEnd={handleCoinTouchEnd}
            ref={coinImageRef}
          >
            <img src={getImageForRank(memberLevel)} alt="Balance" />
            {loading && (
              <div className="loading-animation">
                Loading...
              </div>
            )}
            {showDailyReward && !rewardClaimed && (
              <img
                src={dailyRewardImage}
                alt="Daily Reward"
                className="daily-reward-image"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            )}
            {isDotOrLineVisible && showDailyReward && (
              <div
                className="morse-code-container"
                style={{ top: `${touchPosition.y}px`, left: `${touchPosition.x}px` }}
              >
                {morseCode.split('').map((char, index) => (
                  <span key={index} className={`morse-code ${char === '.' ? 'dot' : 'line'}`}>
                    {char}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="click-count">
            {clickCount}
          </div>
        </div>
      )}
      <ToastContainer position="top-center" theme="dark" autoClose={50000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

BalanceDisplay.preload = async (walletAddress: string) => {
  try {
    const result = await getWalletBalance(walletAddress);
    if (typeof result === 'number') {
      console.log('Preloaded balance:', result + 30000);
    } else {
      console.log('Preloaded balance with fallback value:', 30000);
    }

    // Preload daily reward image
    const img = new Image();
    img.src = dailyRewardImage;
    console.log('Preloaded daily reward image');
  } catch (error) {
    console.error('Error preloading BalanceDisplay component data:', error);
  }
};

export default BalanceDisplay;
