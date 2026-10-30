import {
  Building,
  Bullet,
  Dacoit,
  Hawker,
  Mission,
  MovingTrain,
  NightThief,
  NPC,
  Particle,
  Player,
  PoliceHelicopter,
  PoliceOfficer,
  Procession,
  Region,
  RiverCollectible,
  ThrownBomb,
  TimeOfDay,
  Vehicle,
  WeatherType,
} from "../types/game";
import { GUN_SHOP_ITEMS, RAILWAY_TRACK_Y, REGIONS, RIVER_X, TEASTALL_ADDA_TOPICS, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";

// Safe Canvas roundRect Polyfill for all mobile browsers & WebViews
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    this: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number | number[] = 0
  ) {
    const radius = typeof r === "number" ? r : Array.isArray(r) ? r[0] || 0 : 0;
    const rad = Math.min(Math.abs(w) / 2, Math.abs(h) / 2, radius);
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private animTimer = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public setContext(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public render(
    player: Player,
    vehicles: Vehicle[],
    npcs: NPC[],
    dacoits: Dacoit[],
    policeOfficer: PoliceOfficer,
    buildings: Building[],
    particles: Particle[],
    bullets: Bullet[],
    processions: Procession[],
    riverCollectibles: RiverCollectible[],
    activeMission: Mission | null,
    camera: { x: number; y: number; zoom: number; shake: number },
    timeOfDay: TimeOfDay,
    weather: WeatherType,
    dt: number,
    engine?: any
  ) {
    this.animTimer += dt;
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    const viewW = canvas.width;
    const viewH = canvas.height;

    // Check if player is inside ANY enterable building / house / shop interior
    if (player.currentInterior) {
      this.drawBuildingInterior(player, viewW, viewH, engine);
      return;
    }

    // Clear screen
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.save();

    // Camera transform with screen shake
    const shakeX = (Math.random() - 0.5) * camera.shake;
    const shakeY = (Math.random() - 0.5) * camera.shake;
    ctx.translate(viewW / 2 + shakeX, viewH / 2 + shakeY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Viewport bounds for culling
    const halfW = viewW / (2 * camera.zoom) + 120;
    const halfH = viewH / (2 * camera.zoom) + 120;
    const viewLeft = camera.x - halfW;
    const viewRight = camera.x + halfW;
    const viewTop = camera.y - halfH;
    const viewBottom = camera.y + halfH;

    // 1. Draw World Base Terrain & Biomes
    this.drawTerrain(viewLeft, viewRight, viewTop, viewBottom);

    // 2. Draw Massive Connected Road Network
    this.drawMassiveRoadNetwork(viewLeft, viewRight, viewTop, viewBottom);

    // 2.5 Draw Padma River Collectibles (floating Hilsa fish baskets & treasure chests)
    this.drawRiverCollectibles(riverCollectibles);

    // 3. Draw Mission Marker & Target Aura
    if (activeMission) {
      this.drawMissionTarget(activeMission);
    }

    // 4. Draw Ground Particles (dust, ripples)
    this.drawGroundParticles(particles);

    // 5. Draw Living Processions & Rallies
    this.drawProcessions(processions);

    // 6. Draw Sorted Entities (2.5D layering)
    const drawables: Array<{ y: number; draw: () => void }> = [];

    // Buildings
    buildings.forEach((b) => {
      if (b.x + b.w > viewLeft && b.x < viewRight && b.y + b.h > viewTop && b.y < viewBottom) {
        drawables.push({
          y: b.y + b.h,
          draw: () => this.drawBuilding(b),
        });
      }
    });

    // Vehicles
    vehicles.forEach((v) => {
      if (v.x > viewLeft - 90 && v.x < viewRight + 90 && v.y > viewTop - 90 && v.y < viewBottom + 90) {
        drawables.push({
          y: v.y,
          draw: () => this.drawVehicle(v),
        });
      }
    });

    // NPCs
    npcs.forEach((npc) => {
      if (npc.x > viewLeft - 60 && npc.x < viewRight + 60 && npc.y > viewTop - 60 && npc.y < viewBottom + 60) {
        drawables.push({
          y: npc.y,
          draw: () => this.drawNPC(npc),
        });
      }
    });

    // Dacoits (ডাকাত দল)
    dacoits.forEach((d) => {
      if (d.x > viewLeft - 60 && d.x < viewRight + 60 && d.y > viewTop - 60 && d.y < viewBottom + 60) {
        drawables.push({
          y: d.y,
          draw: () => this.drawDacoit(d),
        });
      }
    });

    // Police Officers (সকল পুলিশ ও র‍্যাব সদস্য)
    const officers: PoliceOfficer[] = engine?.policeOfficers || [policeOfficer];
    officers.forEach((p) => {
      if (p.x > viewLeft - 60 && p.x < viewRight + 60 && p.y > viewTop - 60 && p.y < viewBottom + 60) {
        drawables.push({
          y: p.y,
          draw: () => this.drawPolice(p),
        });
      }
    });

    // Hawkers (ভ্রাম্যমাণ ফেরিওয়ালা)
    const hawkers: Hawker[] = engine?.hawkers || [];
    hawkers.forEach((h) => {
      if (h.x > viewLeft - 70 && h.x < viewRight + 70 && h.y > viewTop - 70 && h.y < viewBottom + 70) {
        drawables.push({
          y: h.y,
          draw: () => this.drawHawker(h),
        });
      }
    });

    // Thrown Bombs & Petrol Cocktails (উড়ন্ত হাতবোমা)
    const thrownBombs: ThrownBomb[] = engine?.thrownBombs || [];
    thrownBombs.forEach((b) => {
      if (b.x > viewLeft - 70 && b.x < viewRight + 70 && b.y > viewTop - 70 && b.y < viewBottom + 70) {
        drawables.push({
          y: b.y,
          draw: () => this.drawThrownBomb(b),
        });
      }
    });

    // Moving Bangladesh Railway Train (চলন্ত রেলগাড়ি ও বগি)
    if (engine?.train) {
      drawables.push({
        y: engine.train.trackY + 18,
        draw: () => this.drawMovingTrain(engine.train),
      });
    }

    // Night Thieves & Muggers (রাতের চোর ও ছিনতাইকারী)
    const thieves: NightThief[] = engine?.nightThieves || [];
    thieves.forEach((t) => {
      if (t.x > viewLeft - 70 && t.x < viewRight + 70 && t.y > viewTop - 70 && t.y < viewBottom + 70) {
        drawables.push({
          y: t.y,
          draw: () => this.drawNightThief(t),
        });
      }
    });

    // Player (if not in vehicle)
    if (!player.currentVehicleId) {
      drawables.push({
        y: player.y,
        draw: () => this.drawPlayer(player),
      });
    }

    // Sort by Y and draw
    drawables.sort((a, b) => a.y - b.y);
    drawables.forEach((item) => item.draw());

    // 7. Draw Flying Bullets with Tracers
    this.drawBullets(bullets);

    // 7.5 Gun Aiming Line (if holding a firearm on foot)
    if (!player.currentVehicleId && (player.weapon === "pistol" || player.weapon === "shotgun" || player.weapon === "rifle")) {
      let aimAngle = 0;
      if (player.facing === "right") aimAngle = 0;
      else if (player.facing === "down") aimAngle = Math.PI / 2;
      else if (player.facing === "left") aimAngle = Math.PI;
      else if (player.facing === "up") aimAngle = -Math.PI / 2;

      ctx.save();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + Math.cos(aimAngle) * 90, player.y + Math.sin(aimAngle) * 90);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 8. Draw Overhead Trees
    this.drawOverheadTrees(viewLeft, viewRight, viewTop, viewBottom);

    // 9. Draw Air Particles (smoke, sparks, fireflies)
    this.drawAirParticles(particles);

    // 10. Day / Night Lighting & Headlights
    this.drawDayNightOverlay(viewLeft, viewRight, viewTop, viewBottom, timeOfDay, vehicles, player, dacoits);

    // 10.5 Police Helicopter Airborne & Searchlight (আকাশে পুলিশ হেলিকপ্টার ও ঘূর্ণায়মান সার্চলাইট)
    if (engine?.policeHelicopter) {
      this.drawPoliceHelicopter(engine.policeHelicopter, player);
    }

    ctx.restore();

    // 9. On-Screen Compass Arrow towards active mission
    if (activeMission) {
      this.drawOnScreenCompass(viewW, viewH, player, activeMission, camera);
    }

    // 10. Weather Effects (Rain)
    if (weather === "rain" || weather === "thunder") {
      this.drawRainScreen(viewW, viewH, weather);
    }
  }

  // --- Terrain Drawing ---
  private drawTerrain(left: number, right: number, top: number, bottom: number) {
    const ctx = this.ctx;

    // Lush Bengali grass across full visible viewport
    ctx.fillStyle = "#3a733b";
    ctx.fillRect(left - 200, top - 200, (right - left) + 400, (bottom - top) + 400);

    // Subtle grass texture patches (সবুজ ঘাসের ভিন্ন শেড)
    ctx.fillStyle = "#438244";
    for (let gx = Math.floor(left / 120) * 120; gx < right + 120; gx += 120) {
      for (let gy = Math.floor(top / 120) * 120; gy < bottom + 120; gy += 120) {
        if ((gx + gy) % 240 === 0) {
          ctx.beginPath();
          ctx.ellipse(gx + 40, gy + 40, 50, 35, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Traditional Village Clay Courtyards (মাটির লেপা উঠান ও খলা)
    // 1. Rahim's Ancestral Home Courtyard & Garden (Start Area)
    ctx.fillStyle = "#8a623d"; // Smooth dried clay
    ctx.beginPath();
    ctx.roundRect(430, 330, 650, 160, 12);
    ctx.fill();
    ctx.fillStyle = "#9c7247";
    ctx.fillRect(450, 345, 610, 130);

    // Herringbone Brick Paths (ইটের হেরিংবোন সোলিং রাস্তা)
    // Connecting Rahim's door, garage, Karim's house, and shops to the street
    ctx.fillStyle = "#991b1b"; // Burnt terracotta brick
    ctx.fillRect(655, 455, 26, 40); // Path from Rahim's house to road
    ctx.fillRect(505, 455, 24, 40); // Path from Garage to road
    ctx.fillRect(820, 455, 24, 40); // Path from Karim's house to road
    ctx.fillRect(660, 550, 24, 30); // Path from Anwar Grocery to road
    ctx.fillRect(805, 550, 24, 30); // Path from Tea Stall to road

    // Brick mortar lines
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    for (let by = 458; by < 495; by += 6) {
      ctx.beginPath();
      ctx.moveTo(655, by);
      ctx.lineTo(681, by);
      ctx.stroke();
    }

    // 2. School Yard & Primary School Ground
    ctx.fillStyle = "#785135";
    ctx.fillRect(410, 560, 190, 120);

    // Paddy Fields with irrigation dikes
    ctx.fillStyle = "#4d9047";
    ctx.fillRect(200, 850, 950, 650);
    // Irrigation canal
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(550, 850, 45, 650);

    // School Football ground with goalposts and markings
    ctx.fillStyle = "#8a5840";
    ctx.fillRect(1200, 1550, 750, 550);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 3;
    ctx.strokeRect(1250, 1600, 650, 450);
    ctx.beginPath();
    ctx.arc(1575, 1825, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Village Ponds with lotus and lilies
    ctx.fillStyle = "#0369a1";
    ctx.beginPath();
    ctx.ellipse(870, 680, 100, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#166534";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Sacred Banyan Pond
    ctx.fillStyle = "#075985";
    ctx.beginPath();
    ctx.ellipse(2300, 2500, 140, 95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rajshahi Mango Orchard Soil (লাল ও বাদামী উর্বর মাটি)
    ctx.fillStyle = "#6b3d1f";
    ctx.fillRect(400, 2700, 1600, 1100);

    // Sylhet Rolling Tea Estate Terraces (গাঢ় সবুজ চা বাগানের সারি)
    ctx.fillStyle = "#14532d";
    ctx.fillRect(5800, 350, 1800, 1500);
    ctx.strokeStyle = "#166534";
    ctx.lineWidth = 6;
    for (let ty = 400; ty < 1800; ty += 40) {
      ctx.beginPath();
      ctx.moveTo(5820, ty);
      ctx.lineTo(7580, ty);
      ctx.stroke();
    }

    // Chittagong Seaport Concrete Container Yard
    ctx.fillStyle = "#475569";
    ctx.fillRect(5800, 2000, 1800, 1600);

    // Padma River (flows centrally between village and district city)
    const riverW = 700;
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(RIVER_X, 0, riverW, WORLD_HEIGHT);

    // River animated waves
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    const waveOffset = (this.animTimer * 22) % 60;
    for (let wy = top - (top % 60); wy < bottom + 60; wy += 50) {
      ctx.beginPath();
      const waveX = RIVER_X + 80 + Math.sin(wy * 0.05 + this.animTimer) * 22;
      ctx.moveTo(waveX, wy + waveOffset);
      ctx.bezierCurveTo(waveX + 60, wy + waveOffset - 10, waveX + 120, wy + waveOffset + 10, waveX + 180, wy + waveOffset);
      ctx.stroke();
    }

    // Sandy Shore on village bank
    ctx.fillStyle = "#e2b86a";
    ctx.fillRect(RIVER_X - 60, 0, 60, WORLD_HEIGHT);
    // Sandy Shore on city bank
    ctx.fillRect(RIVER_X + riverW, 0, 60, WORLD_HEIGHT);

    // --- District City Urban Ground & Pavements (East of Padma River) ---
    const cityStartX = RIVER_X + riverW + 60;
    ctx.fillStyle = "#1e293b"; // Urban slate asphalt
    ctx.fillRect(cityStartX, 0, WORLD_WIDTH - cityStartX, WORLD_HEIGHT);

    // City Commercial Plaza Tiles
    ctx.fillStyle = "#334155";
    ctx.fillRect(cityStartX + 100, 450, 1800, 2700);
  }

  // --- Massive Connected Road Network ---
  private drawMassiveRoadNetwork(left: number, right: number, top: number, bottom: number) {
    const ctx = this.ctx;
    const riverW = 700;

    // 1. Long Paved Highway (East-West across entire map connecting village to city!)
    ctx.fillStyle = "#3f3f46"; // Asphalt
    ctx.fillRect(0, 1540, WORLD_WIDTH, 110);

    // Grand Padma Concrete Highway Bridge Crossing the River
    ctx.fillStyle = "#64748b"; // Concrete bridge structure
    ctx.fillRect(RIVER_X - 40, 1530, riverW + 80, 130);
    ctx.fillStyle = "#334155"; // Bridge roadway
    ctx.fillRect(RIVER_X - 40, 1540, riverW + 80, 110);

    // Bridge Concrete Guardrails
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(RIVER_X - 40, 1535, riverW + 80, 5);
    ctx.fillRect(RIVER_X - 40, 1650, riverW + 80, 5);

    // Highway Shoulder Gravel
    ctx.fillStyle = "#71717a";
    ctx.fillRect(0, 1532, RIVER_X - 60, 8);
    ctx.fillRect(0, 1650, RIVER_X - 60, 8);

    // Dashed Yellow Centerline
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 25]);
    ctx.beginPath();
    ctx.moveTo(0, 1595);
    ctx.lineTo(WORLD_WIDTH, 1595);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zebra Crossings (জেব্রা ক্রসিং)
    const drawZebra = (zx: number, zy: number, w: number, h: number) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      for (let y = zy; y < zy + h - 10; y += 16) {
        ctx.fillRect(zx, y, w, 9);
      }
    };
    drawZebra(960, 1545, 32, 100);
    drawZebra(2010, 1545, 32, 100);
    drawZebra(RIVER_X - 100, 1545, 32, 100);
    drawZebra(RIVER_X + 740, 1545, 32, 100);

    // 2. North-South Paved District Road (Village Bypass)
    ctx.fillStyle = "#4b5563";
    ctx.fillRect(2050, 0, 90, WORLD_HEIGHT);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(2095, 0);
    ctx.lineTo(2095, WORLD_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Dense Village Mud Roads & Ring Roads (মেঠো পথ)
    ctx.fillStyle = "#b48c59"; // Rich clay soil
    // Main Village Spine (North-South)
    ctx.fillRect(1000, 100, 80, 2700);
    // Bazaar Crossroad
    ctx.fillRect(100, 960, 2600, 80);
    // Northern Residential Lane
    ctx.fillRect(400, 480, 2350, 75);
    // Southern Mosque & Farm Road
    ctx.fillRect(150, 2200, 2500, 75);
    // River Ghat Embankment Road
    ctx.fillRect(RIVER_X - 140, 200, 80, 2400);

    // Connecting Diagonal / Branch Paths
    ctx.fillRect(350, 480, 75, 560);
    ctx.fillRect(1700, 480, 75, 560);
    ctx.fillRect(1500, 1540, 75, 740);

    // 4. District City Modern Avenue Grid (শহরের পাকা ৪ লেনের এভিনিউ)
    const cityRoadX = RIVER_X + riverW + 60;
    ctx.fillStyle = "#1e293b"; // Smooth city asphalt

    // City Avenue 1 (City Center): y: 680, w: 100
    ctx.fillRect(cityRoadX, 680, WORLD_WIDTH - cityRoadX, 100);
    // City Avenue 2 (Commercial Supermarket): y: 1950, w: 100
    ctx.fillRect(cityRoadX, 1950, WORLD_WIDTH - cityRoadX, 100);
    // City Avenue 3 (Police & Hospital): y: 3220, w: 100
    ctx.fillRect(cityRoadX, 3220, WORLD_WIDTH - cityRoadX, 100);

    // City North-South Boulevards: x: 3850, x: 4450, x: 5050
    ctx.fillRect(3850, 200, 90, 3900);
    ctx.fillRect(4450, 200, 90, 3900);
    ctx.fillRect(5050, 200, 90, 3900);

    // White Lane Markings for City Avenues
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.setLineDash([25, 20]);
    [730, 2000, 3270].forEach((yPos) => {
      ctx.beginPath();
      ctx.moveTo(cityRoadX, yPos);
      ctx.lineTo(WORLD_WIDTH, yPos);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Pedestrian Zebra Crossings in District City
    ctx.fillStyle = "#ffffff";
    [3850, 4450, 5050].forEach((xPos) => {
      [680, 1540, 1950, 3220].forEach((yPos) => {
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(xPos + 10 + i * 12, yPos + 5, 8, 30);
          ctx.fillRect(xPos + 10 + i * 12, yPos + 65, 8, 30);
        }
      });
    });

    // 5. Bangladesh Trans-National Railway Line (পূর্ব-পশ্চিম পুরো বাংলাদেশ সংযোগকারী রেললাইন)
    this.drawRailwayTracks(left, right);

    // 6. Wooden Canal Bridges
    ctx.fillStyle = "#78350f";
    ctx.fillRect(530, 955, 85, 90); // Bridge over canal
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 4;
    ctx.strokeRect(530, 955, 85, 90);

    // 7. River Wooden Jetties / Ghats
    ctx.fillStyle = "#78350f";
    ctx.fillRect(RIVER_X - 80, 430, 150, 50);
    ctx.fillRect(RIVER_X - 80, 1180, 130, 45);
    ctx.fillRect(RIVER_X + riverW - 70, 430, 150, 50);
  }

  // --- Trans-National Bangladesh Railway Tracks (রেললাইন ও পদ্মা রেল সেতু) ---
  private drawRailwayTracks(left: number, right: number) {
    const ctx = this.ctx;
    const trackY = RAILWAY_TRACK_Y;
    const riverW = 700;

    // Ballast stone foundation bed
    ctx.fillStyle = "#27272a";
    ctx.fillRect(0, trackY - 18, WORLD_WIDTH, 36);

    // Ballast gravel speckles
    ctx.fillStyle = "#3f3f46";
    ctx.fillRect(0, trackY - 16, WORLD_WIDTH, 2);
    ctx.fillRect(0, trackY + 14, WORLD_WIDTH, 2);

    // Hardwood Sleepers (স্লিপার) spaced every 14px
    ctx.fillStyle = "#5c2b0c";
    const startX = Math.max(0, Math.floor((left - 60) / 14) * 14);
    const endX = Math.min(WORLD_WIDTH, Math.ceil((right + 60) / 14) * 14);
    for (let rx = startX; rx <= endX; rx += 14) {
      ctx.fillRect(rx, trackY - 15, 7, 30);
    }

    // Two Parallel Steel Rails (চকচকে স্টিলের রেলপাত)
    ctx.fillStyle = "#71717a";
    ctx.fillRect(0, trackY - 9, WORLD_WIDTH, 4);
    ctx.fillRect(0, trackY + 5, WORLD_WIDTH, 4);
    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(0, trackY - 8, WORLD_WIDTH, 2);
    ctx.fillRect(0, trackY + 6, WORLD_WIDTH, 2);

    // Grand Padma Steel Truss Railway Bridge (পদ্মা রেল সেতু)
    const bridgeStartX = RIVER_X - 40;
    const bridgeW = riverW + 80;

    // Bridge Concrete Piers
    ctx.fillStyle = "#64748b";
    for (let px = bridgeStartX + 80; px < bridgeStartX + bridgeW; px += 180) {
      ctx.fillRect(px - 15, trackY - 30, 30, 60);
    }

    // Steel Truss Girders (লাল-কমলা স্টিল ট্রাস)
    ctx.strokeStyle = "#c2410c";
    ctx.lineWidth = 4;
    ctx.strokeRect(bridgeStartX, trackY - 26, bridgeW, 52);

    // Truss X-braces
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let bx = bridgeStartX; bx < bridgeStartX + bridgeW; bx += 40) {
      ctx.moveTo(bx, trackY - 26);
      ctx.lineTo(bx + 40, trackY + 26);
      ctx.moveTo(bx + 40, trackY - 26);
      ctx.lineTo(bx, trackY + 26);
    }
    ctx.stroke();

    // Railway Level Crossing Gates & Flashing Lights at Road Intersections
    [1000, 2050, 3850, 4450].forEach((cx) => {
      ctx.fillStyle = "#facc15";
      ctx.fillRect(cx - 30, trackY - 22, 60, 6);
      ctx.fillRect(cx - 30, trackY + 16, 60, 6);
      ctx.fillStyle = "#000000";
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(cx - 26 + i * 14, trackY - 22, 6, 6);
        ctx.fillRect(cx - 26 + i * 14, trackY + 16, 6, 6);
      }
      const blink = Math.sin(this.animTimer * 6) > 0;
      ctx.fillStyle = blink ? "#ef4444" : "#7f1d1d";
      ctx.beginPath();
      ctx.arc(cx - 36, trackY - 25, 4, 0, Math.PI * 2);
      ctx.arc(cx + 36, trackY + 25, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // --- Buildings ---
  private drawBuilding(b: Building) {
    const ctx = this.ctx;

    // Building Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(b.x + 8, b.y + b.h - 5, b.w + 10, 18);

    // Main Wall Base with shading
    ctx.fillStyle = b.wallColor || "#a16207";
    ctx.fillRect(b.x, b.y + 15, b.w, b.h - 15);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(b.x, b.y + b.h - 12, b.w, 12); // Base skirting shadow

    // Multistory City Buildings (Dhaka, Chittagong, Banks, Malls, Stations)
    const isMultiFloor = (b.floors && b.floors >= 2) || b.type === "city_building";
    if (isMultiFloor) {
      // Concrete roof slab & parapet
      ctx.fillStyle = b.roofColor || "#334155";
      ctx.fillRect(b.x - 3, b.y, b.w + 6, b.h * 0.45);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x - 3, b.y, b.w + 6, b.h * 0.45);

      // Rooftop AC Units & Vents
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(b.x + 12, b.y + 6, 18, 12);
      ctx.fillStyle = "#475569";
      ctx.fillRect(b.x + 14, b.y + 8, 14, 8);

      // Floor Windows Grid (Realistic lit/unlit glass panes)
      const numFloors = Math.min(5, b.floors || 3);
      const cols = Math.max(3, Math.floor(b.w / 28));
      const winW = 14;
      const winH = 10;
      for (let f = 0; f < numFloors; f++) {
        const floorY = b.y + 18 + f * 16;
        if (floorY > b.y + b.h - 22) break;
        for (let c = 0; c < cols; c++) {
          const winX = b.x + 10 + c * ((b.w - 20) / cols);
          const isLit = (f + c + Math.floor(this.animTimer * 0.2)) % 3 !== 0;
          ctx.fillStyle = isLit ? "#38bdf8" : "#1e293b";
          ctx.fillRect(winX, floorY, winW, winH);
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 1;
          ctx.strokeRect(winX, floorY, winW, winH);
        }
      }
    } else {
      // Village Single-Story Corrugated Tin Roof
      ctx.fillStyle = b.roofColor || "#64748b";
      ctx.fillRect(b.x - 4, b.y, b.w + 8, b.h * 0.62);

      // Corrugated tin ridges with highlights
      for (let rx = b.x - 2; rx < b.x + b.w + 4; rx += 12) {
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx, b.y);
        ctx.lineTo(rx, b.y + b.h * 0.62);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx + 2, b.y);
        ctx.lineTo(rx + 2, b.y + b.h * 0.62);
        ctx.stroke();
      }

      // Shop Front Striped Awning / Canopy (রঙিন সামিয়ানা)
      if (b.type === "shop" || b.type === "tea_stall" || b.type === "bazaar") {
        const awningH = 18;
        const awningY = b.y + b.h * 0.58;
        const stripes = Math.floor(b.w / 12);
        for (let s = 0; s < stripes; s++) {
          ctx.fillStyle = s % 2 === 0 ? "#ef4444" : "#fef08a";
          ctx.fillRect(b.x + s * 12, awningY, 12, awningH);
        }
        // Shadow under awning
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(b.x, awningY + awningH, b.w, 6);
      }
    }

    // Doorway with wooden frame
    ctx.fillStyle = "#1e1005";
    const doorW = 22;
    const doorH = 32;
    const doorX = b.x + b.w / 2 - doorW / 2;
    const doorY = b.y + b.h - doorH;
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 2;
    ctx.strokeRect(doorX, doorY, doorW, doorH);

    // Door knob
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(doorX + doorW - 5, doorY + doorH / 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Veranda Bamboo Pillars (বারান্দার খুঁটি)
    if (!isMultiFloor) {
      ctx.strokeStyle = "#854d0e";
      ctx.lineWidth = 3;
      [b.x + 4, b.x + b.w - 4].forEach((px) => {
        ctx.beginPath();
        ctx.moveTo(px, b.y + b.h * 0.6);
        ctx.lineTo(px, b.y + b.h);
        ctx.stroke();
      });
    }

    // Windows with glass shine & wooden shutters
    if (!isMultiFloor) {
      [b.x + 14, b.x + b.w - 32].forEach((wx) => {
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(wx, b.y + b.h - 28, 16, 16);
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 2;
        ctx.strokeRect(wx, b.y + b.h - 28, 16, 16);
        // Window cross mullion
        ctx.beginPath();
        ctx.moveTo(wx + 8, b.y + b.h - 28);
        ctx.lineTo(wx + 8, b.y + b.h - 12);
        ctx.moveTo(wx, b.y + b.h - 20);
        ctx.lineTo(wx + 16, b.y + b.h - 20);
        ctx.stroke();
      });
    }

    // Special signs
    if (b.type === "tea_stall") {
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(b.x + b.w / 2 - 8, b.y + b.h - 26, 16, 10);
      // Steam
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h - 30 - ((this.animTimer * 20) % 15), 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.type === "mosque") {
      ctx.fillStyle = "#047857";
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + 10, 36, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y - 28, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Special architectural details
    if (b.isPlayerSafehouse) {
      // Safehouse glowing porch lantern & green trim
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(b.x - 4, b.y, b.w + 8, b.h + 20);

      // Bed / Safehouse Icon on door
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h - 40, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("🛏️", b.x + b.w / 2 - 5, b.y + b.h - 37);
    } else if (b.id === "police_camp_main") {
      // Draw Central Police Camp Helipad on the front compound asphalt!
      const heloPadX = b.x + b.w / 2 + 30;
      const heloPadY = b.y + b.h + 40;

      // Helipad Outer Circle
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(heloPadX, heloPadY, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#facc15"; // Yellow helipad boundary
      ctx.lineWidth = 4;
      ctx.stroke();

      // Inner dashed ring
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(heloPadX, heloPadY, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Bold White Letter "H"
      ctx.fillStyle = "#ffffff";
      ctx.font = "black 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("H", heloPadX, heloPadY + 11);

      // Flying Flag of Bangladesh on flagpole beside gate
      const poleX = b.x - 18;
      const poleY = b.y + b.h - 10;
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(poleX, poleY);
      ctx.lineTo(poleX, poleY - 55);
      ctx.stroke();

      // Green field
      ctx.fillStyle = "#006a4e";
      ctx.fillRect(poleX, poleY - 55, 28, 17);
      // Red disc
      ctx.fillStyle = "#f42a41";
      ctx.beginPath();
      ctx.arc(poleX + 12, poleY - 46.5, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rooftop Gazi water tank on residential & city buildings
    if (b.w > 100 && b.type !== "tea_stall") {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(b.x + 14, b.y - 10, 16, 11);
      ctx.fillStyle = "#16a34a"; // Green Gazi tank stripe
      ctx.fillRect(b.x + 15, b.y - 7, 14, 3);
    }

    // Signboard
    ctx.fillStyle = b.isPlayerSafehouse ? "#14532d" : "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = b.isPlayerSafehouse ? "#4ade80" : "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1.5;
    const signW = Math.max(120, b.nameBn.length * 8 + 24);
    ctx.beginPath();
    ctx.roundRect(b.x + b.w / 2 - signW / 2, b.y - 20, signW, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = b.isPlayerSafehouse ? "#86efac" : "#fef08a";
    ctx.font = "bold 10px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(b.nameBn, b.x + b.w / 2, b.y - 6);
  }

  // --- Moving Bangladesh Railway Train (চলন্ত রেলগাড়ি ও বগি) ---
  private drawMovingTrain(t: MovingTrain) {
    const ctx = this.ctx;

    for (let i = t.carriages.length - 1; i >= 0; i--) {
      const c = t.carriages[i];
      const isEngine = i === 0;

      ctx.save();
      ctx.translate(c.x, c.y);

      // Carriage Shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(-c.width / 2 + 4, -c.height / 2 + 5, c.width, c.height);

      if (isEngine) {
        // Locomotive Engine
        ctx.fillStyle = "#15803d"; // BR Green
        ctx.beginPath();
        ctx.roundRect(-c.width / 2, -c.height / 2, c.width, c.height, 6);
        ctx.fill();

        // Red speed stripe
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(-c.width / 2, -4, c.width, 8);

        // Yellow Accent trims
        ctx.fillStyle = "#facc15";
        ctx.fillRect(-c.width / 2, -c.height / 2 + 2, c.width, 3);
        ctx.fillRect(-c.width / 2, c.height / 2 - 5, c.width, 3);

        // Cab Windows
        ctx.fillStyle = "#38bdf8";
        const noseX = t.direction === 1 ? c.width / 2 - 20 : -c.width / 2 + 6;
        ctx.fillRect(noseX, -c.height / 2 + 5, 14, c.height - 10);

        // Driver silhouette
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(noseX + 7, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Smokestack
        ctx.fillStyle = "#27272a";
        const stackX = t.direction === 1 ? c.width / 2 - 38 : -c.width / 2 + 26;
        ctx.beginPath();
        ctx.arc(stackX, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Front Headlight Beam
        const lightDir = t.direction;
        const frontX = lightDir === 1 ? c.width / 2 : -c.width / 2;
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(frontX, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Headlight projected light cone
        const gradient = ctx.createRadialGradient(frontX, 0, 4, frontX + lightDir * 120, 0, 140);
        gradient.addColorStop(0, "rgba(254, 240, 138, 0.45)");
        gradient.addColorStop(1, "rgba(254, 240, 138, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(frontX, -5);
        ctx.lineTo(frontX + lightDir * 140, -45);
        ctx.lineTo(frontX + lightDir * 140, 45);
        ctx.lineTo(frontX, 5);
        ctx.closePath();
        ctx.fill();

        // Bangladesh Railway Emblem Text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px 'Hind Siliguri', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("বাংলাদেশ রেলওয়ে", 0, 3);
      } else {
        // Passenger Coach / Bogey
        ctx.fillStyle = c.color || "#166534";
        ctx.beginPath();
        ctx.roundRect(-c.width / 2, -c.height / 2, c.width, c.height, 4);
        ctx.fill();

        // Red speed stripe
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(-c.width / 2, -3, c.width, 6);

        // Windows with warm lights
        ctx.fillStyle = "#fef08a";
        for (let wx = -c.width / 2 + 10; wx < c.width / 2 - 10; wx += 14) {
          ctx.fillRect(wx, -c.height / 2 + 4, 8, 5);
          ctx.fillRect(wx, c.height / 2 - 9, 8, 5);

          ctx.fillStyle = "#451a03";
          ctx.beginPath();
          ctx.arc(wx + 4, -c.height / 2 + 6, 2, 0, Math.PI * 2);
          ctx.arc(wx + 4, c.height / 2 - 6, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fef08a";
        }
      }

      ctx.restore();
    }

    if (t.hasPlayerBoarded) {
      ctx.save();
      ctx.translate(t.x, t.trackY - 26);
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.roundRect(-45, -16, 90, 16, 6);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🚆 ট্রেনে আছেন (E: নামুন)", 0, -4);
      ctx.restore();
    }
  }

  // --- Night Thieves & Criminals (রাতের চোর ও ছিনতাইকারী) ---
  private drawNightThief(thief: NightThief) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(thief.x, thief.y);

    if (thief.isHandedOver) {
      ctx.restore();
      return;
    }

    if (thief.isSubdued) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-12, -5, 24, 10);

      // Handcuffs
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-2, 2, 4, 0, Math.PI * 2);
      ctx.arc(4, 2, 4, 0, Math.PI * 2);
      ctx.stroke();

      // Spinning yellow stars
      ctx.fillStyle = "#facc15";
      for (let s = 0; s < 3; s++) {
        const starAngle = this.animTimer * 6 + (s * Math.PI * 2) / 3;
        const sx = Math.cos(starAngle) * 12;
        const sy = -16 + Math.sin(starAngle) * 5;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 9px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("আটক চোর! (E চাপুন)", 0, -20);
      ctx.restore();
      return;
    }

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 7, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const legOffset = Math.sin(this.animTimer * 12) * 4;

    // Dark pants
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-5 + legOffset, 2, 4, 9);
    ctx.fillRect(1 - legOffset, 2, 4, 9);

    // Black burglar hoodie
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-7, -10, 14, 13);

    // Stolen burlap sack with loot
    ctx.fillStyle = "#ca8a04";
    const sackX = thief.facing === "left" ? 6 : -10;
    ctx.beginPath();
    ctx.arc(sackX, -4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("৳", sackX, -1);

    // Head with dark bandit mask
    ctx.fillStyle = "#c28859";
    ctx.beginPath();
    ctx.arc(0, -14, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Black mask
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-5, -13, 10, 5);

    // Dark bandit cap
    ctx.beginPath();
    ctx.arc(0, -16, 5.5, Math.PI, 0);
    ctx.fill();

    // Red thief tag badge
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.roundRect(-22, -28, 44, 12, 3);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🥷 চোর", 0, -19);

    ctx.restore();
  }

  // --- Vehicles ---
  private drawVehicle(v: Vehicle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.angle);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(-v.length / 2 + 3, -v.width / 2 + 5, v.length, v.width);

    if (v.type === "bicycle") {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-14, 0, 7, 0, Math.PI * 2);
      ctx.arc(14, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = v.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(0, -2);
      ctx.lineTo(14, 0);
      ctx.stroke();
    } else if (v.type === "rickshaw") {
      // Driver seat
      ctx.fillStyle = "#000000";
      ctx.fillRect(14, -3, 8, 6);
      // Large rear wheels
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-10, -v.width / 2 - 2, 14, 4);
      ctx.fillRect(-10, v.width / 2 - 2, 14, 4);
      // Colorful Passenger Hood
      ctx.fillStyle = "#e11d48";
      ctx.fillRect(-v.length / 2, -v.width / 2 + 2, 18, v.width - 4);
      // Painted backplate
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-v.length / 2 - 3, -v.width / 2 + 3, 4, v.width - 6);
      // Driver platform
      ctx.fillStyle = "#78350f";
      ctx.fillRect(0, -6, 12, 12);
    } else if (v.type === "cng") {
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(-v.length / 2, -v.width / 2, v.length, v.width);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-v.length / 2 + 5, -v.width / 2 + 2, v.length - 12, v.width - 4);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(v.length / 2 - 8, -v.width / 2 + 3, 6, v.width - 6);
    } else if (v.type === "tractor") {
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(-v.length / 2 + 8, -v.width / 2 + 4, v.length - 10, v.width - 8);
      ctx.fillStyle = "#09090b";
      ctx.fillRect(-v.length / 2, -v.width / 2 - 3, 18, 7);
      ctx.fillRect(-v.length / 2, v.width / 2 - 4, 18, 7);
      ctx.fillRect(v.length / 2 - 14, -v.width / 2, 10, 5);
      ctx.fillRect(v.length / 2 - 14, v.width / 2 - 5, 10, 5);
    } else if (v.type === "bus") {
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(-v.length / 2, -v.width / 2, v.length, v.width);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-v.length / 2 + 10, -v.width / 2 + 3, v.length - 20, v.width - 6);
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(v.length / 2 - 8, -v.width / 2 + 4, 6, v.width - 8);
    } else if (v.type === "fishing_boat" || v.type === "motorboat") {
      ctx.fillStyle = v.color || "#78350f";
      ctx.beginPath();
      ctx.ellipse(0, 0, v.length / 2, v.width / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = v.color || "#3b82f6";
      ctx.fillRect(-v.length / 2, -v.width / 2, v.length, v.width);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(v.length / 6, -v.width / 2 + 3, 10, v.width - 6);
    }

    ctx.restore();
  }

  // --- Realistic Bengali Player Character (সুনির্দিষ্ট অঙ্গভঙ্গি ও পোশাক) ---
  private drawPlayer(p: Player) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Realistic directional ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(2, 9, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const isMoving = p.speed > 0.2;
    const walkCycle = Math.sin(this.animTimer * (p.isRunning ? 18 : 10));
    const legOffset = isMoving ? walkCycle * 6 : 0;

    // Leather sandals / slippers (চামড়ার স্যান্ডেল)
    ctx.fillStyle = "#451a03";
    ctx.fillRect(-6 + legOffset, 12, 5, 4);
    ctx.fillRect(2 - legOffset, 12, 5, 4);

    // Traditional Bengali Check Lungi (সবুজ চেক লুঙ্গি)
    ctx.fillStyle = "#166534";
    if (isMoving) {
      ctx.fillRect(-6 + legOffset, 2, 5, 11);
      ctx.fillRect(2 - legOffset, 2, 5, 11);
      ctx.strokeStyle = "#86efac";
      ctx.lineWidth = 1;
      ctx.strokeRect(-6 + legOffset, 4, 5, 6);
      ctx.strokeRect(2 - legOffset, 4, 5, 6);
    } else {
      ctx.fillRect(-5, 2, 11, 11);
      ctx.strokeStyle = "#86efac";
      ctx.lineWidth = 1;
      ctx.strokeRect(-5, 4, 11, 6);
    }

    // White Cotton Panjabi / Kurta (সাদা সুতি পাঞ্জাবি)
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(-8, -12, 16, 16, 3);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Panjabi placket and button line
    ctx.strokeStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, -2);
    ctx.stroke();

    // Arms & Hands (চলন্ত হাতের সুইং)
    const armSwing = isMoving ? walkCycle * 5 : 0;
    ctx.fillStyle = "#c28859"; // Bengali Skin tone
    ctx.beginPath();
    ctx.arc(-9, -4 + armSwing, 3, 0, Math.PI * 2);
    ctx.arc(9, -4 - armSwing, 3, 0, Math.PI * 2);
    ctx.fill();

    // Equipped Weapon & Attack Stance
    const isAttacking = p.isAttacking;
    const handX = p.facing === "right" ? 11 : p.facing === "left" ? -11 : 8;
    const handY = p.facing === "up" ? -12 : p.facing === "down" ? 2 : -4;

    // 1. RAMDAO (ধারালো রামদা/চাপাতি)
    if (p.weapon === "ramdao") {
      ctx.save();
      ctx.translate(handX, handY);
      const swingAngle = isAttacking
        ? (p.facing === "left" ? -1 : 1) * Math.sin(this.animTimer * 28) * 1.2
        : p.facing === "left" ? -0.4 : 0.4;
      ctx.rotate(swingAngle);

      // Wooden handle
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-2, -3, 4, 8);

      // Curved steel heavy blade
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(-2, -3);
      ctx.lineTo(8, -18);
      ctx.lineTo(14, -14);
      ctx.lineTo(3, -1);
      ctx.closePath();
      ctx.fill();

      // Blade shine highlight
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(9, -17);
      ctx.stroke();

      ctx.restore();
    }
    // 2. BAMBOO STICK (বাঁশের লাঠি)
    else if (p.weapon === "bamboo_stick") {
      ctx.save();
      ctx.translate(handX, handY);
      const stickRot = isAttacking ? Math.sin(this.animTimer * 24) * 0.9 : 0.3;
      ctx.rotate(stickRot);
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-4, 10);
      ctx.lineTo(8, -20);
      ctx.stroke();
      ctx.restore();
    }
    // 3. HANDBOMB / COCKTAIL (হাতবোমা / পেট্রোল ককটেল)
    else if (p.weapon === "bomb") {
      ctx.save();
      ctx.translate(handX, handY);
      ctx.fillStyle = "#15803d";
      ctx.fillRect(-3, -4, 6, 9);
      ctx.fillStyle = "#475569";
      ctx.fillRect(-1.5, -7, 3, 3);
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(0, -9, 3.5 + Math.sin(this.animTimer * 20), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // 4. FIREARMS (পিস্তল / শটগান / রাইফেল)
    else if (p.weapon === "pistol" || p.weapon === "shotgun" || p.weapon === "rifle") {
      ctx.save();
      ctx.translate(handX, handY);
      let gunAngle = 0;
      if (p.facing === "right") gunAngle = 0;
      else if (p.facing === "left") gunAngle = Math.PI;
      else if (p.facing === "up") gunAngle = -Math.PI / 2;
      else if (p.facing === "down") gunAngle = Math.PI / 2;
      ctx.rotate(gunAngle);

      ctx.fillStyle = "#1e293b";
      if (p.weapon === "pistol") {
        ctx.fillRect(0, -2, 10, 4);
      } else {
        ctx.fillRect(0, -2.5, 18, 5);
        ctx.fillStyle = "#78350f";
        ctx.fillRect(-4, -2, 6, 5);
      }
      ctx.restore();
    }
    // 5. UNARMED FIST
    else if (isAttacking) {
      ctx.fillStyle = "#c28859";
      const punchX = p.facing === "right" ? 14 : p.facing === "left" ? -14 : 0;
      const punchY = p.facing === "down" ? 12 : p.facing === "up" ? -12 : -2;
      ctx.beginPath();
      ctx.arc(punchX, punchY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Realistic Head
    ctx.fillStyle = "#c28859"; // Bengali skin tone
    ctx.beginPath();
    ctx.arc(0, -16, 7, 0, Math.PI * 2);
    ctx.fill();

    // Hair & Sideburns
    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    ctx.arc(0, -18, 7, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    // Facial details
    ctx.fillStyle = "#09090b";
    if (p.facing === "down") {
      ctx.fillRect(-3, -15, 2, 2);
      ctx.fillRect(1, -15, 2, 2);
      // Bengali mustache
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(-3, -12, 6, 1.5);
    } else if (p.facing === "right") {
      ctx.fillRect(2, -16, 2, 2);
    } else if (p.facing === "left") {
      ctx.fillRect(-4, -16, 2, 2);
    }

    ctx.restore();
  }

  // --- NPCs ---
  private drawNPC(npc: NPC) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(npc.x, npc.y);

    // 1. Ragdoll / Knocked down state from vehicle collision or heavy punch
    if ((npc.knockdownTimer && npc.knockdownTimer > 0) || npc.state === "knocked_down") {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(-12, -4, 24, 8);

      // Spinning yellow stars above head
      ctx.fillStyle = "#facc15";
      for (let s = 0; s < 3; s++) {
        const starAngle = this.animTimer * 6 + (s * Math.PI * 2) / 3;
        const sx = Math.cos(starAngle) * 12;
        const sy = -16 + Math.sin(starAngle) * 5;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 9px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ধাক্কায় কাত!", 0, -22);
      ctx.restore();
      return;
    }

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 7, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = npc.clothingColor;
    ctx.fillRect(-6, -8, 12, 13);

    // Head
    ctx.fillStyle = npc.skinTone;
    ctx.beginPath();
    ctx.arc(0, -14, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Bamboo mathal hat
    if (npc.hasHat) {
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(-11, -14);
      ctx.lineTo(11, -14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.arc(0, -16, 5.5, Math.PI, 0);
      ctx.fill();
    }

    // Earthen water pot (কলসি)
    if (npc.hasPot) {
      ctx.fillStyle = "#c2410c";
      ctx.beginPath();
      ctx.arc(8, -4, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Speech Bubble
    if (npc.activeDialog) {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      const bubbleW = Math.min(220, npc.activeDialog.length * 9 + 20);
      ctx.beginPath();
      ctx.roundRect(-bubbleW / 2, -55, bubbleW, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 10px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(npc.activeDialog, 0, -38);
    } else {
      ctx.fillStyle = "rgba(15,23,42,0.8)";
      ctx.fillRect(-28, -28, 56, 12);
      ctx.fillStyle = "#fef08a";
      ctx.font = "9px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(npc.nameBn, 0, -19);
    }

    ctx.restore();
  }

  // --- Dacoits (ডাকাত দল) ---
  private drawDacoit(d: Dacoit) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(d.x, d.y);

    if (d.isKnockedOut) {
      // Knocked out on ground
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(-12, -4, 24, 8);
      ctx.fillStyle = "#f87171";
      ctx.font = "bold 9px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("পরাজিত", 0, -8);
      ctx.restore();
      return;
    }

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 8, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark bandit vest & black lungi
    ctx.fillStyle = "#18181b";
    ctx.fillRect(-6, -8, 12, 13);
    // Red bandana / gamcha
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-6, -11, 12, 3);

    // Head
    ctx.fillStyle = "#945c31";
    ctx.beginPath();
    ctx.arc(0, -15, 6, 0, Math.PI * 2);
    ctx.fill();

    // Weapon based on bandit role
    if (d.weaponType === "ramdao") {
      // Menacing Ramdao Machete (ধারালো রামদা)
      ctx.save();
      ctx.translate(6, -2);
      ctx.rotate(0.5 + Math.sin(this.animTimer * 10) * 0.2);
      ctx.fillStyle = "#78350f"; // wooden hilt
      ctx.fillRect(-2, -2, 4, 7);
      ctx.fillStyle = "#e2e8f0"; // curved steel blade
      ctx.beginPath();
      ctx.moveTo(-2, -2);
      ctx.lineTo(8, -17);
      ctx.lineTo(14, -13);
      ctx.lineTo(2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(8, -15);
      ctx.stroke();
      ctx.restore();
    } else if (d.weaponType === "bomb") {
      // Cocktail Bomb bottle in hand
      ctx.save();
      ctx.translate(8, -4);
      ctx.fillStyle = "#166534";
      ctx.fillRect(-3, -3, 6, 8);
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(0, -6, 4 + Math.sin(this.animTimer * 16), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (d.weaponType === "pistol" || d.weaponType === "shotgun") {
      // Gun barrel
      ctx.save();
      ctx.translate(6, -4);
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, -2, 12, 4);
      ctx.restore();
    } else {
      // Wooden Lathi (বাঁশের লাঠি)
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(6, 6);
      ctx.lineTo(14, -20);
      ctx.stroke();
    }

    // Flaming Torch (মশাল) in off-hand
    ctx.fillStyle = "#ea580c";
    ctx.beginPath();
    ctx.arc(-8, -12, 4 + Math.sin(this.animTimer * 12) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(-8, -12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Health bar if wounded
    if (d.health < d.maxHealth) {
      ctx.fillStyle = "#450a0a";
      ctx.fillRect(-14, -32, 28, 4);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-14, -32, 28 * (d.health / d.maxHealth), 4);
    }

    // Bandit Name & Alert Badge
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 9px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(d.nameBn, 0, -22);

    ctx.restore();
  }

  // --- Street Hawkers (ভ্রাম্যমাণ ফেরিওয়ালা) ---
  private drawHawker(h: Hawker) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(h.x, h.y);

    // Cart shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 10, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden cart body
    ctx.fillStyle = "#854d0e";
    ctx.fillRect(-14, -6, 28, 14);
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-14, -6, 28, 14);

    // Cart Wheels
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-16, 6, 5, 4);
    ctx.fillRect(11, 6, 5, 4);

    // Canopy Umbrella Pole & Umbrella
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -26);
    ctx.stroke();

    // Striped colorful vendor umbrella (লাল ও হলুদ)
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(0, -26, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.moveTo(-16, -26);
    ctx.arc(0, -26, 16, Math.PI * 1.15, Math.PI * 1.35);
    ctx.lineTo(0, -26);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.arc(0, -26, 16, Math.PI * 1.65, Math.PI * 1.85);
    ctx.lineTo(0, -26);
    ctx.fill();

    // Hawker character pushing from behind
    ctx.fillStyle = "#0284c7"; // Hawker vest
    ctx.fillRect(-4, -18, 8, 11);
    ctx.fillStyle = "#c28859"; // Head
    ctx.beginPath();
    ctx.arc(0, -22, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // Gamcha on head
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-4, -25, 8, 3);

    // Name tag & goods
    ctx.fillStyle = "rgba(15,23,42,0.85)";
    ctx.beginPath();
    ctx.roundRect(-32, 12, 64, 13, 3);
    ctx.fill();
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 9px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${h.nameBn}`, 0, 22);

    // Active vocal shout / cry bubble
    if (h.activeShout && (h.shoutTimer ?? 0) > 0) {
      const bubbleW = Math.min(220, h.activeShout.length * 8.5 + 24);
      ctx.fillStyle = "#fef08a";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-bubbleW / 2, -62, bubbleW, 26, 6);
      ctx.fill();
      ctx.stroke();

      // Little beak pointer
      ctx.beginPath();
      ctx.moveTo(-4, -36);
      ctx.lineTo(4, -36);
      ctx.lineTo(0, -31);
      ctx.closePath();
      ctx.fillStyle = "#fef08a";
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 10px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`📢 ${h.activeShout}`, 0, -45);
    }

    ctx.restore();
  }

  // --- Thrown Bombs & Cocktails (উড়ন্ত হাতবোমা) ---
  private drawThrownBomb(b: ThrownBomb) {
    const ctx = this.ctx;
    ctx.save();

    const progress = Math.min(1, Math.max(0, b.progress));
    const arcHeight = Math.sin(progress * Math.PI) * b.arcHeight;

    // 1. Ground Shadow (shrinks as bomb goes higher into the air)
    const shadowScale = Math.max(0.3, 1 - arcHeight / 150);
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 7 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Air Bomb / Cocktail Bottle
    const bombY = b.y - arcHeight;
    ctx.translate(b.x, bombY);
    ctx.rotate(progress * Math.PI * 6); // tumble in flight

    // Bottle / shell
    ctx.fillStyle = "#15803d"; // dark glass cocktail bottle
    ctx.fillRect(-3, -7, 6, 12);
    ctx.fillStyle = "#475569"; // bottle neck
    ctx.fillRect(-1.5, -11, 3, 4);

    // Burning rag / fuse sparks!
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(0, -12, 3.5 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(0, -12, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- Police Officer ---
  private drawPolice(p: PoliceOfficer) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 8, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blue Police Uniform
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(-6, -8, 12, 13);

    // Police Cap
    ctx.fillStyle = "#172554";
    ctx.fillRect(-6, -18, 12, 4);

    // Head
    ctx.fillStyle = "#c28859";
    ctx.beginPath();
    ctx.arc(0, -14, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Flashing Siren Light above head
    if (p.isSirenActive) {
      const isRed = Math.floor(this.animTimer * 10) % 2 === 0;
      ctx.fillStyle = isRed ? "#ef4444" : "#3b82f6";
      ctx.beginPath();
      ctx.arc(0, -25, 6, 0, Math.PI * 2);
      ctx.fill();

      // Siren glow ring
      ctx.strokeStyle = isRed ? "rgba(239, 68, 68, 0.4)" : "rgba(59, 130, 246, 0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -25, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Handheld weapon: Baton or Shotgun
    if (p.weaponType === "shotgun") {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(4, -4, 16, 4);
    } else {
      // Wooden Police Lathi / Baton
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(5, 4);
      ctx.lineTo(12, p.chasingPlayer ? -18 : -8);
      ctx.stroke();
    }

    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 9px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.nameBn || "পুলিশ", 0, -32);

    ctx.restore();
  }

  // --- Police Helicopter Airborne (পুলিশ হেলিকপ্টার ও ঘূর্ণায়মান সার্চলাইট) ---
  private drawPoliceHelicopter(helo: PoliceHelicopter, player: Player) {
    if (!helo.isActive || helo.altitude <= 2) return;
    const ctx = this.ctx;
    ctx.save();

    // 1. Conical Searchlight Beam shining down onto ground & player
    ctx.save();
    const searchAngle = helo.searchlightAngle;
    const beamLength = 280;
    const beamSpread = 0.42;

    const grad = ctx.createRadialGradient(helo.x, helo.y, 10, helo.x + Math.cos(searchAngle) * beamLength, helo.y + Math.sin(searchAngle) * beamLength, 90);
    grad.addColorStop(0, "rgba(254, 240, 138, 0.65)");
    grad.addColorStop(0.7, "rgba(254, 240, 138, 0.3)");
    grad.addColorStop(1, "rgba(254, 240, 138, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(helo.x, helo.y);
    ctx.arc(helo.x, helo.y, beamLength, searchAngle - beamSpread, searchAngle + beamSpread);
    ctx.closePath();
    ctx.fill();

    // Searchlight illuminated circular aura on target ground
    const spotGroundX = helo.x + Math.cos(searchAngle) * (beamLength * 0.85);
    const spotGroundY = helo.y + Math.sin(searchAngle) * (beamLength * 0.85);
    ctx.fillStyle = "rgba(254, 240, 138, 0.35)";
    ctx.beginPath();
    ctx.arc(spotGroundX, spotGroundY, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Ground Shadow (projected below based on altitude)
    const shadowOffset = helo.altitude * 0.65;
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(helo.x + 20, helo.y + shadowOffset, 38, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Helicopter Body Fuselage
    ctx.translate(helo.x, helo.y);
    const flightAngle = helo.searchlightAngle;
    ctx.rotate(flightAngle);

    // Tail boom
    ctx.strokeStyle = "#1e3a8a"; // Police navy blue
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-45, 0);
    ctx.stroke();

    // Tail stabilizer fin
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-48, -7, 6, 14);

    // Spinning Tail Rotor
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 2;
    const tailSpin = Math.sin(this.animTimer * 45) * 8;
    ctx.beginPath();
    ctx.moveTo(-45, tailSpin);
    ctx.lineTo(-45, -tailSpin);
    ctx.stroke();

    // Main Cockpit Fuselage
    ctx.fillStyle = "#1e3a8a"; // Police navy blue
    ctx.beginPath();
    ctx.ellipse(4, 0, 24, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Police racing stripes
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-6, -11, 14, 3);
    ctx.fillRect(-6, 8, 14, 3);

    // Cockpit Glass Canopy (Glassy cyan sheen)
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.ellipse(14, 0, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flashing Red & Blue strobe lights on wingtips
    const isRed = Math.floor(this.animTimer * 12) % 2 === 0;
    ctx.fillStyle = isRed ? "#ef4444" : "#3b82f6";
    ctx.beginPath();
    ctx.arc(0, -13, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isRed ? "#3b82f6" : "#ef4444";
    ctx.beginPath();
    ctx.arc(0, 13, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Main Spinning Rotor Blades (4 blades with motion blur disc)
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.arc(4, 0, 52, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2.5;
    for (let r = 0; r < 4; r++) {
      const bAngle = helo.rotorAngle + (r * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(4 + Math.cos(bAngle) * 50, Math.sin(bAngle) * 50);
      ctx.stroke();
    }

    // Rotor Hub Cap
    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    ctx.arc(4, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Police Label on Roof
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("POLICE", 4, 3);

    ctx.restore();
  }

  // --- Overhead Trees ---
  private drawOverheadTrees(left: number, right: number, top: number, bottom: number) {
    const ctx = this.ctx;
    const trees = [
      // Starting Village (Radhanagar) - Around Rahim's house, street & shops
      { x: 420, y: 320, type: "coconut" },
      { x: 550, y: 310, type: "coconut" },
      { x: 670, y: 310, type: "mango" },
      { x: 740, y: 320, type: "coconut" },
      { x: 880, y: 310, type: "mango" },
      { x: 1040, y: 320, type: "coconut" },
      { x: 400, y: 500, type: "mango" },
      { x: 550, y: 530, type: "coconut" },
      { x: 740, y: 530, type: "coconut" },
      { x: 890, y: 530, type: "mango" },
      { x: 1040, y: 530, type: "coconut" },
      { x: 410, y: 700, type: "banana" },
      { x: 580, y: 700, type: "coconut" },
      { x: 750, y: 700, type: "mango" },
      { x: 920, y: 720, type: "coconut" },

      // Neighborhood Village & Bazaars
      { x: 1150, y: 340, type: "mango" },
      { x: 1350, y: 310, type: "coconut" },
      { x: 1550, y: 330, type: "coconut" },
      { x: 1750, y: 350, type: "mango" },
      { x: 1950, y: 380, type: "coconut" },
      { x: 2150, y: 450, type: "mango" },
      { x: 2280, y: 420, type: "coconut" },
      { x: 2500, y: 440, type: "mango" },
      { x: 2700, y: 400, type: "coconut" },

      // Highway Corridor & Canal
      { x: 400, y: 1450, type: "coconut" },
      { x: 750, y: 1460, type: "mango" },
      { x: 1100, y: 1450, type: "coconut" },
      { x: 1450, y: 1460, type: "mango" },
      { x: 1800, y: 1500, type: "mango" },
      { x: 2150, y: 1480, type: "coconut" },
      { x: 2500, y: 1470, type: "coconut" },

      // Southern Villages, Mosque, School & Clinics
      { x: 380, y: 1950, type: "mango" },
      { x: 620, y: 1850, type: "coconut" },
      { x: 950, y: 1950, type: "coconut" },
      { x: 1300, y: 2150, type: "mango" },
      { x: 1650, y: 2200, type: "coconut" },
      { x: 1900, y: 2180, type: "mango" },
      { x: 2200, y: 2350, type: "banyan" }, // Outlaw ancient banyan tree
      { x: 2450, y: 2450, type: "mango" },

      // Rajshahi Division Mango Orchards (আম বাগান)
      { x: 500, y: 2800, type: "mango" },
      { x: 700, y: 2820, type: "mango" },
      { x: 900, y: 2800, type: "mango" },
      { x: 1150, y: 2850, type: "mango" },
      { x: 1400, y: 2800, type: "mango" },
      { x: 600, y: 3100, type: "mango" },
      { x: 850, y: 3150, type: "mango" },
      { x: 1100, y: 3120, type: "mango" },
      { x: 1350, y: 3160, type: "mango" },

      // Khulna & Sundarbans Mangrove Edge
      { x: 2400, y: 2800, type: "coconut" },
      { x: 2700, y: 2850, type: "banyan" },
      { x: 3000, y: 2820, type: "coconut" },
      { x: 3300, y: 2850, type: "coconut" },
      { x: 2550, y: 3200, type: "banyan" },
      { x: 2850, y: 3250, type: "coconut" },

      // Dhaka City Parks & Boulevard Greens
      { x: 4000, y: 300, type: "mango" },
      { x: 4400, y: 300, type: "coconut" },
      { x: 4800, y: 300, type: "mango" },
      { x: 5200, y: 300, type: "coconut" },
      { x: 4700, y: 900, type: "banyan" },
      { x: 5300, y: 920, type: "coconut" },

      // Sylhet Tea Garden Shade Trees
      { x: 6000, y: 400, type: "mango" },
      { x: 6400, y: 420, type: "banyan" },
      { x: 6800, y: 400, type: "mango" },
      { x: 7200, y: 420, type: "mango" },
    ];

    trees.forEach((t) => {
      if (t.x > left - 120 && t.x < right + 120 && t.y > top - 120 && t.y < bottom + 120) {
        if (t.type === "coconut") {
          ctx.strokeStyle = "#78350f";
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(t.x, t.y);
          ctx.quadraticCurveTo(t.x + 8, t.y - 40, t.x + 12, t.y - 75);
          ctx.stroke();
          ctx.fillStyle = "#15803d";
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.beginPath();
            ctx.ellipse(t.x + 12 + Math.cos(a) * 25, t.y - 75 + Math.sin(a) * 20, 24, 7, a, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (t.type === "banyan") {
          ctx.fillStyle = "#14532d";
          ctx.beginPath();
          ctx.arc(t.x, t.y - 80, 85, 0, Math.PI * 2);
          ctx.arc(t.x - 45, t.y - 70, 65, 0, Math.PI * 2);
          ctx.arc(t.x + 45, t.y - 70, 65, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#15803d";
          ctx.beginPath();
          ctx.arc(t.x, t.y - 45, 38, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#78350f";
          ctx.fillRect(t.x - 6, t.y - 20, 12, 22);
        }
      }
    });
  }

  // --- Mission Target Zone ---
  private drawMissionTarget(m: Mission) {
    const ctx = this.ctx;
    const target = m.pickupLocation && !m.hasPickedUp ? m.pickupLocation : m.targetLocation;
    const pulse = Math.sin(this.animTimer * 5) * 6;

    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(target.x, target.y, m.targetRadius + pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(250, 204, 21, 0.25)";
    ctx.beginPath();
    ctx.arc(target.x, target.y, m.targetRadius + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(target.x, target.y - 35 + Math.sin(this.animTimer * 4) * 5, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- On-Screen Compass Pointer towards Mission ---
  private drawOnScreenCompass(
    viewW: number,
    viewH: number,
    player: Player,
    mission: Mission,
    camera: { x: number; y: number; zoom: number }
  ) {
    const ctx = this.ctx;
    const target = mission.pickupLocation && !mission.hasPickedUp ? mission.pickupLocation : mission.targetLocation;
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.hypot(dx, dy);

    // If mission target is off-screen or far away, draw compass arrow at screen edge!
    const angle = Math.atan2(dy, dx);
    const radius = Math.min(viewW, viewH) * 0.42;
    const arrowX = viewW / 2 + Math.cos(angle) * radius;
    const arrowY = viewH / 2 + Math.sin(angle) * radius;

    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);

    // 3D-styled Glowing Pointer
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -9);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Distance Badge
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.beginPath();
    ctx.roundRect(arrowX - 40, arrowY + 14, 80, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 10px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(dist / 10)} মি.`, arrowX, arrowY + 28);
  }

  // --- Particles ---
  private drawGroundParticles(particles: Particle[]) {
    const ctx = this.ctx;
    particles.forEach((p) => {
      if (p.type === "dust" || p.type === "water") {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  private drawAirParticles(particles: Particle[]) {
    const ctx = this.ctx;
    particles.forEach((p) => {
      if (p.type === "shout" && p.text) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.alpha * 1.5);
        ctx.fillStyle = "#ef4444"; // Bold comic alert red
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.font = "bold 13px 'Hind Siliguri', sans-serif";
        const tw = ctx.measureText(p.text).width + 20;
        ctx.beginPath();
        ctx.roundRect(p.x - tw / 2, p.y - 14, tw, 26, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(p.text, p.x, p.y + 4);
        ctx.restore();
      } else if (p.type === "firefly" || p.type === "smoke" || p.type === "spark" || p.type === "hit" || p.type === "coin") {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  // --- Day / Night Overlay ---
  private drawDayNightOverlay(
    left: number,
    right: number,
    top: number,
    bottom: number,
    timeOfDay: TimeOfDay,
    vehicles: Vehicle[],
    player: Player,
    dacoits: Dacoit[]
  ) {
    const ctx = this.ctx;
    if (timeOfDay === "afternoon") return;

    let overlayColor = "";
    if (timeOfDay === "morning") {
      overlayColor = "rgba(254, 240, 138, 0.08)";
    } else if (timeOfDay === "evening") {
      overlayColor = "rgba(249, 115, 22, 0.18)";
    } else if (timeOfDay === "night") {
      overlayColor = "rgba(15, 23, 42, 0.38)"; // Atmospheric moonlit night, never pitch black!
    }

    if (overlayColor) {
      ctx.fillStyle = overlayColor;
      ctx.fillRect(left - 200, top - 200, (right - left) + 400, (bottom - top) + 400);
    }

    // Night headlights & bandit torches illumination
    if (timeOfDay === "night") {
      vehicles.forEach((v) => {
        if (v.occupied || v.id === player.currentVehicleId) {
          ctx.save();
          ctx.translate(v.x, v.y);
          ctx.rotate(v.angle);
          const grad = ctx.createRadialGradient(25, 0, 5, 130, 0, 80);
          grad.addColorStop(0, "rgba(254, 240, 138, 0.7)");
          grad.addColorStop(1, "rgba(254, 240, 138, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(10, -5);
          ctx.lineTo(140, -45);
          ctx.lineTo(140, 45);
          ctx.lineTo(10, 5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      });
    }
  }

  // --- Rain Screen FX ---
  private drawRainScreen(w: number, h: number, weather: WeatherType) {
    const ctx = this.ctx;
    ctx.strokeStyle = "rgba(203, 213, 225, 0.4)";
    ctx.lineWidth = 1.5;
    const density = weather === "thunder" ? 140 : 80;
    for (let i = 0; i < density; i++) {
      const rx = (Math.sin(i * 99 + this.animTimer * 10) * 0.5 + 0.5) * w;
      const ry = (i * 37 + this.animTimer * 600) % h;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 8, ry + 18);
      ctx.stroke();
    }
  }

  // --- River Collectibles (পদ্মা নদীর রূপালী ইলিশ ও স্বর্ণের কলসি) ---
  private drawRiverCollectibles(collectibles: RiverCollectible[]) {
    const ctx = this.ctx;
    collectibles.forEach((item) => {
      if (item.collected) return;
      ctx.save();
      ctx.translate(item.x, item.y);

      // Water ripple ring
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14 + Math.sin(this.animTimer * 4) * 3, 0, Math.PI * 2);
      ctx.stroke();

      if (item.type === "hilsa_fish") {
        // Floating bamboo fish basket with silver Hilsa fish
        ctx.fillStyle = "#78350f";
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        // Silver Hilsa shimmer
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.ellipse(0, -2, 10, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(6, -3, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === "coin_chest") {
        // Golden treasure chest
        ctx.fillStyle = "#eab308";
        ctx.fillRect(-10, -8, 20, 16);
        ctx.fillStyle = "#ca8a04";
        ctx.fillRect(-11, -2, 22, 4);
      } else {
        // Fuel drum
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating label
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      ctx.roundRect(-45, -26, 90, 16, 4);
      ctx.fill();
      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 9px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.nameBn.split(" ")[0] || item.nameBn, 0, -14);

      ctx.restore();
    });
  }

  // --- Flying Bullets & Projectiles ---
  private drawBullets(bullets: Bullet[]) {
    const ctx = this.ctx;
    bullets.forEach((b) => {
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.weaponType === "shotgun" ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.08, b.y - b.vy * 0.08);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.weaponType === "rifle" ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // --- Living Processions & Rallies (মিছিল) ---
  private drawProcessions(processions: Procession[]) {
    const ctx = this.ctx;
    processions.forEach((proc) => {
      const leader = proc.members[0];
      if (!leader) return;

      // Draw all marchers
      proc.members.forEach((m, idx) => {
        ctx.save();
        ctx.translate(m.x, m.y);

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(0, 7, 9, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Walking body
        const legBob = Math.sin(this.animTimer * 10 + idx) * 3;
        ctx.fillStyle = m.clothingColor;
        ctx.fillRect(-5, -7 + legBob, 10, 12);

        // Head
        ctx.fillStyle = "#c28859";
        ctx.beginPath();
        ctx.arc(0, -12 + legBob, 5, 0, Math.PI * 2);
        ctx.fill();

        // Leader with Megaphone
        if (m.role === "leader") {
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(5, -14 + legBob, 8, 5); // Megaphone horn
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(14, -12 + legBob, 4, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
          // Sound rings
          ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(14, -12 + legBob, 8 + (Math.sin(this.animTimer * 12) * 3), -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
        }

        // Placard held high on a bamboo pole
        if (m.role === "placard" && m.placardTextBn) {
          ctx.strokeStyle = "#78350f";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(0, -28);
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#b91c1c";
          ctx.lineWidth = 1.5;
          ctx.fillRect(-22, -42, 44, 15);
          ctx.strokeRect(-22, -42, 44, 15);

          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 8px 'Hind Siliguri', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(m.placardTextBn, 0, -31);
        }

        ctx.restore();
      });

      // Long Fabric Banner held between the front marchers
      if (proc.members.length >= 3) {
        const m1 = proc.members[1];
        const m2 = proc.members[2];
        ctx.save();
        ctx.fillStyle = "#15803d"; // Green banner
        ctx.strokeStyle = "#dc2626"; // Red border
        ctx.lineWidth = 2;

        const bannerW = Math.hypot(m2.x - m1.x, m2.y - m1.y) + 30;
        const bannerMidX = (m1.x + m2.x) / 2;
        const bannerMidY = (m1.y + m2.y) / 2 - 14;

        ctx.beginPath();
        ctx.roundRect(bannerMidX - 90, bannerMidY - 10, 180, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fef08a";
        ctx.font = "bold 9px 'Hind Siliguri', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(proc.bannerTextBn, bannerMidX, bannerMidY + 4);
        ctx.restore();
      }

      // Overhead Slogan Speech Bubble
      if (proc.activeSlogan) {
        ctx.save();
        ctx.translate(leader.x, leader.y - 48);
        ctx.fillStyle = proc.chantPhase === "leader" ? "#ef4444" : "#16a34a";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        const txtW = ctx.measureText(proc.activeSlogan).width + 24;
        ctx.beginPath();
        ctx.roundRect(-txtW / 2, -12, txtW, 24, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px 'Hind Siliguri', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(proc.activeSlogan, 0, 4);
        ctx.restore();
      }
    });
  }

  // --- Detailed Enterable Building & House Interior Scene (প্রত্যেকটি ঘরের ভেতরের দৃশ্য) ---
  private drawBuildingInterior(player: Player, viewW: number, viewH: number, engine?: any) {
    const ctx = this.ctx;
    const interior = player.currentInterior;
    const building = player.currentBuilding;

    // Dim cinematic background
    ctx.fillStyle = "#0c120c";
    ctx.fillRect(0, 0, viewW, viewH);

    // Interior Room Dimensions
    const roomW = Math.min(680, viewW - 24);
    const roomH = Math.min(500, viewH - 24);
    const rx = (viewW - roomW) / 2;
    const ry = (viewH - roomH) / 2;

    // Room Floor (earthen mud floor for cottages, wooden planks for shops, tiled for bank/hospital)
    if (interior === "mud_cottage" || interior === "riverside_hut") {
      ctx.fillStyle = "#854d0e"; // Clay mud floor
    } else if (interior === "mosque_prayer_hall") {
      ctx.fillStyle = "#047857"; // Green velvet prayer carpet
    } else if (interior === "hospital_clinic" || interior === "bank_office" || interior === "city_supermarket") {
      ctx.fillStyle = "#cbd5e1"; // Clean white/grey tiles
    } else {
      ctx.fillStyle = "#78350f"; // Rich wooden timber planks
    }
    ctx.fillRect(rx, ry, roomW, roomH);

    // Floor Plank Lines
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1.5;
    for (let py = ry + 25; py < ry + roomH; py += 28) {
      ctx.beginPath();
      ctx.moveTo(rx, py);
      ctx.lineTo(rx + roomW, py);
      ctx.stroke();
    }

    // Room Back Wall
    const wallH = 110;
    if (interior === "residential_home" || interior === "mud_cottage") {
      ctx.fillStyle = "#713f12"; // Traditional mud wall
    } else if (interior === "gun_shop") {
      ctx.fillStyle = "#1e293b"; // Dark secure gun vault wall
    } else if (interior === "mosque_prayer_hall") {
      ctx.fillStyle = "#064e3b"; // Mosque arched wall
    } else if (interior === "hospital_clinic") {
      ctx.fillStyle = "#0f766e";
    } else {
      ctx.fillStyle = "#451a03";
    }
    ctx.fillRect(rx, ry, roomW, wallH);

    // Wooden Trim
    ctx.fillStyle = "#292524";
    ctx.fillRect(rx, ry, roomW, 8);

    // Wall Hanging Calendar & Rural Art
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(rx + 50, ry + 18, 36, 46);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(rx + 54, ry + 22, 28, 12);

    // Open Window looking out to village coconut trees & blue sky
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(rx + roomW - 130, ry + 18, 75, 52);
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 3;
    ctx.strokeRect(rx + roomW - 130, ry + 18, 75, 52);
    // Coconut fronds visible through window
    ctx.fillStyle = "#16a34a";
    ctx.beginPath();
    ctx.arc(rx + roomW - 100, ry + 22, 18, 0, Math.PI);
    ctx.fill();

    // Top Header Banner with Building Name
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.fillRect(rx + 15, ry + 10, roomW - 30, 36);
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 15px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(building?.nameBn || "গ্রামীণ ভবনের ভেতর", rx + roomW / 2, ry + 33);

    const counterY = ry + 170;

    // ==========================================
    // 1. RESIDENTIAL VILLAGE HOME & MUD COTTAGES
    // ==========================================
    if (
      interior === "residential_home" ||
      interior === "mud_cottage" ||
      interior === "village_villa" ||
      interior === "weaver_hut" ||
      interior === "riverside_hut"
    ) {
      // Large Wooden Chowki (চৌকি - গ্রামীণ খাট) on left
      const bedX = rx + 50;
      const bedY = counterY - 20;
      ctx.fillStyle = "#9a3412";
      ctx.fillRect(bedX, bedY, 150, 75);
      // Nakshi Kantha Quilt (নকশী কাঁথা)
      ctx.fillStyle = "#b91c1c";
      ctx.fillRect(bedX + 15, bedY + 8, 120, 58);
      // Quilt geometric pattern
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bedX + 22, bedY + 14, 106, 46);
      // Cotton Pillow
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(bedX + 25, bedY + 18, 28, 16, 4);
      ctx.fill();

      // Clothes Rack (আলনা) with drying lungi & gamcha
      ctx.fillStyle = "#78350f";
      ctx.fillRect(rx + roomW - 100, counterY - 40, 10, 80);
      ctx.fillRect(rx + roomW - 50, counterY - 40, 10, 80);
      ctx.fillRect(rx + roomW - 105, counterY - 35, 70, 6);
      // Lungi & Gamcha
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(rx + roomW - 95, counterY - 28, 24, 45);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(rx + roomW - 68, counterY - 28, 22, 40);

      // Earthen Kalshi (মাটির কলসি) and Clay Stove (মাটির চুলা)
      ctx.fillStyle = "#c2410c";
      ctx.beginPath();
      ctx.arc(rx + roomW - 140, counterY + 20, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9a3412";
      ctx.fillRect(rx + roomW - 146, counterY + 4, 12, 6);

      // Resident Family Member Avatar
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(rx + roomW / 2 - 12, counterY - 35, 24, 28);
      ctx.fillStyle = "#c28859";
      ctx.beginPath();
      ctx.arc(rx + roomW / 2, counterY - 45, 10, 0, Math.PI * 2);
      ctx.fill();

      // Welcome Message Card
      ctx.fillStyle = "rgba(30, 41, 59, 0.95)";
      ctx.beginPath();
      ctx.roundRect(rx + 30, counterY + 55, roomW - 60, 48, 10);
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 12px 'Hind Siliguri', sans-serif";
      ctx.fillText(building?.residentNameBn || "গৃহকর্তা", rx + roomW / 2, counterY + 74);
      ctx.fillStyle = "#a7f3d0";
      ctx.font = "12px 'Hind Siliguri', sans-serif";
      ctx.fillText(
        building?.isPlayerSafehouse
          ? "“এটি আপনার নিজের নিরাপদ ঘর। বিছানায় ঘুমালে ভোর হয়ে সকাল আসবে ও পুলিশ সতর্কতা চলে যাবে!”"
          : "“আসসালামু আলাইকুম! আমাদের কুটিরে স্বাগতম। চৌকিতে বসে বিশ্রাম নিন!”",
        rx + roomW / 2,
        counterY + 92
      );

      // Safehouse Interactive Sleep in Bed Button (বিছানায় ঘুমান - সকাল করুন)
      if (building?.isPlayerSafehouse) {
        const sleepBtnW = 260;
        const sleepBtnH = 36;
        const sleepBtnX = rx + roomW / 2 - sleepBtnW / 2;
        const sleepBtnY = counterY + 110;

        ctx.fillStyle = "#1e3a8a";
        ctx.strokeStyle = "#93c5fd";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(sleepBtnX, sleepBtnY, sleepBtnW, sleepBtnH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12.5px 'Hind Siliguri', sans-serif";
        ctx.fillText("🛏️ বিছানায় ঘুমান (Sleep - সকাল করুন)", rx + roomW / 2, sleepBtnY + 23);
      } else {
        // Full Health Recovered Badge
        ctx.fillStyle = "#065f46";
        ctx.beginPath();
        ctx.roundRect(rx + roomW / 2 - 130, counterY + 112, 260, 26, 6);
        ctx.fill();
        ctx.fillStyle = "#34d399";
        ctx.font = "bold 11px 'Hind Siliguri', sans-serif";
        ctx.fillText("✨ পূর্ণ স্বাস্থ্য ও শক্তি পুনরুদ্ধার হয়েছে (100%)", rx + roomW / 2, counterY + 129);
      }
    }

    // ==========================================
    // 2. TEA STALL & ADDA (চায়ের দোকান ও আড্ডা)
    // ==========================================
    else if (interior === "tea_stall") {
      // Counter Table
      ctx.fillStyle = "#9a3412";
      ctx.fillRect(rx + 40, counterY - 20, roomW - 80, 40);
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(rx + 38, counterY - 24, roomW - 76, 8);

      // Steaming Kettle on counter
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(rx + 80, counterY - 48, 30, 26);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(rx + 85, counterY - 52, 20, 5);
      // Steam
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      for (let s = 0; s < 4; s++) {
        ctx.beginPath();
        const sy = counterY - 56 - ((this.animTimer * 28 + s * 10) % 24);
        ctx.arc(rx + 95 + s * 3, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Biscuit jars with Bakarkhani
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillRect(rx + 130, counterY - 50, 24, 26);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(rx + 133, counterY - 44, 18, 18);

      // Tea Stall Owner behind counter
      ctx.fillStyle = "#15803d";
      ctx.fillRect(rx + roomW / 2 - 12, counterY - 58, 24, 28);
      ctx.fillStyle = "#c28859";
      ctx.beginPath();
      ctx.arc(rx + roomW / 2, counterY - 68, 10, 0, Math.PI * 2);
      ctx.fill();

      // Dialogue Speech
      ctx.fillStyle = "rgba(30, 41, 59, 0.95)";
      ctx.beginPath();
      ctx.roundRect(rx + 30, counterY + 28, roomW - 60, 44, 8);
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 12px 'Hind Siliguri', sans-serif";
      ctx.fillText(building?.residentNameBn || "করিম ভাই", rx + roomW / 2, counterY + 46);
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px 'Hind Siliguri', sans-serif";
      ctx.fillText(
        player.currentAddaTopic || "“খাঁটি দুধের গরম চা খাইবেন ভাই? টুলের বেঞ্চে বসেন, সবাই মিলে আড্ডা দেই!”",
        rx + roomW / 2,
        counterY + 62
      );

      // Interactive Action Buttons inside Tea Stall
      const btnW = 180;
      const btnH = 34;

      // 1. Drink Tea Button (T / Tap)
      const b1X = rx + roomW / 2 - btnW - 10;
      const b1Y = counterY + 85;
      ctx.fillStyle = "#059669";
      ctx.strokeStyle = "#a7f3d0";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(b1X, b1Y, btnW, btnH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px 'Hind Siliguri', sans-serif";
      ctx.fillText("☕ গরম দুধ চা (৳১০ - T বাটন)", b1X + btnW / 2, b1Y + 22);

      // 2. Eat Bakarkhani
      const b2X = rx + roomW / 2 + 10;
      const b2Y = counterY + 85;
      ctx.fillStyle = "#d97706";
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(b2X, b2Y, btnW, btnH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px 'Hind Siliguri', sans-serif";
      ctx.fillText("🥖 বাকরখানি বিস্কুট (৳১৫)", b2X + btnW / 2, b2Y + 22);

      // 3. Sit on Bench / Adda Button
      const b3X = rx + roomW / 2 - btnW / 2;
      const b3Y = counterY + 128;
      ctx.fillStyle = "#4338ca";
      ctx.strokeStyle = "#c7d2fe";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(b3X, b3Y, btnW, btnH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px 'Hind Siliguri', sans-serif";
      ctx.fillText("🗣️ টুলের বেঞ্চে আড্ডা দিন (গল্প)", b3X + btnW / 2, b3Y + 22);
    }

    // ==========================================
    // 3. SHOMSHER GUN & AMMO STORE (অস্ত্র ও গুলির দোকান)
    // ==========================================
    else if (interior === "gun_shop") {
      // Steel Gun Case Counter
      ctx.fillStyle = "#334155";
      ctx.fillRect(rx + 30, counterY - 24, roomW - 60, 42);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(rx + 28, counterY - 28, roomW - 56, 6);

      // Arms Dealer Ostad Shomsher behind counter
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(rx + roomW / 2 - 12, counterY - 62, 24, 28);
      ctx.fillStyle = "#945c31";
      ctx.beginPath();
      ctx.arc(rx + roomW / 2, counterY - 72, 10, 0, Math.PI * 2);
      ctx.fill();

      // Dialogue Banner
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.beginPath();
      ctx.roundRect(rx + 25, counterY + 24, roomW - 50, 36, 8);
      ctx.fill();
      ctx.fillStyle = "#f87171";
      ctx.font = "bold 12px 'Hind Siliguri', sans-serif";
      ctx.fillText("ওস্তাদ শমসের (লাইসেন্সধারী অস্ত্র ব্যবসায়ী)", rx + roomW / 2, counterY + 40);
      ctx.fillStyle = "#ffffff";
      ctx.font = "11px 'Hind Siliguri', sans-serif";
      ctx.fillText("“ডাকাত দমন ও আত্মরক্ষার জন্য লাইসেন্সকৃত পিস্তল, দোনলা বন্দুক, রাইফেল ও গুলি সুলভ মূল্যে প্রস্তুত!”", rx + roomW / 2, counterY + 54);

      // Available Guns & Ammo Cards Grid
      const cardW = (roomW - 70) / 3;
      const cardH = 50;
      GUN_SHOP_ITEMS.slice(0, 6).forEach((item, idx) => {
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        const cx = rx + 30 + col * (cardW + 8);
        const cy = counterY + 68 + row * (cardH + 8);

        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = item.type === "weapon" ? "#f59e0b" : "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cx, cy, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9.5px 'Hind Siliguri', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(item.nameBn.split("(")[0] || item.nameBn, cx + 6, cy + 16);

        ctx.fillStyle = "#facc15";
        ctx.font = "bold 10px 'Hind Siliguri', sans-serif";
        ctx.fillText(`৳${item.price}`, cx + 6, cy + 32);

        // Buy button badge
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.roundRect(cx + cardW - 52, cy + 18, 46, 22, 4);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px 'Hind Siliguri', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("কিনুন", cx + cardW - 29, cy + 32);
      });
    }

    // ==========================================
    // 4. OTHER INSTITUTIONS (School, Mosque, Clinic, Garage, Bank)
    // ==========================================
    else if (interior === "school_classroom") {
      // Blackboard
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(rx + 60, counterY - 45, roomW - 120, 50);
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 4;
      ctx.strokeRect(rx + 60, counterY - 45, roomW - 120, 50);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("পাঠঃ আমাদের সোনার বাংলাদেশ • জ্ঞানই শক্তি", rx + roomW / 2, counterY - 18);
    } else if (interior === "mosque_prayer_hall") {
      // Mosque Arches
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3;
      for (let ax = rx + 80; ax < rx + roomW - 60; ax += 80) {
        ctx.beginPath();
        ctx.arc(ax, counterY - 20, 32, Math.PI, 0);
        ctx.stroke();
      }
      ctx.fillStyle = "#a7f3d0";
      ctx.font = "bold 13px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("পবিত্র মসজিদ চত্বর • শান্ত মনে প্রার্থনা করুন", rx + roomW / 2, counterY + 40);
    } else if (interior === "hospital_clinic") {
      // Hospital Examination Bed
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(rx + 70, counterY - 30, 110, 45);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(rx + 75, counterY - 25, 25, 30);
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 12px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("জরুরি স্বাস্থ্য সেবা • স্বাস্থ্য বৃদ্ধি ও ওষুধ গ্রহণ", rx + roomW / 2, counterY + 50);
    } else {
      // Standard shop / office counter
      ctx.fillStyle = "#9a3412";
      ctx.fillRect(rx + 50, counterY - 20, roomW - 100, 36);
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(rx + 48, counterY - 24, roomW - 96, 6);
    }

    // Player Avatar inside the Room
    const playerInteriorX = rx + roomW / 2;
    const playerInteriorY = ry + roomH - 75;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(playerInteriorX, playerInteriorY + 12, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#166534";
    ctx.fillRect(playerInteriorX - 6, playerInteriorY, 12, 12);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(playerInteriorX - 8, playerInteriorY - 14, 16, 14);
    ctx.fillStyle = "#c28859";
    ctx.beginPath();
    ctx.arc(playerInteriorX, playerInteriorY - 20, 8, 0, Math.PI * 2);
    ctx.fill();

    // ==========================================
    // EXIT DOOR MAT AT BOTTOM (EVERY INTERIOR HAS THIS!)
    // ==========================================
    ctx.fillStyle = "#10b981";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    const matW = 200;
    const matH = 38;
    const matX = rx + roomW / 2 - matW / 2;
    const matY = ry + roomH - matH - 12;
    ctx.beginPath();
    ctx.roundRect(matX, matY, matW, matH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#022c22";
    ctx.font = "bold 13px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🚪 বাহিরে যান (E বাটন বা ট্যাপ করুন)", rx + roomW / 2, matY + 24);

    // Safehouse Sleeping morning wake-up cinematic transition
    if (player.isSleeping) {
      const alpha = player.sleepFade !== undefined ? Math.min(0.92, player.sleepFade) : 0.8;
      ctx.fillStyle = `rgba(12, 18, 12, ${alpha})`;
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 24px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🌅 ভোর হলো... মোরগের ডাক শুনছেন!", viewW / 2, viewH / 2 - 12);
      ctx.fillStyle = "#a7f3d0";
      ctx.font = "14px 'Hind Siliguri', sans-serif";
      ctx.fillText("✨ সকাল হয়ে গেল! পূর্ণ স্বাস্থ্য ১০০% ও পুলিশ সতর্কতা দূর হয়েছে।", viewW / 2, viewH / 2 + 22);
    }
  }
}
