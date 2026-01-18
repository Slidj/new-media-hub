
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language, translations } from "../utils/translations";

/**
 * Отримує відповідь від AI про конкретний фільм.
 * Використовує модель gemini-3-flash-preview для оптимальної швидкості.
 */
export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  const t = translations[lang];
  
  // Перевірка наявності ключа перед ініціалізацією
  if (!process.env.API_KEY) {
    console.error("Gemini API Key is undefined in process.env");
    return t.configureKey;
  }

  try {
    // Створюємо екземпляр згідно з правилами SDK
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const langInstruction = lang === 'uk' ? "Відповідай українською мовою." : lang === 'ru' ? "Отвечай на русском языке." : "Respond in English.";

    const systemInstruction = `You are a movie expert AI for "Media Hub".
Target Movie: "${movie.title}" (${movie.year}).
Genre: ${movie.genre.join(', ')}. Rating: ${movie.rating}.
Description: ${movie.description}.

Rules:
- ${langInstruction}
- Be conversational, friendly, and very concise (max 30 words).
- Focus on providing interesting facts or context about this specific movie.
- If the user greets you, greet them back as a Media Hub assistant.`;

    // Виконуємо запит у найпростішому форматі для максимальної надійності
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: userMessage }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    // Повертаємо текст (response.text - це getter у новому SDK)
    return response.text || t.noResponse;
  } catch (error: any) {
    console.error("Gemini Request Error:", error);
    
    // Обробка специфічних помилок ключа або доступу
    const errorStr = String(error).toLowerCase();
    if (errorStr.includes("api_key") || errorStr.includes("403") || errorStr.includes("401") || errorStr.includes("not authorized")) {
      return t.configureKey;
    }
    
    return t.errorGemini;
  }
};
