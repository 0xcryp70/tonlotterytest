import React, { useState, useEffect } from 'react';

function App() {
  const [telegramId, setTelegramId] = useState(null);
  const [steps, setSteps] = useState(null);

  useEffect(() => {
    // Simulate getting the Telegram ID from WebApp context
    setTelegramId("123456789");
  }, []);

  const handleFetchSteps = async () => {
    if (!telegramId) {
      alert('Telegram ID not found.');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3002/steps?userId=${telegramId}`);
      const data = await response.json();
      setSteps(data.steps);
    } catch (error) {
      console.error("Error fetching steps:", error);
    }
  };

  return (
    <div className="container">
      <h1>Google Fit Integration</h1>

      {telegramId ? (
        <>
          <p>Telegram ID: {telegramId}</p>

          {/* Button to trigger OAuth authorization */}
          <a href={`http://localhost:3002/auth/google?userId=${telegramId}`} className="btn">
            Authorize Google Fit
          </a>

          {/* Button to fetch steps after authorization */}
          <button onClick={handleFetchSteps}>Fetch Steps</button>

          {/* Display steps if fetched */}
          {steps && <p>Steps in last 24 hours: {steps}</p>}
        </>
      ) : (
        <p>Loading Telegram ID...</p>
      )}
    </div>
  );
}

export default App;

