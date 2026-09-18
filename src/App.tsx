import React from 'react';
import { AppProvider } from './lib/AppContext';
import RichApp from './RichApp';

export default function App() {
  return (
    <AppProvider>
      <RichApp />
    </AppProvider>
  );
}
