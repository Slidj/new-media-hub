
import { GoogleGenAI } from "@google/genai";
import { Movie, ChatMessage } from "../types";
import { Language, translations } from "../utils/translations";

export const getMovieChatResponse = async (movie: Movie, history: ChatMessage[], lang: Language): Promise<string> => {
  const t = translations[lang];

  try {
    // According to guidelines, the API key must be obtained exclusively from process.env.API_KEY.
    // We assume it is pre-configured and valid.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const langInstruction = lang === 'uk' ? "Відповідай українською мовою." : lang === 'ru' ? "Отвечай на русском языке." : "Respond in English.";

    // Convert chat history to Gemini API Content format
    const contents = history
      .filter((msg, index) => !(index === 0 && msg.role === 'model'))
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    if (contents.length === 0 && history.length > 0) {
        const lastMsg = history[history.length - 1];
        contents.push({
            role: lastMsg.role,
            parts: [{ text: lastMsg.text }]
        });
    }
    
    // If array is empty (user hasn't typed anything yet, but we want a greeting),
    // return default message without API call
    if (contents.length === 0) {
        return "Thinking...";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents, 
      config: {
        systemInstruction: `You are a movie expert for "Media Hub". Discussing: ${movie.title} (${movie.year}). 
        Context: ${movie.description}.
        Rules: ${langInstruction} Keep answers concise (max 40 words). Be friendly and engaging.`,
        temperature: 0.7,
      },
    });

    return response.text || t.noResponse;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error?.message || '';
    // Handle specific errors
    if (errorMessage.includes('API_KEY') || error?.status === 403 || error?.status === 401 || error?.status === 400) {
       console.error("API Key appears invalid or expired.");
       return t.configureKey;
    }
    
    return t.errorGemini;
  }
};
