import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Infopage.scss';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import welcomeImage from '../../assets/images/information.png'; // Adjust the path accordingly

const Infopage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0); 
  }, []);

  return (
    <div className="infopage">
      <div className="content-container">
	<img src={welcomeImage} alt="Welcome Image" className="welcome-image" />
        <h2>Welcome to Ton Lottery!</h2>
        <p>
          Ton Lottery is the first-ever cryptocurrency lottery bot that uses TON coin for investment and exciting prizes. Here’s how it works:
        </p>

        <h2>How to Participate</h2>
        <p>
          Dive into the excitement by purchasing a ticket on the main page for just 0.3 TON! Each ticket purchase grants you an 8-digit random number, issued as a unique NFT. The thrill intensifies as the ticket price doubles if the prize remains unclaimed after 3 months, creating even bigger winnings. This cycle continues until a winner is found, at which point the ticket price resets to 0.3 TON.
        </p>

        <h2>Prize Types</h2>
        <p>We offer three thrilling types of prizes:</p>

        <h3>1. Monthly Prize</h3>
        <p>
          Every month, one lucky winner is selected to receive 10% of the total assets accumulated from ticket sales and investments. The winner is randomly chosen from those holding an 8-digit TON Lottery NFT number. Get ready for monthly excitement!
        </p>

        <h3>2. Full Prize</h3>
        <p>
          Every three months, the stakes get even higher! One lucky winner will receive the full prize, which consists of all the coins saved in the bot's main wallet. Using a Python script, we generate a random 8-digit number based on the last block of Bitcoin mining. This ensures absolute transparency and fairness. If no one holds the winning number, the prize rolls over to the next round, making the jackpot even bigger!
        </p>

        <h3>3. VIP Prize</h3>
        <p>
          This exclusive prize is for our VIP members who have purchased more than 10 tickets. Details about this incredible prize will be announced soon. Stay tuned for more exciting updates!
        </p>

        <h2>Transparency and Trust</h2>
        <p>
          We ensure complete transparency by providing the Python code used to generate the winning number. This code can be run by anyone, ensuring that the winning number is truly random and fair. Trust and excitement go hand-in-hand at Ton Lottery!Check our Telegram channel to see the code.
        </p>
        
	<h2>Special Offer</h2>
        <p>
          For a limited time, we are offering each wallet a unique NFT art piece. As we grow, all NFTs will be standardized to a basic design. Don’t miss out on these exclusive art pieces!
        </p>
{/*
        <Link to="https://getgems.io/tonlotterybot">
          <button className="go-back-button">Go To NFT Collection</button>
        </Link>   
*/} 
      </div>
    </div>
  );
}

export default Infopage;
