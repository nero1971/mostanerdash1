export type GameState = "TITLE" | "INTRO_MODAL" | "PLAYING" | "PAUSED" | "MISSION_SUCCESS" | "GAME_OVER";

export type Language = "bn" | "en";

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export type WeatherType = "clear" | "cloudy" | "rain" | "thunder";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface Region {
  id: string;
  nameBn: string;
  nameEn: string;
  bounds: { x: number; y: number; w: number; h: number };
  color: string;
  descriptionBn: string;
  descriptionEn: string;
  isCity?: boolean;
}

export type InteriorType = 
  | "tea_stall"
  | "grocery_store"
  | "garage_workshop"
  | "police_station"
  | "hospital_clinic"
  | "city_supermarket"
  | "residential_home"
  | "mud_cottage"
  | "school_classroom"
  | "mosque_prayer_hall"
  | "gun_shop"
  | "bank_office"
  | "mill_interior"
  | "village_villa"
  | "weaver_hut"
  | "riverside_hut";

export interface Building {
  id: string;
  nameBn: string;
  nameEn: string;
  type: "house" | "mud_house" | "shop" | "tea_stall" | "school" | "mosque" | "clinic" | "mill" | "garage" | "ferry_ghat" | "bazaar" | "city_building" | "bank" | "police_station" | "gun_shop" | "vehicle_showroom" | "airport_terminal" | "space_center";
  x: number;
  y: number;
  w: number;
  h: number;
  roofColor?: string;
  wallColor?: string;
  isEnterable: boolean; // Every building can be entered!
  interiorType?: InteriorType;
  doorX: number;
  doorY: number;
  floors?: number;
  residentNameBn?: string;
  descriptionBn?: string;
  isPlayerSafehouse?: boolean;
}

export type VehicleType = 
  | "bicycle"
  | "motorcycle"
  | "rickshaw"
  | "van"
  | "easybike"
  | "cng"
  | "private_car"
  | "pickup"
  | "tractor"
  | "laguna"
  | "bus"
  | "cargo_truck"
  | "fishing_boat"
  | "motorboat"
  | "speed_boat"
  | "launch"
  | "ferry"
  | "airplane"
  | "helicopter"
  | "space_rocket";

export interface Vehicle {
  id: string;
  type: VehicleType;
  nameBn: string;
  nameEn: string;
  x: number;
  y: number;
  angle: number; // in radians
  speed: number;
  maxSpeed: number;
  accel: number;
  turnSpeed: number;
  isWaterVehicle: boolean;
  width: number;
  length: number;
  health: number;
  maxHealth: number;
  color: string;
  occupied: boolean;
  unlocked: boolean;
  price: number;
  // Flight & Aerial properties (বিমান ও হেলিকপ্টার)
  altitude?: number;
  maxAltitude?: number;
  isFlying?: boolean;
  // Autonomous AI Traffic properties
  isAiTraffic?: boolean;
  trafficWaypoints?: Position[];
  currentWaypointIdx?: number;
  waitTimer?: number;
  honkCooldown?: number;
  driverNameBn?: string;
}

export interface NPC {
  id: string;
  nameBn: string;
  nameEn: string;
  roleBn: string;
  roleEn: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  angle: number;
  state: "idle" | "walking" | "talking" | "farming" | "working" | "fleeing" | "knocked_down" | "rallying";
  speechBn: string[];
  speechEn: string[];
  activeDialog?: string;
  dialogTimer?: number;
  clothingColor: string;
  skinTone: string;
  hasHat?: boolean; // Mathal
  hasPot?: boolean; // Kalshi
  isHostile?: boolean; // Thug / Gangster (গুন্ডা)
  health?: number;
  // Ragdoll on vehicle hit
  knockbackVx?: number;
  knockbackVy?: number;
  knockdownTimer?: number;
}

// Night Dacoits / Outlaws & Gangsters (মস্তানের বাহিনী ও সশস্ত্র ডাকাত দল)
export interface Dacoit {
  id: string;
  nameBn: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  health: number;
  maxHealth: number;
  isChasing: boolean;
  attackCooldown: number;
  hasLoot: boolean;
  isKnockedOut: boolean;
  knockbackVx: number;
  knockbackVy: number;
  knockdownTimer: number;
  weaponType: "ramdao" | "pistol" | "bomb" | "shotgun";
  shootCooldown?: number;
  bombCooldown?: number;
}

// Police Helicopter (পুলিশ হেলিকপ্টার)
export interface PoliceHelicopter {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  altitude: number;
  rotorAngle: number;
  speed: number;
  isActive: boolean;
  searchlightAngle: number;
  searchlightRadius: number;
  shootCooldown: number;
}

// Police Officer (পুলিশ ও র‍্যাব সদস্য)
export interface PoliceOfficer {
  id: string;
  nameBn: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  isSirenActive: boolean;
  sirenTimer: number;
  chasingDacoitId: string | null;
  chasingPlayer: boolean;
  attackCooldown: number;
  health: number;
  maxHealth: number;
  isKnockedOut: boolean;
  weaponType: "baton" | "shotgun";
  vehicleId?: string | null;
}

// Night Thieves & Muggers (রাতের চোর ও ছিনতাইকারী)
export interface NightThief {
  id: string;
  nameBn: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  health: number;
  maxHealth: number;
  bounty: number;
  isSubdued: boolean;
  isHandedOver: boolean;
  stolenItemBn: string;
  speechBn: string;
  speechTimer: number;
  fleeingFromPlayer: boolean;
  facing: "left" | "right" | "up" | "down";
}

