import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initNativePlugins } from './lib/nativeInit';
import { initMonitoring } from './lib/monitoring';
import ErrorBoundary from './components/ErrorBoundary';

initMonitoring();
initNativePlugins();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
