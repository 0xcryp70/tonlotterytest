import React, { useState, useEffect } from 'react';

function App() {
  const [telegramId, setTelegramId] = useState(null);
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [lastPosition, setLastPosition] = useState(null);

  // Constants
  const STEP_LENGTH = 0.7; // Average step length in meters
  const MIN_ACCURACY = 20; // Minimum GPS accuracy in meters
  const tg = window.Telegram.WebApp;

  useEffect(() => {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#5E97F6');
    setTelegramId(tg.initDataUnsafe.user?.id || null);
  }, [tg]);

  const startTracking = () => {
    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      });
      setWatchId(id);
      setIsTracking(true);
      tg.showPopup({
        title: 'Tracking Started',
        message: 'GPS-based step counting has begun.',
        buttons: [{ type: 'ok' }]
      });
    } else {
      tg.showAlert("Geolocation is not supported by this device.");
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
    if (!lastPosition) {
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
    tg.showAlert('Error tracking steps. Please check your GPS settings.');
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
    <div className="container">
      <h1>GPS-based Step Counter</h1>
      <p>Steps Taken: {steps}</p>
      <button onClick={startTracking} disabled={isTracking}>
        Start Tracking
      </button>
      <button onClick={stopTracking} disabled={!isTracking}>
        Stop Tracking
      </button>
    </div>
  );
}

export default App;
