import React from 'react';
import { createRoot } from 'react-dom/client';
import TeleICUDashboard from '../tele_icu_command_center';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TeleICUDashboard />
  </React.StrictMode>,
);
