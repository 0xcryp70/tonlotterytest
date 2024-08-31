import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './profile.scss';

export const Profile = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dailyReward, setDailyReward] = useState(null);
  const [telegramId, setTelegramId] = useState(null);
  const [telegramFirstName, setTelegramFirstName] = useState('');

  useEffect(() => {
    try {
      const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
      const id = initDataUnsafe?.user?.id;
      const firstName = initDataUnsafe?.user?.first_name;

      if (id) {
        setTelegramId(id);
        setTelegramFirstName(firstName);
        fetchUserProfile(id);
      } else {
        console.error('Telegram ID not found.');
      }
    } catch (error) {
      console.error('Error initializing Telegram data:', error);
    }
  }, []);

  const fetchUserProfile = async (id) => {
    try {
      const response = await axios.get(`https://api.tonlottery.info/user-profile?telegramId=${id}`);
      const { email, phone, dailyReward } = response.data;
      setEmail(email || '');
      setPhone(phone || '');
      setDailyReward(dailyReward);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://api.tonlottery.info/update-profile', {
        telegramId,
        email,
        phone
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const claimDailyReward = async () => {
    try {
      const response = await axios.post('https://api.tonlottery.info/claim-daily-reward', {
        telegramId
      });
      setDailyReward(response.data.reward);
      alert(`You've claimed your daily reward: ${response.data.reward}`);
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      alert('Failed to claim daily reward. Please try again later.');
    }
  };

  return (
    <div className="profile-container">
      <h1>Profile</h1>
      <p>Welcome, {telegramFirstName}!</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone:</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <button type="submit">Update Profile</button>
      </form>
      <div className="daily-reward">
        <h2>Daily Reward</h2>
        {dailyReward ? (
          <p>Your daily reward: {dailyReward}</p>
        ) : (
          <button onClick={claimDailyReward}>Claim Daily Reward</button>
        )}
      </div>
    </div>
  );
};