import React from "react";
import { GameEngine } from "../game/GameEngine";
import { soundManager } from "../audio/SoundManager";
import { Play, FileText, Compass, Settings, Home, RotateCcw, Volume2, VolumeX } from "lucide-react";

interface PauseModalProps {
  engine: GameEngine;
  onResume: () => void;
  onOpenMissions: () => void;
  onOpenMap: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  engine,
  onResume,
  onOpenMissions,
  onOpenMap,
  onOpenSettings,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-bangla select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-emerald-500/70 rounded-3xl p-6 shadow-2xl text-center text-white">
        {/* Paused Badge */}
        <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase mb-2">
          খেলা স্থগিত আছে
        </div>

        <h2 className="text-2xl font-extrabold text-stone-100 mb-6">
          মস্তানের দেশ ১
        </h2>

        {/* Buttons Stack */}
        <div className="space-y-2.5">
          {/* Resume */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onResume();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>খেলা চালিয়ে যান (Resume)</span>
          </button>

          {/* Missions */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onResume();
              onOpenMissions();
            }}
            className="w-full py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-emerald-500/60 text-stone-200 font-bold text-xs shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>মিশন তালিকা (Missions)</span>
          </button>

          {/* Map */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onResume();
              onOpenMap();
            }}
            className="w-full py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-emerald-500/60 text-stone-200 font-bold text-xs shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>জেলা মানচিত্র (Map)</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onResume();
              onOpenSettings();
            }}
            className="w-full py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-emerald-500/60 text-stone-200 font-bold text-xs shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-purple-400" />
            <span>সেটিংস (Settings)</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !engine.settings.sound.muted;
              engine.settings.sound.muted = next;
              soundManager.updateVolumes(engine.settings.sound);
            }}
            className="w-full py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-bold text-xs shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            {engine.settings.sound.muted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>শব্দ আনমিউট করুন</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>শব্দ মিউট করুন</span>
              </>
            )}
          </button>

          {/* Main Menu */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onMainMenu();
            }}
            className="w-full py-2.5 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 text-rose-200 font-bold text-xs shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mt-4"
          >
            <Home className="w-4 h-4" />
            <span>মূল মেনু (Main Menu)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
