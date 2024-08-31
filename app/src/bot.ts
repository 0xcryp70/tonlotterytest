
//const TELEGRAM_API_URL = 'https://api.telegram.org/bot6659754838:AAEZBm5F2ySLPGwklA_TNOgHALNPl5eua8o'; // Replace with your Telegram bot token
import axios from 'axios';
import { MongoClient, Db, ObjectId, UpdateFilter, Document, WithId } from 'mongodb';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const TELEGRAM_API_URL = 'https://api.telegram.org/bot7173787325:AAGedFA4aDhhvIaxi0Q2BC_kygvuhhUNy5A';
const MONGO_URL = 'mongodb://B14ckc0d3r:B14ckc0d3rSaeed@mongodb:27017';
const botToken = '7173787325:AAGedFA4aDhhvIaxi0Q2BC_kygvuhhUNy5A'; // Ensure you replace 'YOUR_BOT_TOKEN' with your actual bot token
const telegramApi = `https://api.telegram.org/bot${botToken}/sendMessage`;
const MONGO_DB_NAME = 'lottery';
const MONGO_COLLECTION_NAME = 'user_data';
const MONGO_COLLECTION_TICKETS = 'tickets_data';
const MONGO_COLLECTION_TASKS = 'taskstodo_data';
const MONGO_COLLECTION_BAN = 'ban_data';
const MONGO_COLLECTION_BALANCE = 'user_balance';

const PORT = 3001;

let db: Db;

const connectToMongoDB = async () => {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(MONGO_DB_NAME);
    console.log('Connected to MongoDB');
};

const isUserBanned = async (telegramId: number): Promise<boolean> => {
    try {
        const collection = db.collection(MONGO_COLLECTION_BAN);
        const user = await collection.findOne({ telegramId: telegramId });
        return !!user;
    } catch (err) {
        console.error('Error checking banned user:', err);
        return false;
    }
};

const storeUserInMongoDB = async (userData: any) => {
    const collection = db.collection(MONGO_COLLECTION_NAME);
    await collection.updateOne({ telegramId: userData.telegramId }, { $set: userData }, { upsert: true });
};

const initializeUserData = (user: any): any => ({
    ...user,
    activeReferredUsers: user.activeReferredUsers || [],
    lastTicketNumbersBought: user.lastTicketNumbersBought || [],
    ticketNumbers: user.ticketNumbers || [],
    referralTicketsNumbersBought: user.referralTicketsNumbersBought || []
});

const generateReferralLink = (telegramId: number) => `https://t.me/lotterytoncoin_bot?start=${telegramId}`;

const generateUniqueRandomNumber = async (): Promise<number> => {
    while (true) {
        const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
        const existingTicket = await db.collection(MONGO_COLLECTION_TICKETS).findOne({ ticketNumber: randomNumber });
        if (!existingTicket) return randomNumber;
    }
};

interface Task {
    _id?: ObjectId;
    telegramId: number;
    telegramUsername: string;
    tasks: { name: string; completed: boolean }[];
}

interface UserWithdrawal {
    telegramId: number;
    telegramUsername: string;
    balance: number;
    claimedBalance: number;
    requestedWithdrawal: number;
    withdrawalStatus: string; // Example statuses: "pending", "completed", "failed"
}

interface UserDocument {
    telegramId: number;
    balance: number;
    rewardedReferralCount: number;
    activeReferredUsers: number[];
    telegramUsername?: string;
    claimedBalance?: number;
}

const INITIAL_TASKS = [
    { name: 'task1', completed: false },
    { name: 'task2', completed: false },
    { name: 'task3', completed: false },
    { name: 'task4', completed: false },
    { name: 'task5', completed: false },
    { name: 'task6', completed: false },
    { name: 'task7', completed: false },
];

const storeUserTaskStatus = async (telegramId: number, telegramUsername: string, tasks: { name: string; completed: boolean }[]) => {
    const collection = db.collection<Task>(MONGO_COLLECTION_TASKS);
    await collection.updateOne(
        { telegramId },
        { $set: { telegramUsername, tasks } },
        { upsert: true }
    );
};

