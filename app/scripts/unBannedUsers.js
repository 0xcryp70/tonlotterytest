const { MongoClient } = require('mongodb');

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const MONGO_DB_NAME = 'lottery';
const MONGO_COLLECTION_BAN = 'ban_data';

const unbanUsers = async (telegramIds) => {
    const client = new MongoClient(MONGO_URL);
    try {
        await client.connect();
        const db = client.db(MONGO_DB_NAME);
        const collection = db.collection(MONGO_COLLECTION_BAN);

        const result = await collection.deleteMany({ telegramId: { $in: telegramIds } });
        console.log(`Unbanned ${result.deletedCount} users.`);
    } catch (err) {
        console.error('Error unbanning users:', err);
    } finally {
        await client.close();
    }
};

const telegramIdsToUnban = [1694077117, 5630910702]; // Add the IDs you want to unban here
unbanUsers(telegramIdsToUnban);

