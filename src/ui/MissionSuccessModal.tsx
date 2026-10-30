import React from "react";
import { soundManager } from "../audio/SoundManager";
import { Award, CheckCircle2, ChevronRight, Coins, Sparkles } from "lucide-react";

interface MissionSuccessModalProps {
  rewardMoney: number;
  completedCount: number;
  totalMissions: number;
  onContinue: () => void;
}

export const MissionSuccessModal: React.FC<MissionSuccessModalProps> = ({
  rewardMoney,
  completedCount,
  totalMissions,
  onContinue,
}) => {
  const handleProceed = () => {
    soundManager.resume();
    soundManager.playUiClick();
    onContinue();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-bangla select-none animate-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-stone-900 via-stone-900 to-emerald-950 border-2 border-emerald-500/80 rounded-3xl p-6 shadow-2xl text-center text-white">
        {/* Glow and Victory Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-2xl mb-4 animate-bounce">
          <Award className="w-10 h-10 text-stone-950" />
          <Sparkles className="w-5 h-5 text-amber-200 absolute -top-1 -right-1" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-300 to-green-400 mb-1">
          মিশন সফল!
        </h2>
        <p className="text-xs text-emerald-400 font-semibold mb-4">
          শাবাশ ভাই! দারুণ দক্ষতা দেখিয়েছেন!
        </p>

        {/* Reward Card */}
        <div className="p-4 rounded-2xl bg-stone-950/80 border border-amber-500/50 mb-5">
          <span className="text-xs text-stone-400 font-medium">মিশন পুরস্কার লাভ:</span>
          <div className="flex items-center justify-center gap-1.5 text-2xl font-black text-amber-400 mt-1">
            <Coins className="w-6 h-6 text-amber-400" />
            <span>+৳{rewardMoney} টাকা</span>
          </div>
          <div className="text-[10px] text-stone-400 mt-1">
            (আপনার পকেটে ও বিকাশ একাউন্টে টাকা যোগ হয়েছে)
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mb-6 p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-xs flex justify-between items-center">
          <span className="text-stone-400">মোট সম্পন্ন মিশন:</span>
          <span className="font-bold text-emerald-300 font-mono">
            {completedCount} / {totalMissions} টি
          </span>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleProceed}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <span>সামনে এগিয়ে যান</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
