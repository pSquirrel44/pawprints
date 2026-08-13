import React from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';

interface ClerkAuthGateProps {
  isDog?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps the entire app. If the user is not signed in, shows a branded
 * sign-in / sign-up screen. Once authenticated, renders children.
 */
export const ClerkAuthGate: React.FC<ClerkAuthGateProps> = ({ isDog = false, children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const [showSignUp, setShowSignUp] = React.useState(false);

  // While Clerk loads, show a branded splash
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <span className="text-6xl animate-bounce">{isDog ? '🐶' : '🐱'}</span>
        <p className="text-zinc-400 text-sm font-medium animate-pulse">Loading Pawprint Network…</p>
      </div>
    );
  }

  // Signed in → render app normally
  if (isSignedIn) {
    return <>{children}</>;
  }

  // Not signed in → show Clerk's hosted UI in a branded wrapper
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 gap-6">
      {/* Branded header */}
      <div className="text-center space-y-2 mb-2">
        <div className="text-5xl">{isDog ? '🐶' : '🐱'}</div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {isDog ? 'The Dog Park' : 'The Catwalk'}
        </h1>
        <p className="text-zinc-400 text-sm">
          by <span className="text-amber-400 font-semibold">Pawprint Network</span>
        </p>
        <p className="text-zinc-500 text-xs max-w-xs">
          {isDog
            ? 'The social platform built for every good boy and good girl 🦴'
            : 'The social platform where cats run everything 🐾'}
        </p>
      </div>

      {/* Clerk hosted component — handles all sign-in/sign-up flows */}
      {showSignUp ? (
        <SignUp
          appearance={{
            variables: {
              colorPrimary: '#f97316',
              colorBackground: '#18181b',
              colorText: '#f4f4f5',
              colorInputBackground: '#27272a',
              colorInputText: '#f4f4f5',
              borderRadius: '1rem',
            },
          }}
          routing="hash"
          signInUrl="#sign-in"
        />
      ) : (
        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#f97316',
              colorBackground: '#18181b',
              colorText: '#f4f4f5',
              colorInputBackground: '#27272a',
              colorInputText: '#f4f4f5',
              borderRadius: '1rem',
            },
          }}
          routing="hash"
          signUpUrl="#sign-up"
        />
      )}

      {/* Toggle between sign-in and sign-up */}
      <p className="text-zinc-500 text-xs text-center">
        {showSignUp ? 'Already have an account? ' : "Don't have an account? "}
        <button
          onClick={() => setShowSignUp(!showSignUp)}
          className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
        >
          {showSignUp ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </div>
  );
};
