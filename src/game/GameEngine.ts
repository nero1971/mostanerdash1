import { soundManager } from "../audio/SoundManager";
import {
  Animal,
  Building,
  Bullet,
  Dacoit,
  GameSettings,
  GameState,
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
  RiverCollectible,
  ThrownBomb,
  TimeOfDay,
  Vehicle,
  WeatherType,
} from "../types/game";
import {
  BUILDINGS,
  COW_FUNNY_DIALOGUES,
  DUCK_FUNNY_DIALOGUES,
  GOAT_FUNNY_DIALOGUES,
  GUN_SHOP_ITEMS,
  GunStoreItem,
  INITIAL_ANIMALS,
  INITIAL_HAWKERS,
  INITIAL_NIGHT_THIEVES,
  INITIAL_NPCS,
  INITIAL_PROCESSIONS,
  INITIAL_RIVER_COLLECTIBLES,
  INITIAL_TRAFFIC_VEHICLES,
  INITIAL_TRAIN_DATA,
  INITIAL_VEHICLES,
  MISSIONS,
  REGIONS,
  RIVER_X,
  TEASTALL_ADDA_TOPICS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  BENGALI_HIT_SCREAMS,
} from "./constants";
import { GameRenderer } from "./renderer";

const SAVE_KEY = "mastaner_desh_1_save_v1";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;

  public state: GameState = "INTRO_MODAL"; // Show "বাপের রাস্তা" intro modal first!
  public player: Player;
  public vehicles: Vehicle[] = [];
  public npcs: NPC[] = [];
  public dacoits: Dacoit[] = [];
  public nightThieves: NightThief[] = JSON.parse(JSON.stringify(INITIAL_NIGHT_THIEVES));
  public train: MovingTrain = JSON.parse(JSON.stringify(INITIAL_TRAIN_DATA));
  public policeOfficer: PoliceOfficer;
  public policeOfficers: PoliceOfficer[] = [];
  public policeHelicopter: PoliceHelicopter;
  public buildings: Building[] = [];
  public particles: Particle[] = [];

  public activeMission: Mission | null = null;
  public activeMissionIndex = 0;
  public completedMissions: number[] = [];
  public missionTimer: number | null = null;

  public bullets: Bullet[] = [];
  public thrownBombs: ThrownBomb[] = [];
  public hawkers: Hawker[] = [];
  public processions: Procession[] = [];
  public riverCollectibles: RiverCollectible[] = [];
  public animals: Animal[] = [];
  private generatedChunks = new Set<string>();
  private nightRaidSpawnTimer = 0;

  public camera = { x: 680, y: 520, zoom: 1.55, shake: 0 };
  public timeOfDay: TimeOfDay = "morning";
  public weather: WeatherType = "clear";
  private timeCycleTimer = 0;

  public settings: GameSettings = {
    language: "bn",
    graphicsQuality: "high",
    controlType: "dpad", // D-Pad default for immediate responsiveness on mobile!
    controlSize: "medium",
    leftHanded: false,
    showMinimap: true,
    sound: {
      master: 0.8,
      music: 0.6,
      ambient: 0.5,
      vehicles: 0.7,
      sfx: 0.8,
      muted: false,
    },
  };

  // Inputs
  public inputs = {
    up: false,
    down: false,
    left: false,
    right: false,
    run: false,
    action: false,
    attack: false,
    shoot: false,
    horn: false,
    justPressedAction: false,
    justPressedAttack: false,
    justPressedShoot: false,
    justPressedHorn: false,
  };

  public joystick = { x: 0, y: 0, active: false };

  private isRunning = false;
  private lastTime = 0;
  private animationFrameId: number | null = null;
  private stepDistance = 0;
  private speedBoostTimer = 0;

  public notification: { title: string; desc: string; timer: number } | null = null;

  public onStateChange?: (state: GameState) => void;
  public onHudUpdate?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
    this.renderer = new GameRenderer(this.ctx);

    // Initial player state with weapons, ammo, and enterable house tracking
    this.player = {
      x: 680,
      y: 520, // Right on the village paved road outside Rahim's house!
      angle: 0,
      speed: 0,
      walkSpeed: 2.6, // Smooth, natural walking pace
      runSpeed: 4.8,  // Controllable sprint pace
      health: 100,
      maxHealth: 100,
      money: 450,
      currentVehicleId: null,
      currentInterior: null,
      currentBuildingId: null,
      currentBuilding: null,
      isRunning: false,
      isInteracting: false,
      isAttacking: false,
      attackTimer: 0,
      facing: "down",
      animFrame: 0,
      wantedLevel: 0,
      finesDue: 0,
      // Weapons & Firearms
      weapon: "fist",
      ownedWeapons: ["fist", "ramdao"],
      ammo: {
        pistol: 15,
        shotgun: 0,
        rifle: 0,
        bomb: 3,
      },
      // Digital Banking & Mobile Wallets (বিকাশ, নগদ ও ব্যাংক একাউন্ট)
      bankBalance: 5000,
      bkashBalance: 850,
      nagadBalance: 420,
      // Tea stall and adda states
      isDrinkingTea: false,
      isSittingInAdda: false,
      currentAddaTopic: "",
    };

    this.policeOfficer = {
      id: "police_mizan",
      nameBn: "অফিসার মিজান",
      x: 2180,
      y: 1610,
      targetX: 2180,
      targetY: 1610,
      speed: 3.5,
      isSirenActive: false,
      sirenTimer: 0,
      chasingDacoitId: null,
      chasingPlayer: false,
      attackCooldown: 0,
      health: 120,
      maxHealth: 120,
      isKnockedOut: false,
      weaponType: "baton",
    };

    this.policeOfficers = [
      this.policeOfficer,
      {
        id: "police_kayser",
        nameBn: "সার্জেন্ট কায়সার",
        x: 4400,
        y: 2450,
        targetX: 4400,
        targetY: 2450,
        speed: 3.6,
        isSirenActive: false,
        sirenTimer: 0,
        chasingDacoitId: null,
        chasingPlayer: false,
        attackCooldown: 0,
        health: 100,
        maxHealth: 100,
        isKnockedOut: false,
        weaponType: "baton",
      },
      {
        id: "police_rab_1",
        nameBn: "র‍্যাব অফিসার শওকত",
        x: 4600,
        y: 2480,
        targetX: 4600,
        targetY: 2480,
        speed: 3.8,
        isSirenActive: false,
        sirenTimer: 0,
        chasingDacoitId: null,
        chasingPlayer: false,
        attackCooldown: 0,
        health: 150,
        maxHealth: 150,
        isKnockedOut: false,
        weaponType: "shotgun",
      },
    ];

    this.policeHelicopter = {
      id: "police_helo_1",
      x: 4560,
      y: 2480,
      targetX: 4560,
      targetY: 2480,
      altitude: 0,
      rotorAngle: 0,
      speed: 6.2,
      isActive: false,
      searchlightAngle: 0,
      searchlightRadius: 110,
      shootCooldown: 0,
    };

    // Load initial buildings (every single one enterable!)
    this.buildings = [...BUILDINGS];

    // Initialize vehicles including user's vehicles AND AI Autonomous Traffic vehicles!
    const baseVehicles = JSON.parse(JSON.stringify(INITIAL_VEHICLES));
    const trafficVehicles = JSON.parse(JSON.stringify(INITIAL_TRAFFIC_VEHICLES));
    this.vehicles = [...baseVehicles, ...trafficVehicles];

    // Load Hawkers
    this.hawkers = JSON.parse(JSON.stringify(INITIAL_HAWKERS));

    // Load Animals & Humorous Village Fauna (গরু, হাঁস, ছাগল ও পাখি)
    this.animals = JSON.parse(JSON.stringify(INITIAL_ANIMALS));

    // Load Processions & Rallies
    this.processions = JSON.parse(JSON.stringify(INITIAL_PROCESSIONS));

    // Load River Collectibles
    this.riverCollectibles = JSON.parse(JSON.stringify(INITIAL_RIVER_COLLECTIBLES));

    this.npcs = JSON.parse(JSON.stringify(INITIAL_NPCS)).map((n: NPC) => ({
      ...n,
      knockbackVx: 0,
      knockbackVy: 0,
      knockdownTimer: 0,
    }));

    // Initialize initial Dacoits near Banyan Tree
    this.dacoits = [
      {
        id: "dacoit_1",
        nameBn: "ডাকাত কালু (রামদাবাজ)",
        x: 2120,
        y: 2320,
        targetX: 2120,
        targetY: 2320,
        speed: 3.2,
        health: 70,
        maxHealth: 70,
        isChasing: false,
        attackCooldown: 0,
        hasLoot: true,
        isKnockedOut: false,
        knockbackVx: 0,
        knockbackVy: 0,
        knockdownTimer: 0,
        weaponType: "ramdao",
      },
      {
        id: "dacoit_2",
        nameBn: "ডাকাত জলিল (বোমাবাজ)",
        x: 2200,
        y: 2380,
        targetX: 2200,
        targetY: 2380,
        speed: 3.4,
        health: 80,
        maxHealth: 80,
        isChasing: false,
        attackCooldown: 0,
        hasLoot: true,
        isKnockedOut: false,
        knockbackVx: 0,
        knockbackVy: 0,
        knockdownTimer: 0,
        weaponType: "bomb",
        bombCooldown: 2.0,
      },
      {
        id: "dacoit_3",
        nameBn: "ডাকাত সর্দার বাচ্চু (পিস্তলধারী)",
        x: 2160,
        y: 2420,
        targetX: 2160,
        targetY: 2420,
        speed: 3.0,
        health: 120,
        maxHealth: 120,
        isChasing: false,
        attackCooldown: 0,
        hasLoot: true,
        isKnockedOut: false,
        knockbackVx: 0,
        knockbackVy: 0,
        knockdownTimer: 0,
        weaponType: "pistol",
        shootCooldown: 1.5,
      },
    ];

    // Generate nearby infinite world chunks around starting region
    this.checkAndGenerateWorldChunks(this.player.x, this.player.y);

    this.loadProgress();
    this.setupListeners();

    // Start with Mission 1 ready
    if (this.completedMissions.length === 0) {
      this.activeMission = { ...MISSIONS[0], hasPickedUp: false };
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    soundManager.init();
    soundManager.updateVolumes(this.settings.sound);

    const loop = (time: number) => {
      const rawDt = (time - this.lastTime) / 1000;
      this.lastTime = time;
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.render(dt);

      this.inputs.justPressedAction = false;
      this.inputs.justPressedAttack = false;
      this.inputs.justPressedHorn = false;

      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundManager.stopEngine();
    soundManager.stopRadio();
  }

  private setupListeners() {
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      soundManager.resume();

      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          this.inputs.up = true;
          break;
        case "KeyS":
        case "ArrowDown":
          this.inputs.down = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          this.inputs.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          this.inputs.right = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          this.inputs.run = true;
          break;
        case "KeyE":
          this.inputs.action = true;
          this.inputs.justPressedAction = true;
          this.handleActionPress();
          break;
        case "KeyF":
        case "KeyJ":
          this.inputs.shoot = true;
          this.inputs.justPressedShoot = true;
          this.shootGun();
          break;
        case "KeyQ":
          this.switchWeapon();
          break;
        case "KeyT":
          this.drinkTea();
          break;
        case "Space":
          this.inputs.horn = true;
          this.inputs.justPressedHorn = true;
          this.handleHornPress();
          break;
        case "Escape":
          if (this.state === "PLAYING") {
            this.setState("PAUSED");
          } else if (this.state === "PAUSED") {
            this.setState("PLAYING");
          }
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          this.inputs.up = false;
          break;
        case "KeyS":
        case "ArrowDown":
          this.inputs.down = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          this.inputs.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          this.inputs.right = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          this.inputs.run = false;
          break;
        case "KeyE":
          this.inputs.action = false;
          break;
        case "KeyF":
        case "KeyJ":
          this.inputs.shoot = false;
          break;
        case "Space":
          this.inputs.horn = false;
          break;
      }
    });

    window.addEventListener("blur", () => {
      this.inputs = {
        up: false,
        down: false,
        left: false,
        right: false,
        run: false,
        action: false,
        attack: false,
        shoot: false,
        horn: false,
        justPressedAction: false,
        justPressedAttack: false,
        justPressedShoot: false,
        justPressedHorn: false,
      };
      this.joystick = { x: 0, y: 0, active: false };
    });
  }

  // --- Melee Attack (ঘুষি বা লাঠির আঘাত) ---
  // --- Melee Attack (ঘুষি, বাঁশের লাঠি বা রামদার কোপ) ---
  public handleAttack() {
    if (this.state !== "PLAYING") return;
    this.player.isAttacking = true;
    this.player.attackTimer = 0.25;

    let baseDamage = 35;
    let reach = 65;

    if (this.player.weapon === "ramdao") {
      baseDamage = 85;
      reach = 90;
      soundManager.playMacheteSwing();
      this.camera.shake = 12;
    } else if (this.player.weapon === "bamboo_stick") {
      baseDamage = 50;
      reach = 75;
      soundManager.playPunch();
      this.camera.shake = 8;
    } else {
      soundManager.playPunch();
      this.camera.shake = 6;
    }

    // 1. Check hit against nearby dacoits
    this.dacoits.forEach((d) => {
      if (d.isKnockedOut) return;
      const dist = Math.hypot(d.x - this.player.x, d.y - this.player.y);
      if (dist < reach) {
        d.health = Math.max(0, d.health - baseDamage);
        soundManager.playBodyHit();
        this.addParticle({
          x: d.x,
          y: d.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          size: 5,
          color: "#f87171",
          alpha: 0.9,
          life: 0.35,
          maxLife: 0.35,
          type: "hit",
        });
        if (d.health <= 0) {
          d.isKnockedOut = true;
          this.player.money += 150;
          soundManager.playCoin();
          this.showToast("ডাকাত পরাস্ত!", "ডাকাত পরাজিত হয়েছে! আপনি ৳১৫০ উদ্ধার করেছেন!");
        } else {
          this.showToast(this.player.weapon === "ramdao" ? "রামদার কোপ!" : "ঘুষি!", `ডাকাত আঘাত পেয়েছে! (স্বাস্থ্য: ${d.health})`);
        }
      }
    });

    // 1.5. Check hit against nearby Night Thieves (রাতের চোর ও ছিনতাইকারী)
    this.nightThieves.forEach((t) => {
      if (t.isSubdued) return;
      const dist = Math.hypot(t.x - this.player.x, t.y - this.player.y);
      if (dist < reach) {
        t.health = Math.max(0, t.health - baseDamage);
        soundManager.playBodyHit();
        this.addParticle({
          x: t.x,
          y: t.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          size: 5,
          color: "#f87171",
          alpha: 0.9,
          life: 0.35,
          maxLife: 0.35,
          type: "hit",
        });
        if (t.health <= 0) {
          t.isSubdued = true;
          this.player.money += t.bounty;
          soundManager.playThiefCaught();
          this.showToast("🥷 চোর আটক!", `${t.nameBn} পরাস্ত হয়েছে! চোরাই মাল থেকে ৳${t.bounty} উদ্ধার! এবার (E) চেপে পুলিশকে দিন!`);
        } else {
          t.fleeingFromPlayer = true;
          this.showToast("চোরের গায়ে আঘাত!", `${t.nameBn} আঘাত খেয়েছে! (স্বাস্থ্য: ${t.health})`);
        }
      }
    });

    // 2. Universal Combat Freedom: Hit ANY person / NPC in front of player
    this.npcs.forEach((n) => {
      if (n.state === "knocked_down") return;
      const dist = Math.hypot(n.x - this.player.x, n.y - this.player.y);
      if (dist < reach) {
        n.health = Math.max(0, (n.health || 100) - baseDamage);
        n.knockbackVx = Math.sign(n.x - this.player.x) * 10;
        n.knockbackVy = Math.sign(n.y - this.player.y) * 10;
        n.knockdownTimer = 2.5;
        soundManager.playBodyHit();

        const scream = BENGALI_HIT_SCREAMS[Math.floor(Math.random() * BENGALI_HIT_SCREAMS.length)];
        this.addParticle({
          type: "shout",
          text: scream,
          x: n.x,
          y: n.y - 20,
          vx: n.knockbackVx * 0.3,
          vy: -2,
          size: 8,
          color: "#ef4444",
          alpha: 1,
          life: 2.0,
          maxLife: 2.0,
        });

        if (n.health <= 0) {
          n.state = "knocked_down";
          n.knockdownTimer = 45.0; // Stay down
          this.player.money += 60;
          this.player.wantedLevel = Math.min(3, this.player.wantedLevel + 1);
          soundManager.playCoin();
          this.showToast("মানুষ পরাস্ত!", `${n.nameBn} পরাস্ত হয়েছে! ৳৬০ টাকা লুট হয়েছে!`);
        } else {
          this.showToast(this.player.weapon === "ramdao" ? "রামদার আঘাত!" : "ঘুষি!", `${n.nameBn} আঘাত খেয়েছে! (স্বাস্থ্য: ${n.health})`);
        }
      }
    });

    if (this.onHudUpdate) this.onHudUpdate();
  }

  // --- Emergency Police Call (পুলিশের জরুরি কল) ---
  public callPolice() {
    soundManager.playSiren();
    this.policeOfficer.isSirenActive = true;
    this.policeOfficer.sirenTimer = 15;

    // Spawn police near player to rescue
    this.policeOfficer.x = this.player.x - 120;
    this.policeOfficer.y = this.player.y;
    this.policeOfficer.targetX = this.player.x;
    this.policeOfficer.targetY = this.player.y;

    // Frighten and arrest nearby dacoits
    this.dacoits.forEach((d) => {
      if (Math.hypot(d.x - this.player.x, d.y - this.player.y) < 300) {
        d.isChasing = false;
        d.isKnockedOut = true;
      }
    });

    this.showToast("পুলিশ এসেছে!", "অফিসার মিজান সাইরেন বাজিয়ে উপস্থিত হয়েছেন! ডাকাতরা গ্রেপ্তার হয়েছে!");
    if (this.onHudUpdate) this.onHudUpdate();
  }

  // --- Universal Building Entry / Exit & Action Press ---
  // Any house in the village, river, or infinite world can be entered and exited!
  public handleActionPress() {
    if (this.state !== "PLAYING") return;

    // 0. Train Boarding / Disembarking (ট্রেনে ওঠা ও নামা)
    if (this.train.hasPlayerBoarded) {
      this.train.hasPlayerBoarded = false;
      this.player.y = this.train.trackY + 45;
      soundManager.playFootstep();
      this.showToast("ট্রেন থেকে নেমেছেন", "আপনি নিরাপদে প্ল্যাটফর্মে নেমেছেন।");
      if (this.onHudUpdate) this.onHudUpdate();
      return;
    }

    const distToTrain = Math.hypot(this.player.x - this.train.x, this.player.y - this.train.y);
    if (distToTrain < 85) {
      this.train.hasPlayerBoarded = true;
      soundManager.playTrainWhistle();
      this.showToast("🚆 ট্রেনে চড়েছেন!", "বাংলাদেশ রেলওয়ে আন্তঃনগর এক্সপ্রেস ট্রেনে চড়েছেন! পুরো বাংলাদেশ ঘুরে দেখুন। নামতে আবার (E) চাপুন।");
      if (this.onHudUpdate) this.onHudUpdate();
      return;
    }

    // 0.5. Hand over Subdued Thief to Police (আটক চোরকে পুলিশে সোপর্দ)
    const nearbyThief = this.nightThieves.find(
      (t) => t.isSubdued && !t.isHandedOver && Math.hypot(t.x - this.player.x, t.y - this.player.y) < 80
    );
    if (nearbyThief) {
      nearbyThief.isHandedOver = true;
      const totalReward = nearbyThief.bounty + 250;
      this.player.money += totalReward;
      soundManager.playPoliceWhistle();
      soundManager.playThiefCaught();
      this.showToast("🚨 চোর পুলিশে সোপর্দ!", `${nearbyThief.nameBn}-কে পুলিশের হাতে তুলে দেওয়া হয়েছে! ৳${totalReward} পুরস্কার অর্জন!`);
      if (this.onHudUpdate) this.onHudUpdate();
      return;
    }

    // 1. If currently inside a house, mud cottage, or shop: exit outside!
    if (this.player.currentInterior || this.player.currentBuilding) {
      soundManager.playShopDoorBell();
      const bld = this.player.currentBuilding;
      if (bld) {
        // Place player just outside the front door
        this.player.x = bld.doorX || (bld.x + bld.w / 2);
        this.player.y = (bld.doorY || (bld.y + bld.h)) + 25;
      }
      this.player.currentInterior = null;
      this.player.currentBuilding = null;
      this.player.isSittingInAdda = false;
      this.showToast("বাহিরে এসেছেন", "ঘর/দোকান থেকে বাইরে উন্মুক্ত রাস্তায় ফিরে এসেছেন।");
      if (this.onHudUpdate) this.onHudUpdate();
      return;
    }

    // 2. If in a vehicle or boat, exit vehicle
    if (this.player.currentVehicleId) {
      this.exitVehicle();
      return;
    }

    // 3. Proximity to ANY building's door (Handcrafted + Procedural)
    // Every house in the entire map is 100% enterable!
    const nearbyBuilding = this.buildings.find((b) => {
      const dX = b.doorX || (b.x + b.w / 2);
      const dY = b.doorY || (b.y + b.h);
      return Math.hypot(dX - this.player.x, dY - this.player.y) < 85;
    });

    if (nearbyBuilding) {
      this.player.currentBuilding = nearbyBuilding;
      this.player.currentInterior = nearbyBuilding.interiorType || "residential_home";
      soundManager.playShopDoorBell();

      // Resting inside restores health
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);

      const residentInfo = nearbyBuilding.residentNameBn ? ` (${nearbyBuilding.residentNameBn})` : "";
      this.showToast(
        nearbyBuilding.nameBn,
        `বাড়িতে প্রবেশ করেছেন${residentInfo}। বিছানায় বিশ্রামে স্বাস্থ্য উদ্ধার হলো! (বের হতে E চাপুন)`
      );
      if (this.onHudUpdate) this.onHudUpdate();
      return;
    }

    // 4. Proximity to rideable vehicle or river ferry boat
    const nearbyVeh = this.vehicles.find((v) => {
      const dist = Math.hypot(v.x - this.player.x, v.y - this.player.y);
      return dist < 85 && (!v.occupied || v.isAiTraffic);
    });

    if (nearbyVeh) {
      this.enterVehicle(nearbyVeh);
      return;
    }

    // 5. Proximity to Street Hawkers (ঝালমুড়ি, আইসক্রিম, বাদাম ও ফল বিক্রেতা)
    const nearbyHawker = this.hawkers.find((h) => {
      return Math.hypot(h.x - this.player.x, h.y - this.player.y) < 85;
    });

    if (nearbyHawker) {
      if (this.player.money < nearbyHawker.price) {
        soundManager.playPhoneBeep();
        this.showToast(nearbyHawker.nameBn, `টাকা নেই ভাই! ${nearbyHawker.itemBn} এর দাম ৳${nearbyHawker.price}`);
        return;
      }
      this.player.money -= nearbyHawker.price;
      this.player.health = Math.min(this.player.maxHealth, this.player.health + nearbyHawker.healthHeal);
      soundManager.playCoin();
      soundManager.playTeaSip();
      this.showToast(
        nearbyHawker.nameBn,
        `😋 ${nearbyHawker.itemBn} কিনে খেয়েছেন (৳${nearbyHawker.price})! স্বাস্থ্য +${nearbyHawker.healthHeal}% বৃদ্ধি পেয়েছে!`
      );
      if (this.onHudUpdate) this.onHudUpdate();
      return;
    }

    // 6. Proximity to ANY Person / NPC dialog (সবার সাথেই সরাসরি কথা বলা)
    const nearbyNPC = this.npcs.find((n) => {
      return Math.hypot(n.x - this.player.x, n.y - this.player.y) < 85;
    });

    if (nearbyNPC) {
      const phrases = this.settings.language === "bn" ? nearbyNPC.speechBn : nearbyNPC.speechEn;
      nearbyNPC.activeDialog = phrases[Math.floor(Math.random() * phrases.length)];
      nearbyNPC.dialogTimer = 4.5;
      soundManager.playPhoneBeep();
      soundManager.speakBengali(nearbyNPC.activeDialog);
      this.showToast(`🗣️ ${nearbyNPC.nameBn} (${nearbyNPC.roleBn})`, `"${nearbyNPC.activeDialog}"`);
      if (this.onHudUpdate) this.onHudUpdate();
      return;
    }
  }

  // --- Horn / Bicycle Bell ---
  public handleHornPress() {
    if (this.state !== "PLAYING") return;
    if (this.player.currentVehicleId) {
      const veh = this.vehicles.find((v) => v.id === this.player.currentVehicleId);
      if (veh) {
        soundManager.playHorn(veh.type);
        this.npcs.forEach((npc) => {
          if (Math.hypot(npc.x - veh.x, npc.y - veh.y) < 180) {
            npc.targetX += Math.sign(npc.x - veh.x) * 50;
            npc.targetY += Math.sign(npc.y - veh.y) * 50;
          }
        });
      }
    } else {
      soundManager.playBicycleBell();
    }
  }

  // --- Vehicle Enter / Exit & Carjacking ---
  public enterVehicle(v: Vehicle) {
    if (v.isWaterVehicle && this.player.x < RIVER_X - 100) {
      this.showToast("পদ্মার খেয়া নৌকা", "নৌকা চালাতে হলে পদ্মা নদীর ঘাটে যান!");
      return;
    }

    // GTA 2 Carjacking: If vehicle was AI traffic or occupied by an NPC, forcibly pull driver out!
    if (v.isAiTraffic || (v.occupied && v.id !== this.player.currentVehicleId)) {
      v.isAiTraffic = false;
      soundManager.playCarjacking();

      const scream = "ওরে বাবারে! আমার গাড়ি নিয়া গেল রে! পুলিশ ডাক!";
      this.addParticle({
        type: "shout",
        text: scream,
        x: v.x - 20,
        y: v.y - 15,
        vx: -3,
        vy: -2,
        size: 8,
        color: "#ef4444",
        alpha: 1,
        life: 2.5,
        maxLife: 2.5,
      });

      // Spawn ejected driver as an NPC on ground in ragdoll tumble
      this.npcs.push({
        id: `ejected_driver_${Date.now()}`,
        nameBn: v.driverNameBn || "ছিনতাইয়ের শিকার চালক",
        nameEn: "Ejected Driver",
        roleBn: "ভুক্তভোগী চালক",
        roleEn: "Victim Driver",
        x: v.x - 25,
        y: v.y,
        targetX: v.x - 60,
        targetY: v.y + 30,
        speed: 1.0,
        angle: v.angle,
        state: "knocked_down",
        clothingColor: "#0284c7",
        skinTone: "#c28859",
        knockbackVx: -12,
        knockbackVy: -4,
        knockdownTimer: 3.5,
        speechBn: ["আমার গাড়ি নিয়া গেল রে! পুলিশ ডাক!", "বাপের রাস্তা পাইছস নাকি রে?!"],
        speechEn: ["He stole my vehicle! Call the police!"],
      });

      // Increase wanted level (1 to 5 Stars)!
      this.player.wantedLevel = Math.min(5, this.player.wantedLevel + 1);
      this.camera.shake = 10;
      this.showToast("গাড়ি ছিনতাই (Carjack)!", `${v.nameBn} কেড়ে নিয়েছেন! পুলিশ সতর্ক হয়েছে (★)!`);
    } else {
      this.showToast(v.nameBn, "যানবাহনে উঠেছেন। চালাতে বাটন বা জয়স্টিক ব্যবহার করুন।");
    }

    this.player.currentVehicleId = v.id;
    v.occupied = true;
    soundManager.playUiClick();
    if (this.onHudUpdate) this.onHudUpdate();
  }

  public exitVehicle() {
    if (!this.player.currentVehicleId) return;
    const v = this.vehicles.find((veh) => veh.id === this.player.currentVehicleId);
    if (v) {
      v.occupied = false;
      v.speed = 0;
      this.player.x = v.x - Math.cos(v.angle + Math.PI / 2) * (v.width + 18);
      this.player.y = v.y - Math.sin(v.angle + Math.PI / 2) * (v.width + 18);
    }
    this.player.currentVehicleId = null;
    soundManager.stopEngine();
    soundManager.playUiClick();
    if (this.onHudUpdate) this.onHudUpdate();
  }

  // --- Gun & Shooting System (গুলি চালানো, রামদা ও বোমা সিস্টেম) ---
  public shootGun() {
    if (this.state !== "PLAYING") return;

    // 1. Melee Weapons: Fist, Bamboo Stick, Ramdao
    if (this.player.weapon === "fist" || this.player.weapon === "bamboo_stick" || this.player.weapon === "ramdao") {
      this.handleAttack();
      return;
    }

    // 2. Thrown Weapon: Hand Bomb / Petrol Cocktail
    if (this.player.weapon === "bomb") {
      this.throwBomb();
      return;
    }

    const currentGun = this.player.weapon as "pistol" | "shotgun" | "rifle";
    const availableAmmo = this.player.ammo[currentGun] || 0;

    // Check if player has ammunition
    if (availableAmmo <= 0) {
      soundManager.playGunEmpty();
      this.showToast("গুলি শেষ!", "আপনার কাছে পর্যাপ্ত গুলি নেই! 'শমসের অস্ত্রাগার' থেকে গুলি কিনুন!");
      return;
    }

    // Decrement ammunition
    this.player.ammo[currentGun]--;

    // Determine shot angle from player's facing direction
    let baseAngle = 0;
    if (this.player.facing === "right") baseAngle = 0;
    else if (this.player.facing === "down") baseAngle = Math.PI / 2;
    else if (this.player.facing === "left") baseAngle = Math.PI;
    else if (this.player.facing === "up") baseAngle = -Math.PI / 2;

    const startX = this.player.x + Math.cos(baseAngle) * 16;
    const startY = this.player.y + Math.sin(baseAngle) * 16;

    // Play sound and generate bullets based on gun type
    if (currentGun === "shotgun") {
      soundManager.playGunshot("shotgun");
      this.camera.shake = 14;

      // 5 spread pellets
      for (let i = -2; i <= 2; i++) {
        const spreadAngle = baseAngle + i * 0.08;
        const speed = 19 + Math.random() * 4;
        this.bullets.push({
          id: `bullet_${Date.now()}_${Math.random()}`,
          x: startX,
          y: startY,
          vx: Math.cos(spreadAngle) * speed,
          vy: Math.sin(spreadAngle) * speed,
          life: 0.45,
          maxLife: 0.45,
          damage: 55,
          weaponType: "shotgun",
          color: "#ea580c",
        });
      }

      // Muzzle smoke & spark particles
      for (let s = 0; s < 8; s++) {
        this.addParticle({
          x: startX,
          y: startY,
          vx: Math.cos(baseAngle) * 6 + (Math.random() - 0.5) * 4,
          vy: Math.sin(baseAngle) * 6 + (Math.random() - 0.5) * 4,
          size: 6,
          color: "#f59e0b",
          alpha: 0.9,
          life: 0.35,
          maxLife: 0.35,
          type: "spark",
        });
      }
    } else if (currentGun === "rifle") {
      soundManager.playGunshot("rifle");
      this.camera.shake = 10;

      // High speed penetrating round
      this.bullets.push({
        id: `bullet_${Date.now()}`,
        x: startX,
        y: startY,
        vx: Math.cos(baseAngle) * 28,
        vy: Math.sin(baseAngle) * 28,
        life: 0.75,
        maxLife: 0.75,
        damage: 120,
        weaponType: "rifle",
        color: "#38bdf8",
      });

      this.addParticle({
        x: startX,
        y: startY,
        vx: Math.cos(baseAngle) * 4,
        vy: Math.sin(baseAngle) * 4,
        size: 5,
        color: "#67e8f9",
        alpha: 0.9,
        life: 0.25,
        maxLife: 0.25,
        type: "spark",
      });
    } else {
      // 9mm Pistol
      soundManager.playGunshot("pistol");
      this.camera.shake = 6;

      this.bullets.push({
        id: `bullet_${Date.now()}`,
        x: startX,
        y: startY,
        vx: Math.cos(baseAngle) * 22,
        vy: Math.sin(baseAngle) * 22,
        life: 0.55,
        maxLife: 0.55,
        damage: 48,
        weaponType: "pistol",
        color: "#facc15",
      });

      this.addParticle({
        x: startX,
        y: startY,
        vx: Math.cos(baseAngle) * 3,
        vy: Math.sin(baseAngle) * 3,
        size: 4,
        color: "#fde047",
        alpha: 0.8,
        life: 0.2,
        maxLife: 0.2,
        type: "spark",
      });
    }

    if (this.onHudUpdate) this.onHudUpdate();
  }

  // --- Throw Bomb or Petrol Cocktail (হাতবোমা ও পেট্রোল ককটেল নিক্ষেপ) ---
  public throwBomb(targetX?: number, targetY?: number, isEnemy = false, sourceX?: number, sourceY?: number) {
    if (this.state !== "PLAYING") return;
    const sX = sourceX ?? this.player.x;
    const sY = sourceY ?? this.player.y;

    if (!isEnemy) {
      if (this.player.ammo.bomb <= 0) {
        soundManager.playGunEmpty();
        this.showToast("হাতবোমা নেই!", "আপনার কাছে বোমা নেই! 'শমসের অস্ত্রাগার' থেকে বোমা কিনুন!");
        return;
      }
      this.player.ammo.bomb--;
    }

    let tX = targetX;
    let tY = targetY;
    if (tX === undefined || tY === undefined) {
      let baseAngle = 0;
      if (this.player.facing === "right") baseAngle = 0;
      else if (this.player.facing === "down") baseAngle = Math.PI / 2;
      else if (this.player.facing === "left") baseAngle = Math.PI;
      else if (this.player.facing === "up") baseAngle = -Math.PI / 2;
      tX = sX + Math.cos(baseAngle) * 190;
      tY = sY + Math.sin(baseAngle) * 190;
    }

    soundManager.playBombThrow();
    this.thrownBombs.push({
      id: `bomb_${Date.now()}_${Math.random()}`,
      x: sX,
      y: sY,
      startX: sX,
      startY: sY,
      targetX: tX,
      targetY: tY,
      progress: 0,
      arcHeight: 55,
      timer: 0.65,
      damage: 140,
      radius: 125,
      isEnemy,
      exploded: false,
    });

    if (this.onHudUpdate) this.onHudUpdate();
  }

  // --- Switch Weapon ---
  public switchWeapon() {
    const weapons = this.player.ownedWeapons;
    if (weapons.length <= 1) {
      this.showToast("অস্ত্র পরিবর্তন", "আপনার কাছে একটি মাত্র অস্ত্র রয়েছে। অস্ত্রাগার থেকে নতুন অস্ত্র কিনুন!");
      return;
    }
    const curIdx = weapons.indexOf(this.player.weapon);
    const nextIdx = (curIdx + 1) % weapons.length;
    this.player.weapon = weapons[nextIdx];
    soundManager.playGunReload();

    let nameBn = "খালি হাত (ঘুষি)";
    let ammoStr = "";
    if (this.player.weapon === "ramdao") nameBn = "ধারালো রামদা (চাপাতি)";
    if (this.player.weapon === "bamboo_stick") nameBn = "বাঁশের লাঠি";
    if (this.player.weapon === "pistol") {
      nameBn = "৯মিমি দেশি পিস্তল";
      ammoStr = ` (গুলি: ${this.player.ammo.pistol})`;
    }
    if (this.player.weapon === "shotgun") {
      nameBn = "দোনলা শিকারী বন্দুক";
      ammoStr = ` (কার্তুজ: ${this.player.ammo.shotgun})`;
    }
    if (this.player.weapon === "rifle") {
      nameBn = "দূরপাল্লার কার্বাইন রাইফেল";
      ammoStr = ` (গুলি: ${this.player.ammo.rifle})`;
    }
    if (this.player.weapon === "bomb") {
      nameBn = "হাতবোমা ও পেট্রোল ককটেল";
      ammoStr = ` (মজুদ: ${this.player.ammo.bomb}টি)`;
    }

    this.showToast("অস্ত্র নির্বাচিত", `${nameBn}${ammoStr}`);
    if (this.onHudUpdate) this.onHudUpdate();
  }

  // --- Buy Weapon from Gun Shop ---
  public buyWeapon(item: GunStoreItem): boolean {
    if (this.player.money < item.price) {
      soundManager.playGunEmpty();
      this.showToast("পর্যাপ্ত টাকা নেই!", `এই অস্ত্র কেনার জন্য ৳${item.price} প্রয়োজন। মিশন সম্পন্ন করে টাকা আয় করুন!`);
      return false;
    }

    this.player.money -= item.price;
    if (!this.player.ownedWeapons.includes(item.weaponType)) {
      this.player.ownedWeapons.push(item.weaponType);
    }
    this.player.weapon = item.weaponType;
    if (item.weaponType !== "ramdao") {
      this.player.ammo[item.weaponType as "pistol" | "shotgun" | "rifle" | "bomb"] += item.ammoCount;
    }

    soundManager.playCoin();
    soundManager.playGunReload();
    const ammoExtra = item.weaponType !== "ramdao" ? ` সাথে ${item.ammoCount}টি গোলাবারুদ যোগ হয়েছে!` : "";
    this.showToast("অস্ত্র ক্রয় সফল!", `${item.nameBn} কেনা হয়েছে!${ammoExtra}`);
    this.saveProgress();
    if (this.onHudUpdate) this.onHudUpdate();
    return true;
  }

  // --- Buy Ammo from Gun Shop ---
  public buyAmmo(item: GunStoreItem): boolean {
    if (this.player.money < item.price) {
      soundManager.playGunEmpty();
      this.showToast("পর্যাপ্ত টাকা নেই!", `গুলি কেনার জন্য ৳${item.price} প্রয়োজন!`);
      return false;
    }

    this.player.money -= item.price;
    if (item.weaponType !== "ramdao") {
      this.player.ammo[item.weaponType as "pistol" | "shotgun" | "rifle" | "bomb"] += item.ammoCount;
    }

    soundManager.playCoin();
    soundManager.playGunReload();
    this.showToast("গোলাবারুদ ক্রয় সফল!", `${item.nameBn} যোগ হয়েছে!`);
    this.saveProgress();
    if (this.onHudUpdate) this.onHudUpdate();
    return true;
  }

  // --- Tea Stall: Drink Tea (চা পান করুন) ---
  public drinkTea(): boolean {
    const isAtTeaStall = 
      this.player.currentInterior === "tea_stall" ||
      this.buildings.some((b) => b.type === "tea_stall" && Math.hypot((b.doorX || b.x) - this.player.x, (b.doorY || b.y) - this.player.y) < 130);

    if (!isAtTeaStall) {
      this.showToast("চায়ের দোকান", "চা খেতে হলে করিম ভাইয়ের চায়ের দোকানে বা নদী তীরের স্টলে যান!");
      return false;
    }

    if (this.player.money < 10) {
      this.showToast("টাকা নেই!", "এক কাপ স্পেশাল দুধ চায়ের জন্য ৳১০ প্রয়োজন!");
      return false;
    }

    this.player.money -= 10;
    this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
    this.speedBoostTimer = 35; // 35 seconds of speed boost!
    this.player.isDrinkingTea = true;

    soundManager.playTeaSip();

    // Tea Steam Particles
    for (let i = 0; i < 6; i++) {
      this.addParticle({
        x: this.player.x + (Math.random() - 0.5) * 10,
        y: this.player.y - 15 - i * 4,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1.8,
        size: 5,
        color: "rgba(255, 255, 255, 0.8)",
        alpha: 0.8,
        life: 0.6,
        maxLife: 0.6,
        type: "tea_steam",
      });
    }

    this.showToast("☕ কড়া দুধ চা", "আহ্! খাঁটি গরুর দুধের ধোঁয়া ওঠা গরম চা পান করেছেন! স্বাস্থ্য বৃদ্ধি ও গতি বেড়েছে!");
    if (this.onHudUpdate) this.onHudUpdate();
    return true;
  }

  // --- Tea Stall: Eat Bakarkhani / Biscuit ---
  public eatBakarkhani(): boolean {
    if (this.player.money < 15) {
      this.showToast("টাকা নেই!", "মুচমুচে বাকরখানি ও বিস্কুটের জন্য ৳১৫ প্রয়োজন!");
      return false;
    }

    this.player.money -= 15;
    this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
    soundManager.playCoin();
    this.showToast("🥖 বাকরখানি বিস্কুট", "চায়ের সাথে মুচমুচে বাকরখানি খেয়েছেন! স্বাস্থ্য +২৫ বৃদ্ধি পেয়েছে!");
    if (this.onHudUpdate) this.onHudUpdate();
    return true;
  }

  // --- Tea Stall: Chit-Chat / Adda (আড্ডা দিন) ---
  public startTeaAdda() {
    this.player.isSittingInAdda = true;
    const randomTopic = TEASTALL_ADDA_TOPICS[Math.floor(Math.random() * TEASTALL_ADDA_TOPICS.length)];
    this.player.currentAddaTopic = randomTopic;
    soundManager.playPhoneBeep();
    this.showToast("টুলের বেঞ্চে আড্ডা", randomTopic);
    if (this.onHudUpdate) this.onHudUpdate();
  }

  public exitTeaAdda() {
    this.player.isSittingInAdda = false;
    this.player.currentAddaTopic = "";
    if (this.onHudUpdate) this.onHudUpdate();
  }

  // --- Sleep in Safehouse / Own Home (ঘুমালে সকাল হয়ে যাওয়া) ---
  public sleepInSafehouse() {
    this.player.isSleeping = true;
    this.player.sleepFade = 1.0;
    soundManager.playRoosterCrow();

    // Advance time to morning
    this.timeOfDay = "morning";
    this.timeCycleTimer = 0;
    this.player.health = 100;
    this.player.wantedLevel = 0; // heat is cleared!
    this.policeOfficer.isSirenActive = false;
    this.policeOfficer.chasingPlayer = false;
    this.policeHelicopter.isActive = false;
    soundManager.stopHelicopterSound();

    this.showToast("🌅 সকাল হয়ে গেল!", "বিছানায় শান্তিমতো ঘুমিয়েছেন! মোরগ ডাকছে, স্বাস্থ্য ১০০% পূর্ণ ও পুলিশ সতর্কতা দূর হয়েছে!");
    if (this.onHudUpdate) this.onHudUpdate();
  }

  // --- Join Procession / Rally (মিছিলে যোগ দিন) ---
  public joinProcession(processionId: string) {
    const proc = this.processions.find((p) => p.id === processionId);
    if (!proc) return;

    proc.isPlayerJoined = true;
    this.player.money += 100;
    soundManager.playRallyMegaphone();
    soundManager.playCoin();
    this.showToast("মিছিলে অংশগ্রহণ!", `আপনি '${proc.nameBn}'-এ শামিল হয়েছেন! সংহতি বোনাস হিসেবে ৳১০০ পেয়েছেন!`);
    if (this.onHudUpdate) this.onHudUpdate();
  }

  // --- Updates for Bullets, AI Traffic, Processions, and River Items ---
  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * 60 * dt;
      b.y += b.vy * 60 * dt;
      b.life -= dt;

      // Bullet trace particle
      if (Math.random() < 0.6) {
        this.addParticle({
          x: b.x,
          y: b.y,
          vx: -b.vx * 0.08,
          vy: -b.vy * 0.08,
          size: 3,
          color: b.color,
          alpha: 0.6,
          life: 0.2,
          maxLife: 0.2,
          type: "bullet_trace",
        });
      }

      // 1. If enemy bullet, check hit on PLAYER
      if (b.isEnemy) {
        if (Math.hypot(this.player.x - b.x, this.player.y - b.y) < 26) {
          this.player.health = Math.max(1, this.player.health - b.damage);
          soundManager.playBodyHit();
          this.camera.shake = 10;
          this.addParticle({
            x: this.player.x,
            y: this.player.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: 4,
            color: "#ef4444",
            alpha: 1,
            life: 0.3,
            maxLife: 0.3,
            type: "hit",
          });
          this.showToast("⚠️ ডাকাতের গুলি লেগেছে!", `ডাকাতের বুলেটে আঘাত পেয়েছেন! (স্বাস্থ্য: ${this.player.health}%)`);
          this.bullets.splice(i, 1);
          if (this.onHudUpdate) this.onHudUpdate();
          continue;
        }
      }

      // 2. Check bullet hit on dacoits (ডাকাত)
      let hitDacoit = false;
      if (!b.isEnemy) {
        for (const d of this.dacoits) {
          if (!d.isKnockedOut && Math.hypot(d.x - b.x, d.y - b.y) < 32) {
            d.health = Math.max(0, d.health - b.damage);
            soundManager.playBodyHit();
            this.camera.shake = 8;
            hitDacoit = true;

            for (let p = 0; p < 5; p++) {
              this.addParticle({
                x: d.x,
                y: d.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: 4,
                color: "#ef4444",
                alpha: 0.9,
                life: 0.3,
                maxLife: 0.3,
                type: "hit",
              });
            }

            if (d.health <= 0) {
              d.isKnockedOut = true;
              this.player.money += 150;
              soundManager.playCoin();
              this.showToast("ডাকাত পরাস্ত!", `বন্দুকের গুলিতে ডাকাত পরাস্ত হয়েছে! ৳১৫০ উদ্ধার হয়েছে!`);
            } else {
              this.showToast("বুলেট আঘাত!", `ডাকাত আঘাত খেয়েছে! (স্বাস্থ্য: ${d.health})`);
            }
            break;
          }
        }
      }

      // 3. Universal Combat Freedom: Check bullet hit on ANY NPC / Person
      let hitPerson = false;
      if (!hitDacoit && !b.isEnemy) {
        for (const n of this.npcs) {
          if (n.state !== "knocked_down" && Math.hypot(n.x - b.x, n.y - b.y) < 32) {
            n.health = Math.max(0, (n.health || 100) - b.damage);
            n.knockbackVx = Math.sign(b.vx) * 12;
            n.knockbackVy = Math.sign(b.vy) * 12;
            n.knockdownTimer = 2.5;
            soundManager.playBodyHit();
            this.camera.shake = 10;
            hitPerson = true;

            const scream = BENGALI_HIT_SCREAMS[Math.floor(Math.random() * BENGALI_HIT_SCREAMS.length)];
            this.addParticle({
              type: "shout",
              text: scream,
              x: n.x,
              y: n.y - 20,
              vx: n.knockbackVx * 0.3,
              vy: -2,
              size: 8,
              color: "#ef4444",
              alpha: 1,
              life: 2.0,
              maxLife: 2.0,
            });

            if (n.health <= 0) {
              n.state = "knocked_down";
              n.knockdownTimer = 50.0;
              this.player.money += 70;
              this.player.wantedLevel = Math.min(3, this.player.wantedLevel + 1);
              soundManager.playCoin();
              this.showToast("মানুষ পরাস্ত!", `${n.nameBn} বুলেটের আঘাতে পরাস্ত হয়েছে! ৳৭০ লুট!`);
            } else {
              this.showToast("বুলেট আঘাত!", `${n.nameBn} আঘাত খেয়েছে! (স্বাস্থ্য: ${n.health})`);
            }
            break;
          }
        }
      }

      // Check bullet hit on solid buildings
      let hitWall = false;
      if (!hitDacoit && !hitPerson) {
        for (const bld of this.buildings) {
          if (b.x >= bld.x && b.x <= bld.x + bld.w && b.y >= bld.y && b.y <= bld.y + bld.h) {
            hitWall = true;
            this.addParticle({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              size: 4,
              color: "#f59e0b",
              alpha: 0.8,
              life: 0.25,
              maxLife: 0.25,
              type: "spark",
            });
            break;
          }
        }
      }

      if (b.life <= 0 || hitDacoit || hitPerson || hitWall) {
        this.bullets.splice(i, 1);
      }
    }
  }

  // --- Thrown Bombs & Petrol Cocktails Simulation ---
  private updateThrownBombs(dt: number) {
    for (let i = this.thrownBombs.length - 1; i >= 0; i--) {
      const b = this.thrownBombs[i];
      b.progress += dt / 0.65;
      b.x = b.startX + (b.targetX - b.startX) * Math.min(1, b.progress);
      b.y = b.startY + (b.targetY - b.startY) * Math.min(1, b.progress);

      // Fuse smoke & spark particles
      if (Math.random() < 0.75) {
        const curArcY = b.y - Math.sin(Math.min(1, b.progress) * Math.PI) * b.arcHeight;
        this.addParticle({
          x: b.x,
          y: curArcY,
          vx: (Math.random() - 0.5) * 2,
          vy: -2,
          size: 4,
          color: "#f59e0b",
          alpha: 0.9,
          life: 0.25,
          maxLife: 0.25,
          type: "spark",
        });
      }

      if (b.progress >= 1 && !b.exploded) {
        b.exploded = true;
        soundManager.playExplosion();
        this.camera.shake = 22;

        // Massive blast explosion fireballs & sparks
        for (let p = 0; p < 25; p++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 4 + Math.random() * 10;
          this.addParticle({
            x: b.x,
            y: b.y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            size: 8 + Math.random() * 8,
            color: Math.random() < 0.5 ? "#ea580c" : "#facc15",
            alpha: 1,
            life: 0.45,
            maxLife: 0.45,
            type: "explosion",
          });
        }

        // Area-of-effect damage on Dacoits
        this.dacoits.forEach((d) => {
          if (d.isKnockedOut) return;
          const dist = Math.hypot(d.x - b.x, d.y - b.y);
          if (dist < b.radius) {
            d.health = Math.max(0, d.health - b.damage);
            d.knockbackVx = Math.sign(d.x - b.x) * 14;
            d.knockbackVy = Math.sign(d.y - b.y) * 14;
            d.knockdownTimer = 2.0;
            if (d.health <= 0) {
              d.isKnockedOut = true;
              this.player.money += 200;
              soundManager.playCoin();
              this.showToast("ডাকাত বিস্ফোরণে খতম!", "বোমার বিস্ফোরণে ডাকাত নিহত হয়েছে! ৳২০০ উদ্ধার!");
            }
          }
        });

        // Area-of-effect damage on ANY NPC / Person (Universal Freedom)
        this.npcs.forEach((n) => {
          if (n.state === "knocked_down") return;
          const dist = Math.hypot(n.x - b.x, n.y - b.y);
          if (dist < b.radius) {
            n.health = Math.max(0, (n.health || 100) - b.damage);
            n.knockbackVx = Math.sign(n.x - b.x) * 16;
            n.knockbackVy = Math.sign(n.y - b.y) * 16;
            n.knockdownTimer = 3.0;
            n.state = "knocked_down";
            if (n.health <= 0) {
              this.player.wantedLevel = Math.min(3, this.player.wantedLevel + 1);
            }
          }
        });

        // Damage Player if in blast radius
        const distToPlayer = Math.hypot(this.player.x - b.x, this.player.y - b.y);
        if (distToPlayer < b.radius) {
          const dmg = Math.round((1 - distToPlayer / b.radius) * 45);
          this.player.health = Math.max(1, this.player.health - dmg);
          soundManager.playBodyHit();
          this.showToast("বিস্ফোরণের আঘাত!", `বোমার বিস্ফোরণে আপনি আঘাত পেয়েছেন (-${dmg}%)!`);
        }

        this.thrownBombs.splice(i, 1);
        if (this.onHudUpdate) this.onHudUpdate();
      }
    }
  }

  // --- Street Hawkers Movement and Food Selling ---
  private updateHawkers(dt: number) {
    this.hawkers.forEach((h) => {
      // Move hawker along route
      const dx = h.targetX - h.x;
      const dy = h.targetY - h.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 8) {
        h.x += (dx / dist) * h.speed * 60 * dt;
        h.y += (dy / dist) * h.speed * 60 * dt;
        h.angle = Math.atan2(dy, dx);
      } else {
        // Reverse direction
        const tempX = h.targetX;
        const tempY = h.targetY;
        h.targetX = h.x - dx;
        h.targetY = h.y - dy;
      }

      // Voice call timer
      h.callTimer -= dt;
      if (h.callTimer <= 0) {
        h.callTimer = 5.5 + Math.random() * 3.5;
        const shout = h.callShoutsBn[Math.floor(Math.random() * h.callShoutsBn.length)];
        h.activeShout = shout;
        h.shoutTimer = 3.5;
        soundManager.playHawkerBell();

        this.addParticle({
          type: "shout",
          text: `📣 ${shout}`,
          x: h.x,
          y: h.y - 25,
          vx: 0,
          vy: -1.2,
          size: 8,
          color: "#f59e0b",
          alpha: 1,
          life: 2.8,
          maxLife: 2.8,
        });
      }

      if (h.shoutTimer && h.shoutTimer > 0) {
        h.shoutTimer -= dt;
        if (h.shoutTimer <= 0) h.activeShout = undefined;
      }
    });
  }

  // --- Living Animals & Humorous Fauna (গরু, হাঁস, ছাগল ও পাখি) ---
  private updateAnimals(dt: number) {
    this.animals.forEach((a) => {
      // Timer for funny speech texts
      if (a.textTimer && a.textTimer > 0) {
        a.textTimer -= dt;
        if (a.textTimer <= 0) a.funnyText = undefined;
      }

      // Periodic animal sounds
      a.soundTimer -= dt;
      const distToPlayer = Math.hypot(this.player.x - a.x, this.player.y - a.y);

      if (a.soundTimer <= 0) {
        a.soundTimer = 10 + Math.random() * 14;
        if (distToPlayer < 400) {
          if (a.type === "cow") {
            soundManager.playCowMoo();
            a.funnyText = COW_FUNNY_DIALOGUES[Math.floor(Math.random() * COW_FUNNY_DIALOGUES.length)];
            a.textTimer = 3.5;
          } else if (a.type === "duck") {
            soundManager.playDuckQuack();
            a.funnyText = DUCK_FUNNY_DIALOGUES[Math.floor(Math.random() * DUCK_FUNNY_DIALOGUES.length)];
            a.textTimer = 3.0;
          } else if (a.type === "goat") {
            soundManager.playGoatBleat();
            a.funnyText = GOAT_FUNNY_DIALOGUES[Math.floor(Math.random() * GOAT_FUNNY_DIALOGUES.length)];
            a.textTimer = 3.0;
          } else if (a.type === "bird") {
            soundManager.playBirdChirp();
          }
        }
      }

      // Movement physics
      if (a.type === "bird") {
        // Flying across map
        a.x += Math.cos(a.angle) * a.speed * 60 * dt;
        a.y += Math.sin(a.angle) * a.speed * 60 * dt;
        if (a.x < 100 || a.x > WORLD_WIDTH - 100 || a.y < 100 || a.y > WORLD_HEIGHT - 100) {
          a.angle += Math.PI * 0.75;
        }
      } else {
        // Cow, Duck, Goat roaming
        const dist = Math.hypot(a.targetX - a.x, a.targetY - a.y);
        if (dist > 6) {
          const moveAngle = Math.atan2(a.targetY - a.y, a.targetX - a.x);
          a.angle = moveAngle;
          a.x += Math.cos(moveAngle) * a.speed * 60 * dt;
          a.y += Math.sin(moveAngle) * a.speed * 60 * dt;
        } else if (Math.random() < 0.02) {
          a.targetX = a.x + (Math.random() - 0.5) * 160;
          a.targetY = a.y + (Math.random() - 0.5) * 160;
        }
      }

      // Proximity interaction reaction
      if (distToPlayer < 35 && Math.random() < 0.03) {
        if (a.type === "cow") {
          soundManager.playCowMoo();
          a.funnyText = "হাম্বা! গায়ে ধাক্কা লাগাইও না!";
          a.textTimer = 3.0;
        } else if (a.type === "duck") {
          soundManager.playDuckQuack();
          a.funnyText = "প্যাক! সরে যাও ভাই!";
          a.textTimer = 2.5;
        } else if (a.type === "goat") {
          soundManager.playGoatBleat();
          a.funnyText = "ম্যাঁ! আমার লেজে টান দিও না!";
          a.textTimer = 2.5;
        }
      }
    });
  }

  // --- bKash Digital Payment (বিকাশ পেমেন্ট) ---
  public payWithBkash(amount: number, purpose: string): boolean {
    if (this.player.bkashBalance < amount) {
      this.showToast("বিকাশ ব্যালেন্স অপর্যাপ্ত!", `আপনার বিকাশ একাউন্টে ৳${amount} টাকা নেই! বর্তমান ব্যালেন্স: ৳${this.player.bkashBalance}`);
      return false;
    }
    this.player.bkashBalance -= amount;
    soundManager.playBkashTune();
    this.showToast("বিকাশ পেমেন্ট সফল!", `৳${amount} টাকা পরিশোধিত হয়েছে (${purpose})। বর্তমান বিকাশ ব্যালেন্স: ৳${this.player.bkashBalance}`);
    this.saveProgress();
    if (this.onHudUpdate) this.onHudUpdate();
    return true;
  }

  // --- Nagad Digital Payment (নগদ পেমেন্ট) ---
  public payWithNagad(amount: number, purpose: string): boolean {
    if (this.player.nagadBalance < amount) {
      this.showToast("নগদ ব্যালেন্স অপর্যাপ্ত!", `আপনার নগদ একাউন্টে ৳${amount} টাকা নেই! বর্তমান ব্যালেন্স: ৳${this.player.nagadBalance}`);
      return false;
    }
    this.player.nagadBalance -= amount;
    soundManager.playNagadTune();
    this.showToast("নগদ পেমেন্ট সফল!", `৳${amount} টাকা সফলভাবে প্রদান করা হয়েছে (${purpose})। বর্তমান নগদ ব্যালেন্স: ৳${this.player.nagadBalance}`);
    this.saveProgress();
    if (this.onHudUpdate) this.onHudUpdate();
    return true;
  }

  // --- Cash-In to bKash/Nagad from Cash in Hand ---
  public cashInToWallet(wallet: "bkash" | "nagad", amount: number): boolean {
    if (this.player.money < amount) {
      this.showToast("পকেটে পর্যাপ্ত টাকা নেই!", `আপনার পকেটে ক্যাশ ৳${amount} টাকা নেই!`);
      return false;
    }
    this.player.money -= amount;
    if (wallet === "bkash") {
      this.player.bkashBalance += amount;
      soundManager.playBkashTune();
      this.showToast("বিকাশ ক্যাশ-ইন সফল!", `৳${amount} টাকা বিকাশে যোগ হয়েছে! বর্তমান ব্যালেন্স: ৳${this.player.bkashBalance}`);
    } else {
      this.player.nagadBalance += amount;
      soundManager.playNagadTune();
      this.showToast("নগদ ক্যাশ-ইন সফল!", `৳${amount} টাকা নগদে জমা হয়েছে! বর্তমান ব্যালেন্স: ৳${this.player.nagadBalance}`);
    }
    this.saveProgress();
    if (this.onHudUpdate) this.onHudUpdate();
    return true;
  }

  // --- Bank Deposit & ATM Withdrawal ---
  public bankDeposit(amount: number): boolean {
    if (this.player.money < amount) {
      this.showToast("জমা ব্যর্থ!", "আপনার হাতে পর্যাপ্ত নগদ টাকা নেই!");
      return false;
    }
    this.player.money -= amount;
    this.player.bankBalance += amount;
    soundManager.playCoin();
    this.showToast("ব্যাংকে জমা সম্পন্ন!", `সোনালী ব্যাংক একাউন্টে ৳${amount} জমা হয়েছে! মোট আমানত: ৳${this.player.bankBalance}`);
    this.saveProgress();
    if (this.onHudUpdate) this.onHudUpdate();
    return true;
  }

  public bankWithdraw(amount: number): boolean {
    if (this.player.bankBalance < amount) {
      this.showToast("উত্তোলন ব্যর্থ!", "ব্যাংক একাউন্টে পর্যাপ্ত টাকা নেই!");
      return false;
    }
    this.player.bankBalance -= amount;
    this.player.money += amount;
    soundManager.playCoin();
    this.showToast("ATM টাকা উত্তোলন সফল!", `ব্যাংক থেকে ৳${amount} ক্যাশ উত্তোলন করা হয়েছে! পকেটের ব্যালেন্স: ৳${this.player.money}`);
    this.saveProgress();
    if (this.onHudUpdate) this.onHudUpdate();
    return true;
  }

  // --- Autonomous AI Traffic Physics & Navigation ---
  private updateTrafficVehicles(dt: number) {
    this.vehicles.forEach((veh) => {
      if (!veh.isAiTraffic || veh.id === this.player.currentVehicleId) return;
      if (!veh.trafficWaypoints || veh.trafficWaypoints.length === 0) return;

      const target = veh.trafficWaypoints[veh.currentWaypointIdx || 0];
      const dx = target.x - veh.x;
      const dy = target.y - veh.y;
      const dist = Math.hypot(dx, dy);

      // Desired angle towards current waypoint
      const targetAngle = Math.atan2(dy, dx);
      // Smoothly steer angle towards target
      let angleDiff = targetAngle - veh.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      veh.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), veh.turnSpeed * 60 * dt);

      // Raycast forward obstacle detection (check player, other vehicles, and pedestrians)
      let obstacleAhead = false;
      const checkDist = 65;
      const rayX = veh.x + Math.cos(veh.angle) * checkDist;
      const rayY = veh.y + Math.sin(veh.angle) * checkDist;

      // Check distance to player
      if (Math.hypot(this.player.x - rayX, this.player.y - rayY) < 45) {
        obstacleAhead = true;
      }

      // Check distance to other vehicles
      if (!obstacleAhead) {
        for (const other of this.vehicles) {
          if (other.id !== veh.id && Math.hypot(other.x - rayX, other.y - rayY) < 55) {
            obstacleAhead = true;
            break;
          }
        }
      }

      if (obstacleAhead) {
        // Brake smoothly
        veh.speed = Math.max(0, veh.speed - veh.accel * 2 * 60 * dt);

        // Honk horn if stuck!
        veh.honkCooldown = (veh.honkCooldown || 0) - dt;
        if (veh.honkCooldown <= 0) {
          veh.honkCooldown = 4.0;
          soundManager.playHorn(veh.type);
        }
      } else {
        // Accelerate up to max speed
        veh.speed = Math.min(veh.maxSpeed * 0.85, veh.speed + veh.accel * 60 * dt);
      }

      // Move vehicle
      veh.x += Math.cos(veh.angle) * veh.speed * 60 * dt;
      veh.y += Math.sin(veh.angle) * veh.speed * 60 * dt;

      // Advance waypoint if close
      if (dist < 45) {
        veh.currentWaypointIdx = ((veh.currentWaypointIdx || 0) + 1) % veh.trafficWaypoints.length;
      }
    });
  }

  // --- Processions & Rallies (মিছিল সিস্টেম) ---
  private updateProcessions(dt: number) {
    this.processions.forEach((proc) => {
      const target = proc.waypoints[proc.currentWaypointIdx];
      const leader = proc.members[0];
      if (!leader || !target) return;

      const dx = target.x - leader.x;
      const dy = target.y - leader.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // Move procession leader
      leader.x += Math.cos(angle) * proc.speed * 60 * dt;
      leader.y += Math.sin(angle) * proc.speed * 60 * dt;

      // Other members follow in organized marching formation behind leader
      for (let i = 1; i < proc.members.length; i++) {
        const mem = proc.members[i];
        const offsetDist = i * 22;
        const targetMemX = leader.x - Math.cos(angle) * offsetDist + ((i % 2 === 0 ? 1 : -1) * 12);
        const targetMemY = leader.y - Math.sin(angle) * offsetDist;
        mem.x += (targetMemX - mem.x) * 0.15;
        mem.y += (targetMemY - mem.y) * 0.15;
      }

      // If player joined, player walks alongside the leader!
      if (proc.isPlayerJoined && !this.player.currentVehicleId) {
        const joinTargetX = leader.x - Math.cos(angle) * 20 - Math.sin(angle) * 25;
        const joinTargetY = leader.y - Math.sin(angle) * 20 + Math.cos(angle) * 25;
        this.player.x += (joinTargetX - this.player.x) * 0.1;
        this.player.y += (joinTargetY - this.player.y) * 0.1;
      }

      // Waypoint arrival
      if (dist < 50) {
        proc.currentWaypointIdx = (proc.currentWaypointIdx + 1) % proc.waypoints.length;
      }

      // Slogan chanting timer cycle
      proc.chantTimer -= dt;
      if (proc.chantTimer <= 0) {
        if (proc.chantPhase === "leader") {
          proc.chantPhase = "crowd";
          proc.chantTimer = 3.2;
          const randomLeaderSpeech = proc.leaderSpeechBn[Math.floor(Math.random() * proc.leaderSpeechBn.length)];
          proc.activeSlogan = randomLeaderSpeech;
          soundManager.playRallyMegaphone();
        } else {
          proc.chantPhase = "leader";
          proc.chantTimer = 3.8;
          const randomCrowdResp = proc.crowdResponseBn[Math.floor(Math.random() * proc.crowdResponseBn.length)];
          proc.activeSlogan = randomCrowdResp;
        }

        // Add shouting speech bubble particle
        this.addParticle({
          type: "shout",
          text: proc.activeSlogan,
          x: leader.x,
          y: leader.y - 30,
          vx: 0,
          vy: -1.2,
          size: 8,
          color: proc.chantPhase === "leader" ? "#ef4444" : "#16a34a",
          alpha: 1,
          life: 2.4,
          maxLife: 2.4,
        });
      }
    });
  }

  // --- River Collectibles (পদ্মা নদী পারাপারে মাছের খাঁচা ও রত্ন সংগ্রহ) ---
  private updateRiverCollectibles(dt: number) {
    const curVeh = this.player.currentVehicleId
      ? this.vehicles.find((v) => v.id === this.player.currentVehicleId)
      : null;
    const isBoating = curVeh && curVeh.isWaterVehicle;

    this.riverCollectibles.forEach((item) => {
      if (item.collected) return;
      const dist = Math.hypot(item.x - this.player.x, item.y - this.player.y);
      if (dist < 60) {
        item.collected = true;
        this.player.money += item.value;
        soundManager.playItemCollect();
        soundManager.playCoin();
        this.showToast(item.nameBn, `নদী থেকে সংগ্রহ করেছেন! +৳${item.value} আয় হয়েছে!`);
        if (this.onHudUpdate) this.onHudUpdate();
      }
    });
  }

  // --- Infinite Open-World Procedural Chunk Generator ---
  // Generates infinite land, roads, and EVERY house is 100% enterable!
  public checkAndGenerateWorldChunks(px: number, py: number) {
    const chunkSize = 1200;
    const currentChunkX = Math.floor(px / chunkSize);
    const currentChunkY = Math.floor(py / chunkSize);

    // Check surrounding 3x3 chunks
    for (let cx = currentChunkX - 1; cx <= currentChunkX + 1; cx++) {
      for (let cy = currentChunkY - 1; cy <= currentChunkY + 1; cy++) {
        const key = `${cx},${cy}`;
        if (!this.generatedChunks.has(key)) {
          this.generatedChunks.add(key);
          this.generateProceduralChunk(cx, cy, chunkSize);
        }
      }
    }
  }

  private generateProceduralChunk(cx: number, cy: number, size: number) {
    // Only generate if outside the handcrafted core box (0 to 5800, 0 to 4400)
    // or to populate procedural homesteads at outer borders
    const originX = cx * size;
    const originY = cy * size;

    if (originX >= 300 && originX + size <= WORLD_WIDTH - 300 && originY >= 300 && originY + size <= WORLD_HEIGHT - 300) {
      return; // Handcrafted central region already populated
    }

    // Deterministic pseudo-random seed from chunk coordinates
    const seed = Math.abs(Math.sin(cx * 12.9898 + cy * 78.233) * 43758.5453);
    const houseCount = 2 + Math.floor((seed % 1) * 3); // 2 to 4 houses per chunk

    const bengaliFamilyNames = [
      "আলমগীর ভাইয়ের বাড়ি",
      "সোলেমান চাচার কুটির",
      "কৃষক শফিকের ভিটা",
      "আনোয়ার মুদির দোকান",
      "কাশেমের ডেইরি খামার",
      "নদী তীরের মাঝি বাড়ি",
      "মন্টুর মাটির ঘর",
      "বকুল তলার গৃহস্থালয়",
      "নুরুল মাস্টারের বাড়ি",
      "মজিবর ব্যাপারীর কুটির",
    ];

    for (let i = 0; i < houseCount; i++) {
      const houseX = originX + 150 + (i * 260) % (size - 220);
      const houseY = originY + 180 + ((i * 190) % (size - 240));
      const nameIndex = Math.floor((seed * (i + 1) * 7) % bengaliFamilyNames.length);
      const houseName = `${bengaliFamilyNames[nameIndex]} (প্রবেশযোগ্য)`;

      // Every procedural house is enterable!
      const isShop = (i + cx + cy) % 4 === 0;
      const bld: Building = {
        id: `proc_bld_${cx}_${cy}_${i}`,
        nameBn: houseName,
        nameEn: `Procedural Home ${cx}_${cy}_${i}`,
        type: isShop ? "tea_stall" : "mud_house",
        x: houseX,
        y: houseY,
        w: 120 + ((i * 15) % 30),
        h: 85 + ((i * 10) % 25),
        roofColor: isShop ? "#b45309" : i % 2 === 0 ? "#78350f" : "#475569",
        wallColor: isShop ? "#451a03" : "#713f12",
        isEnterable: true,
        interiorType: isShop ? "tea_stall" : "residential_home",
        residentNameBn: bengaliFamilyNames[nameIndex].replace(" (প্রবেশযোগ্য)", ""),
        descriptionBn: "অসীম মুক্ত বিশ্বের শান্ত ও স্নিগ্ধ গ্রামীণ গৃহস্থালয়। চৌকিতে শুয়ে বিশ্রাম নিতে পারেন।",
        doorX: houseX + 60,
        doorY: houseY + 85,
      };

      this.buildings.push(bld);
    }
  }

  private update(dt: number) {
    if (this.state !== "PLAYING") return;

    // Day/Night Cycle
    this.timeCycleTimer += dt;
    if (this.timeCycleTimer > 150) {
      this.timeCycleTimer = 0;
      const cycles: TimeOfDay[] = ["morning", "afternoon", "evening", "night"];
      const nextIdx = (cycles.indexOf(this.timeOfDay) + 1) % cycles.length;
      this.timeOfDay = cycles[nextIdx];

      if (this.timeOfDay === "night") {
        this.showToast("রাত নেমেছে!", "সাবধান! রাতে নির্জন পথে ডাকাতদের আনাগোনা থাকে!");
      }
    }

    // Safehouse Sleeping morning wake-up fade
    if (this.player.isSleeping && this.player.sleepFade !== undefined) {
      this.player.sleepFade = Math.max(0, this.player.sleepFade - dt * 0.7);
      if (this.player.sleepFade <= 0) {
        this.player.isSleeping = false;
      }
    }

    // Tea Speed Boost timer countdown
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) {
        this.player.isDrinkingTea = false;
      }
    }

    // Player attack timer
    if (this.player.attackTimer > 0) {
      this.player.attackTimer -= dt;
      if (this.player.attackTimer <= 0) {
        this.player.isAttacking = false;
      }
    }

    // Police Siren timer
    if (this.policeOfficer.isSirenActive) {
      this.policeOfficer.sirenTimer -= dt;
      if (this.policeOfficer.sirenTimer <= 0) {
        this.policeOfficer.isSirenActive = false;
      }
    }

    // Mission timer
    if (this.activeMission && this.missionTimer !== null) {
      this.missionTimer -= dt;
      if (this.missionTimer <= 0) {
        this.missionTimer = 0;
        this.showToast("সময় শেষ!", "মিশন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
        this.resetMission();
      }
    }

    // Movement
    if (this.player.currentVehicleId) {
      this.updateDrivenVehicle(dt);
    } else {
      this.updatePlayerMovement(dt);
    }

    // 1. Update Autonomous AI Road Traffic
    this.updateTrafficVehicles(dt);

    // 2. Update Bullets & Ballistics
    this.updateBullets(dt);

    // 2.5 Update Thrown Bombs & Cocktails
    this.updateThrownBombs(dt);

    // 2.6 Update Street Hawkers & Food Sellers
    this.updateHawkers(dt);

    // 2.7 Update Living Animals & Fauna (গরু, হাঁস, ছাগল ও পাখি)
    this.updateAnimals(dt);

    // 3. Update Living Processions & Rallies
    this.updateProcessions(dt);

    // 4. Update River Collectibles (Padma crossing)
    this.updateRiverCollectibles(dt);

    // 4.5 Update Police Officers Chase & Helicopter Spotlight Strike
    this.updatePoliceAndHelicopter(dt);

    // 4.6 Update Moving Bangladesh Railway Train (চলন্ত ট্রেন)
    this.updateTrain(dt);

    // 4.7 Update Night Thieves & Muggers (রাতের চোর ও ছিনতাইকারী)
    this.updateNightThieves(dt);

    // 5. Procedurally generate infinite open world around player as they travel
    this.checkAndGenerateWorldChunks(this.player.x, this.player.y);

    // NPCs & Dacoits
    this.updateNPCs(dt);
    this.updateDacoits(dt);
    this.updateParticles(dt);
    this.checkMissionProgress();

    // Health / Busted / Hospital Check
    if (this.player.health <= 0) {
      if (this.player.wantedLevel > 0) {
        soundManager.playBustedSound();
        const fine = Math.min(this.player.money, 200);
        this.player.money -= fine;
        this.player.wantedLevel = 0;
        this.player.health = 100;
        // Respawn outside Central Police Camp
        this.player.x = 4450;
        this.player.y = 2650;
        this.showToast("🚨 গ্রেপ্তার (BUSTED)!", `পুলিশ আপনাকে ধরেছে! জামিন ও জরিমানা বাবদ ৳${fine} কাটা হলো।`);
      } else {
        soundManager.playBodyHit();
        this.player.health = 100;
        // Respawn at Clinic
        this.player.x = 600;
        this.player.y = 2050;
        this.showToast("হাসপাতালে চিকিৎসা", "আপনি পল্লী স্বাস্থ্য কেন্দ্রে সুস্থ হয়েছেন!");
      }
      if (this.player.currentVehicleId) {
        this.exitVehicle();
      }
      if (this.onHudUpdate) this.onHudUpdate();
    }

    // Dynamic Responsive Camera Zoom (বড় ও স্পষ্ট গ্রাফিক্স)
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    const baseZoom = isMobile ? 1.55 : 1.35;
    const drivingZoom = isMobile ? 1.25 : 1.15;
    const targetZoom = this.player.currentVehicleId ? drivingZoom : baseZoom;
    this.camera.zoom += (targetZoom - this.camera.zoom) * 0.08;

    // Camera follow
    const targetX = this.player.currentVehicleId
      ? this.vehicles.find((v) => v.id === this.player.currentVehicleId)?.x || this.player.x
      : this.player.x;
    const targetY = this.player.currentVehicleId
      ? this.vehicles.find((v) => v.id === this.player.currentVehicleId)?.y || this.player.y
      : this.player.y;

    this.camera.x += (targetX - this.camera.x) * 0.12;
    this.camera.y += (targetY - this.camera.y) * 0.12;

    const halfViewW = this.canvas.width / (2 * this.camera.zoom);
    const halfViewH = this.canvas.height / (2 * this.camera.zoom);
    this.camera.x = Math.max(halfViewW, Math.min(WORLD_WIDTH - halfViewW, this.camera.x));
    this.camera.y = Math.max(halfViewH, Math.min(WORLD_HEIGHT - halfViewH, this.camera.y));

    if (this.camera.shake > 0) {
      this.camera.shake = Math.max(0, this.camera.shake - dt * 25);
    }

    if (this.notification) {
      this.notification.timer -= dt;
      if (this.notification.timer <= 0) {
        this.notification = null;
      }
    }
  }

  // --- Player On-Foot Movement ---
  private updatePlayerMovement(dt: number) {
    let dx = 0;
    let dy = 0;

    if (this.joystick.active) {
      dx = this.joystick.x;
      dy = this.joystick.y;
    } else {
      if (this.inputs.left) dx -= 1;
      if (this.inputs.right) dx += 1;
      if (this.inputs.up) dy -= 1;
      if (this.inputs.down) dy += 1;
    }

    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;

      this.player.isRunning = this.inputs.run;
      const speed = this.player.isRunning ? this.player.runSpeed : this.player.walkSpeed;
      const newX = this.player.x + dx * speed * 60 * dt;
      const newY = this.player.y + dy * speed * 60 * dt;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.facing = dx > 0 ? "right" : "left";
      } else {
        this.player.facing = dy > 0 ? "down" : "up";
      }

      if (!this.checkSolidCollision(newX, newY, 12, false)) {
        this.player.x = newX;
        this.player.y = newY;
        this.player.speed = speed;

        this.stepDistance += speed * 60 * dt;
        if (this.stepDistance > 45) {
          this.stepDistance = 0;
          soundManager.playFootstep();
          this.addParticle({
            x: this.player.x,
            y: this.player.y + 6,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: 3,
            color: "#b48c59",
            alpha: 0.5,
            life: 0.3,
            maxLife: 0.3,
            type: "dust",
          });
        }
      }
    } else {
      this.player.speed = 0;
    }

    this.player.x = Math.max(35, Math.min(WORLD_WIDTH - 35, this.player.x));
    this.player.y = Math.max(35, Math.min(WORLD_HEIGHT - 35, this.player.y));
  }

  // --- Driving Vehicle Physics & Traffic Violations ---
  private updateDrivenVehicle(dt: number) {
    const v = this.vehicles.find((veh) => veh.id === this.player.currentVehicleId);
    if (!v) return;

    let steer = 0;
    let throttle = 0;

    if (this.joystick.active) {
      steer = this.joystick.x;
      throttle = -this.joystick.y;
    } else {
      if (this.inputs.left) steer -= 1;
      if (this.inputs.right) steer += 1;
      if (this.inputs.up) throttle += 1;
      if (this.inputs.down) throttle -= 1;
    }

    if (Math.abs(v.speed) > 0.1) {
      const dir = v.speed >= 0 ? 1 : -1;
      v.angle += steer * v.turnSpeed * dir * 60 * dt;
    }

    if (throttle > 0) {
      v.speed = Math.min(v.maxSpeed, v.speed + v.accel * 60 * dt);
    } else if (throttle < 0) {
      v.speed = Math.max(-v.maxSpeed * 0.45, v.speed - v.accel * 60 * dt);
    } else {
      v.speed *= 0.94;
      if (Math.abs(v.speed) < 0.05) v.speed = 0;
    }

    const nextX = v.x + Math.cos(v.angle) * v.speed * 60 * dt;
    const nextY = v.y + Math.sin(v.angle) * v.speed * 60 * dt;

    const collided = this.checkSolidCollision(nextX, nextY, v.width / 2, v.isWaterVehicle);

    if (!collided) {
      v.x = nextX;
      v.y = nextY;
    } else {
      if (Math.abs(v.speed) > 2) {
        this.camera.shake = 12;
        v.health = Math.max(0, v.health - 8);
        soundManager.playUiClick();
        if (v.health <= 0) {
          this.showToast("গাড়ি বিকল!", "গাড়িটি নষ্ট হয়ে গেছে। গ্যারেজে মেরামত করুন।");
          this.exitVehicle();
        }
      }
      v.speed = -v.speed * 0.3;
    }

    // Check hit against pedestrians & thugs (Dramatic Vehicle Knockback Ragdoll Physics!)
    if (Math.abs(v.speed) > 1.2) {
      const hitSpeed = Math.abs(v.speed);
      this.npcs.forEach((npc) => {
        if (Math.hypot(npc.x - v.x, npc.y - v.y) < v.width + 12) {
          // Calculate high-impact knockback vector
          const impactAngle = v.angle;
          npc.knockbackVx = Math.cos(impactAngle) * (hitSpeed * 2.5 + 4.0);
          npc.knockbackVy = Math.sin(impactAngle) * (hitSpeed * 2.5 + 4.0);
          npc.knockdownTimer = 2.5; // Ragdoll tumble duration
          npc.state = "knocked_down";

          // Play dramatic impact sounds
          soundManager.playBodyHit();
          soundManager.playCrash();
          soundManager.playTireScreech();

          // Pick random iconic Bengali scream
          const scream = BENGALI_HIT_SCREAMS[Math.floor(Math.random() * BENGALI_HIT_SCREAMS.length)];
          npc.activeDialog = scream;
          npc.dialogTimer = 3.0;

          // Spawn floating shout particle
          this.addParticle({
            type: "shout",
            text: scream,
            x: npc.x,
            y: npc.y - 18,
            vx: npc.knockbackVx * 0.35,
            vy: -2.5,
            size: 8,
            color: "#ef4444",
            alpha: 1,
            life: 2.2,
            maxLife: 2.2,
          });

          // If fast hit, damage NPC, charge fine and raise wanted stars
          if (hitSpeed > 2.6) {
            this.camera.shake = 14;
            const fineAmount = 60;
            this.player.money = Math.max(0, this.player.money - fineAmount);
            this.player.finesDue += fineAmount;
            this.player.wantedLevel = Math.min(3, this.player.wantedLevel + 1);
            soundManager.playFine();
            this.showToast("পথচারী দুর্ঘটনা!", `${scream} বেপরোয়া চালনায় ৳${fineAmount} জরিমানা কাটা হলো!`);
          }
        }
      });
    }

    this.player.x = v.x;
    this.player.y = v.y;
    soundManager.updateEngine(v.type, Math.abs(v.speed) / v.maxSpeed);
  }

  // --- Night Bandit Raids & Armed Dacoit AI Simulation (রাতের ডাকাত ও বোমাবাজ বাহিনী) ---
  private updateDacoits(dt: number) {
    // Night Raid Spawner: At night, armed gangs regularly raid the area
    if (this.timeOfDay === "night") {
      this.nightRaidSpawnTimer += dt;
      const aliveCount = this.dacoits.filter((d) => !d.isKnockedOut).length;

      if (this.nightRaidSpawnTimer > 28 && aliveCount < 10) {
        this.nightRaidSpawnTimer = 0;
        const raidTypes: Array<"ramdao" | "pistol" | "bomb" | "shotgun"> = ["ramdao", "bomb", "pistol", "ramdao", "bomb"];
        const names = ["ছিনতাইকারী রতন", "বোমাবাজ খলিল", "শুটার সেলিম", "কসাই জহির", "ডাকাত মান্নান"];

        raidTypes.forEach((wType, idx) => {
          const spawnAngle = (idx / raidTypes.length) * Math.PI * 2 + Math.random() * 0.5;
          const spawnDist = 320 + Math.random() * 120;
          const sx = Math.max(80, Math.min(WORLD_WIDTH - 80, this.player.x + Math.cos(spawnAngle) * spawnDist));
          const sy = Math.max(80, Math.min(WORLD_HEIGHT - 80, this.player.y + Math.sin(spawnAngle) * spawnDist));

          this.dacoits.push({
            id: `raid_dacoit_${Date.now()}_${idx}`,
            nameBn: names[idx % names.length],
            x: sx,
            y: sy,
            targetX: sx,
            targetY: sy,
            speed: wType === "ramdao" ? 3.5 : 2.8,
            health: 80,
            maxHealth: 80,
            isChasing: true,
            attackCooldown: 1.0,
            hasLoot: true,
            isKnockedOut: false,
            knockbackVx: 0,
            knockbackVy: 0,
            knockdownTimer: 0,
            weaponType: wType,
            shootCooldown: 1.5 + Math.random() * 2,
            bombCooldown: 2.5 + Math.random() * 2,
          });
        });

        soundManager.playSiren();
        this.showToast("⚠️ রাতের ডাকাত ও বোমাবাজ আক্রমণ!", "সাবধান! বোমা ও বন্দুকধারী ডাকাত দল হামলা করেছে!");
      }
    }

    this.dacoits.forEach((d) => {
      if (d.isKnockedOut) return;

      const distToPlayer = Math.hypot(this.player.x - d.x, this.player.y - d.y);
      const alertDist = this.timeOfDay === "night" ? 420 : 250;

      if (distToPlayer < alertDist && !this.player.currentVehicleId) {
        d.isChasing = true;
        const angle = Math.atan2(this.player.y - d.y, this.player.x - d.x);

        // 1. Shooter Dacoit AI: Stays at firing range (~180px) and shoots bullets
        if (d.weaponType === "pistol" || d.weaponType === "shotgun") {
          if (distToPlayer > 180) {
            d.x += Math.cos(angle) * d.speed * 60 * dt;
            d.y += Math.sin(angle) * d.speed * 60 * dt;
          } else if (distToPlayer < 120) {
            // Back up slightly if player gets too close
            d.x -= Math.cos(angle) * d.speed * 40 * dt;
            d.y -= Math.sin(angle) * d.speed * 40 * dt;
          }

          d.shootCooldown = (d.shootCooldown || 2.0) - dt;
          if (d.shootCooldown <= 0 && distToPlayer < 350) {
            d.shootCooldown = 2.6 + Math.random() * 1.6;
            soundManager.playGunshot("pistol");
            this.bullets.push({
              id: `enemy_bullet_${Date.now()}_${Math.random()}`,
              x: d.x,
              y: d.y,
              vx: Math.cos(angle) * 16,
              vy: Math.sin(angle) * 16,
              life: 0.55,
              maxLife: 0.55,
              damage: 18,
              weaponType: "pistol",
              color: "#f87171",
              isEnemy: true,
            });
            this.addParticle({
              type: "shout",
              text: "গুলি কর!",
              x: d.x,
              y: d.y - 18,
              vx: 0,
              vy: -1.5,
              size: 7,
              color: "#ef4444",
              alpha: 1,
              life: 1.5,
              maxLife: 1.5,
            });
          }
        }
        // 2. Bomber Dacoit AI: Throws petrol cocktails / bombs towards player
        else if (d.weaponType === "bomb") {
          if (distToPlayer > 210) {
            d.x += Math.cos(angle) * d.speed * 60 * dt;
            d.y += Math.sin(angle) * d.speed * 60 * dt;
          }

          d.bombCooldown = (d.bombCooldown || 3.0) - dt;
          if (d.bombCooldown <= 0 && distToPlayer < 380) {
            d.bombCooldown = 4.2 + Math.random() * 2.2;
            this.throwBomb(
              this.player.x + (Math.random() - 0.5) * 40,
              this.player.y + (Math.random() - 0.5) * 40,
              true,
              d.x,
              d.y
            );
            this.addParticle({
              type: "shout",
              text: "বোমা মার রে!",
              x: d.x,
              y: d.y - 18,
              vx: 0,
              vy: -1.5,
              size: 7,
              color: "#f97316",
              alpha: 1,
              life: 1.5,
              maxLife: 1.5,
            });
          }
        }
        // 3. Melee Ramdao / Stick Dacoit AI: Charges player directly
        else {
          d.x += Math.cos(angle) * d.speed * 60 * dt;
          d.y += Math.sin(angle) * d.speed * 60 * dt;

          if (distToPlayer < 28) {
            d.attackCooldown -= dt;
            if (d.attackCooldown <= 0) {
              d.attackCooldown = 1.8;
              this.player.health = Math.max(1, this.player.health - 16);
              soundManager.playMacheteSwing();
              this.camera.shake = 10;
              this.showToast("রামদার কোপ!", `ডাকাত রামদা দিয়ে আঘাত করেছে! (স্বাস্থ্য: ${this.player.health}%)`);
            }
          }
        }
      } else {
        d.isChasing = false;
        if (Math.random() < 0.01) {
          d.x += (Math.random() - 0.5) * 40;
          d.y += (Math.random() - 0.5) * 40;
        }
      }
    });
  }

  // --- Police Officers Chase & Helicopter Spotlight Strike (পুলিশের তাড়া, মারধর ও হেলিকপ্টার) ---
  private updatePoliceAndHelicopter(dt: number) {
    const isWanted = this.player.wantedLevel >= 1;
    const targetX = this.player.x;
    const targetY = this.player.y;

    // 1. Police Officers on Foot and in Patrol Cars
    this.policeOfficers.forEach((p) => {
      if (p.isKnockedOut) return;

      if (isWanted) {
        p.chasingPlayer = true;
        p.isSirenActive = true;
        p.sirenTimer = 10;

        const dist = Math.hypot(targetX - p.x, targetY - p.y);
        const angle = Math.atan2(targetY - p.y, targetX - p.x);

        // Move towards player
        p.x += Math.cos(angle) * p.speed * 60 * dt;
        p.y += Math.sin(angle) * p.speed * 60 * dt;

        // Beat player with baton if close
        if (dist < 40 && !this.player.currentVehicleId) {
          p.attackCooldown -= dt;
          if (p.attackCooldown <= 0) {
            p.attackCooldown = 1.3;
            soundManager.playBatonHit();
            this.camera.shake = 12;
            this.player.health = Math.max(0, this.player.health - 16);

            const policeScream = "থাম! দাঁড়া হারামজাদা!";
            this.addParticle({
              type: "shout",
              text: policeScream,
              x: p.x,
              y: p.y - 18,
              vx: 0,
              vy: -1.8,
              size: 8,
              color: "#3b82f6",
              alpha: 1,
              life: 2.0,
              maxLife: 2.0,
            });

            this.showToast("পুলিশের লাঠিপেটা!", `পুলিশ লাঠি দিয়ে পেটাচ্ছে! (স্বাস্থ্য: ${this.player.health}%) নিরাপদে ঘুমান বা পালান!`);
          }
        }
      } else {
        p.chasingPlayer = false;
        // Wander around camp or post
        const dist = Math.hypot(p.targetX - p.x, p.targetY - p.y);
        if (dist > 10) {
          p.x += (p.targetX - p.x) * 0.02;
          p.y += (p.targetY - p.y) * 0.02;
        } else if (Math.random() < 0.015) {
          p.targetX = p.x + (Math.random() - 0.5) * 80;
          p.targetY = p.y + (Math.random() - 0.5) * 80;
        }
      }
    });

    // 2. Police Helicopter (পুলিশ হেলিকপ্টার - Wanted Level >= 4)
    if (this.player.wantedLevel >= 4) {
      this.policeHelicopter.isActive = true;
      this.policeHelicopter.rotorAngle += dt * 42; // fast spinning blades
      this.policeHelicopter.altitude = Math.min(75, this.policeHelicopter.altitude + dt * 30);

      soundManager.startHelicopterSound();

      // Fly towards player
      const hdx = targetX - this.policeHelicopter.x;
      const hdy = targetY - this.policeHelicopter.y;
      const hdist = Math.hypot(hdx, hdy);
      const hAngle = Math.atan2(hdy, hdx);

      if (hdist > 25) {
        this.policeHelicopter.x += Math.cos(hAngle) * this.policeHelicopter.speed * 60 * dt;
        this.policeHelicopter.y += Math.sin(hAngle) * this.policeHelicopter.speed * 60 * dt;
      }

      // Spotlight tracks player
      this.policeHelicopter.searchlightAngle = hAngle;

      // Helicopter Warning Gunshots or Warning shouts
      this.policeHelicopter.shootCooldown -= dt;
      if (this.policeHelicopter.shootCooldown <= 0 && hdist < 320) {
        this.policeHelicopter.shootCooldown = 3.5 + Math.random() * 2;
        soundManager.playGunshot("shotgun");
        this.camera.shake = 10;

        this.bullets.push({
          id: `helo_bullet_${Date.now()}`,
          x: this.policeHelicopter.x,
          y: this.policeHelicopter.y,
          vx: Math.cos(hAngle) * 14,
          vy: Math.sin(hAngle) * 14,
          life: 0.5,
          maxLife: 0.5,
          damage: 15,
          weaponType: "shotgun",
          color: "#38bdf8",
          isEnemy: true,
        });

        this.addParticle({
          type: "shout",
          text: "🚁 পুলিশ হেলিকপ্টার: সারেন্ডার কর!",
          x: this.policeHelicopter.x,
          y: this.policeHelicopter.y - 35,
          vx: 0,
          vy: -2,
          size: 8,
          color: "#0284c7",
          alpha: 1,
          life: 2.5,
          maxLife: 2.5,
        });
      }
    } else {
      if (this.policeHelicopter.isActive) {
        // Return to police camp helipad (4560, 2480) and land
        const cdx = 4560 - this.policeHelicopter.x;
        const cdy = 2480 - this.policeHelicopter.y;
        const cdist = Math.hypot(cdx, cdy);
        if (cdist > 20) {
          const cAngle = Math.atan2(cdy, cdx);
          this.policeHelicopter.x += Math.cos(cAngle) * this.policeHelicopter.speed * 60 * dt;
          this.policeHelicopter.y += Math.sin(cAngle) * this.policeHelicopter.speed * 60 * dt;
          this.policeHelicopter.rotorAngle += dt * 30;
        } else {
          this.policeHelicopter.altitude = Math.max(0, this.policeHelicopter.altitude - dt * 25);
          if (this.policeHelicopter.altitude <= 0) {
            this.policeHelicopter.isActive = false;
            soundManager.stopHelicopterSound();
          }
        }
      }
    }
  }

  // --- Moving Bangladesh Railway Train System (রেলগাড়ি ও যাত্রী নেটওয়ার্ক) ---
  private updateTrain(dt: number) {
    const t = this.train;

    // Train Station stops: check stations along track
    const stationStops = [
      { name: "রাজশাহী সিল্ক সিটি স্টেশন", x: 875 },
      { name: "রাধানগর রেলওয়ে জংশন", x: 1470 },
      { name: "কমলাপুর ঢাকা কেন্দ্রীয় স্টেশন", x: 4280 },
      { name: "চট্টগ্রাম বটতলী টার্মিনাল", x: 6250 },
      { name: "সিলেট সুরমা ভ্যালি স্টেশন", x: 7230 },
    ];

    if (t.stoppedTimer > 0) {
      t.stoppedTimer -= dt;
      t.speed = 0;
      if (t.stoppedTimer <= 0) {
        t.speed = 4.8;
        soundManager.playTrainWhistle();
        this.showToast("🚆 ট্রেন ছাড়ছে!", `${t.currentStation || "স্টেশন"} থেকে ট্রেন যাত্রা শুরু করেছে!`);
      }
    } else {
      t.speed = 4.8;
      // Check if arriving at a station
      for (const st of stationStops) {
        if (Math.abs(t.x - st.x) < 24 && (!t.currentStation || t.currentStation !== st.name)) {
          t.currentStation = st.name;
          t.stoppedTimer = 6.0; // Wait 6 seconds for passengers
          soundManager.playTrainWhistle();
          this.showToast("🚆 ট্রেন থেমেছে!", `${st.name}-এ ট্রেন যাত্রাবিরতি দিচ্ছে। (E) চেপে ট্রেনে উঠুন বা নামুন!`);
          break;
        }
      }
    }

    if (t.speed > 0) {
      t.x += t.direction * t.speed * 60 * dt;

      // Reverse at ends of Bangladesh map
      if (t.x > 7800) {
        t.direction = -1;
        t.x = 7800;
        soundManager.playTrainWhistle();
      } else if (t.x < 500) {
        t.direction = 1;
        t.x = 500;
        soundManager.playTrainWhistle();
      }

      // Update carriages following behind locomotive engine
      const carriageSpacing = 90;
      for (let i = 0; i < t.carriages.length; i++) {
        const targetX = t.x - t.direction * (i * carriageSpacing);
        t.carriages[i].x = targetX;
        t.carriages[i].y = t.trackY;
      }

      // Whistle horn timer
      t.whistleTimer -= dt;
      if (t.whistleTimer <= 0) {
        t.whistleTimer = 18 + Math.random() * 12;
        soundManager.playTrainWhistle();
      }

      // Wheels chug sound timer
      t.chugTimer -= dt;
      if (t.chugTimer <= 0) {
        t.chugTimer = 0.35;
        soundManager.playTrainChug();
      }

      // Smoke particles from locomotive chimney
      if (Math.random() < 0.45) {
        this.addParticle({
          x: t.x + (t.direction === 1 ? 30 : -30),
          y: t.trackY - 20,
          vx: -t.direction * 1.5 + (Math.random() - 0.5) * 1,
          vy: -2 - Math.random() * 2,
          size: 6 + Math.random() * 8,
          color: "rgba(235, 235, 235, 0.7)",
          alpha: 0.8,
          life: 1.3,
          maxLife: 1.3,
          type: "smoke",
        });
      }
    }

    // If player boarded train: transport player smoothly with the train!
    if (t.hasPlayerBoarded) {
      this.player.x = t.x;
      this.player.y = t.trackY - 6;
      this.player.speed = t.speed;
    }
  }

  // --- Night Thieves & Street Criminals (রাতের চোর ও ছিনতাইকারী) ---
  private updateNightThieves(dt: number) {
    this.nightThieves.forEach((thief) => {
      if (thief.isSubdued || thief.isHandedOver) return;

      // Dialogue / threat speech
      thief.speechTimer -= dt;
      if (thief.speechTimer <= 0) {
        thief.speechTimer = 6.0 + Math.random() * 4.0;
        this.addParticle({
          type: "shout",
          text: `🥷 ${thief.nameBn}: ${thief.speechBn}`,
          x: thief.x,
          y: thief.y - 25,
          vx: 0,
          vy: -1.2,
          size: 8,
          color: "#dc2626",
          alpha: 1,
          life: 2.8,
          maxLife: 2.8,
        });
      }

      // If fleeing from player
      const distToPlayer = Math.hypot(this.player.x - thief.x, this.player.y - thief.y);
      if (thief.fleeingFromPlayer && distToPlayer < 240) {
        const awayAngle = Math.atan2(thief.y - this.player.y, thief.x - this.player.x);
        thief.x += Math.cos(awayAngle) * thief.speed * 60 * dt;
        thief.y += Math.sin(awayAngle) * thief.speed * 60 * dt;
        thief.facing = Math.cos(awayAngle) > 0 ? "right" : "left";
      } else {
        // Patrol back and forth between targetX and original spot
        const tdx = thief.targetX - thief.x;
        const tdy = thief.targetY - thief.y;
        const dist = Math.hypot(tdx, tdy);
        if (dist > 10) {
          thief.x += (tdx / dist) * thief.speed * 0.5 * 60 * dt;
          thief.y += (tdy / dist) * thief.speed * 0.5 * 60 * dt;
          thief.facing = tdx > 0 ? "right" : "left";
        } else {
          // Flip patrol target
          thief.targetX = thief.x - tdx;
          thief.targetY = thief.y - tdy;
        }
      }

      // Police officers chase thief if officer within 260px!
      this.policeOfficers.forEach((officer) => {
        const distToOfficer = Math.hypot(officer.x - thief.x, officer.y - thief.y);
        if (distToOfficer < 260 && !thief.isSubdued) {
          const chaseAngle = Math.atan2(thief.y - officer.y, thief.x - officer.x);
          officer.x += Math.cos(chaseAngle) * officer.speed * 60 * dt;
          officer.y += Math.sin(chaseAngle) * officer.speed * 60 * dt;
          if (distToOfficer < 30) {
            thief.isSubdued = true;
            officer.isSirenActive = true;
            soundManager.playPoliceWhistle();
            this.showToast("🚨 পুলিশ চোর ধরেছে!", `${officer.nameBn} সফলভাবে ${thief.nameBn}-কে হাতকড়া পরিয়েছে!`);
          }
        }
      });
    });
  }

  // --- Solid Collision with Open Padma Bridge and District Town ---
  private checkSolidCollision(x: number, y: number, radius: number, isWaterVehicle: boolean): boolean {
    if (x < radius + 30 || x > WORLD_WIDTH - radius - 30 || y < radius + 30 || y > WORLD_HEIGHT - radius - 30) {
      return true;
    }

    const riverStart = RIVER_X - 10;
    const riverEnd = RIVER_X + 710;
    // Padma Grand Highway Bridge corridor connects village to district city!
    const isOnPadmaBridge = y >= 1530 && y <= 1660;

    if (isWaterVehicle) {
      // Water vehicles must remain inside Padma river corridor
      if (x < riverStart || x > riverEnd) return true;
    } else {
      // Land vehicles / player cannot swim into river water UNLESS crossing on Padma Bridge!
      if (x > riverStart && x < riverEnd && !isOnPadmaBridge) {
        return true;
      }
    }

    for (const b of this.buildings) {
      if (
        x + radius > b.x &&
        x - radius < b.x + b.w &&
        y + radius > b.y + 15 &&
        y - radius < b.y + b.h
      ) {
        return true;
      }
    }
    return false;
  }

  // --- NPCs Update with Ragdoll Sliding & Hostile Thug AI ---
  private updateNPCs(dt: number) {
    this.npcs.forEach((npc) => {
      // 1. Dialogue timer
      if (npc.dialogTimer && npc.dialogTimer > 0) {
        npc.dialogTimer -= dt;
        if (npc.dialogTimer <= 0) {
          npc.activeDialog = undefined;
        }
      }

      // 2. Ragdoll Knockback Physics (Sliding across ground on vehicle impact)
      if (npc.knockdownTimer && npc.knockdownTimer > 0) {
        npc.x += (npc.knockbackVx || 0) * 60 * dt;
        npc.y += (npc.knockbackVy || 0) * 60 * dt;
        npc.knockbackVx = (npc.knockbackVx || 0) * 0.88;
        npc.knockbackVy = (npc.knockbackVy || 0) * 0.88;
        npc.knockdownTimer -= dt;

        if (npc.knockdownTimer <= 0) {
          npc.state = "walking";
          npc.knockbackVx = 0;
          npc.knockbackVy = 0;
        }
        return;
      }

      // 3. Hostile Thug AI (মাস্তানরা কাছে পেলে আক্রমণ করে)
      if (npc.isHostile && !this.player.currentVehicleId) {
        const distToPlayer = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
        if (distToPlayer < 190) {
          // Chase player
          const angle = Math.atan2(this.player.y - npc.y, this.player.x - npc.x);
          npc.x += Math.cos(angle) * (npc.speed * 1.3) * 60 * dt;
          npc.y += Math.sin(angle) * (npc.speed * 1.3) * 60 * dt;

          if (distToPlayer < 28 && Math.random() < 0.04) {
            this.player.health = Math.max(10, this.player.health - 6);
            soundManager.playPunch();
            this.camera.shake = 6;
            this.showToast("মাস্তানের ঘুষি!", `${npc.nameBn} আপনাকে ঘুষি মেরেছে! পাল্টা আক্রমণ করুন!`);
            if (this.onHudUpdate) this.onHudUpdate();
          }
          return;
        }
      }

      // 4. Regular peaceful roaming along pathways
      const dist = Math.hypot(npc.targetX - npc.x, npc.targetY - npc.y);
      if (dist > 8) {
        npc.x += (npc.targetX - npc.x) * 0.025;
        npc.y += (npc.targetY - npc.y) * 0.025;
      } else if (Math.random() < 0.03) {
        npc.targetX = npc.x + (Math.random() - 0.5) * 120;
        npc.targetY = npc.y + (Math.random() - 0.5) * 120;
      }
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public addParticle(p: Particle) {
    if (this.particles.length < 150) {
      this.particles.push(p);
    }
  }

  // --- Missions System ---
  public startMission(missionId: number) {
    const mission = MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;

    this.activeMission = { ...mission, hasPickedUp: false };
    this.activeMissionIndex = MISSIONS.indexOf(mission);
    this.missionTimer = mission.timeLimit || null;

    soundManager.playPhoneBeep();
    this.showToast(mission.titleBn, mission.descBn);
    if (this.onHudUpdate) this.onHudUpdate();
  }

  public startNextAvailableMission() {
    const nextMission = MISSIONS.find((m) => !this.completedMissions.includes(m.id)) || MISSIONS[0];
    this.startMission(nextMission.id);
  }

  public resetMission() {
    this.activeMission = null;
    this.missionTimer = null;
    if (this.onHudUpdate) this.onHudUpdate();
  }

  private checkMissionProgress() {
    if (!this.activeMission) return;

    const m = this.activeMission;
    if (m.pickupLocation && !m.hasPickedUp) {
      const distToPickup = Math.hypot(this.player.x - m.pickupLocation.x, this.player.y - m.pickupLocation.y);
      if (distToPickup < m.targetRadius) {
        m.hasPickedUp = true;
        soundManager.playCoin();
        this.showToast("পার্সেল সংগৃহীত!", "এবার লাল চিহ্নিত গন্তব্যে দ্রুত পৌঁছে দিন।");
        if (this.onHudUpdate) this.onHudUpdate();
      }
      return;
    }

    const distToTarget = Math.hypot(this.player.x - m.targetLocation.x, this.player.y - m.targetLocation.y);
    if (distToTarget < m.targetRadius) {
      if (m.requiredVehicle) {
        const curVeh = this.vehicles.find((v) => v.id === this.player.currentVehicleId);
        if (!curVeh || curVeh.type !== m.requiredVehicle) {
          return;
        }
      }
      this.completeMission(m);
    }
  }

  private completeMission(m: Mission) {
    this.player.money += m.rewardMoney;
    if (!this.completedMissions.includes(m.id)) {
      this.completedMissions.push(m.id);
    }

    soundManager.playMissionComplete();
    this.showToast("মিশন সফল!", `আপনি পুরস্কার পেয়েছেন ৳${m.rewardMoney} টাকা!`);

    this.activeMission = null;
    this.missionTimer = null;

    this.saveProgress();
    if (this.onHudUpdate) this.onHudUpdate();
    if (this.onStateChange) this.onStateChange("MISSION_SUCCESS");
  }

  public showToast(title: string, desc: string) {
    this.notification = { title, desc, timer: 4.5 };
    if (this.onHudUpdate) this.onHudUpdate();
  }

  private render(dt: number) {
    this.renderer.render(
      this.player,
      this.vehicles,
      this.npcs,
      this.dacoits,
      this.policeOfficer,
      this.buildings,
      this.particles,
      this.bullets,
      this.processions,
      this.riverCollectibles,
      this.activeMission,
      this.camera,
      this.timeOfDay,
      this.weather,
      dt,
      this // pass engine reference for interior interactive buttons!
    );
  }

  public setState(newState: GameState) {
    this.state = newState;
    if (newState === "PLAYING") {
      soundManager.resume();
    } else {
      soundManager.stopEngine();
    }
    if (this.onStateChange) this.onStateChange(newState);
  }

  public saveProgress() {
    try {
      const data = {
        player: {
          x: this.player.x,
          y: this.player.y,
          money: this.player.money,
          health: this.player.health,
          weapon: this.player.weapon,
          ownedWeapons: this.player.ownedWeapons,
          ammo: this.player.ammo,
        },
        completedMissions: this.completedMissions,
        settings: this.settings,
        timeOfDay: this.timeOfDay,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }

  public loadProgress(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.player) {
        this.player.x = data.player.x || 650;
        this.player.y = data.player.y || 460;
        this.player.money = data.player.money ?? 450;
        this.player.health = data.player.health ?? 100;
        if (data.player.weapon) this.player.weapon = data.player.weapon;
        if (Array.isArray(data.player.ownedWeapons)) this.player.ownedWeapons = data.player.ownedWeapons;
        if (data.player.ammo) this.player.ammo = { ...this.player.ammo, ...data.player.ammo };
      }
      if (Array.isArray(data.completedMissions)) {
        this.completedMissions = data.completedMissions;
      }
      if (data.settings) {
        this.settings = { ...this.settings, ...data.settings };
      }
      if (data.timeOfDay) {
        this.timeOfDay = data.timeOfDay;
      }
      return true;
    } catch (e) {
      console.warn("Could not load from localStorage", e);
      return false;
    }
  }

  public resetProgress() {
    localStorage.removeItem(SAVE_KEY);
    this.player.x = 650;
    this.player.y = 460;
    this.player.money = 200;
    this.player.health = 100;
    this.completedMissions = [];
    this.activeMission = { ...MISSIONS[0], hasPickedUp: false };
    this.missionTimer = null;
    if (this.player.currentVehicleId) {
      this.exitVehicle();
    }
    this.saveProgress();
    if (this.onHudUpdate) this.onHudUpdate();
  }
}
