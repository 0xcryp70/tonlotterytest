import axios from 'axios';

const instance = axios.create({
    baseURL: 'https://api.tonlottery.info',
    timeout: 5000, // Adjust timeout as needed
    headers: {
        'Content-Type': 'application/json',
    },
});

export default instance;

