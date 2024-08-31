// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const redis = require('redis');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors());

const redisClient = redis.createClient(); // Connect to your Redis server

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

app.post('/saveNumbers', (req, res) => {
  const { walletAddress, numbers } = req.body;
  redisClient.lpush(walletAddress, ...numbers, (err, reply) => {
    if (err) {
      console.error('Redis save error:', err);
      res.status(500).send('Error saving numbers');
    } else {
      res.sendStatus(200);
    }
  });
});

app.get('/getNumbers/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  redisClient.lrange(walletAddress, 0, -1, (err, numbers) => {
    if (err) {
      console.error('Redis fetch error:', err);
      res.status(500).send('Error fetching numbers');
    } else {
      res.json(numbers);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

