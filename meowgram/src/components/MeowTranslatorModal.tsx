import React, { useState } from 'react';
import { X, MessageSquare, Sparkles, Volume2, ArrowRightLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { playMeowSound, playPurrSound } from '../utils/audio';

interface MeowTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HUMAN_PRESETS = [
  'I love you sweet kitty! Time for dinner.',
  'Please stop knocking glasses off the table.',
  'Why are you staring into the empty corner at 3 AM?',
  'Get down from the refrigerator right now.',
];

const CAT_PRESETS = [
  'Meow meow prrrrr *slow blink*',
  'Meow meow *stares at bowl that is 50% empty*',
  'Hiss meow prrr *zoomies at Mach 2*',
  'Mew meow *sits directly on laptop keyboard*',
];

export const MeowTranslatorModal: React.FC<MeowTranslatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'human-to-cat' | 'cat-to-human'>('human-to-cat');
  const [inputText, setInputText] = useState(HUMAN_PRESETS[0]);
  const [translatedResult, setTranslatedResult] = useState<string | null>(null);
  const [catMood, setCatMood] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    playPurrSound();

    try {
      const res = await fetch('/api/gemini/meow-translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          text: inputText,
        }),
      });

      const data = await res.json();
      setTranslatedResult(data.translatedText || 'Meow prrr *slow blink*');
      setCatMood(data.catMood || 'Mildly Intrigued');
      setActionNote(data.actionNote || '*Tail flicks once*');
      playMeowSound(1.2);
    } catch (err) {
      console.error('Translation error:', err);
      setTranslatedResult(
        mode === 'human-to-cat'
          ? 'Meow prrrr *slow blink* (I acknowledge your request for treats).'
          : 'Translation: "Fill my bowl immediately or face midnight corridor zoomies."'
      );
      setCatMood('Regal Sovereign');
      setActionNote('*Tail flicks majestically*');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!translatedResult) return;
    navigator.clipboard?.writeText?.(translatedResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Gemini AI Meow Translator</span>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Bridge the feline-human language barrier
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Mode Switcher */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => {
                setMode('human-to-cat');
                setInputText(HUMAN_PRESETS[0]);
                setTranslatedResult(null);
                playMeowSound(1.0);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'human-to-cat'
                  ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              🗣️ Human ➔ 🐱 Cat Speak
            </button>
            <button
              onClick={() => {
                setMode('cat-to-human');
                setInputText(CAT_PRESETS[0]);
                setTranslatedResult(null);
                playMeowSound(1.1);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'cat-to-human'
                  ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              🐱 Cat Meow ➔ 👤 Human Thoughts
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Quick Presets
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(mode === 'human-to-cat' ? HUMAN_PRESETS : CAT_PRESETS).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(preset);
                    playMeowSound(1.0);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl hover:border-purple-400 shrink-0"
                >
                  "{preset.length > 25 ? preset.slice(0, 25) + '...' : preset}"
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              {mode === 'human-to-cat' ? 'Your Human Phrase' : 'Cat Sound / Meows'}
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === 'human-to-cat' ? 'Type human text...' : 'Type cat meows or sounds...'}
              className="w-full px-4 py-3 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-400"
            />
          </div>

          {/* Translate Action Button */}
          <button
            onClick={handleTranslate}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm rounded-2xl shadow-md shadow-purple-500/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Translating with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Translate to {mode === 'human-to-cat' ? 'Cat Dialect' : 'Human Thoughts'}</span>
              </>
            )}
          </button>

          {/* Translation Result Card */}
          {translatedResult && (
            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 rounded-3xl border border-purple-200 dark:border-purple-800/50 space-y-3 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐱</span>
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                    Translation Result
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playMeowSound(1.3)}
                    className="p-1.5 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-full transition-colors"
                    title="Play Meow SFX"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-full transition-colors"
                    title="Copy Translation"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-sm font-bold text-purple-950 dark:text-purple-100 leading-relaxed">
                "{translatedResult}"
              </p>

              {catMood && (
                <div className="flex items-center justify-between pt-2 border-t border-purple-200/60 dark:border-purple-800/40 text-xs">
                  <span className="text-purple-700 dark:text-purple-300 font-semibold">
                    Cat Mood: <strong className="text-purple-950 dark:text-purple-100">{catMood}</strong>
                  </span>
                  {actionNote && (
                    <span className="text-purple-600 dark:text-purple-400 italic text-[11px]">
                      {actionNote}
                    </span>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
