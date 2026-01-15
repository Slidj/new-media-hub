
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language } from "../utils/translations";

/**
 * Generates an AI response for a movie using Gemini API.
 * Adheres to @google/genai guidelines:
 * - Uses process.env.API_KEY directly.
 * - Instantiates GoogleGenAI within the request context.
 * - Uses correct model 'gemini-3-flash-preview' for basic text tasks.
 * - Accesses response.text property directly.
 */
export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  try {
    // Fix: Instantiate GoogleGenAI right before the call to ensure up-to-date config
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Fix: Use correct model string for basic text tasks
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

    // Fix: Use ai.models.generateContent directly with parameters
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    // Fix: Access .text property directly (not a method call)
    return response.text || "I couldn't generate a response regarding that.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the movie database right now.";
  }
};