const getUserTaskStatus = async (telegramId: number) => {
    const collection = db.collection<Task>(MONGO_COLLECTION_TASKS);
    let user = await collection.findOne({ telegramId });

    // If user does not exist, initialize with default tasks
    if (!user) {
        user = {
            _id: new ObjectId(), // Add _id for the new user
            telegramId,
            telegramUsername: '',
            tasks: INITIAL_TASKS
        };
        await storeUserTaskStatus(telegramId, '', INITIAL_TASKS);
    }

    return user ? user.tasks : [];
};

const claimPrize = async (telegramId: number, prizeAmount: number) => {
    const collection = db.collection(MONGO_COLLECTION_NAME);
    const user = await collection.findOne({ telegramId });

    if (!user) {
        return false;
    }

    const now = new Date();
    const nowUTC = new Date(now.toISOString()); // Convert to UTC
    const lastClaimDate = user.lastClaimDate ? new Date(user.lastClaimDate) : null;
    const daysSinceLastClaim = lastClaimDate ? Math.floor((nowUTC.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

    const isMondayUTC = nowUTC.getUTCDay() === 1;
    const isNewWeek = isMondayUTC && (!lastClaimDate || lastClaimDate.getUTCDay() !== 1 || (daysSinceLastClaim !== null && daysSinceLastClaim >= 7));

    if (isNewWeek || !lastClaimDate || (daysSinceLastClaim !== null && daysSinceLastClaim >= 7)) {
        const result = await collection.updateOne(
            { telegramId },
            { 
                $set: { lastClaimDate: nowUTC }, 
                $inc: { balance: prizeAmount },
                $setOnInsert: { pendingWithdrawals: 0 }  // Initialize pendingWithdrawals if it doesn't exist
            }
        );

        return result.modifiedCount > 0;
    }

    return false;
};

const claimPrizeRef = async (telegramId: number, newReferralCount: number) => {
    const collection = db.collection<UserDocument>(MONGO_COLLECTION_NAME);
    const user = await collection.findOne({ telegramId });

    if (!user) {
        return false;
    }

    if (newReferralCount > 0) {
        const prizeAmount = newReferralCount * 0.12;
        const result = await collection.updateOne(
            { telegramId },
            {
                $inc: { balance: prizeAmount, rewardedReferralCount: newReferralCount }
            }
        );
        return result.modifiedCount > 0;
    }

    return false;
};

const generateNumbersForTickets = async (tickets: number): Promise<number[]> => {
    const numbers: number[] = [];
    for (let i = 0; i < tickets; i++) {
        numbers.push(await generateUniqueRandomNumber());
    }
    return numbers;
};

const handleMessage = async (message: any) => {
    try {
        const existingUser = await db.collection(MONGO_COLLECTION_NAME).findOne({ telegramId: message.chat.id });
        if (existingUser) {
            console.log('User already exists in the database, skipping message handling.');
            return;
        }

        if (message.text && message.text.startsWith('/start')) {
            const [_, referrerId] = message.text.split(' ');
            const userId = message.chat.id;

            const userData = {
                telegramId: userId,
                telegramUsername: message.chat.username,
                referredBy: referrerId ? parseInt(referrerId) : null,
                ticketNumbers: [],
                lastTicketNumbersBought: [],
                dateOfLastBought: null,
                activeReferredUsers: [],
                referralTicketsNumbersBought: []
            };

            if (userData.referredBy) {
                const referrer = await db.collection(MONGO_COLLECTION_NAME).findOne({ telegramId: userData.referredBy });
                if (referrer) {
                    referrer.activeReferredUsers = referrer.activeReferredUsers || [];
                    referrer.activeReferredUsers.push(userId);
                    await storeUserInMongoDB(referrer);
                    await updateReferralTicketsNumbersBought(userData.referredBy);
                }
            }

            await storeUserInMongoDB(userData);

            const referralLink = generateReferralLink(userId);
            const firstName = message.chat.first_name || "";
            const welcomeMessage = `🎉 Welcome${firstName ? `, ${firstName}` : ''}! 🎉\n\nInvite your friends and get 0.12 TON for each active friend and 10% when they win a prize! 🏆\n\nYour referral link is: ${referralLink}`;

            await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
                chat_id: message.chat.id,
                text: welcomeMessage
            });
        } else {
            await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
                chat_id: message.chat.id,
                text: `🎉 Welcome! 🎉\n\nInvite your friends and get 10% when they win a prize! 🏆`
            });
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
};

