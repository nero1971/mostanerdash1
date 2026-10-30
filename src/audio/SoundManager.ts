import { SoundSettings, VehicleType } from "../types/game";

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private vehicleGain: GainNode | null = null;

  private isInitialized = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private radioOsc: OscillatorNode | null = null;
  private radioInterval: number | null = null;
  private radioPlaying = false;
  private currentRadioTrack = 0;

  private settings: SoundSettings = {
    master: 0.8,
    music: 0.6,
    ambient: 0.5,
    vehicles: 0.7,
    sfx: 0.8,
    muted: false,
  };

  private radioTracks = [
    { titleBn: "ভাটিয়ালি সুর (Bhatiali Folk)", tempo: 180, notes: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63, 293.66] },
    { titleBn: "বাউল একতারা তাল (Baul Rhythm)", tempo: 220, notes: [196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 329.63, 261.63] },
    { titleBn: "পল্লীগীতির মেঠো গান (Rural Melody)", tempo: 160, notes: [329.63, 392.0, 440.0, 493.88, 523.25, 440.0, 392.0, 329.63] },
    { titleBn: "নদী তীরের বাঁশি (River Flute)", tempo: 140, notes: [440.0, 493.88, 587.33, 659.25, 587.33, 523.25, 440.0] },
  ];

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.ambientGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.vehicleGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.vehicleGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.updateVolumes(this.settings);
      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio initialization skipped:", e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public updateVolumes(settings: SoundSettings) {
    this.settings = { ...settings };
    if (!this.masterGain || !this.ctx) return;

    const masterVal = settings.muted ? 0 : settings.master;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(masterVal, now);
    if (this.musicGain) this.musicGain.gain.setValueAtTime(settings.music, now);
    if (this.ambientGain) this.ambientGain.gain.setValueAtTime(settings.ambient, now);
    if (this.sfxGain) this.sfxGain.gain.setValueAtTime(settings.sfx, now);
    if (this.vehicleGain) this.vehicleGain.gain.setValueAtTime(settings.vehicles, now);
  }

  // --- Bell Sounds ---
  public playRickshawBell() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    [0, 0.12].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, now + offset); // A6
      osc.frequency.exponentialRampToValueAtTime(1920, now + offset + 0.05);

      gain.gain.setValueAtTime(0.35, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  }

  public playBicycleBell() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [0, 0.09, 0.18].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(2200, now + offset);
      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  }

  // --- Horn Sounds ---
  public playHorn(type: VehicleType) {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (type === "bicycle" || type === "rickshaw") {
      this.playRickshawBell();
      return;
    }

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === "cng") {
      osc1.type = "sawtooth";
      osc2.type = "square";
      osc1.frequency.setValueAtTime(420, now);
      osc2.frequency.setValueAtTime(530, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } else if (type === "bus" || type === "cargo_truck" || type === "tractor") {
      // Big air horn
      osc1.type = "sawtooth";
      osc2.type = "sawtooth";
      osc1.frequency.setValueAtTime(220, now);
      osc2.frequency.setValueAtTime(277.18, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } else {
      // Standard car horn
      osc1.type = "triangle";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(370, now);
      osc2.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.26);
      osc2.stop(now + 0.26);
    }

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
  }

  // --- Engine Sound Simulation ---
  public updateEngine(vehicleType: VehicleType | null, speedRatio: number) {
    if (!vehicleType || vehicleType === "bicycle" || vehicleType === "rickshaw") {
      this.stopEngine();
      return;
    }
    this.resume();
    if (!this.ctx || !this.vehicleGain) return;

    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      if (vehicleType === "cng") {
        this.engineOsc.type = "sawtooth";
      } else if (vehicleType === "tractor") {
        this.engineOsc.type = "triangle";
      } else if (vehicleType === "fishing_boat" || vehicleType === "motorboat") {
        this.engineOsc.type = "square";
      } else {
        this.engineOsc.type = "sawtooth";
      }

      this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.vehicleGain);
      this.engineOsc.start();
    }

    // Dynamic pitch modulation based on speed
    const baseFreq = vehicleType === "cng" ? 85 : vehicleType === "tractor" ? 45 : 60;
    const targetFreq = baseFreq + speedRatio * 140;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
  }

  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (e) {}
      this.engineOsc = null;
    }
  }

  // --- Footsteps ---
  public playFootstep(isMud = false) {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isMud ? "triangle" : "sine";
    osc.frequency.setValueAtTime(isMud ? 90 : 140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
  }

  // --- UI and Mission Sounds ---
  public playCoin() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playMissionComplete() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.3, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.3);
    });
  }

  public playUiClick() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playPhoneBeep() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [0, 0.15].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, now + offset);
      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.09);
    });
  }

  public playPunch() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.09);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playSiren() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.25);
    osc.frequency.linearRampToValueAtTime(650, now + 0.5);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.85);
  }

  public playBodyHit() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.16);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playCrash() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.25);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playTireScreech() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.18);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playShopDoorBell() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [0, 0.1].forEach((delay, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      const freq = idx === 0 ? 880 : 1320;
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + delay);
      osc.stop(now + delay + 0.28);
    });
  }

  public playFine() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [0, 0.15].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(300, now + offset);
      osc.frequency.exponentialRampToValueAtTime(150, now + offset + 0.12);
      gain.gain.setValueAtTime(0.3, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    });
  }

  public playSplash() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // --- Radio / Folk Music Player ---
  public toggleRadio(): boolean {
    if (this.radioPlaying) {
      this.stopRadio();
      return false;
    } else {
      this.startRadio();
      return true;
    }
  }

  public startRadio() {
    this.resume();
    if (!this.ctx || !this.musicGain) return;
    this.stopRadio();
    this.radioPlaying = true;

    const track = this.radioTracks[this.currentRadioTrack];
    let noteIdx = 0;

    const playNextNote = () => {
      if (!this.radioPlaying || !this.ctx || !this.musicGain) return;
      const freq = track.notes[noteIdx % track.notes.length];
      noteIdx++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (60 / track.tempo) * 1.5);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + (60 / track.tempo) * 1.6);
    };

    playNextNote();
    this.radioInterval = window.setInterval(playNextNote, (60 / track.tempo) * 1000);
  }

  public nextRadioTrack(): string {
    this.currentRadioTrack = (this.currentRadioTrack + 1) % this.radioTracks.length;
    if (this.radioPlaying) {
      this.startRadio();
    }
    return this.radioTracks[this.currentRadioTrack].titleBn;
  }

  public prevRadioTrack(): string {
    this.currentRadioTrack = (this.currentRadioTrack - 1 + this.radioTracks.length) % this.radioTracks.length;
    if (this.radioPlaying) {
      this.startRadio();
    }
    return this.radioTracks[this.currentRadioTrack].titleBn;
  }

  public stopRadio() {
    this.radioPlaying = false;
    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
  }

  public isRadioOn(): boolean {
    return this.radioPlaying;
  }

  // --- Gun & Ammo Sound Effects ---
  public playGunshot(type: "pistol" | "shotgun" | "rifle" = "pistol") {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (type === "shotgun") {
      // Deep loud double boom with noise burst
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.4);

      // Noise crackle
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      whiteNoise.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      whiteNoise.start(now);
    } else if (type === "rifle") {
      // High velocity sharp crack
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // 9mm Pistol pop & snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  public playGunEmpty() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playGunReload() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [0, 0.14].forEach((offset, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(idx === 0 ? 550 : 850, now + offset);
      osc.frequency.exponentialRampToValueAtTime(300, now + offset + 0.08);
      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  }

  // --- Tea Stall Sounds ---
  public playTeaSip() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.linearRampToValueAtTime(550, now + 0.15);
    osc.frequency.linearRampToValueAtTime(280, now + 0.3);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  // --- Rally / Procession Megaphone Chanting ---
  public playRallyMegaphone() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth"; // Megaphone buzzy timbre
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(420, now + 0.1);
    osc.frequency.linearRampToValueAtTime(350, now + 0.25);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playItemCollect() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [659.25, 880, 1174.66].forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      gain.gain.setValueAtTime(0.22, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.22);
    });
  }

  // --- Bomb & Cocktail Explosion (বোমা ও ককটেল বিস্ফোরণ) ---
  public playExplosion() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // 1. Low frequency rumble boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.6);

    // 2. High burst crackle noise
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.09));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(900, now);
    noiseFilter.frequency.linearRampToValueAtTime(200, now + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }

  // --- Throw Bomb Whoosh ---
  public playBombThrow() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  // --- Machete / Ramdao Swing (রামদা / চাপাতির কোপ) ---
  public playMacheteSwing() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.16);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // --- Street Hawker Horn / Tin Rattle (হকার ও ফেরিওয়ালার ডাক ও ঘণ্টা) ---
  public playHawkerBell() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [1046.5, 1318.5, 1567.98].forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now + idx * 0.09);
      gain.gain.setValueAtTime(0.2, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.18);
    });
  }

  // --- Rally Crowd Roar (মিছিলের হাজারো জনতার গর্জন) ---
  public playCrowdSlogan() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [180, 240, 320].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.05);
      osc.stop(now + 0.55);
    });
  }

  // --- Authentic bKash Payment Tune (বিকাশ পেমেন্ট রিংটোন টুং-টুং) ---
  public playBkashTune() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Classic bKash 4-note bell chime (E6, G#6, B6, E7)
    const notes = [1318.51, 1661.22, 1975.53, 2637.02];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.3, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.32);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.35);
    });
  }

  // --- Nagad Digital Transaction Tune (নগদ লেনদেন সুর) ---
  public playNagadTune() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Warm harmonic tri-tone (C5, G5, C6)
    [523.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.28, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.28);
    });
  }

  // --- Animal Sounds: Cow Moo (গরুর হাম্বা হাম্বা ডাক) ---
  public playCowMoo() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.7);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  // --- Animal Sounds: Duck Quack (হাঁসের প্যাক প্যাক ডাক) ---
  public playDuckQuack() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [0, 0.16].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(420, now + offset);
      osc.frequency.exponentialRampToValueAtTime(280, now + offset + 0.12);
      gain.gain.setValueAtTime(0.22, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    });
  }

  // --- Animal Sounds: Goat Bleat (ছাগলের ম্যাঁ ডাক) ---
  public playGoatBleat() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(370, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(290, now + 0.45);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.52);
  }

  // --- Animal Sounds: Bird Chirp (পাখির কিচিরমিচির গান) ---
  public playBirdChirp() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [0, 0.08, 0.16].forEach((offset, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2400 + idx * 300, now + offset);
      osc.frequency.exponentialRampToValueAtTime(3200, now + offset + 0.05);
      gain.gain.setValueAtTime(0.15, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.07);
    });
  }

  // --- Police Helicopter Chopper Rotor Sound (পুলিশ হেলিকপ্টারের প্রপেলার শব্দ) ---
  private chopperOsc: OscillatorNode | null = null;
  private chopperGain: GainNode | null = null;
  private chopperInterval: number | null = null;

  public startHelicopterSound() {
    this.resume();
    if (!this.ctx || !this.vehicleGain || this.chopperOsc) return;

    this.chopperOsc = this.ctx.createOscillator();
    this.chopperGain = this.ctx.createGain();

    this.chopperOsc.type = "sawtooth";
    this.chopperOsc.frequency.setValueAtTime(36, this.ctx.currentTime); // Low rotor thud

    this.chopperGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.chopperOsc.connect(this.chopperGain);
    this.chopperGain.connect(this.vehicleGain);
    this.chopperOsc.start();

    // Periodic rotor blade chop pulse
    this.chopperInterval = window.setInterval(() => {
      if (!this.ctx || !this.chopperGain) return;
      const now = this.ctx.currentTime;
      this.chopperGain.gain.cancelScheduledValues(now);
      this.chopperGain.gain.setValueAtTime(0.24, now);
      this.chopperGain.gain.exponentialRampToValueAtTime(0.04, now + 0.08);
    }, 110);
  }

  public stopHelicopterSound() {
    if (this.chopperInterval) {
      clearInterval(this.chopperInterval);
      this.chopperInterval = null;
    }
    if (this.chopperOsc) {
      try {
        this.chopperOsc.stop();
        this.chopperOsc.disconnect();
      } catch (e) {}
      this.chopperOsc = null;
    }
  }

  // --- Rooster Crowing for Morning Sleep (ভোরের মোরগের ডাক কুক-কুরূ-কূঁ) ---
  public playRoosterCrow() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Iconic 4-part rooster melodic contour: G4 -> C5 -> E5 -> G5 (held long)
    const notes = [
      { f: 392.0, d: 0.18, delay: 0 },
      { f: 523.25, d: 0.16, delay: 0.18 },
      { f: 659.25, d: 0.22, delay: 0.34 },
      { f: 783.99, d: 0.75, delay: 0.56 },
    ];

    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(n.f, now + n.delay);
      osc.frequency.linearRampToValueAtTime(n.f * 1.05, now + n.delay + n.d);

      gain.gain.setValueAtTime(0.01, now + n.delay);
      gain.gain.linearRampToValueAtTime(0.26, now + n.delay + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.delay + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + n.delay);
      osc.stop(now + n.delay + n.d + 0.05);
    });
  }

  // --- Carjacking Sound (গাড়ি ছিনতাই / দরজা টানার শব্দ) ---
  public playCarjacking() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // --- Police Baton Strike (পুলিশের লাঠির পিটুনি) ---
  public playBatonHit() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.14);
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // --- Arrest / Busted Dramatic Sting (পুলিশের হাতে ধরা খাওয়ার সুর) ---
  public playBustedSound() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const freqs = [350, 310, 270, 220, 160];
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, now + idx * 0.16);
      gain.gain.setValueAtTime(0.35, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.4);
    });
  }

  // --- Moving Train Whistle & Chug (বাংলাদেশ রেলওয়ের ট্রেনের বাঁশি ও ঝমাঝম শব্দ) ---
  public playTrainWhistle() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [587.33, 739.99, 880.0].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.98, now + 1.2);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
      gain.gain.setValueAtTime(0.24, now + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 1.35);
    });
  }

  public playTrainChug() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.08);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // --- Thief Apprehended & Police Bounty Fanfare (চোর ধরা ও পুলিশ পুরস্কার সুর) ---
  public playThiefCaught() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now + idx * 0.1);
      gain.gain.setValueAtTime(0.28, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.3);
    });
  }

  public playPoliceWhistle() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [0, 0.15].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2400, now + offset);
      osc.frequency.linearRampToValueAtTime(2600, now + offset + 0.1);
      gain.gain.setValueAtTime(0.3, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    });
  }

  // --- Aircraft & Flight Sounds (বিমান ও হেলিকপ্টার) ---
  public playAirplaneSound() {
    this.resume();
    if (!this.ctx || !this.vehicleGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(this.vehicleGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playHelicopterRotor() {
    this.resume();
    if (!this.ctx || !this.vehicleGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(45, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.vehicleGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // --- Space Rocket Launch & Moon Exploration (মহাকাশ রকেট ও চাঁদের শব্দ) ---
  public playRocketLaunch() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Deep thunderous sub-bass roar
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 1.2);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.5);
  }

  public playMoonLanding() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);
      gain.gain.setValueAtTime(0.3, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.45);
    });
  }

  // --- Living Animals Authentic Vocalizations (গরু, হাঁস, ছাগল ও পাখি) ---
  public playAnimalSound(type: "cow" | "duck" | "goat" | "bird") {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (type === "cow") {
      // Gentle Cow Moo (হাম্বাআআ)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.6);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.7);
    } else if (type === "duck") {
      // Duck Quack (প্যাক প্যাক)
      [0, 0.12].forEach((offset) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(380, now + offset);
        osc.frequency.exponentialRampToValueAtTime(240, now + offset + 0.08);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } else if (type === "goat") {
      // Goat Bleat (ম্যাঁ ম্যাঁ)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === "bird") {
      // Bird Chirp (কিচিরমিচির)
      [0, 0.09, 0.18].forEach((offset, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1800 + i * 200, now + offset);
        osc.frequency.exponentialRampToValueAtTime(2800, now + offset + 0.06);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.08);
      });
    }
  }

  // --- Real-time Bengali Speech Synthesis (সরাসরি মুখে কথা বলা ও শোনানো) ---
  public speakBengali(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel(); // cancel any active speech
      const cleanText = text.replace(/[*#_~`"“”]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "bn-BD"; // Bengali (Bangladesh)
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select Bengali voice if available in browser
      const voices = window.speechSynthesis.getVoices();
      const bnVoice = voices.find((v) => v.lang.startsWith("bn") || v.lang.includes("Bengali"));
      if (bnVoice) utterance.voice = bnVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis unavailable:", e);
    }
  }

  public stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getCurrentTrackName(): string {
    return this.radioTracks[this.currentRadioTrack].titleBn;
  }
}

export const soundManager = new SoundManager();

