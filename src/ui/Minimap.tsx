import React, { useEffect, useRef } from "react";
import { GameEngine } from "../game/GameEngine";
import { RIVER_X, WORLD_HEIGHT, WORLD_WIDTH } from "../game/constants";
import { Maximize2 } from "lucide-react";

interface MinimapProps {
  engine: GameEngine;
  onOpenFullMap: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({ engine, onOpenFullMap }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const renderMinimap = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Clear
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, w, h);

      // Base terrain
      ctx.fillStyle = "#2d5a27";
      ctx.fillRect(0, 0, w, h);

      // River Padma corridor
      const scaleX = w / WORLD_WIDTH;
      const scaleY = h / WORLD_HEIGHT;

      const riverLeft = RIVER_X * scaleX;
      const riverWidth = 700 * scaleX;
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(riverLeft, 0, riverWidth, h);

      // East City urban asphalt
      const cityLeft = (RIVER_X + 700) * scaleX;
      ctx.fillStyle = "#334155";
      ctx.fillRect(cityLeft, 0, w - cityLeft, h);

      // Main Grand Highway Bridge
      const bridgeY = 1540 * scaleY;
      const bridgeH = Math.max(3, 110 * scaleY);
      ctx.fillStyle = "#71717a";
      ctx.fillRect(0, bridgeY, w, bridgeH);

      // Buildings
      ctx.fillStyle = "#94a3b8";
      engine.buildings.forEach((b) => {
        const bx = b.x * scaleX;
        const by = b.y * scaleY;
        const bw = Math.max(2, b.w * scaleX);
        const bh = Math.max(2, b.h * scaleY);
        ctx.fillRect(bx, by, bw, bh);
      });

      // Active Mission Marker
      if (engine.activeMission) {
        const mx = engine.activeMission.targetLocation.x * scaleX;
        const my = engine.activeMission.targetLocation.y * scaleY;
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Vehicles
      ctx.fillStyle = "#38bdf8";
      engine.vehicles.forEach((v) => {
        const vx = v.x * scaleX;
        const vy = v.y * scaleY;
        ctx.fillRect(vx - 1, vy - 1, 2, 2);
      });

      // Police blip
      if (engine.policeOfficer.isSirenActive) {
        const px = engine.policeOfficer.x * scaleX;
        const py = engine.policeOfficer.y * scaleY;
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dacoits blips
      ctx.fillStyle = "#dc2626";
      engine.dacoits.forEach((d) => {
        if (!d.isKnockedOut) {
          ctx.fillRect(d.x * scaleX - 1, d.y * scaleY - 1, 2, 2);
        }
      });

      // Player Blip
      const px = engine.player.x * scaleX;
      const py = engine.player.y * scaleY;

      // Player pulse aura
      ctx.fillStyle = "rgba(74, 222, 128, 0.4)";
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Player center dot
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();

      animId = requestAnimationFrame(renderMinimap);
    };

    renderMinimap();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [engine]);

  return (
    <div
      onClick={onOpenFullMap}
      className="relative w-28 h-20 sm:w-32 sm:h-24 rounded-2xl overflow-hidden border border-emerald-500/60 shadow-xl bg-stone-950/80 backdrop-blur-md cursor-pointer hover:border-emerald-400 group active:scale-95 transition-all pointer-events-auto"
      title="সম্পূর্ণ ম্যাপ দেখতে চাপুন (M)"
    >
      <canvas
        ref={canvasRef}
        width={128}
        height={96}
        className="w-full h-full block"
      />
      <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/60 text-[8px] font-bold text-emerald-300 flex items-center gap-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
        <Maximize2 className="w-2.5 h-2.5" />
        <span>ম্যাপ</span>
      </div>
    </div>
  );
};
