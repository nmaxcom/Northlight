import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { LauncherBar } from '../components/LauncherBar';
import { getLauncherMockState, type LauncherMockVariant } from './launcherMockState';
import '../styles/global.css';
import '@mantine/core/styles.css';
import { theme } from '../theme';

document.body.dataset.nativeShell = 'true';
document.body.dataset.designHosted = 'true';

const variant = (document.body.dataset.mockVariant as LauncherMockVariant | undefined) ?? 'current';
const mockState = getLauncherMockState(variant);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <LauncherBar mockState={mockState} />
    </MantineProvider>
  </React.StrictMode>
);
