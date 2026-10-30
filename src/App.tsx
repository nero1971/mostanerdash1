import React, { useEffect, useRef, useState, useCallback } from "react";
import { GameEngine } from "./game/GameEngine";
import { GameState } from "./types/game";
import { HudOverlay } from "./ui/HudOverlay";
import { VirtualControls } from "./ui/VirtualControls";
import { Smartphone, PhoneApp } from "./ui/Smartphone";
import { WorldMapModal } from "./ui/WorldMapModal";
import { PauseModal } from "./ui/PauseModal";
import { MissionSuccessModal } from "./ui/MissionSuccessModal";
import { BaaperRastaIntroModal } from "./ui/BaaperRastaIntroModal";
import { DirectVoiceModal } from "./ui/DirectVoiceModal";
import { soundManager } from "./audio/SoundManager";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>("PLAYING");
  const [, setTick] = useState(0);

  // Modals state
  const [showPhone, setShowPhone] = useState(false);
  const [phoneDefaultApp, setPhoneDefaultApp] = useState<PhoneApp>("HOME");
  const [showMap, setShowMap] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  // Resize canvas helper
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }
  }, []);

  // Initialize GameEngine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    handleResize();

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    // Start directly in PLAYING state so the game world and graphics are vibrant and active immediately!
    engine.state = "PLAYING";
    setGameState("PLAYING");

    engine.onStateChange = (newState: GameState) => {
      setGameState(newState);
      setTick((t) => t + 1);
    };

    engine.onHudUpdate = () => {
      setTick((t) => t + 1);
    };

    engine.start();

    // Welcome greeting
    engine.showToast(
      "মস্তানের দেশ ১ - উন্মুক্ত বাংলাদেশ",
      "স্বাগতম! পুরো বাংলাদেশ উন্মুক্ত। রহিমের নিজের বাড়ি, পুলিশ ক্যাম্প ও ভয়েসে সরাসরি কথা বলার সুবিধা সক্রিয়!"
    );

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      engine.stop();
      engineRef.current = null;
    };
  }, [handleResize]);

  const engine = engineRef.current;

  return (
    <div className="relative w-screen h-dvh bg-stone-950 overflow-hidden select-none touch-none font-bangla">
      {/* Primary 2D Game Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block absolute inset-0 touch-none select-none z-0 bg-stone-900"
      />

      {/* In-Game HUD and Overlays (Rendered whenever engine is mounted) */}
      {engine && (
        <>
          {/* Top HUD Overlay */}
          <HudOverlay
            engine={engine}
            onOpenMap={() => setShowMap(true)}
            onOpenPhone={() => {
              setPhoneDefaultApp("HOME");
              setShowPhone(true);
            }}
            onPause={() => {
              engine.setState("PAUSED");
            }}
            onOpenVoice={() => setShowVoice(true)}
          />

          {/* Touch Joystick and Virtual Controls for Mobile & Desktop */}
          <VirtualControls
            engine={engine}
            onOpenPhone={() => {
              setPhoneDefaultApp("HOME");
              setShowPhone(true);
            }}
            onOpenMap={() => setShowMap(true)}
          />

          {/* Direct Bengali Voice Chat Modal */}
          <DirectVoiceModal
            engine={engine}
            isOpen={showVoice}
            onClose={() => setShowVoice(false)}
            onOpenMap={() => setShowMap(true)}
            onOpenPhone={() => {
              setPhoneDefaultApp("HOME");
              setShowPhone(true);
            }}
          />

          {/* Smartphone In-game Device */}
          {showPhone && (
            <Smartphone
              engine={engine}
              defaultApp={phoneDefaultApp}
              onClose={() => setShowPhone(false)}
            />
          )}

          {/* World Map Modal (All 8 Divisions & Entire Bangladesh) */}
          {showMap && (
            <WorldMapModal
              engine={engine}
              onClose={() => setShowMap(false)}
            />
          )}

          {/* Intro Story Modal (Can be re-opened from Pause menu) */}
          {showIntro && (
            <BaaperRastaIntroModal
              engine={engine}
              onStart={() => setShowIntro(false)}
            />
          )}

          {/* Pause Modal */}
          {gameState === "PAUSED" && (
            <PauseModal
              engine={engine}
              onResume={() => {
                engine.setState("PLAYING");
              }}
              onOpenMissions={() => {
                setPhoneDefaultApp("MISSIONS");
                setShowPhone(true);
              }}
              onOpenMap={() => {
                setShowMap(true);
              }}
              onOpenSettings={() => {
                setPhoneDefaultApp("SETTINGS");
                setShowPhone(true);
              }}
              onMainMenu={() => {
                setShowIntro(true);
              }}
            />
          )}

          {/* Mission Success Victory Modal */}
          {gameState === "MISSION_SUCCESS" && (
            <MissionSuccessModal
              rewardMoney={400}
              completedCount={engine.completedMissions.length}
              totalMissions={10}
              onContinue={() => {
                engine.setState("PLAYING");
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
