import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, Check, ArrowRight, UserCheck } from 'lucide-react';
import { CatProfile } from '../types';
import { playMeowSound, playPurrSound } from '../utils/audio';

interface SocialAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: CatProfile;
  onUpdateSocialLinked: (platform: string) => void;
}

const SOCIAL_PROVIDERS = [
  { id: 'google', name: 'Google', icon: '🌐', color: 'bg-white text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700' },
  { id: 'amazon', name: 'Amazon', icon: '🛒', color: 'bg-amber-500 text-zinc-900 border-amber-400' },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-gradient-to-r from-purple-600 via-rose-500 to-amber-500 text-white' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black text-white dark:bg-zinc-800' },
  { id: 'x', name: 'X / Twitter', icon: '🐦', color: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' },
  { id: 'facebook', name: 'Facebook', icon: '🔵', color: 'bg-blue-600 text-white' },
  { id: 'apple', name: 'Apple', icon: '🍏', color: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' },
];

export const SocialAuthModal: React.FC<SocialAuthModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onUpdateSocialLinked,
}) => {
  if (!isOpen) return null;

  const [authenticatingPlatform, setAuthenticatingPlatform] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSocialLogin = (platformName: string) => {
    setAuthenticatingPlatform(platformName);
    playPurrSound();

    setTimeout(() => {
      setAuthenticatingPlatform(null);
      onUpdateSocialLinked(platformName);
      setSuccessMessage(`Successfully authenticated as @${activeProfile.handle} via ${platformName}! Account verified.`);
      playMeowSound(1.3);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-amber-500 to-rose-500 text-white">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            <h2 className="text-base font-bold">Social Login & Account Link</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          <div className="text-center space-y-1">
            <div className="inline-block p-3 bg-rose-50 dark:bg-rose-950/40 rounded-full mb-1">
              <img
                src={activeProfile.avatar}
                alt={activeProfile.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500"
              />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Welcome to Meowgram, @{activeProfile.handle}!
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Log in or link your social accounts to sync cat posts, unlock verified badges, and earn extra treats.
            </p>
          </div>

          {activeProfile.socialLinked && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Linked to {activeProfile.socialLinked} Account</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-700 dark:text-rose-300 text-center animate-in fade-in duration-200">
              {successMessage}
            </div>
          )}

          {/* Social Provider Buttons */}
          <div className="space-y-2.5">
            {SOCIAL_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleSocialLogin(provider.name)}
                disabled={authenticatingPlatform !== null}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-xs shadow-xs border flex items-center justify-between transition-all ${provider.color} hover:opacity-90 disabled:opacity-50`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{provider.icon}</span>
                  <span>
                    {authenticatingPlatform === provider.name
                      ? `Authenticating with ${provider.name}...`
                      : `Continue with ${provider.name}`}
                  </span>
                </div>

                {activeProfile.socialLinked === provider.name ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ArrowRight className="w-4 h-4 opacity-70" />
                )}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-zinc-400 text-center italic">
            🐾 Fast, secure login powered by Meowgram OAuth & Gemini AI.
          </p>

        </div>

      </div>
    </div>
  );
};
