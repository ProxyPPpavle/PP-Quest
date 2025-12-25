
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
    - Quests must be achievable and not socially awkward. 
    - They should be funny, positive, and add value or joy.
    - Focus on "Main Character Energy".
    
    TYPES: IMAGE (creative photos), TEXT (witty writing), ACTION (small real-world fun).
    TONE: Witty, cool, supportive. No AI-robot speak.

    Return the quests in the specified JSON schema.`,
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

export async function translateQuests(quests: Quest[], targetLang: Language): Promise<Quest[]> {
  const questData = quests.map(q => ({ id: q.id, title: q.title, description: q.description }));
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Translate the following quest titles and descriptions to ${languagePrompts[targetLang]}. 
    Keep the humor and tone intact. 
    Data: ${JSON.stringify(questData)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    }
  });

  const translatedData = JSON.parse(response.text);
  return quests.map(q => {
    const translation = translatedData.find((t: any) => t.id === q.id);
    return translation ? { ...q, title: translation.title, description: translation.description } : q;
  });
}

export async function verifySubmission(
  quest: Quest, 
  submission: { text?: string, imageBase64?: string },
  lang: Language = 'en'
): Promise<{ success: boolean; feedback: string }> {
  const parts: any[] = [{ text: `Act as a BRUTALLY STRICT and cynical "Quest Guardian". 
  Quest: ${quest.title} - ${quest.description}
  User submitted evidence: ${submission.text || "An image proof"}
  Language for response: ${languagePrompts[lang]}.
  
  STRICTNESS PROTOCOL:
  1. REJECT (success: false) if the submission is even slightly lazy, generic, or looks like a cheat.
  2. If an image is just a blank wall, floor, or blurry mess: REJECT immediately.
  3. If text is under 15 characters (unless it's a specific choice): REJECT.
  4. Be a "hard-to-please" critic. Only 10/10 effort gets a pass.
  5. Mock them if they fail. Compliment them with respect if they actually put in the work.
  
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
