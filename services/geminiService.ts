
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language, translations } from "../utils/translations";

export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  const t = translations[lang];
  
  // Намагаємося отримати ключ безпосередньо з process.env
  const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY;
  
  if (!apiKey) {
    console.error("Gemini API Key is missing. Check environment variables.");
    return t.configureKey || "AI Key is missing.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
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
    console.error("Gemini Request Failed:", error);
    if (error?.status === 403 || error?.message?.includes("key")) {
      return t.configureKey;
    }
    return t.errorGemini;
  }
};
