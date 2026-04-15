import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { SettingsViewV3 } from '../components/SettingsViewV3';
import '../styles/global.css';
import '@mantine/core/styles.css';
import { theme } from '../theme';

document.body.dataset.nativeShell = 'true';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <SettingsViewV3 />
    </MantineProvider>
  </React.StrictMode>
);
