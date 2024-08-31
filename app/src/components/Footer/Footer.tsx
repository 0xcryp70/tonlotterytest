import { BorderRadius, Locales, ReturnStrategy, Theme, THEME, useTonConnectUI } from "@tonconnect/ui-react";
import './Footer.scss';
import { useEffect } from "react";
import WebApp from '@twa-dev/sdk';
import { Link, useLocation } from 'react-router-dom';

const vibrate = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'error' | 'warning' | 'success' = 'heavy'): void => {
  switch (style) {
    case 'light':
    case 'medium':
    case 'heavy':
    case 'rigid':
    case 'soft':
      WebApp.HapticFeedback.impactOccurred(style);
      break;
    case 'error':
    case 'warning':
    case 'success':
      WebApp.HapticFeedback.notificationOccurred(style);
      break;
  }
};

export const Footer = () => {
    const location = useLocation();

    useEffect(() => {
        // Add your side-effect logic here
    }, []);

  const handleNavClick = () => {
    vibrate('medium');
  };

    return (
        <footer className="footer">
            <nav className="footer-nav" onClick={handleNavClick}>
                <Link to="/" className={`footer-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                    <img src="./src/assets/images/home.png" alt="Home" className="icon" />
                    <span>Home</span>
                </Link>
		<Link to="/tickets" className={`footer-nav-item ${location.pathname === '/tickets' ? 'active' : ''}`}>
                    <img src="./src/assets/images/tickets.png" alt="Tickets" className="icon" />
                    <span>My Tickets</span>
                </Link>
                <Link to="/task" className={`footer-nav-item ${location.pathname === '/task' ? 'active' : ''}`}>
                    <img src="./src/assets/images/tasks.png" alt="Tasks" className="icon" />
                    <span>Tasks</span>
                </Link>
        {/*        <Link to="/infopage" className={`footer-nav-item ${location.pathname === '/infopage' ? 'active' : ''}`}>
                    <img src="./src/assets/images/read.png" alt="Info" className="icon" />
                    <span>Information</span>
                </Link>
           */}
                <Link to="/ref" className={`footer-nav-item ${location.pathname === '/ref' ? 'active' : ''}`}>
                    <img src="./src/assets/images/invite.png" alt="Invite" className="icon" />
                    <span>Invite</span>
                </Link>
            </nav>
        </footer>
    );
};
