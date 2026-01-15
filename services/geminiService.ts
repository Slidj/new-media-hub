
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language, translations } from "../utils/translations";

export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  const t = translations[lang];
  
  if (!process.env.API_KEY) {
    console.error("Gemini API Key is missing in process.env");
    return t.configureKey || "AI Key is missing.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview";
    
    const langInstruction = lang === 'uk' ? "Respond in Ukrainian." : lang === 'ru' ? "Respond in Russian." : "Respond in English.";

    const systemInstruction = `You are a helpful movie enthusiast AI assistant integrated into a streaming platform.
    The user is currently looking at the movie: "${movie.title}".
    Movie details:
    - Genre: ${movie.genre.join(', ')}
    - Year: ${movie.year}
    - Rating: ${movie.rating}
    - Description: ${movie.description}

    ${langInstruction}
    Answer the user's questions about this specific movie. If they ask for recommendations, suggest similar movies based on this one.
    Keep answers concise (under 50 words) and engaging.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || t.noResponse;
  } catch (error) {
    console.error("Gemini API Error details:", error);
    return t.errorGemini;
  }
};