const updateReferralTicketsNumbersBought = async (referrerId: number) => {
    try {
        const referrer = await db.collection(MONGO_COLLECTION_NAME).findOne({ telegramId: referrerId });
        if (referrer) {
            const referralUsers = await db.collection(MONGO_COLLECTION_NAME).find({ referredBy: referrerId }).toArray();
            referrer.referralTicketsNumbersBought = referralUsers.flatMap(user => user.allTickets || []);
            await storeUserInMongoDB(referrer);
        }
    } catch (error) {
        console.error('Error updating referral tickets numbers:', error);
    }
};

const handleIncomingMessage = async (update: any) => {
    const message = update.message;
    if (message && message.text) {
        await handleMessage(message);
    }
};

let lastUpdateId = 0;

const getUpdates = async () => {
    try {
        const response = await axios.get(`${TELEGRAM_API_URL}/getUpdates`, { params: { offset: lastUpdateId + 1 } });
        for (const update of response.data.result) {
            await handleIncomingMessage(update);
            lastUpdateId = update.update_id;
        }
    } catch (error) {
        console.error('Error fetching updates:', error.toJSON ? error.toJSON() : error);
    }
};

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(bodyParser.json());

app.get('/api/claimPrize', async (req, res) => {
    const { telegramId, prizeAmount } = req.query;

    if (!telegramId || !prizeAmount) {
        return res.status(400).send('Missing telegramId or prizeAmount');
    }

    const telegramIdNum = Number(telegramId);
    const prizeAmountNum = Number(prizeAmount);

    if (isNaN(telegramIdNum) || isNaN(prizeAmountNum)) {
        return res.status(400).send('Invalid telegramId or prizeAmount');
    }

    const success = await claimPrize(telegramIdNum, prizeAmountNum);
    if (success) {
        res.status(200).send('Prize claimed successfully');
    } else {
        res.status(400).send('Unable to claim prize');
    }
});

app.get('/api/claimPrizeRef', async (req, res) => {
    const { telegramId } = req.query;

    if (!telegramId) {
        return res.status(400).send('Missing telegramId');
    }

    const telegramIdNum = Number(telegramId);

    if (isNaN(telegramIdNum)) {
        return res.status(400).send('Invalid telegramId');
    }

    try {
        // Fetch user and calculate new referrals to reward
        const user = await db.collection<UserDocument>(MONGO_COLLECTION_NAME).findOne({ telegramId: telegramIdNum });
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Use existing getReferralUsers logic to fetch active referrals
        const referrer = await db.collection<UserDocument>(MONGO_COLLECTION_NAME).findOne({ telegramId: telegramIdNum });
        if (!referrer) {
            return res.status(404).send('Referrer not found');
        }

        const activeReferredUsersList = Array.isArray(referrer.activeReferredUsers) ? referrer.activeReferredUsers : [];
        const activeReferredUsers = await db.collection<UserDocument>(MONGO_COLLECTION_NAME).aggregate([
            { $match: { telegramId: { $in: activeReferredUsersList } } },
            { $project: { telegramId: 1, telegramUsername: 1, allTickets: 1 } },
            { $match: { allTickets: { $exists: true, $not: { $size: 0 } } } }
        ]).toArray();

        const rewardedReferralCount = user.rewardedReferralCount || 0;
        const newReferralCount = activeReferredUsers.length - rewardedReferralCount;

        if (newReferralCount > 0) {
            const success = await claimPrizeRef(telegramIdNum, newReferralCount);
            if (success) {
                res.status(200).send({ success: true });
            } else {
                res.status(400).send('Unable to claim prize');
            }
        } else {
            res.status(200).send('No new referrals to reward');
        }
    } catch (error) {
        console.error('Error processing claim prize request:', error);
        res.status(500).send('Internal server error');
    }
});

