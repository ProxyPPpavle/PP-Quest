
import { GoogleGenAI, Type } from "@google/genai";
import { Quest, QuestDifficulty, QuestType, Language } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const QUEST_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      difficulty: { 
        type: Type.STRING,
        description: "Must be one of: Easy, Medium, Hard"
      },
      type: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      points: { type: Type.NUMBER }
    },
    required: ["title", "description", "difficulty", "type", "points"]
  }
};

const languagePrompts: Record<Language, string> = {
  en: "English",
  sr: "Serbian (Serbian language/srpski)",
  es: "Spanish",
  fr: "French"
};

export async function generateDailyQuests(lang: Language = 'en'): Promise<Quest[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 4 CREATIVE, DOABLE, and PLEASANT "side quests" for a mobile app. 
    Language: ${languagePrompts[lang]}.
    
    CORE PHILOSOPHY:
    - Quests must be achievable and not socially awkward or "cringe". 
    - They should be funny, positive, and add a small bit of meaning or joy to the user's day.
    - NO boring academic tasks. NO bugging strangers for "random" things.
    - Focus on "wholesome fun" and "Main Character Energy" that makes the user feel cool, not weird.
    
    QUEST TYPES TO INCLUDE:
    - IMAGE QUEST: Find something interesting or create a funny scene. 
      Examples: "Find a tree that looks like it's judging you", "Give a tiny paper hat to a piece of fruit", "Find a building with a 'face'".
    - TEXT QUEST: Creative writing or witty observations.
      Examples: "Write a short 'thank you' note to your shoes for carrying you today", "Invent a funny backstory for the first object you see on your left", "Draft a 1-sentence motivation for a lazy cat".
    - ACTION QUEST: Small, fun interactions with the environment.
      Examples: "Leave a positive sticky note in a public place", "Learn how to say 'you are awesome' in a new language", "Organize your apps by color for 1 minute".
    - "IMPOSSIBLE" (Hard) but funny: Exaggerated goals that are still lighthearted.
      Example: "Find a dog that looks like it has a corporate 9-to-5 job", "Spot a car that looks exactly like a specific snack".

    TONE: 
    - Witty, playful, encouraging, and sharp. 
    - Speak like a cool, supportive friend who loves a good joke.

    Return the quests in the specified JSON schema. Ensure variety in types (IMAGE, TEXT, CHOICE).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: QUEST_SCHEMA
    }
  });

  try {
    const rawQuests = JSON.parse(response.text);
    return rawQuests.map((q: any) => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
      saved: false,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error("Failed to parse quests", e);
    return [];
  }
}

export async function verifySubmission(
  quest: Quest, 
  submission: { text?: string, imageBase64?: string },
  lang: Language = 'en'
): Promise<{ success: boolean; feedback: string }> {
  const parts: any[] = [{ text: `Act as a STRICT but FAIR "Quest Guardian". 
  Quest: ${quest.title} - ${quest.description}
  User submitted evidence: ${submission.text || "An image proof"}
  Language for response: ${languagePrompts[lang]}.
  
  STRICTNESS PROTOCOL:
  1. REJECT if the submission is lazy, generic, or clearly ignored the prompt.
  2. If an image is required, verify it actually matches the request (e.g., if it asked for a hat on a fruit, look for it).
  3. If they succeed, provide a witty, rewarding compliment.
  4. If they fail, be firm but funny about why they didn't meet the "Guild Standards".
  
  Return JSON with "success" (boolean) and "feedback" (string).` }];

  if (submission.imageBase64) {
    parts.push({
      inlineData: {
        data: submission.imageBase64,
        mimeType: "image/jpeg"
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          success: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING }
        },
        required: ["success", "feedback"]
      }
    }
  });

  return JSON.parse(response.text);
}
