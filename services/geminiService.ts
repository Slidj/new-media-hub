
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language, translations } from "../utils/translations";

export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  const t = translations[lang];
  
  try {
    // Використовуємо process.env.API_KEY напряму, як зазначено в інструкціях
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = "gemini-3-flash-preview";
    
    const langInstruction = lang === 'uk' ? "Відповідай українською мовою." : lang === 'ru' ? "Отвечай на русском языке." : "Respond in English.";

    const systemInstruction = `You are a movie expert AI for "Media Hub".
    Movie: "${movie.title}".
    Details: ${movie.genre.join(', ')}, ${movie.year}, Rating: ${movie.rating}.
    Description: ${movie.description}.
    
    Rules:
    - ${langInstruction}
    - Keep response under 40 words.
    - Be conversational and helpful.
    - Focus only on movies.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: userMessage }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || t.noResponse;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Перевірка на помилки аутентифікації або відсутність ключа в SDK
    if (error?.message?.includes("API_KEY") || error?.status === 403 || error?.status === 401) {
      return t.configureKey;
    }
    
    return t.errorGemini;
  }
};
