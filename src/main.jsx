import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { IconContext } from '@phosphor-icons/react';
import '@fontsource-variable/outfit';
import '@fontsource-variable/geist';
import App from './App';
import { AppProvider } from './auth';
import './styles.css';
createRoot(document.getElementById('root')).render(
  <IconContext.Provider value={{ weight: 'regular', size: 18 }}>
    <BrowserRouter><AppProvider><App /></AppProvider></BrowserRouter>
  </IconContext.Provider>
);
