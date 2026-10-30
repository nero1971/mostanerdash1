import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// In-game AI Village Counselor / গ্রাম বন্ধু Endpoint with High Thinking
app.post("/api/counselor", async (req: Request, res: Response) => {
  try {
    const { message, history, language = "bn", context } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    if (!aiClient) {
      // Graceful rich offline fallback with authentic Bengali village wisdom
      const fallbacksBn = [
        "রাধানগর গ্রামে স্বাগতম ভাই! আপনি মেঠো পথ ধরে পূর্ব দিকে গেলে নদী ও ফেরি ঘাট পাবেন, আর পশ্চিমে হাট বাজার।",
        "চা খাবেন ভাই? করিম ভাইয়ের চায়ের দোকানে গরম মালাই চা আর বাকরখানি বেশ বিখ্যাত। গিয়ে দেখতে পারেন!",
        "ধানের খেতে পানি সেচের কাজ চলছে। আপনি চাইলে ট্রাক্টর চালিয়ে কৃষকদের সাহায্য করতে পারেন।",
        "নদীতে হরিদাস জেলের নৌকা বাঁধা আছে। সাবধানে নৌকা চালাবেন, পদ্মার স্রোত কিন্তু বেশ প্রবল!",
        "রাধানগর উচ্চ বিদ্যালয়ের সামনে মাঠটিতে বিকেলে ছেলেরা ফুটবল খেলে। সেখানেও যেতে পারেন।",
        "কোনো গাড়ি নষ্ট হলে সোজা বাস স্ট্যান্ডের পাশে জব্বার মেকানিকের গ্যারেজে নিয়ে যাবেন।"
      ];
      const randomAdvice = fallbacksBn[Math.floor(Math.random() * fallbacksBn.length)];
      res.json({
        reply: randomAdvice,
        isOfflineFallback: true,
      });
      return;
    }

    const systemInstruction = `You are "গ্রাম বন্ধু" (Gram Bondhu), an affectionate, wise, and enthusiastic local guide and elder living in রাধানগর গ্রাম (Radhanagar Village), a fictional authentic Bangladeshi rural region in the open-world game "আমাদের গ্রাম বাংলা" (Amader Gram Bangla).
Game World Context:
- Current Region: ${context?.region || "Radhanagar"}
- Current Vehicle: ${context?.vehicle || "None (Walking)"}
- Completed Missions: ${context?.completedCount || 0}
- Player Balance: ৳${context?.money || 0}

Personality:
- Warm, polite, uses colloquial rural Bengali phrases ("ভাই", "চাচা", "দাদা", "শোনেন", "আল্লাহ ভরসা", "মাশাল্লাহ").
- If the user writes in English, reply in friendly English with touches of Bengali rural hospitality. If the user writes in Bengali, reply in pure, natural, expressive Bengali.
- Keep responses concise and engaging for an in-game phone messenger (2-4 sentences max).
- Offer helpful gameplay advice, village lore, route tips (river ghat, banyan tree / বটতলা, bazaar, mosque, rice mill, fishing village), or fun rural riddles.`;

    // As explicitly specified in metadata instructions:
    // Model: gemini-4-argon with thinkingLevel: ThinkingLevel.HIGH, without maxOutputTokens.
    const response = await aiClient.models.generateContent({
      model: "gemini-4-argon",
      contents: message,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    res.json({
      reply: response.text || "বলো ভাই, আমি শুনছি। রাধানগরে কী জানতে চাও?",
    });
  } catch (error: any) {
    console.error("Gemini Counselor API error:", error?.message || error);
    // Return friendly local response if API limit or error occurs
    res.json({
      reply: "রাধানগরের মেঠো পথে নেটওয়ার্ক একটু দুর্বল ভাই! তবে করিম চাচার চায়ের দোকান বা নদীর ঘাটে গিয়ে দেখুন, নতুন রোমাঞ্চ অপেক্ষা করছে।",
      fallback: true,
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
