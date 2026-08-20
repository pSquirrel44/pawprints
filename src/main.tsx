import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';
import { initNativeBridge } from './utils/nativeBridge';

// No-op in a regular browser tab; wires up splash screen / status bar /
// Android back button when running inside the iOS or Android app.
initNativeBridge();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    '⚠️  Missing VITE_CLERK_PUBLISHABLE_KEY.\n' +
    'Add it to your .env.local file:\n' +
    'VITE_CLERK_PUBLISHABLE_KEY=pk_test_...'
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
);
