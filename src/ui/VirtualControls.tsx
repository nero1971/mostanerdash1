import React, { useRef, useState, useEffect, useCallback } from "react";
import { GameEngine } from "../game/GameEngine";
import { soundManager } from "../audio/SoundManager";
import {
  Bell,
  Bomb,
  Car,
  Crosshair,
  Footprints,
  LogOut,
  RotateCcw,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";

interface VirtualControlsProps {
  engine: GameEngine;
  onOpenPhone: () => void;
  onOpenMap: () => void;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  engine,
  onOpenPhone,
  onOpenMap,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const joystickRef = useRef<HTMLDivElement | null>(null);
  const touchIdRef = useRef<number | null>(null);

  const inVehicle = !!engine.player.currentVehicleId;
  const currentVeh = inVehicle
    ? engine.vehicles.find((v) => v.id === engine.player.currentVehicleId)
    : null;

  const currentWeapon = engine.player.weapon;
  const bombCount = engine.player.ammo.bomb || 0;

  const toggleRun = () => {
    soundManager.resume();
    const next = !isRunning;
    setIsRunning(next);
    engine.inputs.run = next;
  };

  const handleTurboBoost = () => {
    if (!currentVeh) return;
    soundManager.resume();
    currentVeh.speed = Math.min(currentVeh.maxSpeed * 1.4, currentVeh.speed + 4.5);
    soundManager.playHorn(currentVeh.type);
    engine.showToast(currentVeh.nameBn, "⚡ টার্বো স্পিড বুস্ট চালু!");
  };

  // --- Analog Joystick Math (Smooth 360-degree control matching user's photo) ---
  const MAX_RADIUS = 46;

  const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(MAX_RADIUS, dist);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: knobX, y: knobY });

    if (dist > 6) {
      const normX = knobX / MAX_RADIUS;
      const normY = knobY / MAX_RADIUS;
      engine.joystick.x = normX;
      engine.joystick.y = normY;
      engine.joystick.active = true;

      // Digital fallbacks
      engine.inputs.left = normX < -0.3;
      engine.inputs.right = normX > 0.3;
      engine.inputs.up = normY < -0.3;
      engine.inputs.down = normY > 0.3;
    } else {
      engine.joystick.x = 0;
      engine.joystick.y = 0;
      engine.joystick.active = false;
      engine.inputs.left = false;
      engine.inputs.right = false;
      engine.inputs.up = false;
      engine.inputs.down = false;
    }
  }, [engine]);

  const handleJoystickEnd = useCallback(() => {
    setIsDragging(false);
    touchIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });

    engine.joystick.x = 0;
    engine.joystick.y = 0;
    engine.joystick.active = false;

    engine.inputs.left = false;
    engine.inputs.right = false;
    engine.inputs.up = false;
    engine.inputs.down = false;
  }, [engine]);

  // Touch event handlers for Joystick
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    soundManager.resume();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDragging(true);
    handleJoystickMove(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        handleJoystickMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  // Mouse fallback handlers for Joystick
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    soundManager.resume();
    setIsDragging(true);
    handleJoystickMove(e.clientX, e.clientY);
  };

  useEffect(() => {
    const onMouseMoveWindow = (e: MouseEvent) => {
      if (isDragging && touchIdRef.current === null) {
        handleJoystickMove(e.clientX, e.clientY);
      }
    };
    const onMouseUpWindow = () => {
      if (isDragging && touchIdRef.current === null) {
        handleJoystickEnd();
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMoveWindow);
      window.addEventListener("mouseup", onMouseUpWindow);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMoveWindow);
      window.removeEventListener("mouseup", onMouseUpWindow);
    };
  }, [isDragging, handleJoystickMove, handleJoystickEnd]);

  // Quick Action Attack Handler
  const handleAttackOrShoot = () => {
    soundManager.resume();
    if (inVehicle) {
      // In vehicle: Honk horn
      engine.handleHornPress();
    } else {
      engine.shootGun();
    }
  };

  // Quick Handbomb Throw Handler
  const handleQuickBombThrow = () => {
    soundManager.resume();
    if (bombCount <= 0) {
      engine.showToast("বোমা শেষ!", "আপনার কাছে বোমা নেই! শমসের অস্ত্রাগার থেকে হাতবোমা সংগ্রহ করুন!");
      return;
    }
    // Calculate direction player is facing
    let angle = 0;
    if (engine.player.facing === "right") angle = 0;
    else if (engine.player.facing === "left") angle = Math.PI;
    else if (engine.player.facing === "up") angle = -Math.PI / 2;
    else if (engine.player.facing === "down") angle = Math.PI / 2;

    const targetX = engine.player.x + Math.cos(angle) * 140;
    const targetY = engine.player.y + Math.sin(angle) * 140;

    engine.player.ammo.bomb--;
    engine.throwBomb(targetX, targetY, false);
    if (engine.onHudUpdate) engine.onHudUpdate();
  };

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-40 font-bangla">
      {/* ========================================================
          BOTTOM CONTROLS BAR: Ergonomic placement within safe margins
         ======================================================== */}
      <div className="fixed bottom-3 sm:bottom-6 left-0 right-0 px-2 sm:px-6 flex justify-between items-end pointer-events-auto">
        {/* ========================================================
            LEFT SIDE: CIRCULAR ANALOG JOYSTICK (As shown in screenshot)
           ======================================================== */}
        <div className="relative flex flex-col items-center">
          {/* Top satellite buttons (Sprint and Horn) placed right above joystick */}
          <div className="flex items-center justify-between w-28 sm:w-32 mb-1 px-1">
            {/* Horn / Bell Button (Top-Left of Joystick) */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                engine.inputs.horn = true;
                engine.handleHornPress();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                engine.inputs.horn = false;
              }}
              onMouseDown={() => {
                engine.inputs.horn = true;
                engine.handleHornPress();
              }}
              onMouseUp={() => {
                engine.inputs.horn = false;
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-950/70 border border-white/30 text-amber-300 backdrop-blur-md shadow-lg flex items-center justify-center active:scale-90 transition-transform"
              title="হর্ন / ঘণ্টি বাজান"
            >
              <Bell className="w-5 h-5 text-amber-300" />
            </button>

            {/* Sprint Button (Top-Right of Joystick - Exactly as shown in screenshot) */}
            <button
              onClick={toggleRun}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border backdrop-blur-md shadow-lg flex items-center justify-center active:scale-90 transition-transform ${
                isRunning
                  ? "bg-rose-600/90 border-white text-white animate-pulse"
                  : "bg-stone-950/70 border-white/30 text-white"
              }`}
              title="দৌড়ান / স্প্রিন্ট"
            >
              <Footprints className="w-5 h-5" />
            </button>
          </div>

          {/* Outer Translucent Glassy Circular Joystick Base */}
          <div
            ref={joystickRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={handleJoystickEnd}
            onTouchCancel={handleJoystickEnd}
            onMouseDown={onMouseDown}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-black/45 backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center touch-none cursor-pointer"
          >
            {/* Inner Metallic Grey Thumb Puck / Knob */}
            <div
              style={{
                transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-stone-200 via-stone-300 to-stone-400 shadow-xl border border-white/80 flex items-center justify-center pointer-events-none"
            >
              <div className="w-4 h-4 rounded-full bg-stone-400/60 border border-stone-500/40" />
            </div>

            {/* Subtle crosshairs / ring guidance */}
            <div className="absolute inset-2 rounded-full border border-white/10 pointer-events-none" />
          </div>
        </div>

        {/* ========================================================
            RIGHT SIDE: ERGONOMIC ACTION BUTTON CLUSTER
            (Strictly clamped inside mobile boundaries)
           ======================================================== */}
        <div className="flex flex-col items-end gap-2 max-w-[50vw] sm:max-w-none">
          {/* Secondary Action Row: Switch Weapon, Quick Bomb, Turbo */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Handbomb Button (যদি বোমা থাকে) */}
            {!inVehicle && (
              <button
                onClick={handleQuickBombThrow}
                className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl border flex flex-col items-center justify-center shadow-lg active:scale-90 transition-transform ${
                  bombCount > 0
                    ? "bg-gradient-to-tr from-amber-700 to-orange-600 border-amber-300 text-white"
                    : "bg-stone-900/80 border-stone-700 text-stone-500 opacity-60"
                }`}
                title="ককটেল / হাতবোমা নিক্ষেপ"
              >
                <Bomb className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
                <span className="text-[8px] font-bold text-amber-100">
                  {bombCount > 0 ? `বোমা (${bombCount})` : "বোমা"}
                </span>
              </button>
            )}

            {/* Weapon Switcher (Q) */}
            {!inVehicle && engine.player.ownedWeapons.length > 1 && (
              <button
                onClick={() => engine.switchWeapon()}
                className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-stone-900/90 border border-amber-400/80 text-amber-300 shadow-lg flex flex-col items-center justify-center active:scale-90 transition-transform"
                title="অস্ত্র পরিবর্তন (Q)"
              >
                <RotateCcw className="w-4 h-4 text-amber-300" />
                <span className="text-[8px] font-bold text-stone-200">বদল (Q)</span>
              </button>
            )}

            {/* Vehicle Turbo Boost Button */}
            {inVehicle && (
              <button
                onClick={handleTurboBoost}
                className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-cyan-700 border border-cyan-300 text-white shadow-lg flex flex-col items-center justify-center active:scale-90 transition-transform"
                title="টার্বো স্পিড বুস্ট"
              >
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="text-[8px] font-bold">টার্বো</span>
              </button>
            )}

            {/* Primary Strike / Attack Button (Large, Vibrant) */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                handleAttackOrShoot();
              }}
              onMouseDown={handleAttackOrShoot}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 text-white shadow-2xl flex flex-col items-center justify-center active:scale-90 transition-transform font-bold ${
                currentWeapon === "ramdao"
                  ? "bg-gradient-to-tr from-rose-700 via-red-600 to-amber-500 border-yellow-300 ring-2 ring-red-500/40"
                  : currentWeapon === "bomb"
                  ? "bg-gradient-to-tr from-amber-600 to-orange-600 border-amber-300"
                  : currentWeapon === "pistol" || currentWeapon === "shotgun" || currentWeapon === "rifle"
                  ? "bg-gradient-to-tr from-rose-700 via-red-600 to-orange-500 border-yellow-300"
                  : "bg-gradient-to-tr from-red-600 to-amber-600 border-orange-200"
              }`}
              title="আক্রমণ / গুলি চালান"
            >
              {currentWeapon === "ramdao" ? (
                <>
                  <span className="text-base">🗡️</span>
                  <span className="text-[9px] font-black text-yellow-200">রামদা (F)</span>
                </>
              ) : currentWeapon === "bomb" ? (
                <>
                  <Bomb className="w-5 h-5 text-yellow-200" />
                  <span className="text-[9px] font-black text-yellow-200">বোমা (F)</span>
                </>
              ) : currentWeapon === "pistol" || currentWeapon === "shotgun" || currentWeapon === "rifle" ? (
                <>
                  <Crosshair className="w-5 h-5 text-yellow-200" />
                  <span className="text-[9px] font-black text-yellow-200">গুলি (F)</span>
                  <span className="text-[7.5px] font-mono text-white/90">
                    {engine.player.ammo[currentWeapon as "pistol" | "shotgun" | "rifle"]}
                  </span>
                </>
              ) : (
                <>
                  <Swords className="w-5 h-5 text-yellow-100" />
                  <span className="text-[9px] font-bold">ঘুষি (F)</span>
                </>
              )}
            </button>
          </div>

          {/* Safehouse Direct Sleep Button (ঘুমালে সকাল হয়ে যাওয়া) */}
          {engine.player.currentInterior && engine.player.currentBuilding?.isPlayerSafehouse && (
            <button
              onClick={() => engine.sleepInSafehouse()}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 border border-blue-300 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xl active:scale-95 transition-transform mb-1 cursor-pointer"
            >
              <span>🛏️ বিছানায় ঘুমান (সকাল করুন)</span>
            </button>
          )}

          {/* Primary Universal Enter/Exit/Talk Action Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              engine.inputs.action = true;
              engine.handleActionPress();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              engine.inputs.action = false;
            }}
            onMouseDown={() => {
              engine.inputs.action = true;
              engine.handleActionPress();
            }}
            onMouseUp={() => {
              engine.inputs.action = false;
            }}
            className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl border shadow-xl font-bold flex items-center justify-center gap-1.5 text-xs active:scale-95 transition-transform ${
              engine.player.currentInterior || inVehicle
                ? "bg-gradient-to-r from-rose-700 to-red-600 border-rose-300 text-white"
                : "bg-gradient-to-r from-emerald-600 to-green-600 border-emerald-300 text-white"
            }`}
          >
            {engine.player.currentInterior ? (
              <>
                <LogOut className="w-4 h-4 text-rose-200 shrink-0" />
                <span className="truncate">🚪 বের হন (E)</span>
              </>
            ) : inVehicle ? (
              <>
                <LogOut className="w-4 h-4 text-rose-200 shrink-0" />
                <span className="truncate">🚪 নামুন (E)</span>
              </>
            ) : (
              <>
                <Car className="w-4 h-4 text-emerald-200 shrink-0" />
                <span className="truncate">🏠 গাড়ি/বাড়ি/কথা (E)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