app.get('/api/getUserBalance', async (req, res) => {
    try {
        const { telegramId } = req.query;
        if (!telegramId) {
            return res.status(400).json({ error: 'telegramId is required' });
        }

        const collection = db.collection(MONGO_COLLECTION_NAME);
        const user = await collection.findOne({ telegramId: Number(telegramId) });

        if (user) {
            res.json({ 
                balance: user.balance, 
                pendingWithdrawals: user.pendingWithdrawals || 0,
                claimedBalance: user.claimedBalance || 0  // Added claimedBalance to the response
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user balance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/generateTickets', async (req, res) => {
    const { numTickets } = req.query;
    const ticketsCount = Number(numTickets);

    if (isNaN(ticketsCount)) {
        return res.status(400).send('Invalid number of tickets');
    }
    
    if (ticketsCount > 90) {
        return res.status(400).send('The maximum number of tickets allowed is 50');
    }

    try {
        const generatedNumbers = await generateNumbersForTickets(ticketsCount);
        res.status(200).json({ ticketNumbers: generatedNumbers });
    } catch (error) {
        console.error('Error generating ticket numbers:', error);
        res.status(500).send('Error generating ticket numbers');
    }
});

app.get('/api/getReferralUsers', async (req, res) => {
    const { telegramId } = req.query;

    if (!telegramId || isNaN(Number(telegramId))) {
        return res.status(400).send('Invalid Telegram ID');
    }

    try {
        const referrer = await db.collection(MONGO_COLLECTION_NAME).findOne({ telegramId: Number(telegramId) });
        if (!referrer) {
            return res.status(404).send('Referrer not found');
        }

        // Ensure activeReferredUsers is always an array
        const activeReferredUsersList = Array.isArray(referrer.activeReferredUsers) ? referrer.activeReferredUsers : [];

        // Aggregate users who have tickets
        const activeReferredUsers = await db.collection(MONGO_COLLECTION_NAME).aggregate([
            { $match: { telegramId: { $in: activeReferredUsersList } } },
            { $project: { telegramId: 1, telegramUsername: 1, allTickets: 1 } },
            { $match: { allTickets: { $exists: true, $not: { $size: 0 } } } }
        ]).toArray();

        res.status(200).json({
            activeReferredUsers,
            referralTicketsNumbersBought: referrer.referralTicketsNumbersBought
        });
    } catch (error) {
        console.error('Error fetching referral users:', error);
        res.status(500).send('Error fetching referral users');
    }
});

app.get('/api/getTicketNumbers', async (req, res) => {
    const { telegramId } = req.query;

    if (!telegramId || isNaN(Number(telegramId))) {
        return res.status(400).send('Invalid Telegram ID');
    }

    try {
        const user = await db.collection(MONGO_COLLECTION_NAME).findOne({ telegramId: Number(telegramId) });
        if (!user || !user.allTickets) {
            return res.status(204).end();
        }

        res.status(200).json({
            ticketNumbers: user.allTickets
        });
    } catch (error) {
        console.error('Error fetching ticket numbers:', error);
        res.status(500).send('Error fetching ticket numbers');
    }
});

app.get('/api/saveWalletData', async (req, res) => {
    const { address, telegramUsername, telegramId, newTickets, allTickets, lastTransaction } = req.query;

    // Validate query parameters
    if (
        typeof address !== 'string' ||
        typeof telegramUsername !== 'string' ||
        typeof telegramId !== 'string' ||
        typeof newTickets !== 'string' ||
        typeof allTickets !== 'string' ||
        typeof lastTransaction !== 'string'
    ) {
        return res.status(400).send('Invalid query parameters');
    }

    try {
        const collection = db.collection(MONGO_COLLECTION_NAME);
        const user = await collection.findOne({ telegramId: Number(telegramId) });

        interface UpdatedFields {
            [key: string]: any;
            telegramId: number;
            newTickets: any;
            allTickets: any;
            lastTransaction: string;
        }

        const updatedFields: UpdatedFields = {
            telegramId: Number(telegramId),
            newTickets: JSON.parse(newTickets),
            allTickets: JSON.parse(allTickets),
            lastTransaction: String(lastTransaction),
        };

        if (user) {
            const existingFields = Object.keys(user);

            if (user.address !== address) {
                let addressSuffix = 1;
                let newAddressField = `address_${addressSuffix}`;
                while (existingFields.includes(newAddressField)) {
                    addressSuffix++;
                    newAddressField = `address_${addressSuffix}`;
                }
                updatedFields[newAddressField] = String(address);
            }

            if (user.telegramUsername !== telegramUsername) {
                let usernameSuffix = 1;
                let newUsernameField = `telegramUsername_${usernameSuffix}`;
                while (existingFields.includes(newUsernameField)) {
                    usernameSuffix++;
                    newUsernameField = `telegramUsername_${usernameSuffix}`;
                }
                updatedFields[newUsernameField] = String(telegramUsername);
            }
        } else {
            updatedFields[`address_1`] = String(address);
            updatedFields[`telegramUsername_1`] = String(telegramUsername);
        }

        const result = await collection.updateOne({ telegramId: Number(telegramId) }, {
            $set: updatedFields
        }, { upsert: true });

        if (result.modifiedCount || result.upsertedCount) {
            if (user && user.referredBy) {
                await updateReferralTicketsNumbersBought(user.referredBy);
            }

            try {
                const ticketsArray = JSON.parse(newTickets) as number[];
                await Promise.all(ticketsArray.map((ticketNumber: number) => db.collection(MONGO_COLLECTION_TICKETS).insertOne({ ticketNumber })));
                res.status(200).send('Wallet data saved successfully');
            } catch (error) {
                console.error('Error inserting ticket numbers:', error);
                res.status(500).send('Error saving wallet data (ticket insertion failed)');
            }
        } else {
            throw new Error('Failed to save wallet data');
        }
    } catch (error) {
        console.error('Error saving wallet data:', error);
        res.status(500).send('Error saving wallet data');
    }
});

// Task Status Endpoint
app.get('/api/saveTaskCompletion', async (req, res) => {
    const { telegramId, telegramUsername, taskCompleted } = req.query;

    if (!telegramId || isNaN(Number(telegramId)) || typeof telegramUsername !== 'string' || typeof taskCompleted !== 'string') {
        return res.status(400).send('Invalid query parameters');
    }

    try {
        const collection = db.collection(MONGO_COLLECTION_TASKS);
        const result = await collection.insertOne({
            telegramId: Number(telegramId),
            telegramUsername,
            taskCompleted: taskCompleted === 'true', // Convert string to boolean
            timestamp: new Date()
        });

        if (result.acknowledged) {
            res.status(200).send('Task completion data saved successfully');
        } else {
            throw new Error('Failed to save task completion data');
        }
    } catch (error) {
        console.error('Error saving task completion data:', error);
        res.status(500).send('Error saving task completion data');
    }
});

app.get('/api/completeTask', async (req, res) => {
    const { telegramId, telegramUsername, taskName } = req.query;

    if (!telegramId || isNaN(Number(telegramId)) || typeof telegramUsername !== 'string' || typeof taskName !== 'string') {
        return res.status(400).send('Invalid parameters');
    }

    try {
        const tasks = await getUserTaskStatus(Number(telegramId));

        let taskFound = false;
        const updatedTasks = tasks.map(task => {
            if (task.name === taskName) {
                taskFound = true;
                return { ...task, completed: true };
            }
            return task;
        });

        if (!taskFound) {
            updatedTasks.push({ name: taskName, completed: true });
        }

        await storeUserTaskStatus(Number(telegramId), telegramUsername, updatedTasks);
        res.status(200).send('Task completed successfully');
    } catch (error) {
        console.error('Error completing task:', error);
        res.status(500).send('Error completing task');
    }
});

app.get('/api/getTaskStatus', async (req, res) => {
    const { telegramId } = req.query;

    if (!telegramId || isNaN(Number(telegramId))) {
        return res.status(400).send('Invalid Telegram ID');
    }

    try {
        const tasks = await getUserTaskStatus(Number(telegramId));
        res.status(200).json({ tasks });
    } catch (error) {
        console.error('Error fetching task status:', error);
        res.status(500).send('Error fetching task status');
    }
});

app.get('/api/buyFreeTickets', async (req, res) => {
    const { telegramId } = req.query;

    if (!telegramId || isNaN(Number(telegramId))) {
        return res.status(400).send('Invalid Telegram ID');
    }

    try {
        const tasks = await getUserTaskStatus(Number(telegramId));

        const isTask1Completed = tasks.find(task => task.name === 'task1' && task.completed);
        const isTask2Completed = tasks.find(task => task.name === 'task2' && task.completed);
        const isTask3Completed = tasks.find(task => task.name === 'task3' && task.completed);
	const isTask4Completed = tasks.find(task => task.name === 'task4' && task.completed);

        if (!isTask1Completed || !isTask2Completed || !isTask3Completed || !isTask4Completed) {
            return res.status(400).send('All Tasks must be completed to buy free tickets');
        }

        const freeTickets = await generateNumbersForTickets(3);
        await db.collection(MONGO_COLLECTION_TICKETS).insertMany(freeTickets.map(ticketNumber => ({ ticketNumber })));

        res.status(200).json({ message: '3 free tickets bought successfully', ticketNumbers: freeTickets });
    } catch (error) {
        console.error('Error buying free tickets:', error);
        res.status(500).send('Error buying free tickets');
    }
});


app.get('/check-banned', async (req, res) => {
        const telegramId = parseInt(req.query.telegramId as string, 10);
        if (!telegramId) {
            return res.status(400).json({ error: 'Invalid telegramId' });
        }
        const banned = await isUserBanned(telegramId);
        res.json({ banned });
});

app.get('/notifyBot', async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
        return res.status(400).send('User ID is required');
    }

    try {
        const message = "https://t.me/lotterytoncoinbeta_bot/TonLotteryBeta";
        const response = await axios.post(telegramApi, {
            chat_id: userId,
            text: message
        });

        res.send('Notification sent to bot');
    } catch (error) {
        console.error('Error sending message to Telegram:', error);
        res.status(500).send('Failed to send notification');
    }
});

app.get('/api/storeWalletAddress', async (req, res) => {
    const { telegramId, walletAddress } = req.query as { telegramId: string; walletAddress: string };

    if (!telegramId || !walletAddress) {
        return res.status(400).send('Missing required parameters.');
    }

    try {
        const userData = {
            telegramId: parseInt(telegramId),
            walletAddress,
        };
        await storeUserInMongoDB(userData); // This should handle adding or updating the user's wallet address
        res.send({ success: true, message: 'Wallet address stored successfully' });
    } catch (error) {
        console.error('Error storing wallet address:', error);
        res.status(500).send({ success: false, message: 'Failed to store wallet address' });
    }
});

app.get('/api/withdraw', async (req, res) => {
    const { telegramId, amount, walletAddress } = req.query as { telegramId: string; amount: string; walletAddress: string };

    if (!telegramId || !amount || !walletAddress) {
        return res.status(400).send('Missing required parameters.');
    }

    try {
        const id = parseInt(telegramId);
        const amt = parseFloat(amount);

        const isBanned = await isUserBanned(id);
        if (isBanned) {
            return res.status(403).send('User is banned.');
        }

        const user = await db.collection(MONGO_COLLECTION_NAME).findOne({ telegramId: id });

        if (!user) {
            return res.status(404).send('User not found.');
        }

        if (user.balance - user.pendingWithdrawals < amt) {
            return res.status(400).send('Insufficient balance.');
        }

        // Ensure claimedBalance exists and set it to 0 if it doesn't
        await db.collection(MONGO_COLLECTION_NAME).updateOne(
            { telegramId: id },
            { 
                $setOnInsert: { claimedBalance: 0 },
                $inc: { pendingWithdrawals: amt } 
            }
        );

        const withdrawal = {
            telegramId: id,
            telegramUsername: user.telegramUsername || '',
            balance: user.balance,
            claimedBalance: user.claimedBalance || 0,
            requestedWithdrawal: amt,
            withdrawalStatus: 'pending'
        };

        await db.collection('user_withdrawal').insertOne(withdrawal);
        res.send({ success: true, message: 'Withdrawal request submitted successfully' });
    } catch (error) {
        console.error('Error submitting withdrawal:', error);
        res.status(500).send({ success: false, message: 'An error occurred. Please try again later.' });
    }
});



const initializeAllUsers = async () => {
    const users = await db.collection(MONGO_COLLECTION_NAME).find().toArray();
    await Promise.all(users.map(user => storeUserInMongoDB(initializeUserData(user))));
};

const startBot = async () => {
    await connectToMongoDB();
    await initializeAllUsers();

    app.listen(PORT, () => {
        console.log(`Server running at http://0.0.0.0:${PORT}`);
    });

    setInterval(getUpdates, 5000);
};

startBot().then(() => {
    console.log('Bot is running...');
}).catch(error => {
    console.error('Error starting bot:', error);
});
