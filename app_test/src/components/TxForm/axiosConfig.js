import axios from 'axios';

const instance = axios.create({
    baseURL: 'https://api2.tonlottery.info',
    timeout: 5000, // Adjust timeout as needed
    headers: {
        'Content-Type': 'application/json',
    },
});

export default instance;

