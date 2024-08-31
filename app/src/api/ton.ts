import axios from 'axios';

const TON_API_URL = 'https://toncenter.com/api/v3/account';
const API_KEY = 'ba946b838738262a29f7411999d92476162aa73e8db2a359e7880565f4f6cdd2';  // Replace 'your-api-key-here' with your actual API key

export const getWalletBalance = async (walletAddress: string): Promise<number | string> => {
  try {
    const response = await axios.get(`${TON_API_URL}?address=${walletAddress}`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    console.log('API Response:', response.data);

    if (response.data && response.data.balance) {
      const balance = parseInt(response.data.balance, 10) / 1e9; // Convert from nanograms to TON
      return balance;
    } else {
      throw new Error('No balance found in response');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        return 'Rate limit exceeded. Please try again later.';
      } else {
        console.error('Axios error:', error.response?.data || error.message);
        return `Error fetching balance: ${error.response?.data || error.message}`;
      }
    } else {
      console.error('Unknown error:', error);
      return `Error fetching balance: ${error.message}`;
    }
  }
};

