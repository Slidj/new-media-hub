
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language, translations } from "../utils/translations";

export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  const t = translations[lang];

  try {
    // Використовуємо API_KEY безпосередньо з оточення
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const langInstruction = lang === 'uk' ? "Відповідай українською мовою." : lang === 'ru' ? "Отвечай на русском языке." : "Respond in English.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: `You are a movie expert for "Media Hub". Discussing: ${movie.title} (${movie.year}). Rules: ${langInstruction} Be very brief (max 20 words).`,
        temperature: 0.8,
      },
    });

    // response.text — це getter в @google/genai
    const text = response.text;
    return text || t.noResponse;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Якщо помилка пов'язана з авторизацією/ключем
    if (error?.message?.includes('API_KEY') || error?.status === 403 || error?.status === 401) {
      return t.configureKey;
    }
    
    return t.errorGemini;
  }
};
