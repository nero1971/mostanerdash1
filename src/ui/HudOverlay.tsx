import React from "react";
import { GameEngine } from "../game/GameEngine";
import { soundManager } from "../audio/SoundManager";
import { Minimap } from "./Minimap";
import {
  Bell,
  Clock,
  Coffee,
  Heart,
  MapPin,
  Mic,
  Pause,
  Phone,
  ShieldAlert,
  Smartphone,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";

interface HudOverlayProps {
  engine: GameEngine;
  onOpenMap: () => void;
  onOpenPhone: () => void;
  onPause: () => void;
  onOpenVoice: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  engine,
  onOpenMap,
  onOpenPhone,
  onPause,
  onOpenVoice,
}) => {
  const currentVeh = engine.vehicles.find((v) => v.id === engine.player.currentVehicleId);
  const activeMission = engine.activeMission;
  const weapon = engine.player.weapon;

  const weaponIcon =
    weapon === "ramdao"
      ? "🗡️"
      : weapon === "bomb"
      ? "💣"
      : weapon === "pistol"
      ? "🔫"
      : weapon === "shotgun"
      ? "💥"
      : weapon === "rifle"
      ? "🎯"
      : weapon === "bamboo_stick"
      ? "🎋"
      : "🥊";

  const weaponName =
    weapon === "ramdao"
      ? "রামদা"
      : weapon === "bomb"
      ? "হাতবোমা"
      : weapon === "pistol"
      ? "পিস্তল"
      : weapon === "shotgun"
      ? "শটগান"
      : weapon === "rifle"
      ? "রাইফেল"
      : weapon === "bamboo_stick"
      ? "লাঠি"
      : "ঘুষি";

  const ammoCount =
    weapon === "pistol" || weapon === "shotgun" || weapon === "rifle"
      ? engine.player.ammo[weapon]
      : weapon === "bomb"
      ? engine.player.ammo.bomb
      : null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col items-center font-bangla">
      {/* ========================================================
          TOP ULTRA-COMPACT STATUS BAR (Strictly fits inside all mobile screens)
         ======================================================== */}
      <header className="w-full max-w-full px-1.5 sm:px-4 pt-1.5 sm:pt-2.5 flex items-center justify-between pointer-events-auto gap-1 sm:gap-2">
        {/* Left Side: Consolidated Health, Cash, & Equipped Weapon Pill */}
        <div className="flex items-center gap-1 shrink min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-950/90 backdrop-blur-md border border-emerald-500/60 px-2 sm:px-2.5 py-1 rounded-full shadow-lg">
            {/* Health */}
            <div className="flex items-center gap-1 shrink-0">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
              <div className="hidden xs:block sm:block w-12 sm:w-16 h-1.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                <div
                  style={{ width: `${engine.player.health}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                />
              </div>
              <span className="text-[10px] font-bold text-stone-200 tabular-nums">
                {engine.player.health}%
              </span>
            </div>

            <span className="text-stone-600 text-xs">|</span>

            {/* Money */}
            <div className="flex items-center gap-0.5 shrink-0">
              <span className="text-xs font-bold text-amber-400">৳</span>
              <span className="text-xs font-bold text-amber-300 tabular-nums">
                {engine.player.money}
              </span>
            </div>

            <span className="text-stone-600 text-xs">|</span>

            {/* Equipped Weapon Badge (Tap to cycle weapon) */}
            <button
              onClick={() => engine.switchWeapon()}
              className="flex items-center gap-0.5 sm:gap-1 text-[10px] font-bold text-emerald-300 hover:text-emerald-200 cursor-pointer active:scale-95 transition-transform truncate"
              title="অস্ত্র পরিবর্তন (Q)"
            >
              <span>{weaponIcon}</span>
              <span className="hidden xs:inline">{weaponName}</span>
              {ammoCount !== null && (
                <span className="text-[9px] font-mono text-amber-300 font-bold bg-stone-900 px-1 py-0.2 rounded border border-amber-500/30">
                  {ammoCount}
                </span>
              )}
            </button>
          </div>

          {/* Wanted Stars (if police alert active) */}
          {engine.player.wantedLevel > 0 && (
            <div className="flex items-center gap-0.5 bg-rose-950/90 border border-rose-500/80 px-1.5 sm:px-2 py-1 rounded-full shadow shrink-0">
              <ShieldAlert className="w-3 h-3 text-rose-400 mr-0.5" />
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    i < engine.player.wantedLevel
                      ? "text-amber-400 text-xs animate-pulse"
                      : "text-stone-600 text-xs"
                  }
                >
                  ★
                </span>
              ))}
            </div>
          )}

          {/* Interior Exit Pill (if inside house/shop) */}
          {engine.player.currentInterior && (
            <button
              onClick={() => engine.handleActionPress()}
              className="flex items-center gap-1 bg-gradient-to-r from-rose-700 to-red-600 border border-rose-300 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg cursor-pointer active:scale-95 transition-transform shrink-0"
            >
              <span>🚪 বের হন</span>
            </button>
          )}
        </div>

        {/* Right Side: Quick Action Icons (Clamped, Never Overflows Screen) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Direct Bengali Voice Chat Button */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onOpenVoice();
            }}
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:brightness-110 border border-emerald-300 text-white shadow-lg cursor-pointer active:scale-90 transition-transform text-[11px] font-bold shrink-0"
            title="গেমে সরাসরি কথা বলুন (Voice Chat)"
          >
            <Mic className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">কথা বলুন</span>
          </button>

          {/* Quick Phone Icon */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onOpenPhone();
            }}
            className="p-1.5 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-emerald-500/50 text-emerald-300 shadow cursor-pointer active:scale-90 transition-transform"
            title="মোবাইল ফোন (P)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          {/* Quick World Map Icon */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onOpenMap();
            }}
            className="p-1.5 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-emerald-500/50 text-emerald-300 shadow cursor-pointer active:scale-90 transition-transform"
            title="মানচিত্র / ম্যাপ (M)"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>

          {/* Quick Tea Button */}
          <button
            onClick={() => engine.drinkTea()}
            className="p-1.5 rounded-full bg-amber-900/80 hover:bg-amber-800 border border-amber-400 text-amber-200 shadow cursor-pointer active:scale-90 transition-transform"
            title="দুধ চা খান (T)"
          >
            <Coffee className="w-3.5 h-3.5" />
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={() => {
              const next = !engine.settings.sound.muted;
              engine.settings.sound.muted = next;
              soundManager.updateVolumes(engine.settings.sound);
            }}
            className="p-1.5 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-stone-700 text-stone-300 shadow cursor-pointer active:scale-90 transition-transform hidden xs:flex"
            title="সাউন্ড অন/অফ"
          >
            {engine.settings.sound.muted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="p-1.5 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-stone-700 text-stone-300 shadow cursor-pointer active:scale-90 transition-transform"
            title="পজ (Esc)"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>

          {/* Desktop Minimap */}
          {engine.settings.showMinimap && (
            <div className="ml-1 hidden md:block">
              <Minimap engine={engine} onOpenFullMap={onOpenMap} />
            </div>
          )}
        </div>
      </header>

      {/* ========================================================
          TOP MISSION BANNER (Pinned right under header - NEVER overlaps bottom controls)
         ======================================================== */}
      {activeMission && (
        <div className="mt-1 px-3 py-0.5 rounded-full bg-stone-950/90 backdrop-blur-md border border-rose-500/70 text-center shadow-lg pointer-events-auto max-w-[92vw] truncate">
          <div className="text-[10px] font-bold text-rose-300 flex items-center justify-center gap-1.5">
            <span>⭐</span>
            <span className="truncate">{activeMission.titleBn}</span>
            {engine.missionTimer !== null && (
              <span className="text-amber-300 font-mono text-[9px] shrink-0">
                ({Math.ceil(engine.missionTimer)}s)
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SLIM FLOATING NOTIFICATION TOAST (Pinned at top, unobtrusive)
         ======================================================== */}
      {engine.notification && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] sm:max-w-md bg-stone-950/95 backdrop-blur-md border border-emerald-400 px-3.5 py-1 rounded-full shadow-2xl text-center pointer-events-none animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="text-[10.5px] font-bold text-emerald-300 flex items-center justify-center gap-1.5">
            <span>📢</span>
            <span className="font-extrabold shrink-0">{engine.notification.title}:</span>
            <span className="text-stone-200 font-medium truncate">{engine.notification.desc}</span>
          </div>
        </div>
      )}
    </div>
  );
};
