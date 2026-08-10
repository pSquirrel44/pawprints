import React, { useState } from 'react';
import { X, Sparkles, Upload, RefreshCw, Flame, Eye, Trophy } from 'lucide-react';
import { CatAnalysisResult } from '../types';
import { playMeowSound, playPurrSound } from '../utils/audio';

interface CatAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_ANALYSIS_IMAGES = [
  { label: 'Judging Tuxedo', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80' },
  { label: 'Supreme Loaf', url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=800&q=80' },
  { label: 'Staring Void', url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80' },
];

export const CatAnalyzerModal: React.FC<CatAnalyzerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [imageUrl, setImageUrl] = useState(SAMPLE_ANALYSIS_IMAGES[0].url);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CatAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const res = event.target.result as string;
          setImageUrl(res);
          setImageBase64(res);
          setAnalysisResult(null);
          playMeowSound(1.1);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    playPurrSound();

    try {
      const res = await fetch('/api/gemini/cat-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64 || null,
          description: `A majestic cat photo analysis: ${imageUrl}`,
        }),
      });

      const data = await res.json();
      setAnalysisResult(data);
      playMeowSound(1.3);
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisResult({
        judgementLevel: 96,
        loafFormRating: '9.9 / 10 Flawless Tuck',
        innerMonologue: 'I am judging your life choices from this sunbeam.',
        breedEstimate: 'Majestic Domestic Short Hair',
        moodTag: 'Supreme Monarch',
        whiskersScore: '10/10 Perfect Symmetry',
        funFact: 'Cats spend 70% of their lives sleeping and 30% judging humans.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>AI Cat Vision & Judgement Meter</span>
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Gemini Multimodal Cat Judgement & Loaf Rating
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
          
          {/* Photo Preview & Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="relative aspect-square bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group">
              <img
                src={imageUrl}
                alt="Cat to analyze"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Upload Your Cat Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Select Sample Cat:
              </p>
              <div className="space-y-2">
                {SAMPLE_ANALYSIS_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setImageUrl(sample.url);
                      setImageBase64(null);
                      setAnalysisResult(null);
                      playMeowSound(1.0);
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left text-xs font-semibold transition-all ${
                      imageUrl === sample.url
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <img src={sample.url} alt={sample.label} className="w-8 h-8 rounded-lg object-cover" />
                    <span>{sample.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Cat Eyes & Loaf...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Judgement & Loaf</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="p-5 bg-zinc-50 dark:bg-zinc-800/80 rounded-3xl border border-zinc-200 dark:border-zinc-700 space-y-4 animate-in fade-in duration-300">
              
              {/* Judgement Level Meter */}
              <div>
                <div className="flex items-center justify-between mb-1 text-xs font-bold">
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <Eye className="w-4 h-4" />
                    Judgement Level:
                  </span>
                  <span className="text-rose-600 dark:text-rose-400">{analysisResult.judgementLevel}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 transition-all duration-700 ease-out"
                    style={{ width: `${analysisResult.judgementLevel}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-400 font-medium block text-[10px] uppercase">Loaf Form</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">{analysisResult.loafFormRating}</span>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-400 font-medium block text-[10px] uppercase">Mood Tag</span>
                  <span className="font-bold text-rose-500">{analysisResult.moodTag}</span>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-400 font-medium block text-[10px] uppercase">Breed Estimate</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">{analysisResult.breedEstimate}</span>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-400 font-medium block text-[10px] uppercase">Whiskers Score</span>
                  <span className="font-bold text-amber-500">{analysisResult.whiskersScore}</span>
                </div>
              </div>

              {/* Inner Monologue */}
              <div className="p-3.5 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-xs text-rose-900 dark:text-rose-200">
                <span className="font-bold block mb-0.5 text-[10px] uppercase tracking-wider text-rose-500">
                  Inner Monologue:
                </span>
                <p className="italic">"{analysisResult.innerMonologue}"</p>
              </div>

              {/* Fun Fact */}
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center italic">
                💡 {analysisResult.funFact}
              </p>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
