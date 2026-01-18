
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language, translations } from "../utils/translations";

export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  const t = translations[lang];

  try {
    // Безпечне отримання ключа з window.process
    const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) 
      ? process.env.API_KEY 
      : (window as any).process?.env?.API_KEY;

    if (!apiKey) {
      console.warn("API Key is missing");
      return t.configureKey;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const langInstruction = lang === 'uk' ? "Відповідай українською мовою." : lang === 'ru' ? "Отвечай на русском языке." : "Respond in English.";

    // Використовуємо простий формат запиту (string) для максимальної сумісності
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage, 
      config: {
        systemInstruction: `You are a movie expert for "Media Hub". Discussing: ${movie.title} (${movie.year}). Rules: ${langInstruction} Be very brief (max 20 words).`,
        temperature: 0.7,
      },
    });

    return response.text || t.noResponse;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error?.message || '';
    if (errorMessage.includes('API_KEY') || error?.status === 403 || error?.status === 401) {
      return t.configureKey;
    }
    
    return t.errorGemini;
  }
};
