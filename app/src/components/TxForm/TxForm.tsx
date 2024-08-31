import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './style.scss';
import { SendTransactionRequest, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import Modal from 'react-modal';
import sendTransactionImage from '../../assets/images/main.png';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ticketPrice = 300000000; // Price for one ticket in minimal units

Modal.setAppElement('#root'); // Set the root element for accessibility

export function TxForm({ ticketNumbers, setTicketNumbers }) {
  const [numTickets, setNumTickets] = useState<number>(1);
  const [tx, setTx] = useState<SendTransactionRequest>({
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [
      {
        address: 'UQDWmTyoXiL899TEnDhIEgZtmNdFFOkgumvhXPRLmuLvPOBr',
        amount: (ticketPrice).toString(),
      },
    ],
  });
  const [walletData, setWalletData] = useState<any>(null);
  const wallet = useTonWallet();
  const [tonConnectUi] = useTonConnectUI();
  const [telegramUsername, setTelegramUsername] = useState<string>('');
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
    if (initDataUnsafe && initDataUnsafe.user) {
      setTelegramUsername(initDataUnsafe.user.username);
      setTelegramId(initDataUnsafe.user.id);
    }
  }, []);

  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tickets = parseInt(e.target.value, 10);
    setNumTickets(tickets);
    updateTransaction(tickets);
  };

  const updateTransaction = (tickets: number) => {
    setTx({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: 'UQDWmTyoXiL899TEnDhIEgZtmNdFFOkgumvhXPRLmuLvPOBr',
          amount: (ticketPrice * tickets).toString(),
        },
      ],
    });
  };

  const requestTicketNumbers = async (tickets: number): Promise<number[]> => {
    try {
      const response = await axios.get(`https://api.tonlottery.info/api/generateTickets?numTickets=${tickets}`);
      console.log('Server response:', response);

      if (response.status === 200) {
        const ticketNumbers = response.data.ticketNumbers || response.data.numbers;
        if (Array.isArray(ticketNumbers)) {
          console.log('Generated ticket numbers:', ticketNumbers);
          return ticketNumbers;
        } else {
          throw new Error('Invalid response structure: ticket numbers are not in array format');
        }
      } else {
        throw new Error(`Failed to generate ticket numbers: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      if (error.response) {
        console.error(`Error generating ticket numbers: ${error.response.status} - ${error.response.statusText}`);
        throw new Error(`Failed to generate ticket numbers: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('Failed to generate ticket numbers: No response from server');
      } else {
        console.error('Error generating ticket numbers:', error.message);
        throw new Error(`Failed to generate ticket numbers: ${error.message}`);
      }
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const numbers = await requestTicketNumbers(numTickets);
      const message = numbers.map(number => `Your lucky number is ${number}`).join('\n');
      await tonConnectUi.sendTransaction({
        ...tx,
        messages: [
          {
            ...tx.messages[0],
            text: message,
          },
        ],
      });
      
      toast.success(`🎉 Congratulations! Here are your ticket number(s). 🎟️ Your lucky number(s): ${numbers.join(', ')}. Good luck! 🤞`, {
        position: "top-right",
        theme: "dark",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      const updatedTickets = [...ticketNumbers, ...numbers];
      localStorage.setItem('ticketNumbers', JSON.stringify(updatedTickets));
      setTicketNumbers(updatedTickets);

      const newWalletData = {
        address: wallet?.account.address,
        telegramUsername: telegramUsername,
        telegramId: telegramId,
        newTickets: numbers,
        allTickets: updatedTickets,
        lastTransaction: new Date().toISOString(),
      };
      await saveWalletDataToServer(newWalletData);

      setWalletData(newWalletData);
    } catch (error) {
      console.error('Transaction failed', error);
      toast.error('Transaction failed. Please try again.');
    } finally {
      setLoading(false);
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

  const openExternalLink = () => {
    window.open('https://getgems.io/tonlotterybot', '_blank');
  };

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleModalSubmit = () => {
    closeModal();
    handlePurchase();
  };

  return (
    <div className="send-tx-form">
      {wallet ? (
        <button onClick={openModal} disabled={loading}>
          {loading ? 'Generating Ticket Numbers...' : 'Get Ticket (0.3 ton)'}
        </button>
      ) : (
        <button onClick={() => tonConnectUi.openModal()}>Connect wallet to get your Ticket</button>
      )}

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Number of Tickets"
        className="modal-box"
        overlayClassName="modal-overlay"
      >
        <h4>Number of Tickets (Max. 90)</h4>
        <input
          type="number"
          id="numTickets"
          min="1"
          max="100"
          value={numTickets}
          onChange={handleTicketChange}
          className="modal-input"
        />
        <div className="modal-buttons">
          <button onClick={closeModal} className="modal-button cancel">Cancel</button>
          <button onClick={handleModalSubmit} className="modal-button submit">Submit</button>
        </div>
      </Modal>
    </div>
  );
}