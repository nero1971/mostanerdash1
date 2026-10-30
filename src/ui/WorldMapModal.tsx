import React, { useState } from "react";
import { GameEngine } from "../game/GameEngine";
import { soundManager } from "../audio/SoundManager";
import { REGIONS, RIVER_X, WORLD_HEIGHT, WORLD_WIDTH } from "../game/constants";
import { Compass, MapPin, Navigation, X, Car, ShieldAlert, Award, Coffee } from "lucide-react";

interface WorldMapModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({ engine, onClose }) => {
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);

  const handleClose = () => {
    soundManager.playUiClick();
    onClose();
  };

  const handleTeleportToRegion = (r: typeof REGIONS[0]) => {
    soundManager.playUiClick();
    engine.player.x = r.bounds.x + r.bounds.w / 2;
    engine.player.y = r.bounds.y + r.bounds.h / 2;
    engine.camera.x = engine.player.x;
    engine.camera.y = engine.player.y;
    engine.showToast("স্থান পরিবর্তন!", `আপনি '${r.nameBn}' অঞ্চলে প্রবেশ করেছেন!`);
    onClose();
  };

  // Coordinates normalized to percentage
  const playerPercentX = (engine.player.x / WORLD_WIDTH) * 100;
  const playerPercentY = (engine.player.y / WORLD_HEIGHT) * 100;
  const riverPercentX = (RIVER_X / WORLD_WIDTH) * 100;
  const riverPercentW = (700 / WORLD_WIDTH) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md font-bangla select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[92vh] bg-stone-950 border-2 border-emerald-500/70 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/30 border border-emerald-500/50 text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-100 flex items-center gap-2">
                <span>মস্তানের দেশ ১ · সম্পূর্ণ জেলা মানচিত্র</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                  ১৬টি অঞ্চল
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                পশ্চিমের রাধানগর গ্রাম থেকে পদ্মার ওপারের জেলা শহর
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Map Viewport + Region Details Sidebar */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Visual Map Graphic */}
          <div className="flex-1 relative bg-stone-900 border-b md:border-b-0 md:border-r border-stone-800 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
            <div className="relative w-full h-full max-h-[500px] bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden shadow-inner">
              {/* World Background: Lush Village West, Urban Slate East */}
              <div className="absolute inset-0 bg-[#2d5a27]" />

              {/* Padma River Corridor */}
              <div
                style={{
                  left: `${riverPercentX}%`,
                  width: `${riverPercentW}%`,
                }}
                className="absolute inset-y-0 bg-[#0284c7] border-x border-[#38bdf8]/30 flex items-center justify-center"
              >
                <span className="text-[11px] font-bold text-white/50 tracking-widest rotate-90 whitespace-nowrap">
                  পদ্মা নদী (PADMA RIVER)
                </span>
              </div>

              {/* District City East side */}
              <div
                style={{
                  left: `${riverPercentX + riverPercentW}%`,
                  right: 0,
                }}
                className="absolute inset-y-0 bg-[#1e293b] border-l border-stone-700"
              />

              {/* Grand Padma Highway Bridge */}
              <div
                style={{
                  top: `${(1540 / WORLD_HEIGHT) * 100}%`,
                  height: `${(110 / WORLD_HEIGHT) * 100}%`,
                }}
                className="absolute inset-x-0 bg-[#475569] border-y border-stone-400/40 flex items-center justify-center z-10"
              >
                <span className="text-[9px] font-bold text-yellow-300 tracking-wider">
                  পদ্মা সেতু এক্সপ্রেসওয়ে
                </span>
              </div>

              {/* Render Regions Overlays */}
              {REGIONS.map((r) => {
                const rx = (r.bounds.x / WORLD_WIDTH) * 100;
                const ry = (r.bounds.y / WORLD_HEIGHT) * 100;
                const rw = (r.bounds.w / WORLD_WIDTH) * 100;
                const rh = (r.bounds.h / WORLD_HEIGHT) * 100;
                const isSelected = selectedRegion.id === r.id;

                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      soundManager.playUiClick();
                      setSelectedRegion(r);
                    }}
                    style={{
                      left: `${rx}%`,
                      top: `${ry}%`,
                      width: `${rw}%`,
                      height: `${rh}%`,
                    }}
                    className={`absolute rounded-lg border transition-all cursor-pointer p-1 flex flex-col justify-between ${
                      isSelected
                        ? "bg-amber-500/25 border-amber-400 z-20 shadow-lg"
                        : "bg-black/20 border-white/10 hover:border-emerald-400/60 hover:bg-emerald-500/10"
                    }`}
                  >
                    <span className="text-[9px] sm:text-[10px] font-bold text-stone-100 bg-stone-950/80 px-1 py-0.5 rounded self-start truncate max-w-full">
                      {r.nameBn}
                    </span>
                  </div>
                );
              })}

              {/* Active Mission Target Aura on Map */}
              {engine.activeMission && (
                <div
                  style={{
                    left: `${(engine.activeMission.targetLocation.x / WORLD_WIDTH) * 100}%`,
                    top: `${(engine.activeMission.targetLocation.y / WORLD_HEIGHT) * 100}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                >
                  <div className="w-5 h-5 rounded-full bg-rose-500/40 animate-ping absolute inset-0" />
                  <div className="w-5 h-5 rounded-full bg-rose-600 border-2 border-white shadow flex items-center justify-center text-[9px] text-white font-bold">
                    ★
                  </div>
                </div>
              )}

              {/* Player Current Location Indicator */}
              <div
                style={{
                  left: `${playerPercentX}%`,
                  top: `${playerPercentY}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-400/50 animate-ping absolute inset-0" />
                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Selected Region Details & Fast-Travel */}
          <div className="w-full md:w-80 bg-stone-900/90 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-stone-100">{selectedRegion.nameBn}</h3>
              </div>

              <div className="text-xs text-stone-400 font-medium mb-3">
                {selectedRegion.nameEn} · {selectedRegion.isCity ? "জেলা শহর বাণিজ্যিক এলাকা" : "গ্রামীণ শান্ত জনপদ"}
              </div>

              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-xs text-stone-300 leading-relaxed mb-4">
                {selectedRegion.descriptionBn}
              </div>

              <div className="space-y-2 mb-4 text-xs">
                <div className="flex justify-between p-2 rounded-xl bg-stone-800/60 border border-stone-700/50">
                  <span className="text-stone-400">আপনার দূরত্ব:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {Math.round(
                      Math.hypot(
                        engine.player.x - (selectedRegion.bounds.x + selectedRegion.bounds.w / 2),
                        engine.player.y - (selectedRegion.bounds.y + selectedRegion.bounds.h / 2)
                      ) / 10
                    )}{" "}
                    মিটার
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded-xl bg-stone-800/60 border border-stone-700/50">
                  <span className="text-stone-400">এলাকার ধরন:</span>
                  <span className="font-bold text-emerald-400">
                    {selectedRegion.isCity ? "শহর" : "গ্রাম"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleTeleportToRegion(selectedRegion)}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>এই অঞ্চলে যান (ভ্রমণ করুন)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
