import React, { useState, useEffect } from 'react';
import './App.css'; // Make sure this path is correct

const tg = window.Telegram.WebApp;

function App() {
  const [telegramId, setTelegramId] = useState(null);
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    console.log("App component is mounting...");

    tg.ready();
    tg.expand();
    tg.setHeaderColor('#5E97F6');

    const user = tg.initDataUnsafe.user;
    if (user) {
      setTelegramId(user.id);
    }
  }, []);

  return (
    <div className="App">
      <h1>GPS Step Counter</h1>
      <p>Telegram ID: {telegramId || 'Not available'}</p>
      <p>Steps: {steps}</p>
      <p>Distance: {distance.toFixed(2)} meters</p>
      
      <button onClick={() => setIsTracking(!isTracking)}>
        {isTracking ? 'Stop Tracking' : 'Start Tracking'}
      </button>
    </div>
  );
}

export default App;
