import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import './App.scss';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { THEME, TonConnectUIProvider } from "@tonconnect/ui-react";
import { Footer } from "./components/Footer/Footer";
import { Header } from "./components/Header/Header";
import Infopage from "./components/Infopage/Infopage";
import Task from "./components/Task/Task";
import Ref from "./components/Ref/Ref";
import Tickets from "./components/Tickets/Tickets";
import Withdrawal from "./components/Withdrawal/Withdrawal";
import { TxForm } from "./components/TxForm/TxForm";
import { BalanceDisplay } from './components/BalanceDisplay/BalanceDisplay';
import './fonts.css';
import axios from 'axios';

function App() {
  const [ticketNumbers, setTicketNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicketNumbers = async () => {
      try {
        const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
        const id = initDataUnsafe?.user?.id;
        const firstName = initDataUnsafe?.user?.first_name;

        if (!id) {
          console.error('Telegram ID not found');
          return;
        }

        // Save telegramId and firstName to localStorage
        localStorage.setItem('telegramId', id);
        localStorage.setItem('firstName', firstName);

        // Delete existing tickets from localStorage
        localStorage.removeItem('ticketNumbers');

        // Fetch ticket numbers from the backend
        const response = await axios.get('https://api.tonlottery.info/api/getTicketNumbers', {
          params: { telegramId: id }  // Pass the telegramId as a query parameter
        });

        if (response.status === 200) {
          const fetchedTickets = response.data.ticketNumbers || [];
          setTicketNumbers(fetchedTickets);

          // Save the fetched ticket numbers to localStorage
          localStorage.setItem('ticketNumbers', JSON.stringify(fetchedTickets));
        }
      } catch (error) {
        console.error('Error fetching ticket numbers:', error);
      } finally {
        setTimeout(() => {
          setLoading(false); // Hide the loading spinner after fetching data
        }, 2000); // Delay to ensure smooth UX
      }
    };

    fetchTicketNumbers();
    // Preload all the pages
    preloadPages();
  }, []);

  const preloadPages = () => {
    Infopage.preload?.();
    Task.preload?.();
    Ref.preload?.();
    Tickets.preload?.();
    Withdrawal.preload?.();
  };

  const getLevel = (ticketCount: number) => {
    if (ticketCount >= 100) return 'Diamond';
    if (ticketCount >= 50) return 'Platinum';
    if (ticketCount >= 10) return 'Gold';
    if (ticketCount >= 5) return 'Silver';
    if (ticketCount >= 1) return 'Bronze';
    return 'NoT VIP';
  };

  const walletAddress = 'UQDWmTyoXiL899TEnDhIEgZtmNdFFOkgumvhXPRLmuLvPOBr';

  const memberLevel = getLevel(ticketNumbers.length);

  return (
    <TonConnectUIProvider
      manifestUrl="https://app.tonlottery.info/tonconnect-manifest.json"
      uiPreferences={{ theme: THEME.DARK }}
      walletsListConfiguration={{
        includeWallets: [
          // Wallet configurations...
        ]
      }}
      actionsConfiguration={{
        twaReturnUrl: 'https://t.me/lotterytoncoin_bot/?start'
      }}
    >
      <Router>
        <div className="app">
          {loading ? (
            <Loader />
          ) : (
            <>
              <Header memberLevel={memberLevel} />
              <Routes>
                <Route path="/" element={
                  <>
                    <BalanceDisplay walletAddress={walletAddress} memberLevel={memberLevel} />
                    <TxForm ticketNumbers={ticketNumbers} setTicketNumbers={setTicketNumbers} />
                  </>
                } />
                <Route path="/infopage" element={<Infopage />} />
                <Route path="/ref" element={<Ref />} />
                <Route path="/task" element={<Task />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/withdrawal" element={<Withdrawal />} />
              </Routes>
              <Footer />
            </>
          )}
        </div>
      </Router>
    </TonConnectUIProvider>
  );
}

export default App;
