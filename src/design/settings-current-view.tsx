import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { SettingsView } from '../components/SettingsView';
import '../styles/global.css';
import '@mantine/core/styles.css';
import { theme } from '../theme';

document.body.dataset.nativeShell = 'true';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <SettingsView />
    </MantineProvider>
  </React.StrictMode>
);
