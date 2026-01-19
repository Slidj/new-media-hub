
import { GoogleGenAI } from "@google/genai";
import { Movie, ChatMessage } from "../types";
import { Language, translations } from "../utils/translations";

export const getMovieChatResponse = async (movie: Movie, history: ChatMessage[], lang: Language): Promise<string> => {
  const t = translations[lang];

  try {
    const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) 
      ? process.env.API_KEY 
      : (window as any).process?.env?.API_KEY;

    if (!apiKey) {
      console.warn("API Key is missing");
      return t.configureKey;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const langInstruction = lang === 'uk' ? "Відповідай українською мовою." : lang === 'ru' ? "Отвечай на русском языке." : "Respond in English.";

    // Конвертуємо історію чату у формат Gemini API Content
    // Фільтруємо перше повідомлення, якщо воно від 'model' (привітання), щоб уникнути помилок
    const contents = history
      .filter((msg, index) => !(index === 0 && msg.role === 'model'))
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    // Якщо історія пуста (або було лише привітання), додаємо хоча б останнє повідомлення як fallback
    if (contents.length === 0 && history.length > 0) {
        const lastMsg = history[history.length - 1];
        contents.push({
            role: lastMsg.role,
            parts: [{ text: lastMsg.text }]
        });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents, 
      config: {
        systemInstruction: `You are a movie expert for "Media Hub". Discussing: ${movie.title} (${movie.year}). 
        Context: ${movie.description}.
        Rules: ${langInstruction} Keep answers concise (max 30 words).`,
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
