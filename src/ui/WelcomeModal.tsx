import React from "react";
import { soundManager } from "../audio/SoundManager";
import {
  Car,
  Compass,
  Gift,
  Heart,
  HelpCircle,
  MapPin,
  Plane,
  Play,
  Rocket,
  ShieldAlert,
  Ship,
  Sparkles,
  Swords,
  Train,
  X,
} from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimDailyBonus: () => void;
  dailyClaimed: boolean;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onClaimDailyBonus,
  dailyClaimed,
}) => {
  if (!isOpen) return null;

  const handleStartGame = () => {
    soundManager.resume();
    soundManager.playLevelUp();
    if (!dailyClaimed) {
      onClaimDailyBonus();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none font-bangla animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-stone-900 border-2 border-emerald-500/80 rounded-3xl shadow-2xl overflow-hidden text-stone-100">
        {/* Decorative Top Glowing Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-emerald-900 via-green-800 to-teal-900 border-b border-emerald-600/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">🇧🇩</span>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-amber-300 drop-shadow flex items-center gap-1.5">
                মস্তানের দেশ ১
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-700/80 text-emerald-100 font-bold border border-emerald-400">
                  উন্মুক্ত বাংলাদেশ
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium">
                সম্পূর্ণ উন্মুক্ত ২ডি ওপেন ওয়ার্ল্ড গেম ও মহাকাশ অভিযান
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-950/60 hover:bg-stone-950 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-300 leading-relaxed scrollbar-thin">
          {/* Daily Welcome Gift Banner */}
          {!dailyClaimed && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/80 to-amber-900/60 border border-amber-400/80 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <Gift className="w-6 h-6 text-amber-300 shrink-0 animate-bounce" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-amber-200">
                    🎉 প্রতিদিনের স্বাগতম বোনাস ৳৫০০ ক্যাশ!
                  </div>
                  <div className="text-[10.5px] text-amber-300/80">
                    গেম শুরু করলেই সরাসরি আপনার পকেটে যোগ হবে!
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-amber-300 bg-stone-950/80 px-2.5 py-1 rounded-xl border border-amber-400/50 shrink-0">
                +৳৫০০
              </span>
            </div>
          )}

          {/* Game Story / Brief */}
          <div className="bg-stone-950/60 p-3.5 rounded-2xl border border-stone-800">
            <h2 className="font-bold text-stone-100 text-xs sm:text-sm mb-1 flex items-center gap-1.5 text-emerald-400">
              <Compass className="w-4 h-4 text-emerald-400" />
              গেমের মূল গল্প ও রোমাঞ্চ
            </h2>
            <p className="text-[11.5px] sm:text-xs text-stone-300">
              আপনি রাধানগরের তরুণ রহিম। নিজের মাটির নিরাপদ বাড়ি থেকে শুরু করে পদ্মা সেতু পার হয়ে রাজধানী ঢাকা, রাজশাহী, খুলনা, বরিশাল, চট্টগ্রাম ও সিলেট পর্যন্ত আপনার সাম্রাজ্য বিস্তার করুন। চোর-ডাকাত দমন করুন, ট্রেন ও নৌকা চালান, বিমান ও হেলিকপ্টারে আকাশ জয় করুন এবং মহাকাশ রকেটে চেপে চাঁদের মাটিতে পা রাখুন!
            </p>
          </div>

          {/* Key Game Features Grid */}
          <div>
            <h3 className="font-bold text-stone-100 text-xs sm:text-sm mb-2 flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-300" />
              প্রধান আকর্ষণ ও ফিচারসমূহ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs">
              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-start gap-2">
                <Car className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-200">সকল যানবাহন:</span> সাইকেল, রিকশা, ভ্যান, পালসার বাইক, সিএনজি, বাস, ট্রাক্টর ও কার।
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-start gap-2">
                <Ship className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-200">নদীর খেয়া নৌকা ও লঞ্চ:</span> পদ্মা ঘাটের জেটিতে গিয়ে (E) চেপে ইঞ্জিন ট্রলার ও বিলাসবহুল লঞ্চ চালান।
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-start gap-2">
                <Train className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-200">চলন্ত রেলওয়ে ট্রেন:</span> পূর্ব-পশ্চিম রেললাইনে ট্রেন চলাচল করে। স্টেশনে দাঁড়িয়ে (E) চেপে ট্রেনে চড়ুন!
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-start gap-2">
                <Plane className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-200">বিমান ও হেলিকপ্টার:</span> ঢাকার বিমানবন্দরে রানওয়েতে চার্টার্ড বিমান ও হেলিকপ্টার নিয়ে আকাশে উড়ুন।
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-start gap-2">
                <Rocket className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-200">চাঁদে মহাকাশ অভিযান:</span> স্পারসো স্পেস সেন্টারে গিয়ে রকেট উৎক্ষেপণ করে চাঁদের বুকে চন্দ্র পাথর সংগ্রহ করুন!
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-200">চোর ও গুন্ডা দমন:</span> রাতে চোর ও সন্ত্রাসীদের রামদা দিয়ে ঘায়েল করে পুলিশে দিলে নগদ পুরস্কার পাবেন।
                </div>
              </div>
            </div>
          </div>

          {/* Quick How to Play Controls */}
          <div className="bg-stone-950/60 p-3 rounded-2xl border border-stone-800">
            <h4 className="font-bold text-stone-200 text-xs mb-1.5 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              কন্ট্রোল ও ব্যবহারের নিয়ম
            </h4>
            <ul className="grid grid-cols-2 gap-1.5 text-[10.5px] text-stone-300">
              <li>🕹️ <b>জয়স্টিক</b>: হাঁটা / গাড়ি চালানো</li>
              <li>🗡️ <b>F বাটন</b>: আক্রমণ / গুলি / ঘুষি</li>
              <li>🚗 <b>E বাটন</b>: গাড়ি/নৌকা/ট্রেনে চড়া বা কথা</li>
              <li>💣 <b>বোমা বাটন</b>: ককটেল নিক্ষেপ</li>
              <li>🗺️ <b>M বাটন</b>: পুরো বাংলাদেশের ম্যাপ</li>
              <li>🛏️ <b>নিরাপদ ঘর</b>: ঘুমালে সকাল হয় ও ক্লান্তি দূর</li>
            </ul>
          </div>
        </div>

        {/* Big Start Game Footer Action */}
        <div className="p-4 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-stone-400 hidden sm:block">
            যেকোনো সময় ওপরের <b>ম্যাপ</b> ও <b>কথা বলুন</b> আইকনে ক্লিক করতে পারেন।
          </div>
          <button
            onClick={handleStartGame}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:brightness-110 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl border border-emerald-400 cursor-pointer transition-transform"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>গেম শুরু করুন (Play Now)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
