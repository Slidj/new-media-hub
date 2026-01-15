import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language } from "../utils/translations";

// Extreme safety check for environment variables in browsers
const getApiKey = (): string => {
  try {
    // Check if process exists and has env property
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Silently fail
  }
  return '';
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  if (!ai) {
    return "Please configure the Gemini API Key to use the AI features.";
  }

  try {
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

    return response.text || "I couldn't generate a response regarding that.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the movie database right now.";
  }
};