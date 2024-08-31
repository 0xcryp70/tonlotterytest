const { MongoClient } = require('mongodb');

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const MONGO_DB_NAME = 'lottery';
const MONGO_COLLECTION_BAN = 'ban_data';

const addBannedUsers = async () => {
    const client = new MongoClient(MONGO_URL);
    try {
        await client.connect();
        const db = client.db(MONGO_DB_NAME);
        const collection = db.collection(MONGO_COLLECTION_BAN);

        const users = [
            { telegramId: 1694077888, reason: "Violation of terms", banned_at: new Date() },
            { telegramId: 5630910888, reason: "Spamming", banned_at: new Date() }
        ];

        const result = await collection.insertMany(users);
        console.log(`Inserted ${result.insertedCount} documents.`);
    } catch (err) {
        console.error('Error adding banned users:', err);
    } finally {
        await client.close();
    }
};

addBannedUsers();

