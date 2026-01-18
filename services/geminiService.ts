
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language, translations } from "../utils/translations";

/**
 * Отримує відповідь від AI про фільм.
 */
export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  const t = translations[lang];
  
  // Безпечний пошук ключа в усіх можливих місцях
  const apiKey = (window as any).process?.env?.API_KEY || (process?.env?.API_KEY);

  if (!apiKey) {
    return t.configureKey;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const langInstruction = lang === 'uk' ? "Відповідай українською мовою." : lang === 'ru' ? "Отвечай на русском языке." : "Respond in English.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: `You are a cinema expert for Media Hub. 
Film: ${movie.title} (${movie.year}). 
Rules: ${langInstruction} Max 20 words. Friendly.`,
        temperature: 0.7,
      },
    });

    return response.text || t.noResponse;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errStr = String(error).toLowerCase();
    
    // Перевірка на помилки авторизації
    if (errStr.includes("403") || errStr.includes("401") || errStr.includes("key") || errStr.includes("not authorized")) {
      return t.configureKey;
    }
    
    return t.errorGemini;
  }
};
