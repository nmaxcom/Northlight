import { useEffect } from 'react';
import { LauncherBar } from './components/LauncherBar';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const view = new URLSearchParams(window.location.search).get('view') ?? 'launcher';

  useEffect(() => {
    document.body.dataset.nativeShell = 'true';

    return () => {
      delete document.body.dataset.nativeShell;
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {view === 'settings' ? <SettingsView /> : <LauncherBar />}
    </div>
  );
}
