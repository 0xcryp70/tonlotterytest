import React, { useState, useEffect } from 'react';

// Import Telegram WebApp
const tg = window.Telegram.WebApp;

function App() {
  const [telegramId, setTelegramId] = useState(null);
  const [steps, setSteps] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastPosition, setLastPosition] = useState(null);
  const [watchId, setWatchId] = useState(null);

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

  const handleFetchSteps = async () => {
    if (!telegramId) {
      tg.showPopup({
        title: 'Error',
        message: 'Telegram ID not found.',
        buttons: [{ type: 'ok' }]
      });
      return;
    }

    try {
      // Implement Google Fit API call here
      // For now, we'll just show a placeholder message
      tg.showPopup({
        title: 'Google Fit',
        message: 'Fetching steps from Google Fit is not implemented yet.',
        buttons: [{ type: 'ok' }]
      });
    } catch (error) {
      console.error('Error fetching steps:', error);
      tg.showPopup({
        title: 'Error',
        message: 'Failed to fetch steps from Google Fit.',
        buttons: [{ type: 'ok' }]
      });
    }
  };

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
      message: `You've taken approximately ${steps} steps.`,
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

    const distance = calculateDistance(
      lastPosition.coords.latitude,
      lastPosition.coords.longitude,
      position.coords.latitude,
      position.coords.longitude
    );

    const newSteps = Math.floor(distance / STEP_LENGTH);
    setSteps((prevSteps) => prevSteps + newSteps);
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

  return (
    <div className="App">
      <h1>Step Counter</h1>
      <p>Telegram ID: {telegramId || 'Not available'}</p>
      <p>Steps: {steps || 0}</p>
      
      <h2>GPS Tracking</h2>
      <button onClick={isTracking ? stopTracking : startTracking}>
        {isTracking ? 'Stop Tracking' : 'Start Tracking'}
      </button>

      <h2>Google Fit Integration</h2>
      <button onClick={handleFetchSteps}>Fetch Steps from Google Fit</button>
    </div>
  );
}

export default App;