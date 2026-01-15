
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language, translations } from "../utils/translations";

export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  const t = translations[lang];
  
  // У Telegram process.env.API_KEY має бути доступним через ін'єкцію
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Gemini API Key is missing");
    return t.configureKey || "AI Key is missing.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = "gemini-3-flash-preview";
    
    const langInstruction = lang === 'uk' ? "Відповідай українською." : lang === 'ru' ? "Отвечай по-русски." : "Respond in English.";

    const systemInstruction = `You are an AI movie expert in the Media Hub app.
    The user is viewing: "${movie.title}".
    Genre: ${movie.genre.join(', ')}. Year: ${movie.year}. Rating: ${movie.rating}.
    Description: ${movie.description}.
    
    Instructions:
    - ${langInstruction}
    - Keep it short (max 40 words).
    - Be helpful and enthusiastic about movies.
    - If asked for something unrelated, politely bring the topic back to movies.`;

    // Використовуємо повну структуру запиту для кращої сумісності
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{
        parts: [{ text: userMessage }]
      }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    return response.text || t.noResponse;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Додаткова перевірка на помилки аутентифікації
    if (error?.message?.includes("API key") || error?.status === 403 || error?.status === 401) {
      return t.configureKey;
    }
    return t.errorGemini;
  }
};
