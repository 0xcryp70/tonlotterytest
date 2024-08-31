// src/walletDataHandler.ts
import { MongoClient } from 'mongodb';

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const MONGO_DB_NAME = 'lottery';
const MONGO_COLLECTION_NAME = 'users';

let db: any;

// Connect to MongoDB (this should be called once during server startup)
export const connectToMongoDB = async () => {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(MONGO_DB_NAME);
  console.log('Connected to MongoDB');
};

// Function to save wallet data
export const saveWalletData = async (data: { address: string, telegramId: number, telegramUsername: string, newTickets: number[], lastTransaction: string }) => {
  try {
    const collection = db.collection(MONGO_COLLECTION_NAME);
    await collection.updateOne({ telegramId: data.telegramId }, {
      $set: {
        address: data.address,
        telegramUsername: data.telegramUsername,
        newTickets: data.newTickets,
        lastTransaction: data.lastTransaction
      },
      $push: { ticketNumbers: { $each: data.newTickets } }
    }, { upsert: true });
    console.log('Wallet data saved successfully.');
  } catch (error) {
    console.error('Error saving wallet data:', error);
  }
};

