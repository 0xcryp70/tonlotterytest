import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Task.scss';
import taskimg from '../../assets/images/task.png';

const Task: React.FC = () => {
    const [tasks, setTasks] = useState<{ name: string; completed: boolean }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [walletAddress, setWalletAddress] = useState<string>(localStorage.getItem('walletAddress') || '');
    const [referralTicketsClaimed, setReferralTicketsClaimed] = useState<{ [key: string]: boolean }>({});
    const [activeReferrals, setActiveReferrals] = useState<number>(0);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [claimingTickets, setClaimingTickets] = useState<number | null>(null);
    const [claimedTasks, setClaimedTasks] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
                const taskResponse = await axios.get(`https://api.tonlottery.info/api/getTaskStatus?telegramId=${telegramId}`);
                const taskData = taskResponse.data.tasks || [];

                setTasks(taskData);

                const referralResponse = await axios.get(`https://api.tonlottery.info/api/getReferralUsers?telegramId=${telegramId}`);
                setActiveReferrals(referralResponse.data.activeReferredUsers.length);

                const completedReferralTasks = taskData.reduce((acc: { [key: string]: boolean }, task: { name: string; completed: boolean }) => {
                    if (task.name.startsWith('task5') || task.name.startsWith('task6') || task.name.startsWith('task7')) {
                        acc[task.name] = task.completed;
                    }
                    return acc;
                }, {});

                setReferralTicketsClaimed(completedReferralTasks);
                setClaimedTasks(completedReferralTasks);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const completeTask = async (taskName: string) => {
        try {
            const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
            const telegramUsername = window.Telegram.WebApp.initDataUnsafe.user.username;

            await axios.get(`https://api.tonlottery.info/api/completeTask?telegramId=${telegramId}&telegramUsername=${telegramUsername}&taskName=${taskName}`);
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.name === taskName ? { ...task, completed: true } : task
                )
            );

            toast.success(`Task ${taskName} completed! We will manually verify the results in the next 3 hours to ensure that the task has been completed successfully.`);
        } catch (error) {
            console.error(`Error completing ${taskName}:`, error);
        }
    };

    const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWalletAddress(e.target.value);
        localStorage.setItem('walletAddress', e.target.value);
    };

    const claimFreeTickets = async (milestone: number) => {
        const taskName = milestone === 3 ? 'task5' : milestone === 6 ? 'task6' : 'task7';

        if (referralTicketsClaimed[taskName]) {
            toast.info('This referral claim has already been completed.');
            return;
        }

        try {
            const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
            const response = await axios.get(`https://api.tonlottery.info/api/buyFreeTickets?telegramId=${telegramId}&milestone=${milestone}`);
            const newTickets = response.data.ticketNumbers;

            toast.info(`You have received ${milestone} free tickets: ${newTickets.join(', ')}`);

            const storedTickets = JSON.parse(localStorage.getItem('ticketNumbers') || '[]');
            const updatedTickets = storedTickets.concat(newTickets);
            localStorage.setItem('ticketNumbers', JSON.stringify(updatedTickets));
            setReferralTicketsClaimed(prev => ({ ...prev, [taskName]: true }));

            await completeTask(taskName);

            await saveWalletDataToServer({
                address: localStorage.getItem('walletAddress') || '',
                telegramUsername: window.Telegram.WebApp.initDataUnsafe.user.username,
                telegramId: window.Telegram.WebApp.initDataUnsafe.user.id,
                newTickets,
                allTickets: updatedTickets,
                lastTransaction: new Date().toISOString(),
            });

            setClaimedTasks(prev => ({ ...prev, [taskName]: true }));

        } catch (error) {
            console.error('Error claiming free tickets:', error);
            toast.error('Error claiming free tickets. Please try again later.');
        }
    };

    const saveWalletDataToServer = async (data: { address: string, telegramUsername: string, telegramId: number | null, newTickets: number[], allTickets: number[], lastTransaction: string }) => {
        try {
            const { address, telegramUsername, telegramId, newTickets, allTickets, lastTransaction } = data;
            const queryParams = `?address=${encodeURIComponent(address)}&telegramUsername=${encodeURIComponent(telegramUsername)}&telegramId=${telegramId}&newTickets=${JSON.stringify(newTickets)}&allTickets=${JSON.stringify(allTickets)}&lastTransaction=${encodeURIComponent(lastTransaction)}`;

            const response = await axios.get(`https://api.tonlottery.info/api/saveWalletData${queryParams}`);

            if (response.status === 200) {
                console.log('Wallet data saved on server successfully.');
            } else {
                console.error('Failed to save wallet data on server.');
            }
        } catch (error) {
            console.error('Error saving wallet data on server:', error);
        }
    };

    const handleTaskButtonClick = async (taskName: string) => {
        try {
            if (taskName === 'task1') {
                window.open('https://t.me/tonlotterybotchannel', '_blank');
            } else if (taskName === 'task2') {
                window.open('https://www.youtube.com/@Tonlottery', '_blank');
            } else if (taskName === 'task3') {
                window.open('https://x.com/Tonlotterybot', '_blank');
            } else if (taskName === 'task4') {
                window.open('https://www.instagram.com/tonlottery_bot?igsh=ZTJmdXVyc21haG1z&utm_source=qr', '_blank');
            }

            if (!claimedTasks[taskName]) {
                await completeTask(taskName);
            }
        } catch (error) {
            console.error('Error handling task button click:', error);
        }
    };

    const renderPrerequisiteTasks = () => {
        return tasks.slice(0, 4).map((task, index) => (
            <div key={index} className="task-item">
                <p className={`task-name ${task.completed ? 'completed' : ''}`}>
                    {task.completed ? 'Completed' : 'Not Completed'}
                </p>
                <button
                    className={`task-button ${task.completed ? 'completed' : ''}`}
                    onClick={() => handleTaskButtonClick(task.name)}
                >
                    {task.name === 'task1' ? 'Follow Telegram Channel' :
                        task.name === 'task2' ? 'Subscribe YouTube Channel' :
                            task.name === 'task3' ? 'Follow Twitter Account' :
                                task.name === 'task4' ? 'Follow Instagram Account' :
                                    'Complete Task'}
                </button>
            </div>
        ));
    };

    const renderReferralTasks = () => {
        const referralMilestones = [3, 6, 9];
        const allSocialMediaCompleted = tasks.slice(0, 4).every(task => task.completed);
        return referralMilestones.map((milestone, index) => {
            const taskName = milestone === 3 ? 'task5' : milestone === 6 ? 'task6' : 'task7';
            const isClaimed = referralTicketsClaimed[taskName];
            const isDisabled = isClaimed || !allSocialMediaCompleted || activeReferrals < milestone;
            return (
                <div key={index} className="task-item">
                    <p className={`task-name ${isClaimed ? 'completed' : ''}`}>
                        {isClaimed ? `${milestone} Tickets Claimed` : `${milestone} Free Tickets`}
                    </p>
                    <button
                        className={`task-button ${isClaimed ? 'completed' : isDisabled ? 'not-available' : ''}`}
                        onClick={() => {
                            if (!isClaimed && !isDisabled && !claimedTasks[taskName]) {
                                setClaimingTickets(milestone);
                                setShowModal(true);
                            }
                        }}
                        disabled={isDisabled}
                    >
                        {isClaimed ? 'Claimed' : isDisabled ? `Need ${milestone} active referrals` : 'Claim'}
                    </button>
                </div>
            );
        });
    };

    return (
        <div className="task-container">
            <img src={taskimg} alt="Task List" className="task-image" />
            {loading ? (
                <p>Loading tasks...</p>
            ) : (
                <>
                    <h3>Prerequisite</h3>
                    <div className="tasks-list">
                        {renderPrerequisiteTasks()}
                    </div>
                    <h3>Tasks</h3>
                    <div className="tasks-list">
                        {renderReferralTasks()}
                    </div>
                </>
            )}
    
            {showModal && claimingTickets !== null && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Enter Wallet Address</h3>
                        <input
                            type="text"
                            value={walletAddress}
                            onChange={handleWalletAddressChange}
                            placeholder="Enter your wallet address"
                        />
                        <button onClick={() => {
                            claimFreeTickets(claimingTickets);
                            setShowModal(false);
                        }}>
                            Submit
                        </button>
                        <button onClick={() => setShowModal(false)}>Cancel</button>
                    </div>
                </div>
            )}
            <ToastContainer 
                position="top-center" 
                theme="dark" 
                autoClose={50000} 
                hideProgressBar={false} 
                newestOnTop 
                closeOnClick 
                rtl={false} 
                pauseOnFocusLoss 
                draggable 
                pauseOnHover 
            />
        </div>
    );
};

// Adding the preload method as a static property
Task.preload = async () => {
    try {
        const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
        await axios.get(`https://api.tonlottery.info/api/getTaskStatus?telegramId=${telegramId}`);
        await axios.get(`https://api.tonlottery.info/api/getReferralUsers?telegramId=${telegramId}`);
        console.log('Preloaded Task component data');

        const img = new Image();
        img.src = taskimg;
        console.log('Preloaded tickets image');

    } catch (error) {
        console.error('Error preloading Task component data:', error);
    }
};

export default Task;
