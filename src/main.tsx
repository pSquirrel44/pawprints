import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const brandedHosts = new Set([
  'pawprintsnetwork.com',
  'www.pawprintsnetwork.com',
  'instameow.app',
  'www.instameow.app',
  'instawoof.app',
  'www.instawoof.app',
]);
const appBasePath = brandedHosts.has(window.location.hostname.toLowerCase()) ? '/app' : '/';
const appHomeUrl = appBasePath === '/' ? '/' : `${appBasePath}/`;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignInUrl={appHomeUrl} afterSignUpUrl={appHomeUrl}>
      <BrowserRouter basename={appBasePath}>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
