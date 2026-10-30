import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import StartupGate from './components/StartupGate.jsx';
import './styles/base.css';
import './styles/premium.css';
import './styles/themes-and-controls.css';
import './styles/slot-craft.css';
import './styles/fishing-and-settings.css';
import './styles/sound-and-lever.css';
import './styles/brand-and-carousel.css';
import './styles/saloon.css';
import './styles/win-effects.css';

createRoot(document.getElementById('root')).render(<><StartupGate/><App /></>);
