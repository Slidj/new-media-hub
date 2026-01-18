
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language, translations } from "../utils/translations";

export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  const t = translations[lang];
  
  try {
    // Створюємо екземпляр AI з ключем безпосередньо з оточення
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    
    const langInstruction = lang === 'uk' ? "Відповідай українською мовою." : lang === 'ru' ? "Отвечай на русском языке." : "Respond in English.";

    const systemInstruction = `You are a movie expert for Media Hub. 
User is looking at: ${movie.title} (${movie.year}).
Genre: ${movie.genre.join(', ')}. Rating: ${movie.rating}.
Description: ${movie.description}.

Rules:
- ${langInstruction}
- Be helpful and concise (max 30 words).
- If the user asks about other movies, you can help too.`;

    // Використовуємо максимально простий формат запиту для стабільності
    const result = await ai.models.generateContent({
      model: model,
      contents: userMessage, // Передаємо повідомлення як рядок
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    if (result && result.text) {
      return result.text;
    }
    
    return t.noResponse;
  } catch (error: any) {
    console.error("Gemini API Request Error:", error);
    
    // Більш широка перевірка на проблеми з ключем
    const errorStr = error?.toString() || "";
    if (
      errorStr.includes("API_KEY") || 
      errorStr.includes("403") || 
      errorStr.includes("401") || 
      errorStr.includes("not found")
    ) {
      return t.configureKey;
    }
    
    return t.errorGemini;
  }
};
