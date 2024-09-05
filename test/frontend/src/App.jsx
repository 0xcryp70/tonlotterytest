import React, { useState, useEffect } from 'react';
import './App.css';  // Assuming the CSS file is named 'App.css'

// Import Telegram WebApp
const tg = window.Telegram.WebApp;

function App() {
  const [telegramId, setTelegramId] = useState(null);
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [lastPosition, setLastPosition] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [distance, setDistance] = useState(0);

  // Constants
  const STEP_LENGTH = 0.7; // Average step length in meters
  const MIN_ACCURACY = 20; // Minimum GPS accuracy in meters

  useEffect(() => {
    // Initialize Telegram mini app
    tg.ready();
    tg.expand();

    // Set the app header color
    tg.setHeaderColor('#5E97F6');

    // Get Telegram user ID
    const user = tg.initDataUnsafe.user;
    if (user) {
      setTelegramId(user.id);
    }
  }, []);

  const startTracking = () => {
    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      });
      setWatchId(id);
      setIsTracking(true);
      tg.showPopup({
        title: 'Tracking Started',
        message: 'GPS-based step counting has begun.',
        buttons: [{ type: 'ok' }]
      });
    } else {
      tg.showPopup({
        title: 'Error',
        message: 'Geolocation is not supported by this device.',
        buttons: [{ type: 'ok' }]
      });
    }
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    tg.showPopup({
      title: 'Tracking Stopped',
      message: `You've taken approximately ${steps} steps over ${distance.toFixed(2)} meters.`,
      buttons: [{ type: 'ok' }]
    });
  };

  const handlePosition = (position) => {
    if (lastPosition === null) {
      setLastPosition(position);
      return;
    }

    const accuracy = position.coords.accuracy;
    if (accuracy > MIN_ACCURACY) {
      console.log(`Low accuracy (${accuracy}m), skipping this reading.`);
      return;
    }

    const newDistance = calculateDistance(
      lastPosition.coords.latitude,
      lastPosition.coords.longitude,
      position.coords.latitude,
      position.coords.longitude
    );

    const newSteps = Math.floor(newDistance / STEP_LENGTH);
    setSteps((prevSteps) => prevSteps + newSteps);
    setDistance((prevDistance) => prevDistance + newDistance);
    setLastPosition(position);
  };

  const handleError = (error) => {
    console.error('GPS Error:', error);
    tg.showPopup({
      title: 'Error',
      message: 'Error tracking steps. Please check your GPS settings.',
      buttons: [{ type: 'ok' }]
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const resetCounting = () => {
    setSteps(0);
    setDistance(0);
    setLastPosition(null);
    tg.showPopup({
      title: 'Reset',
      message: 'Step count and distance have been reset to 0.',
      buttons: [{ type: 'ok' }]
    });
  };

  return (
    <div className="App">
      <h1>GPS Step Counter</h1>
      <p>Telegram ID: {telegramId || 'Not available'}</p>
      <p>Steps: {steps}</p>
      <p>Distance: {distance.toFixed(2)} meters</p>
      
      <button onClick={isTracking ? stopTracking : startTracking}>
        {isTracking ? 'Stop Tracking' : 'Start Tracking'}
      </button>
      <button onClick={resetCounting} disabled={isTracking}>
        Reset Count
      </button>
    </div>
  );
}

export default App;