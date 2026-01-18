
import { GoogleGenAI } from "@google/genai";
import { Movie } from "../types";
import { Language, translations } from "../utils/translations";

export const getMovieChatResponse = async (movie: Movie, userMessage: string, lang: Language): Promise<string> => {
  const t = translations[lang];
  
  // Надійний спосіб отримання ключа в браузерному середовищі Telegram
  const apiKey = (window as any).process?.env?.API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Gemini API Key is missing in environment.");
    return t.configureKey;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Використовуємо стабільну модель згідно з гайдлайнами
    const modelId = 'gemini-3-flash-preview';
    
    const langInstruction = lang === 'uk' ? "Відповідай українською мовою." : lang === 'ru' ? "Отвечай на русском языке." : "Respond in English.";

    const systemInstruction = `You are a movie expert for Media Hub app. 
You are discussing: ${movie.title} (${movie.year}).
Genre: ${movie.genre.join(', ')}. Rating: ${movie.rating}.
Movie description: ${movie.description}.

Your rules:
- ${langInstruction}
- Be very brief and friendly (max 25 words).
- Give interesting facts or advice related to this movie.`;

    // Використовуємо коректну структуру contents: [{ parts: [{ text: "..." }] }]
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    if (response && response.text) {
      return response.text.trim();
    }
    
    return t.noResponse;
  } catch (error: any) {
    console.error("Detailed Gemini API Error:", error);
    
    // Якщо помилка пов'язана з ключем або доступом
    const errorMsg = error?.toString() || "";
    if (errorMsg.includes("403") || errorMsg.includes("401") || errorMsg.includes("API_KEY")) {
      return t.configureKey;
    }
    
    // Для всіх інших помилок (мережеві, обмеження моделі тощо)
    return t.errorGemini;
  }
};
