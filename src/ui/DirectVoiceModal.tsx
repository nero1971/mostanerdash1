import React, { useState, useEffect, useRef } from "react";
import { GameEngine } from "../game/GameEngine";
import { soundManager } from "../audio/SoundManager";
import { Mic, MicOff, Volume2, Sparkles, X, Send, Bot, ShieldAlert, Coffee, MapPin, Compass, BedDouble } from "lucide-react";

interface DirectVoiceModalProps {
  engine: GameEngine;
  isOpen: boolean;
  onClose: () => void;
  onOpenMap: () => void;
  onOpenPhone: () => void;
}

export const DirectVoiceModal: React.FC<DirectVoiceModalProps> = ({
  engine,
  isOpen,
  onClose,
  onOpenMap,
  onOpenPhone,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [replyText, setReplyText] = useState("মাইক্রোফোনে বাংলায় সরাসরি কথা বলুন। যেমন: 'কেমন আছেন ভাই', 'চা খাব', 'পুলিশ ডাকো', 'মিশন কী', 'নিরাপদ ঘরে ঘুমাও'...");
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setReplyText("আপনার ব্রাউজারে ভয়েস রিকগনিশন সরাসরি সমর্থিত নয়। নিচের দ্রুত বোতামগুলোতে চাপ দিয়ে সরাসরি কথা বলতে পারেন!");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "bn-BD";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        soundManager.resume();
        soundManager.playPhoneBeep();
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (event.results[0].isFinal) {
          processSpokenBengali(currentTranscript);
        }
      };

      recognition.onerror = (e: any) => {
        setIsListening(false);
        if (e.error === "not-allowed") {
          setReplyText("মাইক্রোফোন অনুমতি পাওয়া যায়নি। নিচের বোতামগুলোতে চাপ দিন বা ব্রাউজারে মাইক চালু করুন।");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const processSpokenBengali = async (speech: string) => {
    const text = speech.toLowerCase().trim();
    if (!text) return;
    setIsProcessing(true);

    // 1. Check direct Action Voice Commands:
    // A. Police Call
    if (text.includes("পুলিশ") || text.includes("বাঁচাও") || text.includes("ডাকাত") || text.includes("হেল্প") || text.includes("সাহায্য")) {
      engine.callPolice();
      const reply = "🚨 অফিসার মিজানকে জরুরি বার্তা পাঠানো হয়েছে! তিনি সাইরেন বাজিয়ে আসছেন!";
      setReplyText(reply);
      soundManager.speakBengali(reply);
      setIsProcessing(false);
      return;
    }

    // B. Tea Stall / Drink Tea
    if (text.includes("চা") || text.includes("দুধ চা") || text.includes("নাস্তা") || text.includes("বিস্কুট")) {
      const drank = engine.drinkTea();
      const reply = drank
        ? "☕ গরম মালাই চা পান করেছেন! স্বাস্থ্য ও চলার গতি বৃদ্ধি পেয়েছে!"
        : "☕ করিম ভাইয়ের চায়ের দোকানে যান, অথবা স্টলের সামনে গিয়ে চা পান করুন!";
      setReplyText(reply);
      soundManager.speakBengali(reply);
      setIsProcessing(false);
      return;
    }

    // C. Safehouse Sleep
    if (text.includes("ঘুম") || text.includes("ঘুমা") || text.includes("সকাল") || text.includes("বিছানা") || text.includes("নিরাপদ")) {
      engine.sleepInSafehouse();
      const reply = "🛏️ রহিমের নিরাপদ ঘরে ঘুম সম্পন্ন হয়েছে! মিষ্টি রোদের সকাল নেমে এলো এবং স্বাস্থ্য ১০০% উদ্ধার হলো!";
      setReplyText(reply);
      soundManager.speakBengali(reply);
      setIsProcessing(false);
      return;
    }

    // D. Map / Location
    if (text.includes("ম্যাপ") || text.includes("মানচিত্র") || text.includes("কোথায়") || text.includes("পথ") || text.includes("রাস্তা")) {
      const reply = "🗺️ মানচিত্র খুলে দেওয়া হলো! আপনি ৮টি বিভাগ ও পুরো বাংলাদেশ ঘুরে দেখতে পারেন।";
      setReplyText(reply);
      soundManager.speakBengali(reply);
      setIsProcessing(false);
      setTimeout(() => {
        onClose();
        onOpenMap();
      }, 700);
      return;
    }

    // E. Missions
    if (text.includes("মিশন") || text.includes("কাজ") || text.includes("টাকা") || text.includes("রোজগার")) {
      engine.startNextAvailableMission();
      const curMission = engine.activeMission;
      const reply = curMission
        ? `🎯 নতুন মিশন: ${curMission.titleBn}! গন্তব্যে দ্রুত রওনা দিন!`
        : "🎯 আপনি সব প্রাথমিক মিশন সম্পন্ন করেছেন! গ্রামে ঘুরে আরও রোমাঞ্চ উপভোগ করুন!";
      setReplyText(reply);
      soundManager.speakBengali(reply);
      setIsProcessing(false);
      return;
    }

    // F. Phone
    if (text.includes("ফোন") || text.includes("মোবাইল") || text.includes("কল")) {
      const reply = "📱 স্মার্টফোন খোলা হলো!";
      setReplyText(reply);
      soundManager.speakBengali(reply);
      setIsProcessing(false);
      setTimeout(() => {
        onClose();
        onOpenPhone();
      }, 700);
      return;
    }

    // 2. Proximity to NPC check (Direct speech to nearest person!)
    const nearbyNPC = engine.npcs.find((n) => Math.hypot(n.x - engine.player.x, n.y - engine.player.y) < 180);
    if (nearbyNPC) {
      const phrases = nearbyNPC.speechBn || ["নমস্কার ভাই! কেমন আছেন?"];
      const npcAnswer = phrases[Math.floor(Math.random() * phrases.length)];
      const fullReply = `🗣️ ${nearbyNPC.nameBn} (${nearbyNPC.roleBn}): "${npcAnswer}"`;
      setReplyText(fullReply);
      soundManager.speakBengali(npcAnswer);
      setIsProcessing(false);
      return;
    }

    // 3. Smart Village Guide & Counselor AI
    try {
      const res = await fetch("/api/counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: speech,
          language: "bn",
          context: {
            region: "বাংলাদেশ",
            money: engine.player.money,
            health: engine.player.health,
            wanted: engine.player.wantedLevel,
          },
        }),
      });
      const data = await res.json();
      const reply = data.reply || "আরে ভাই শুনলাম! পুরো বাংলাদেশের ম্যাপ ঘুরে দেখুন, ঢাকা থেকে খুলনা সব অঞ্চল প্রস্তুত!";
      setReplyText(reply);
      soundManager.speakBengali(reply);
    } catch (e) {
      const fallbacks = [
        "আরে ভাই! পুরো বাংলাদেশের শহর ও গ্রামে আপনার জন্য গাড়ি, রিকশা আর মিশন প্রস্তুত!",
        "করিম ভাইয়ের চায়ের দোকানে যান অথবা নিজের ঘরে ঘুমানোর বিছানায় বিশ্রাম নিন!",
        "সাবধানে গাড়ি চালাবেন! ডাকাতদের হাত থেকে মানুষকে বাঁচান!",
      ];
      const fallbackReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setReplyText(fallbackReply);
      soundManager.speakBengali(fallbackReply);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickVoicePhrase = (phrase: string) => {
    setTranscript(phrase);
    processSpokenBengali(phrase);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md font-bangla select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-stone-900 via-stone-900 to-emerald-950 border-2 border-emerald-500/80 rounded-3xl shadow-2xl p-5 sm:p-7 text-white flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playUiClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          সরাসরি বাংলা ভয়েস কথোপকথন
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-300 to-green-400 text-center mb-1">
          গেমে সরাসরি কথা বলুন
        </h2>
        <p className="text-xs text-stone-300 text-center mb-5">
          যেকোনো কথা বলুন — মানুষ ও পথপ্রদর্শক উত্তর দেবে এবং গেমে কাজ হবে!
        </p>

        {/* Big Animated Mic Button */}
        <div className="relative my-2">
          {isListening && (
            <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping" />
          )}
          <button
            onClick={() => {
              if (isListening) stopListening();
              else startListening();
            }}
            className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl transition transform active:scale-95 ${
              isListening
                ? "bg-gradient-to-tr from-rose-600 to-red-500 ring-4 ring-rose-400/50 animate-pulse"
                : "bg-gradient-to-tr from-emerald-600 to-teal-500 ring-4 ring-emerald-400/50 hover:brightness-110"
            }`}
          >
            {isListening ? (
              <Mic className="w-9 h-9 sm:w-11 sm:h-11 text-white animate-bounce" />
            ) : (
              <MicOff className="w-9 h-9 sm:w-11 sm:h-11 text-stone-200" />
            )}
          </button>
        </div>

        <p className="text-xs font-semibold text-emerald-400 mt-2 mb-4">
          {isListening ? "🔴 শুনছি... আপনার বাংলায় কথা বলুন!" : "মাইক্রোফোনে চাপ দিয়ে কথা বলুন"}
        </p>

        {/* Transcript Box */}
        {transcript && (
          <div className="w-full bg-stone-950/80 border border-emerald-500/40 rounded-2xl p-3 mb-3 text-xs sm:text-sm text-stone-200">
            <span className="text-emerald-400 font-bold block mb-1">আপনি বলেছেন:</span>
            &ldquo;{transcript}&rdquo;
          </div>
        )}

        {/* Game / AI Response Box */}
        <div className="w-full bg-stone-900/90 border border-amber-500/30 rounded-2xl p-3.5 mb-5 text-xs sm:text-sm text-amber-200 leading-relaxed min-h-[64px] flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            {isProcessing ? (
              <span className="inline-flex items-center gap-2 text-stone-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                উত্তর তৈরি হচ্ছে ও বাংলায় বলা হচ্ছে...
              </span>
            ) : (
              replyText
            )}
          </div>
        </div>

        {/* Quick Voice Commands (Instant Tap for Mobile or No-Mic fallback) */}
        <div className="w-full">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 text-center">
            বা দ্রুত ট্যাপ করে সরাসরি বলুন:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickVoicePhrase("পুলিশ ডাকো")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-300 text-xs font-semibold border border-rose-500/30 active:scale-95 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              পুলিশ ডাকো! 🚨
            </button>
            <button
              onClick={() => handleQuickVoicePhrase("চা খাব")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold border border-amber-500/30 active:scale-95 transition"
            >
              <Coffee className="w-3.5 h-3.5 shrink-0" />
              চা খাব! ☕
            </button>
            <button
              onClick={() => handleQuickVoicePhrase("নিরাপদ ঘরে ঘুমাও")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-teal-300 text-xs font-semibold border border-teal-500/30 active:scale-95 transition"
            >
              <BedDouble className="w-3.5 h-3.5 shrink-0" />
              বিছানায় ঘুমাও 🛏️
            </button>
            <button
              onClick={() => handleQuickVoicePhrase("কেমন আছেন ভাই")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-300 text-xs font-semibold border border-emerald-500/30 active:scale-95 transition"
            >
              <Bot className="w-3.5 h-3.5 shrink-0" />
              কেমন আছেন ভাই? 🗣️
            </button>
            <button
              onClick={() => handleQuickVoicePhrase("মিশন কী")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-indigo-300 text-xs font-semibold border border-indigo-500/30 active:scale-95 transition"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              মিশন দাও! 🎯
            </button>
            <button
              onClick={() => handleQuickVoicePhrase("কোথায় যাব")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-sky-300 text-xs font-semibold border border-sky-500/30 active:scale-95 transition"
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              মানচিত্র দেখাও 🗺️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
