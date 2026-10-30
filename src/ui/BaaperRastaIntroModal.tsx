import React from "react";
import { GameEngine } from "../game/GameEngine";
import { soundManager } from "../audio/SoundManager";
import { Play, ShieldAlert, Car, ShoppingBag, Swords, Compass, Volume2 } from "lucide-react";

interface Props {
  engine: GameEngine;
  onStart: () => void;
}

export const BaaperRastaIntroModal: React.FC<Props> = ({ engine, onStart }) => {
  const handleStart = () => {
    soundManager.resume();
    soundManager.playUiClick();
    soundManager.playRickshawBell();
    onStart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-stone-900 via-stone-900 to-emerald-950 border-2 border-emerald-500/70 rounded-2xl shadow-2xl shadow-emerald-950/60 p-5 sm:p-7 text-white text-center my-auto">
        
        {/* Banner Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-bold tracking-wide uppercase mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          খাঁটি গ্রামীণ অ্যাকশন গেম
        </div>

        {/* Title Badge Inspired by "মস্তানের দেশ ১" */}
        <div className="relative mb-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-300 to-green-400 drop-shadow-md">
            মস্তানের দেশ ১
          </h1>
          <p className="text-emerald-400 text-xs sm:text-sm font-semibold tracking-wider mt-1">
            বাপের রাস্তা ও উন্মুক্ত ওপেন ওয়ার্ল্ড অভিযান
          </p>
        </div>

        {/* Humorous Authentic Dialogue Quote */}
        <div className="bg-stone-950/70 border border-amber-500/30 rounded-xl p-2.5 sm:p-3 mb-4 text-xs sm:text-sm text-amber-200 leading-relaxed italic">
          &ldquo;রাস্তায় কি বাপের পাইছস নাকি রে?! সাবধানে রিকশা-সিএনজি চালা, রাতের সশস্ত্র ডাকাত ও বোমাবাজদের রামদা দিয়ে শায়েস্তা কর, ফেরিওয়ালার খাবার খা আর মিশন জেত!&rdquo;
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 text-left mb-5 text-xs sm:text-sm">
          <div className="flex items-start gap-2 bg-stone-800/60 p-2.5 rounded-lg border border-stone-700/50">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-200">বিশাল শহর ও গ্রাম</p>
              <p className="text-stone-400 text-[11px] sm:text-xs">মেঠোপথ থেকে ৪ লেনের জেলা সদর শহর</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-stone-800/60 p-2.5 rounded-lg border border-stone-700/50">
            <Car className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-200">মসৃণ গাড়ি ও হাঁটা</p>
              <p className="text-stone-400 text-[11px] sm:text-xs">সহজ কন্ট্রোল, রিকশা, সিএনজি ও কার</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-stone-800/60 p-2.5 rounded-lg border border-stone-700/50">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-cyan-200">দোকানে প্রবেশ করুন</p>
              <p className="text-stone-400 text-[11px] sm:text-xs">চা স্টল, মুদি, গ্যারেজ, থানা ও হাসপাতাল</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-stone-800/60 p-2.5 rounded-lg border border-stone-700/50">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">গুন্ডা মারামারি ও সাউন্ড</p>
              <p className="text-stone-400 text-[11px] sm:text-xs">ধাক্কায় ছিটকে পড়া ও মজার বাংলা ডায়ালগ</p>
            </div>
          </div>
        </div>

        {/* Big Glow Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 sm:py-4 px-6 rounded-xl font-black text-lg sm:text-xl text-stone-950 bg-gradient-to-r from-amber-400 via-emerald-400 to-green-400 hover:from-amber-300 hover:to-emerald-300 shadow-lg shadow-emerald-500/30 transform active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-stone-950" />
          <span>শুরু করুন (START GAME)</span>
        </button>

        <p className="text-stone-400 text-[11px] sm:text-xs mt-3">
          মোবাইলে অন-স্ক্রিন ডি-প্যাড বা জয়স্টিক দিয়ে খেলতে পারবেন
        </p>
      </div>
    </div>
  );
};
