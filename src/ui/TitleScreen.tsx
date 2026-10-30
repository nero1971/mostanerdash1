import React, { useState } from "react";
import { GameEngine } from "../game/GameEngine";
import { soundManager } from "../audio/SoundManager";
import {
  Compass,
  FileText,
  Info,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  Truck,
} from "lucide-react";

interface TitleScreenProps {
  engine: GameEngine;
  onPlay: () => void;
  onOpenMissions: () => void;
  onOpenMap: () => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  engine,
  onPlay,
  onOpenMissions,
  onOpenMap,
  onOpenGarage,
  onOpenSettings,
}) => {
  const [showAbout, setShowAbout] = useState(false);
  const [isMuted, setIsMuted] = useState(engine.settings.sound.muted);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    engine.settings.sound.muted = next;
    soundManager.updateVolumes(engine.settings.sound);
  };

  const handleStart = () => {
    soundManager.playUiClick();
    onPlay();
  };

  const hasSave = engine.completedMissions.length > 0 || engine.player.money > 150;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-12 overflow-hidden bg-gradient-to-b from-emerald-950 via-stone-950 to-stone-950 text-stone-100 font-bangla select-none">
      {/* Animated Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
        {/* Sun glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
        {/* Green village hills */}
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-emerald-900/60 to-transparent" />
      </div>

      {/* Top Bar: Language & Sound Toggles */}
      <div className="relative z-20 flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold text-xs tracking-wider">
            সংস্করণ ১.০ · রাধানগর জেলা
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-stone-900/80 border border-stone-700 hover:border-emerald-500 text-stone-300"
            title="শব্দ অন/অফ"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Center: Bespoke Inline SVG Title Lockup */}
      <div className="relative z-20 flex flex-col items-center text-center my-auto py-4">
        {/* Bespoke SVG Title */}
        <div className="max-w-xl w-full px-4">
          <svg viewBox="0 0 540 120" className="w-full h-auto drop-shadow-2xl">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="50%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
            </defs>
            {/* Title Text in Bengali with Shadow */}
            <text
              x="270"
              y="75"
              textAnchor="middle"
              fill="#064e3b"
              fontSize="54"
              fontWeight="bold"
              fontFamily="'Tiro Bangla', 'Hind Siliguri', serif"
              dy="3"
            >
              মস্তানের দেশ ১
            </text>
            <text
              x="270"
              y="72"
              textAnchor="middle"
              fill="url(#titleGrad)"
              fontSize="54"
              fontWeight="bold"
              fontFamily="'Tiro Bangla', 'Hind Siliguri', serif"
            >
              মস্তানের দেশ ১
            </text>
          </svg>
        </div>

        <p className="text-amber-300/90 font-semibold tracking-widest text-xs sm:text-sm uppercase mt-1">
          Mastan-er Desh 1 — Bengali Open World Action
        </p>

        <p className="text-stone-300 text-xs sm:text-sm max-w-md mt-3 leading-relaxed">
          উন্মুক্ত গ্রাম ও শহর, ডাকাত ও মাস্তানের সাথে মারামারি, রামদা-হাতবোমা-গুলি, ফেরিওয়ালার হাঁকডাক এবং আনলিমিটেড ওপেন ওয়ার্ল্ড স্বাধীনতা!
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-md">
          <button
            onClick={handleStart}
            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-base shadow-xl flex items-center justify-center gap-2.5 active:scale-95 transition-all border border-emerald-300/40 group"
          >
            <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            <span>{hasSave ? "খেলা চালিয়ে যান (Continue)" : "খেলা শুরু করুন (Start)"}</span>
          </button>

          {hasSave && (
            <button
              onClick={() => {
                if (confirm("আপনি কি নতুন করে শুরু করতে চান?")) {
                  engine.resetProgress();
                  onPlay();
                }
              }}
              className="py-4 px-5 rounded-2xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>নতুন খেলা (New Game)</span>
            </button>
          )}
        </div>

        {/* Secondary Navigation Grid */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-md w-full">
          <button
            onClick={onOpenMissions}
            className="px-3.5 py-2 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-emerald-500 text-stone-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>মিশন তালিকা</span>
          </button>
          <button
            onClick={onOpenMap}
            className="px-3.5 py-2 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-emerald-500 text-stone-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>সম্পূর্ণ ম্যাপ</span>
          </button>
          <button
            onClick={onOpenGarage}
            className="px-3.5 py-2 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-emerald-500 text-stone-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span>যানবাহন</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="px-3.5 py-2 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-emerald-500 text-stone-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-stone-400" />
            <span>সেটিংস</span>
          </button>
          <button
            onClick={() => setShowAbout(!showAbout)}
            className="px-3.5 py-2 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-emerald-500 text-stone-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-purple-400" />
            <span>গেম সম্পর্কে</span>
          </button>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-emerald-500/40 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-emerald-300">আমাদের গ্রাম বাংলা সম্পর্কে</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              “আমাদের গ্রাম বাংলা” বাংলাদেশের গ্রাম্য প্রকৃতির অপার সৌন্দর্য ও গ্রামীণ জীবনধারার অনুপ্রেরণায় নির্মিত একটি সম্পূর্ণ ২ডি ওপেন-ওয়ার্ল্ড অ্যাডভেঞ্চার গেম।
            </p>
            <ul className="text-xs text-stone-400 space-y-1 list-disc pl-4">
              <li>১৬টি সমৃদ্ধ গ্রামীণ অঞ্চল (ধানের খেত, পদ্মা নদীর ঘাট, হাটবাজার, স্কুল)</li>
              <li>১৪+ ঐতিহ্যবাহী বাহন (রিকশা, সিএনজি, ট্রলার, ট্রাক্টর, বাস)</li>
              <li>১৫টি স্বয়ংসম্পূর্ণ লক্ষ্যভিত্তিক মিশন</li>
              <li>ওয়েব অডিও সিন্থেসাইজারে নিখুঁত গ্রামীণ আবহসংগীত ও শব্দ</li>
            </ul>
            <button
              onClick={() => setShowAbout(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* Single Flat Control-Hint Line */}
      <div className="relative z-20 text-center text-[11px] sm:text-xs text-stone-400 border-t border-stone-800/80 pt-3">
        <span className="font-semibold text-emerald-400">কন্ট্রোল: </span>
        <span>WASD / জয়স্টিক Move · Space হর্ন/ঘণ্টি · E যানবাহন/কথা বলুন · Shift দৌড় · P ফোন · M ম্যাপ · Esc পজ</span>
      </div>
    </div>
  );
};