// Moving Train System (রেলগাড়ি ও বগি)
export interface TrainCarriage {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface MovingTrain {
  id: string;
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1; // 1 = eastbound, -1 = westbound
  trackY: number;
  carriages: TrainCarriage[];
  stoppedTimer: number;
  currentStation: string | null;
  whistleTimer: number;
  chugTimer: number;
  hasPlayerBoarded: boolean;
}

export interface Mission {
  id: number;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  rewardMoney: number;
  targetLocation: Position;
  targetRadius: number;
  pickupLocation?: Position;
  hasPickedUp?: boolean;
  targetRegionBn: string;
  targetRegionEn: string;
  requiredVehicle?: VehicleType;
  timeLimit?: number;
  icon: string;
}

export type WeaponType = "fist" | "bamboo_stick" | "ramdao" | "pistol" | "shotgun" | "rifle" | "bomb";

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  damage: number;
  weaponType: "pistol" | "shotgun" | "rifle";
  color: string;
  isEnemy?: boolean;
}

// Thrown Bomb / Cocktail (হাতবোমা ও ককটেল)
export interface ThrownBomb {
  id: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  arcHeight: number;
  timer: number;
  damage: number;
  radius: number;
  isEnemy: boolean;
  exploded: boolean;
}

// Moving Street Hawkers & Vendors (রাস্তায় চলমান হকার ও ফেরিওয়ালা)
export interface Hawker {
  id: string;
  nameBn: string;
  itemBn: string;
  price: number;
  healthHeal: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  angle: number;
  cartType: "jhalmuri" | "icecream" | "chanachur" | "fruit";
  callShoutsBn: string[];
  callTimer: number;
  activeShout?: string;
  shoutTimer?: number;
  clothingColor: string;
}

// Living Processions & Rallies (মিছিল)
export interface ProcessionMember {
  x: number;
  y: number;
  role: "leader" | "banner_front" | "marcher" | "placard";
  flagColor: string;
  nameBn: string;
  clothingColor: string;
  placardTextBn?: string;
}

export interface Procession {
  id: string;
  nameBn: string;
  bannerTextBn: string;
  leaderSpeechBn: string[];
  crowdResponseBn: string[];
  members: ProcessionMember[];
  waypoints: Position[];
  currentWaypointIdx: number;
  speed: number;
  chantTimer: number;
  chantPhase: "leader" | "crowd";
  activeSlogan: string;
  isPlayerJoined: boolean;
}

// River Items and Collectibles on both sides of Padma river
export interface RiverCollectible {
  id: string;
  type: "hilsa_fish" | "coin_chest" | "fuel_drum" | "pearl_box";
  nameBn: string;
  x: number;
  y: number;
  value: number;
  collected: boolean;
}

export interface Player {
  x: number;
  y: number;
  angle: number;
  speed: number;
  walkSpeed: number;
  runSpeed: number;
  health: number;
  maxHealth: number;
  money: number;
  currentVehicleId: string | null;
  currentInterior: InteriorType | null;
  currentBuildingId: string | null;
  currentBuilding: Building | null;
  isRunning: boolean;
  isInteracting: boolean;
  isAttacking: boolean;
  attackTimer: number;
  facing: "up" | "down" | "left" | "right";
  animFrame: number;
  wantedLevel: number;
  finesDue: number;
  // Weapons & Shooting
  weapon: WeaponType;
  ownedWeapons: WeaponType[];
  ammo: {
    pistol: number;
    shotgun: number;
    rifle: number;
    bomb: number;
  };
  // Digital Banking & Mobile Wallets (বিকাশ, নগদ ও ব্যাংক একাউন্ট)
  bankBalance: number;
  bkashBalance: number;
  nagadBalance: number;
  // Tea Stall & Adda states
  isDrinkingTea: boolean;
  isSittingInAdda: boolean;
  currentAddaTopic: string;
  isSleeping?: boolean;
  sleepFade?: number;
  // Moon Exploration & Space Rocket (চাঁদে মহাকাশ অভিযান)
  isOnMoon?: boolean;
  moonRocks?: number;
  rocketCountdown?: number;
  isRocketLaunching?: boolean;
  dailyRewardClaimed?: boolean;
  reputationRank?: string;
}

// Living Animals & Humorous Fauna (গরু, হাঁস, ছাগল ও পাখি)
export interface Animal {
  id: string;
  type: "cow" | "duck" | "goat" | "bird";
  nameBn: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  angle: number;
  soundTimer: number;
  funnyText?: string;
  textTimer?: number;
  state?: "grazing" | "swimming" | "flying" | "wandering" | "scared";
  color?: string;
}

export interface SoundSettings {
  master: number;
  music: number;
  ambient: number;
  vehicles: number;
  sfx: number;
  muted: boolean;
}

export interface GameSettings {
  language: Language;
  graphicsQuality: "low" | "medium" | "high";
  controlType: "dpad" | "joystick";
  controlSize: "small" | "medium" | "large";
  leftHanded: boolean;
  showMinimap: boolean;
  sound: SoundSettings;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: "dust" | "water" | "smoke" | "spark" | "firefly" | "leaf" | "rain" | "hit" | "coin" | "shout" | "bullet_trace" | "tea_steam" | "explosion" | "bomb_fire";
  text?: string;
}
