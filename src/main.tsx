import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import App from './App';
import '@mantine/core/styles.css';
import './styles/global.css';
import { theme } from './theme';

window.addEventListener('error', (event) => {
  console.error('[boot] window error', event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[boot] unhandled rejection', String(event.reason));
});

document.body.dataset.nativeShell = window.launcher ? 'true' : 'false';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>
);
