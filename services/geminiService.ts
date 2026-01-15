
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language, translations } from "../utils/translations";

export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  const t = translations[lang];
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Gemini API Key is missing in process.env");
    return t.configureKey || "AI Key is missing.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-3-flash-preview";
    
    const langInstruction = lang === 'uk' ? "Відповідай українською мовою." : lang === 'ru' ? "Отвечай на русском языке." : "Respond in English.";

    const systemInstruction = `You are a helpful movie enthusiast AI assistant integrated into a streaming platform called Media Hub.
    The user is currently looking at the movie: "${movie.title}".
    Movie details:
    - Genre: ${movie.genre.join(', ')}
    - Year: ${movie.year}
    - Rating: ${movie.rating}
    - Description: ${movie.description}

    Instruction:
    - ${langInstruction}
    - Answer questions specifically about this movie.
    - If asked for recommendations, suggest similar titles.
    - Be concise (max 50 words).
    - Be friendly but professional.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const resultText = response.text;
    return resultText || t.noResponse;
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    // Якщо помилка пов'язана з ключем, виводимо прохання налаштувати його
    if (error?.message?.includes("API key") || error?.message?.includes("403")) {
        return t.configureKey;
    }
    return t.errorGemini;
  }
};
