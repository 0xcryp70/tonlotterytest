require('dotenv').config();
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');

// MongoDB setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const stepSchema = new mongoose.Schema({
  telegramId: String,
  steps: Number,
  dataSourceId: String,
  timestamp: { type: Date, default: Date.now },
});

const Step = mongoose.model('Step', stepSchema);

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = '0.0.0.0';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

app.use(express.json()); // Middleware to parse JSON requests
app.use(cors());

app.get('/auth/google', (req, res) => {
  const telegramUserId = req.query.userId;
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=code&scope=https://www.googleapis.com/auth/fitness.activity.read&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${telegramUserId}&access_type=offline`;
  res.redirect(oauthUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    });
    const { access_token, refresh_token } = tokenResponse.data;
    userTokens[userId] = { access_token, refresh_token };
    res.redirect(`https://test.tonlottery.info/success?userId=${userId}`);
  } catch (error) {
    console.error('Error during token exchange:', error.response ? error.response.data : error.message);
    res.status(500).send('Authentication failed.');
  }
});

app.get('/steps', async (req, res) => {
  const { userId } = req.query;
  const tokens = userTokens[userId];
  if (!tokens) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  try {
    const stepsData = await getStepsData(tokens.access_token);
    res.status(200).json({
      message: 'Steps retrieved',
      steps: stepsData.stepCount,
      dataSourceId: stepsData.dataSourceId,
    });
  } catch (error) {
    console.error('Error retrieving step data', error);
    res.status(500).json({ message: 'Error retrieving steps' });
  }
});

// Helper function to get steps from Google Fit
async function getStepsData(accessToken) {
  const response = await axios.post('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
    aggregateBy: [{
      dataTypeName: "com.google.step_count.delta",
      dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
    }],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: Date.now() - 86400000,
    endTimeMillis: Date.now()
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  const stepCount = response.data.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0;
  const dataSourceId = response.data.bucket[0]?.dataset[0]?.dataSourceId || 'unknown';

  return { stepCount, dataSourceId };
}

// Endpoint to save steps to MongoDB
app.post('/saveSteps', async (req, res) => {
  const { telegramId, steps, dataSourceId } = req.body;
  
  try {
    const newStep = new Step({
      telegramId,
      steps,
      dataSourceId,
    });
    
    await newStep.save();
    res.status(200).json({ message: 'Steps saved successfully' });
  } catch (error) {
    console.error('Error saving steps to DB:', error);
    res.status(500).json({ message: 'Error saving steps' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
});
