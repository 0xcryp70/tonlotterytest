require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3002;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// In-memory store for user tokens (for simplicity, use a proper database in production)
const userTokens = {};

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Step 1: Redirect the user to Google's OAuth consent screen
app.get('/auth/google', (req, res) => {
    const telegramUserId = req.query.userId;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=code&scope=https://www.googleapis.com/auth/fitness.activity.read&redirect_uri=${REDIRECT_URI}&state=${telegramUserId}&access_type=offline`;
    res.redirect(oauthUrl);
});

// Step 2: Handle Google OAuth callback and exchange the authorization code for an access token
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
        
        // Redirect the user back to the mini app
        res.redirect(`/success.html?userId=${userId}`);
    } catch (error) {
        console.error('Error during token exchange', error);
        res.status(500).send('Authentication failed.');
    }
});

// Step 3: Retrieve step data for a specific user
app.post('/steps', async (req, res) => {
    const { userId } = req.body;
    const tokens = userTokens[userId];

    if (!tokens) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const stepsData = await getStepsData(tokens.access_token);
        res.status(200).json({ message: 'Steps retrieved', steps: stepsData });
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
        bucketByTime: { durationMillis: 86400000 }, // One day in milliseconds
        startTimeMillis: Date.now() - 86400000,     // Start from the previous day
        endTimeMillis: Date.now()                   // Until the current time
    }, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        }
    });

    const stepCount = response.data.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0;
    return stepCount;
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

