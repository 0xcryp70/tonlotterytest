import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TonConnectButton } from "@tonconnect/ui-react";
import axios from 'axios';
import './header.scss';
import rankImage from '../../assets/images/rank.png';
import userImage from '../../assets/images/user.png';

export const Header = ({ memberLevel }) => {
  const [telegramId, setTelegramId] = useState(null);
  const [telegramFirstName, setTelegramFirstName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    try {
      const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
      const id = initDataUnsafe?.user?.id;
      const firstName = initDataUnsafe?.user?.first_name;

      if (id) {
        setTelegramId(id);
        setTelegramFirstName(firstName);
        checkIfUserIsBanned(id);
      } else {
        console.error('Telegram ID not found.');
        redirectToOtherPage();
      }
    } catch (error) {
      console.error('Error initializing Telegram data:', error);
      redirectToOtherPage();
    }
  }, []);

  const checkIfUserIsBanned = async (id) => {
    try {
      const response = await axios.get(`https://api.tonlottery.info/check-banned?telegramId=${id}`);
      if (response.data.banned) {
        redirectToBannedPage();
      }
    } catch (error) {
      console.error('Error checking if the user is banned:', error);
    }
  };

  const redirectToBannedPage = () => {
    window.location.href = 'https://tonlottery.info/banned';
  };

  const redirectToOtherPage = () => {
    window.location.href = 'https://tonlottery.info/';
  };

  return (
    <header>
      <div className="connect-button">
        <TonConnectButton />
      </div>
      <div className="member-info" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        {telegramFirstName && (
          <span className="username">
            <img src={userImage} alt="User" className="user-image" />
            {telegramFirstName}
          </span>
        )}
        <span className="rank-info">
          <img src={rankImage} alt="Rank" className="rank-image" />
          {memberLevel}
        </span>
        {isDropdownOpen && (
          <div className="dropdown-menu">
            <ul>
              <li>
                <Link to="#">Profile (Available Soon)</Link>
              </li>
              <li>
                <Link to="#">Settings (Available Soon)</Link>
              </li>
              <li>
                <Link to="#">User Scoreboard ( Available Soon ) </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

