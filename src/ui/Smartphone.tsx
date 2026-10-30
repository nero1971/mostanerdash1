import React, { useState } from "react";
import { GameEngine } from "../game/GameEngine";
import { soundManager } from "../audio/SoundManager";
import { GUN_SHOP_ITEMS, MISSIONS, REGIONS, RIVER_X, WORLD_HEIGHT, WORLD_WIDTH } from "../game/constants";
import {
  Bell,
  Bot,
  Car,
  CheckCircle2,
  ChevronLeft,
  Compass,
  Crosshair,
  FileText,
  Flame,
  MapPin,
  MessageSquare,
  Mic,
  Music,
  Package,
  Phone,
  PhoneCall,
  PhoneOff,
  Radio,
  Send,
  Settings,
  Shield,
  Sparkles,
  Target,
  User,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Zap,
} from "lucide-react";

interface SmartphoneProps {
  engine: GameEngine;
  onClose: () => void;
  defaultApp?: PhoneApp;
}

export type PhoneApp =
  | "HOME"
  | "CONTACTS"
  | "MESSAGES"
  | "MAP"
  | "MISSIONS"
  | "GARAGE"
  | "PROFILE"
  | "RADIO"
  | "SETTINGS"
  | "COUNSELOR"
  | "ARMS";

export const Smartphone: React.FC<SmartphoneProps> = ({
  engine,
  onClose,
  defaultApp = "HOME",
}) => {
  const [currentApp, setCurrentApp] = useState<PhoneApp>(defaultApp);
  const [, setUpdateTick] = useState(0);
  const [activeCall, setActiveCall] = useState<{ name: string; role: string; dialogue: string } | null>(null);

  // Counselor AI Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    {
      sender: "bot",
      text: "নমস্কার ভাই! আমি রাধানগরের 'গ্রাম বন্ধু'। কোনো পথ হারিয়েছেন, মিশন সংক্রান্ত পরামর্শ বা প্রাচীন বটতলার ইতিহাস জানতে চান? নিঃসঙ্কোচে জিজ্ঞেস করুন!",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isCounselorLoading, setIsCounselorLoading] = useState(false);

  // Radio state
  const [radioOn, setRadioOn] = useState(soundManager.isRadioOn());
  const [currentTrack, setCurrentTrack] = useState(soundManager.getCurrentTrackName());

  const handleAppClick = (app: PhoneApp) => {
    soundManager.playPhoneBeep();
    setCurrentApp(app);
  };

  const [isListening, setIsListening] = useState(false);

  const handleCall = (name: string, role: string, dialogues: string[]) => {
    soundManager.playPhoneBeep();
    const d = dialogues[Math.floor(Math.random() * dialogues.length)];
    setActiveCall({ name, role, dialogue: d });
    soundManager.speakBengali(d);
  };

  const endCall = () => {
    soundManager.playUiClick();
    soundManager.stopSpeaking();
    setActiveCall(null);
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      engine.showToast("ভয়েস ইনপুট", "ব্রাউজারে ভয়েস রিকগনিশন সক্রিয় নয়, টেক্সট লিখে পাঠান!");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "bn-BD";
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputMessage(transcript);
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const sendCounselorMessage = async () => {
    if (!inputMessage.trim() || isCounselorLoading) return;
    const userText = inputMessage.trim();
    setInputMessage("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsCounselorLoading(true);
    soundManager.playUiClick();

    try {
      // Find current player region
      const currentReg = REGIONS.find((r) => {
        return (
          engine.player.x >= r.bounds.x &&
          engine.player.x <= r.bounds.x + r.bounds.w &&
          engine.player.y >= r.bounds.y &&
          engine.player.y <= r.bounds.y + r.bounds.h
        );
      });

      const curVeh = engine.vehicles.find((v) => v.id === engine.player.currentVehicleId);

      const res = await fetch("/api/counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          language: engine.settings.language,
          context: {
            region: currentReg?.nameBn || "রাধানগর",
            vehicle: curVeh?.nameBn || "পায়ে হেঁটে",
            completedCount: engine.completedMissions.length,
            money: engine.player.money,
          },
        }),
      });

      const data = await res.json();
      const reply = data.reply || "রাধানগরের সুন্দর নদী আর ফসলের মাঠ ঘুরে দেখুন ভাই!";
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: reply,
        },
      ]);
      soundManager.playPhoneBeep();
      soundManager.speakBengali(reply);
    } catch (e) {
      const errReply = "মেঠো পথের নেটওয়ার্ক কিছুটা দুর্বল ভাই! তবে চায়ের স্টল বা নদীর ঘাটে গিয়ে নতুন মিশনে অংশ নিন।";
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errReply,
        },
      ]);
      soundManager.speakBengali(errReply);
    } finally {
      setIsCounselorLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Phone Hardware Mockup */}
      <div className="relative w-full max-w-[390px] h-[92vh] max-h-[760px] bg-stone-950 rounded-[44px] border-4 border-stone-800 shadow-2xl flex flex-col overflow-hidden text-stone-100 font-bangla">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-end px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 animate-pulse" />
        </div>

        {/* Status Bar */}
        <div className="pt-3 px-6 pb-2 flex justify-between items-center text-[11px] text-stone-400 z-30">
          <span className="font-semibold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">4G রাধানগর</span>
            <div className="w-3.5 h-2 border border-stone-400 rounded-sm p-0.5">
              <div className="h-full bg-emerald-400 rounded-xs w-3/4" />
            </div>
          </div>
        </div>

        {/* Top Header of App */}
        <div className="px-4 py-2 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between z-30">
          {currentApp !== "HOME" ? (
            <button
              onClick={() => {
                soundManager.playUiClick();
                setCurrentApp("HOME");
              }}
              className="flex items-center gap-1 text-emerald-400 text-xs font-bold hover:text-emerald-300"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>হোম</span>
            </button>
          ) : (
            <span className="text-xs font-bold text-stone-300">রাধানগর স্মার্টফোন</span>
          )}

          <button
            onClick={() => {
              soundManager.playUiClick();
              onClose();
            }}
            className="p-1 rounded-full bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Phone Content Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950">
          {/* Active Simulated Phone Call Overlay */}
          {activeCall && (
            <div className="fixed inset-0 z-50 bg-stone-950/95 flex flex-col items-center justify-between p-8 text-center animate-in fade-in">
              <div className="mt-12 flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center border-4 border-emerald-400/50 shadow-2xl animate-pulse">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mt-2">{activeCall.name}</h3>
                <span className="text-xs text-emerald-400 font-semibold">{activeCall.role} · কলিং...</span>
              </div>

              <div className="bg-stone-900/90 border border-emerald-500/30 p-4 rounded-2xl max-w-xs shadow-lg">
                <p className="text-stone-200 text-sm leading-relaxed italic">
                  "{activeCall.dialogue}"
                </p>
              </div>

              <div className="mb-8">
                <button
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 border-2 border-rose-300 shadow-xl flex items-center justify-center text-white active:scale-90 transition-all"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
            </div>
          )}

          {/* 1. HOME SCREEN GRID */}
          {currentApp === "HOME" && (
            <div className="space-y-6">
              {/* Weather & Time Widget */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-900/40 to-stone-900 border border-emerald-500/20 shadow-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">রাধানগর জেলা</h4>
                  <p className="text-xs text-stone-400 capitalize">
                    {engine.timeOfDay === "morning" && "সকালের মিষ্টি রোদ ☀️"}
                    {engine.timeOfDay === "afternoon" && "দুপুরের জমজমাট হাট 🌤️"}
                    {engine.timeOfDay === "evening" && "সন্ধ্যার গোধূলি লগ্ন 🌅"}
                    {engine.timeOfDay === "night" && "শান্ত জ্যোৎস্না রাত 🌙"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-amber-400">৳{engine.player.money}</span>
                  <div className="text-[10px] text-stone-400">ব্যালেন্স</div>
                </div>
              </div>

              {/* App Icon Grid */}
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => handleAppClick("CONTACTS")}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <div className="w-13 h-13 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg border border-emerald-400/40">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-stone-200">যোগাযোগ</span>
                </button>

                <button
                  onClick={() => handleAppClick("MESSAGES")}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <div className="w-13 h-13 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg border border-blue-400/40">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-stone-200">বার্তা</span>
                </button>

                <button
                  onClick={() => handleAppClick("MAP")}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <div className="w-13 h-13 rounded-2xl bg-amber-600 flex items-center justify-center shadow-lg border border-amber-400/40">
                    <Compass className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-stone-200">ম্যাপ</span>
                </button>

                <button
                  onClick={() => handleAppClick("MISSIONS")}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <div className="w-13 h-13 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg border border-rose-400/40">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-stone-200">মিশন</span>
                </button>

                <button
                  onClick={() => handleAppClick("GARAGE")}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <div className="w-13 h-13 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg border border-indigo-400/40">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-stone-200">গ্যারেজ</span>
                </button>

                <button
                  onClick={() => handleAppClick("COUNSELOR")}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg border border-purple-300">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-purple-300">গ্রাম বন্ধু</span>
                </button>

                <button
                  onClick={() => handleAppClick("RADIO")}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <div className="w-13 h-13 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg border border-teal-400/40">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-stone-200">রেডিও</span>
                </button>

                <button
                  onClick={() => handleAppClick("PROFILE")}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <div className="w-13 h-13 rounded-2xl bg-stone-700 flex items-center justify-center shadow-lg border border-stone-500">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-stone-200">প্রোফাইল</span>
                </button>

                <button
                  onClick={() => handleAppClick("ARMS")}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-700 to-rose-700 flex items-center justify-center shadow-lg border border-amber-400/50">
                    <Crosshair className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-amber-300">অস্ত্রাগার</span>
                </button>

                <button
                  onClick={() => handleAppClick("SETTINGS")}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <div className="w-13 h-13 rounded-2xl bg-stone-800 flex items-center justify-center shadow-lg border border-stone-600">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-stone-200">সেটিংস</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. CONTACTS APP */}
          {currentApp === "CONTACTS" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 mb-2">গ্রামবাসী ও জরুরি যোগাযোগ</h3>

              {/* Emergency Police Call Direct Contact */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-red-950/70 to-blue-950/70 border border-rose-500/60 flex items-center justify-between shadow-lg">
                <div>
                  <h4 className="font-bold text-sm text-red-300 flex items-center gap-1.5">
                    <span>🚨 রাধানগর থানা পুলিশ</span>
                  </h4>
                  <span className="text-[11px] text-stone-300">অফিসার মিজান · জরুরি ৯৯৯ হেল্পলাইন</span>
                </div>
                <button
                  onClick={() => {
                    engine.callPolice();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md active:scale-95 animate-pulse"
                >
                  কল করুন
                </button>
              </div>

              {engine.npcs.map((npc) => (
                <div
                  key={npc.id}
                  className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-sm text-stone-100">{npc.nameBn}</h4>
                    <span className="text-xs text-stone-400">{npc.roleBn}</span>
                  </div>
                  <button
                    onClick={() => handleCall(npc.nameBn, npc.roleBn, npc.speechBn)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95"
                    title="কল করুন"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 3. MESSAGES APP */}
          {currentApp === "MESSAGES" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-blue-400 mb-2">ইনবক্স বার্তা</h3>
              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-400">করিম ভাই (চা স্টল)</span>
                  <span className="text-[10px] text-stone-500">১০ মি. আগে</span>
                </div>
                <p className="text-xs text-stone-300">
                  রহিম ভাই! গরুর খাঁটি দুধ এসেছে। দোকানে এসে এক কাপ স্পেশাল মালাই চা খেয়ে যান।
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400">জব্বার মেকানিক</span>
                  <span className="text-[10px] text-stone-500">১ ঘণ্টা আগে</span>
                </div>
                <p className="text-xs text-stone-300">
                  আপনার কোনো রিকশা বা সিএনজি সার্ভিসিং লাগলে ওয়ার্কশপে চলে আসবেন!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-rose-400">শফিক স্যার (উচ্চ বিদ্যালয়)</span>
                  <span className="text-[10px] text-stone-500">আজ সকাল</span>
                </div>
                <p className="text-xs text-stone-300">
                  স্কুলের লাইব্রেরির নতুন বইয়ের পার্সেলটি বাজার থেকে দ্রুত আনা প্রয়োজন।
                </p>
              </div>
            </div>
          )}

          {/* 4. WORLD MAP APP */}
          {currentApp === "MAP" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-400">রাধানগর সম্পূর্ণ জেলা ম্যাপ</h3>
                <span className="text-[11px] text-stone-400">১৬টি অঞ্চল</span>
              </div>
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {REGIONS.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-2xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 transition-all flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-100">{r.nameBn}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold">
                        অঞ্চল
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed">{r.descriptionBn}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. MISSIONS APP */}
          {currentApp === "MISSIONS" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-rose-400">মিশন তালিকা (১৫টি মিশন)</h3>
                <span className="text-xs text-emerald-400 font-bold">
                  {engine.completedMissions.length} / {MISSIONS.length} সম্পন্ন
                </span>
              </div>

              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {MISSIONS.map((m) => {
                  const isCompleted = engine.completedMissions.includes(m.id);
                  const isActive = engine.activeMission?.id === m.id;

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isActive
                          ? "bg-rose-950/40 border-rose-500"
                          : isCompleted
                          ? "bg-stone-900/60 border-emerald-600/40"
                          : "bg-stone-900 border-stone-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-stone-100 flex items-center gap-1.5">
                            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            <span>{m.titleBn}</span>
                          </h4>
                          <span className="text-[10px] text-amber-400 font-semibold">পুরস্কার: ৳{m.rewardMoney}</span>
                        </div>

                        {!isCompleted && !isActive && (
                          <button
                            onClick={() => {
                              engine.startMission(m.id);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow active:scale-95"
                          >
                            শুরু করুন
                          </button>
                        )}
                        {isActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold animate-pulse">
                            চলমান
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">{m.descBn}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. GARAGE APP */}
          {currentApp === "GARAGE" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-indigo-400">যানবাহন গ্যারেজ</h3>
              <p className="text-xs text-stone-400">রাধানগরের গ্রাম্য যানবাহন সংগ্রহশালা</p>

              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {engine.vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-stone-100">{v.nameBn}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1">
                        <span>গতি: {v.maxSpeed * 10} কিমি/ঘন্টা</span>
                        <span>·</span>
                        <span>স্বাস্থ্য: {v.health}/{v.maxHealth}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playUiClick();
                        // Teleport vehicle near player
                        v.x = engine.player.x + 35;
                        v.y = engine.player.y;
                        v.health = v.maxHealth;
                        engine.showToast(v.nameBn, "যানবাহনটি আপনার পাশে আনা হয়েছে!");
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold active:scale-95 shadow"
                    >
                      আনুন
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. GRAM BONDHU (AI COUNSELOR WITH THINKING MODE) */}
          {currentApp === "COUNSELOR" && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-gradient-to-r from-purple-900/50 to-pink-900/40 border border-purple-500/30 mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-200">গ্রাম বন্ধু (AI উপদেষ্টা)</h4>
                    <span className="text-[10px] text-purple-300">হাই থিংকিং মোড সক্রিয় · রাধানগর গাইড</span>
                  </div>
                </div>

                {/* Chat Stream */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 text-xs">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        msg.sender === "user"
                          ? "ml-auto bg-emerald-700 text-white rounded-br-none"
                          : "mr-auto bg-stone-900 border border-stone-800 text-stone-200 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isCounselorLoading && (
                    <div className="p-3 rounded-2xl bg-stone-900 border border-purple-500/30 text-purple-300 mr-auto flex items-center gap-2 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>গ্রাম বন্ধু চিন্তা করছেন...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="mt-3 flex gap-2 items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCounselorMessage()}
                  placeholder="রাধানগর সম্পর্কে যা খুশি জিজ্ঞেস করুন..."
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={sendCounselorMessage}
                  disabled={isCounselorLoading || !inputMessage.trim()}
                  className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white active:scale-95 transition-all shadow"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 8. RADIO APP */}
          {currentApp === "RADIO" && (
            <div className="space-y-4 text-center">
              <h3 className="text-sm font-bold text-teal-400">পল্লী সুর রেডিও</h3>
              <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 flex flex-col items-center gap-3 shadow-xl">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${
                  radioOn ? "bg-teal-600 border-teal-300 animate-pulse" : "bg-stone-800 border-stone-700"
                }`}>
                  <Music className="w-9 h-9 text-white" />
                </div>
                <h4 className="font-bold text-sm text-stone-100">{currentTrack}</h4>
                <span className="text-xs text-stone-400">রাধানগর পল্লী সুর ৯২.৪ এফএম</span>

                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => {
                      const name = soundManager.prevRadioTrack();
                      setCurrentTrack(name);
                      setRadioOn(true);
                    }}
                    className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200"
                  >
                    ⏮️
                  </button>
                  <button
                    onClick={() => {
                      const active = soundManager.toggleRadio();
                      setRadioOn(active);
                    }}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg active:scale-95 ${
                      radioOn ? "bg-rose-600 text-white" : "bg-teal-600 text-white"
                    }`}
                  >
                    {radioOn ? "বিরতি (Pause)" : "বাজান (Play)"}
                  </button>
                  <button
                    onClick={() => {
                      const name = soundManager.nextRadioTrack();
                      setCurrentTrack(name);
                      setRadioOn(true);
                    }}
                    className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200"
                  >
                    ⏭️
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 9. PROFILE APP */}
          {currentApp === "PROFILE" && (
            <div className="space-y-3">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950 to-stone-900 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                  রহিম
                </div>
                <div>
                  <h4 className="font-bold text-stone-100 text-sm">রহিম আহমেদ</h4>
                  <span className="text-xs text-emerald-400">রাধানগর প্রধান গ্রাম</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
                  <span className="text-[10px] text-stone-400">টাকা ব্যালেন্স</span>
                  <p className="text-base font-bold text-amber-400 mt-0.5">৳{engine.player.money}</p>
                </div>
                <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
                  <span className="text-[10px] text-stone-400">সম্পন্ন মিশন</span>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">{engine.completedMissions.length} টি</p>
                </div>
                <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
                  <span className="text-[10px] text-stone-400">স্বাস্থ্য</span>
                  <p className="text-base font-bold text-rose-400 mt-0.5">{engine.player.health}%</p>
                </div>
                <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
                  <span className="text-[10px] text-stone-400">সম্মান স্তর</span>
                  <p className="text-base font-bold text-purple-400 mt-0.5">প্রিয় গ্রামবাসী</p>
                </div>
              </div>
            </div>
          )}

          {/* 10. SETTINGS APP */}
          {currentApp === "SETTINGS" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-stone-300">গেম সেটিংস</h3>

              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-200">সাউন্ড মিউট</span>
                  <p className="text-[10px] text-stone-400">সব অডিও বন্ধ করুন</p>
                </div>
                <button
                  onClick={() => {
                    const next = !engine.settings.sound.muted;
                    engine.settings.sound.muted = next;
                    soundManager.updateVolumes(engine.settings.sound);
                    engine.saveProgress();
                  }}
                  className={`p-2 rounded-xl ${
                    engine.settings.sound.muted ? "bg-rose-600 text-white" : "bg-stone-800 text-stone-300"
                  }`}
                >
                  {engine.settings.sound.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-200">ভাষা / Language</span>
                  <p className="text-[10px] text-stone-400">বাংলা অথবা English</p>
                </div>
                <button
                  onClick={() => {
                    engine.settings.language = engine.settings.language === "bn" ? "en" : "bn";
                    engine.saveProgress();
                  }}
                  className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  {engine.settings.language === "bn" ? "বাংলা" : "English"}
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
                <button
                  onClick={() => {
                    if (confirm("আপনি কি নতুন করে শুরু করতে চান? বর্তমান অগ্রগতি মুছে যাবে।")) {
                      engine.resetProgress();
                      onClose();
                    }
                  }}
                  className="w-full py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-xl text-xs"
                >
                  অগ্রগতি রিসেট করুন (Reset Save)
                </button>
              </div>
            </div>
          )}

          {/* 11. ARMS & AMMO APP (অস্ত্রাগার ও গোলাবারুদ) */}
          {currentApp === "ARMS" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 border border-red-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-amber-400" />
                    <span>শমসের অস্ত্রাগার ও কার্তুজ</span>
                  </h3>
                  <p className="text-[10px] text-stone-400">লাইসেন্সকৃত আত্মরক্ষা ও শিকারী বন্দুক</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-amber-400">৳{engine.player.money}</span>
                  <div className="text-[9px] text-stone-400">ব্যালেন্স</div>
                </div>
              </div>

              {/* Current Weapon & Ammo Status Card */}
              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-stone-300 font-semibold">হাতে বর্তমান অস্ত্র:</span>
                  <button
                    onClick={() => {
                      engine.switchWeapon();
                      setUpdateTick((t) => t + 1);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-red-600/80 hover:bg-red-500 text-white rounded-lg font-bold"
                  >
                    বদলান (Q)
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                  <Target className="w-4 h-4 text-rose-400" />
                  <span>
                    {engine.player.weapon === "fist" && "👊 খালি হাত (ঘুষি)"}
                    {engine.player.weapon === "bamboo_stick" && "🎋 বাঁশের লাঠি"}
                    {engine.player.weapon === "ramdao" && "🗡️ ধারালো রামদা / চাপাতি"}
                    {engine.player.weapon === "bomb" && `💣 পেট্রোল ককটেল / হাতবোমা (${engine.player.ammo.bomb || 0} টি)`}
                    {engine.player.weapon === "pistol" && `🔫 ৯মিমি পিস্তল (${engine.player.ammo.pistol} গুলি)`}
                    {engine.player.weapon === "shotgun" && `💥 দোনলা শিকারী বন্দুক (${engine.player.ammo.shotgun} কার্তুজ)`}
                    {engine.player.weapon === "rifle" && `🎯 কার্বাইন রাইফেল (${engine.player.ammo.rifle} বুলেট)`}
                  </span>
                </div>
                {/* Ammo Counter Grid */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2 border-t border-stone-800 text-[10px]">
                  <div className="bg-stone-950/70 p-1.5 rounded-xl text-center border border-stone-800">
                    <div className="text-stone-400 text-[9px]">হাতবোমা</div>
                    <div className="font-bold text-amber-300 text-xs mt-0.5">{engine.player.ammo.bomb || 0}</div>
                  </div>
                  <div className="bg-stone-950/70 p-1.5 rounded-xl text-center border border-stone-800">
                    <div className="text-stone-400 text-[9px]">পিস্তল</div>
                    <div className="font-bold text-amber-400 text-xs mt-0.5">{engine.player.ammo.pistol}</div>
                  </div>
                  <div className="bg-stone-950/70 p-1.5 rounded-xl text-center border border-stone-800">
                    <div className="text-stone-400 text-[9px]">শটগান</div>
                    <div className="font-bold text-rose-400 text-xs mt-0.5">{engine.player.ammo.shotgun}</div>
                  </div>
                  <div className="bg-stone-950/70 p-1.5 rounded-xl text-center border border-stone-800">
                    <div className="text-stone-400 text-[9px]">রাইফেল</div>
                    <div className="font-bold text-emerald-400 text-xs mt-0.5">{engine.player.ammo.rifle}</div>
                  </div>
                </div>
              </div>

              {/* Gun and Ammo Store Items */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-stone-300">অস্ত্র ও গুলি ক্রয় তালিকা:</h4>
                {GUN_SHOP_ITEMS.map((item) => {
                  const isOwned = item.type === "weapon" && engine.player.ownedWeapons.includes(item.weaponType);
                  const canAfford = engine.player.money >= item.price;

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-3 shadow-sm hover:border-red-500/40 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="p-2 rounded-xl bg-stone-800 border border-stone-700 mt-0.5 shrink-0">
                          {item.type === "weapon" ? (
                            <Crosshair className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Package className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-stone-100 truncate">{item.nameBn}</h5>
                          <p className="text-[10px] text-stone-400 mt-0.5 leading-snug line-clamp-2">
                            {item.descriptionBn}
                          </p>
                          <div className="text-[10px] text-amber-400 font-bold mt-1">
                            ৳{item.price} {item.type === "ammo" && `• +${item.ammoCount} রাউন্ড`}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {item.type === "weapon" ? (
                          isOwned ? (
                            <button
                              onClick={() => {
                                engine.player.weapon = item.weaponType;
                                soundManager.playGunReload();
                                setUpdateTick((t) => t + 1);
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                                engine.player.weapon === item.weaponType
                                  ? "bg-emerald-600 text-white"
                                  : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                              }`}
                            >
                              {engine.player.weapon === item.weaponType ? "সক্রিয়" : "হাতে নিন"}
                            </button>
                          ) : (
                            <button
                              disabled={!canAfford}
                              onClick={() => {
                                engine.buyWeapon(item);
                                setUpdateTick((t) => t + 1);
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                                canAfford
                                  ? "bg-rose-600 hover:bg-rose-500 text-white active:scale-95 shadow-md"
                                  : "bg-stone-800 text-stone-500 cursor-not-allowed"
                              }`}
                            >
                              ৳{item.price} কিনুন
                            </button>
                          )
                        ) : (
                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              engine.buyAmmo(item);
                              setUpdateTick((t) => t + 1);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                              canAfford
                                ? "bg-amber-600 hover:bg-amber-500 text-white active:scale-95 shadow-md"
                                : "bg-stone-800 text-stone-500 cursor-not-allowed"
                            }`}
                          >
                            + কিনুন
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="p-2 bg-stone-950 flex justify-center">
          <div
            onClick={() => {
              soundManager.playUiClick();
              if (currentApp !== "HOME") setCurrentApp("HOME");
              else onClose();
            }}
            className="w-32 h-1 bg-stone-600 rounded-full cursor-pointer hover:bg-white"
          />
        </div>
      </div>
    </div>
  );
};
