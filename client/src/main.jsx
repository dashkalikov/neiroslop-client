import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import PushDecision from './components/PushDecision.jsx';
import { createPortal } from 'react-dom';
import { LanguageProvider } from './LanguageContext.jsx';
import './styles/base.css';
import './styles/premium.css';
import './styles/themes-and-controls.css';
import './styles/slot-craft.css';
import './styles/fishing-and-settings.css';
import './styles/sound-and-lever.css';
import './styles/brand-and-carousel.css';
import './styles/saloon.css';
import './styles/velvet.css';
import './styles/win-effects.css';
import './styles/roulette-and-account.css';
import './styles/roulette-wheel-model.css';
import './styles/account-security.css';
import './styles/account-access.css';
import './styles/liquid-glass.css';
import './styles/wallet-rewards.css';
import './styles/tall-reels.css';

function readApproval() {
  return /^#push-(approve|deny)\/([A-Za-z0-9_-]{43})$/.exec(location.hash);
}

function Client() {
  const [approval, setApproval] = useState(readApproval);
  useEffect(() => {
    const openApproval = () => {
      const request = readApproval();
      if (request) setApproval(request);
    };
    window.addEventListener('hashchange', openApproval);
    return () => window.removeEventListener('hashchange', openApproval);
  }, []);

  if (!approval) return <App />;
  return createPortal(
    <PushDecision key={approval[2]} initialDecision={approval[1]} token={approval[2]} />,
    document.getElementById('startup-account'),
  );
}

createRoot(document.getElementById('root')).render(<LanguageProvider><Client /></LanguageProvider>);
