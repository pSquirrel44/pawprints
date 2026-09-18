import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, SignIn, SignUp } from '@clerk/clerk-react';
import { AppProvider, useApp } from './lib/AppContext';
import { Sidebar } from './components/ui/Sidebar';
import { RightSidebar } from './components/ui/RightSidebar';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';

function Layout() {
  const { theme } = useApp();
  const { isSignedIn } = useAuth();

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: theme.bg, color: theme.text }}>
      <Sidebar />
      <main className="app-main" style={{
        flex: 1, minWidth: 0, maxWidth: 600,
        borderRight: `1px solid ${theme.border}`,
        borderLeft: `1px solid ${theme.border}`,
      }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:username" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/sign-in/*" element={
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <SignIn routing="path" path="/sign-in" />
            </div>
          } />
          <Route path="/sign-up/*" element={
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <SignUp routing="path" path="/sign-up" />
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {isSignedIn && <RightSidebar />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
