import React, { useState, useEffect } from 'react';
import { GoogleFit } from 'react-google-fit';

function App() {
  const [telegramId, setTelegramId] = useState(null);
  const [steps, setSteps] = useState(null);
  const [dataSourceId, setDataSourceId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Simulate getting the Telegram ID from WebApp context
    setTelegramId("123456789");

    // Initialize Google Fit
    GoogleFit.init()
      .then(authResult => {
        if (authResult.success) {
          console.log('Google Fit authenticated successfully');
          setIsAuthenticated(true);
        } else {
          console.error('Google Fit authentication failed:', authResult.message);
        }
      })
      .catch(error => {
        console.error('Error initializing Google Fit:', error);
      });
  }, []);

  const handleFetchSteps = async () => {
    if (!isAuthenticated) {
      alert('Please authenticate Google Fit first.');
      return;
    }

    try {
      // Request access to step count data
      const result = await GoogleFit.getDailySteps();
      const todaySteps = result[0]?.steps || 0;
      const todayDataSourceId = result[0]?.dataSourceId || 'unknown';

      // Set steps and dataSourceId
      setSteps(todaySteps);
      setDataSourceId(todayDataSourceId);

      // Send data to the backend for saving in MongoDB
      await saveStepsToDB(todaySteps, todayDataSourceId);
    } catch (error) {
      console.error('Error fetching steps:', error);
    }
  };

  const saveStepsToDB = async (steps, dataSourceId) => {
    try {
      const response = await fetch('https://api3.tonlottery.info/saveSteps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, steps, dataSourceId }),
      });

      const result = await response.json();
      console.log('Steps saved:', result.message);
    } catch (error) {
      console.error('Error saving steps to DB:', error);
    }
  };

  return (
    <div className="container">
      <h1>Google Fit Integration</h1>

      {telegramId ? (
        <>
          <p>Telegram ID: {telegramId}</p>

          {/* Button to fetch steps after authorization */}
          <button onClick={handleFetchSteps}>Fetch Steps</button>

          {/* Display steps if fetched */}
          {steps && (
            <div>
              <p>Steps in last 24 hours: {steps}</p>
              <p>Data Source ID: {dataSourceId}</p>
            </div>
          )}
        </>
      ) : (
        <p>Loading Telegram ID...</p>
      )}
    </div>
  );
}

export default App;
