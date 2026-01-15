
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Plus, ThumbsUp, Volume2, MessageSquare, Send } from 'lucide-react';
import { Movie, ChatMessage } from '../types';
import { getMovieChatResponse } from '../services/geminiService';
import { Language, translations } from '../utils/translations';

interface ModalProps {
  movie: Movie | null;
  onClose: () => void;
  lang: Language;
}

export const Modal: React.FC<ModalProps> = ({ movie, onClose, lang }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    if (movie) {
      const timer = setTimeout(() => setIsVisible(true), 50);

      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            tg.BackButton.show();
            tg.BackButton.onClick(handleClose);
            tg.HapticFeedback.impactOccurred('light');
        }
      }

      return () => {
        clearTimeout(timer);
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            tg.BackButton.offClick(handleClose);
            tg.BackButton.hide();
          }
        }
      };
    }
  }, [movie]);

  useEffect(() => {
    if (showChat && messages.length === 0) {
        setMessages([{ role: 'model', text: `${t.aiIntro} ${movie?.title}.` }]);
    }
  }, [showChat, movie, messages.length, t.aiIntro]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!movie) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    if (window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
       window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    const userMsg = chatInput;
    setChatInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const aiResponse = await getMovieChatResponse(movie, userMsg, lang);
    
    if (window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
       window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center pointer-events-auto">
      <div 
        className={`
          absolute inset-0 bg-black/80 md:bg-black/70 backdrop-blur-sm 
          transition-opacity duration-500 ease-in-out
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleClose}
      />

      <div 
        className={`
          relative w-full h-[95vh] md:h-auto md:max-h-[90vh] md:max-w-4xl 
          bg-[#141414] rounded-t-2xl md:rounded-lg overflow-hidden shadow-2xl 
          transform transition-all duration-500 ease-expo-out
          flex flex-col
          ${isVisible 
            ? 'translate-y-0 scale-100 opacity-100' 
            : 'translate-y-full md:translate-y-12 md:scale-95 opacity-0'
          }
        `}
      >
        <button 
          onClick={handleClose}
          className={`
            absolute top-4 right-4 z-50 h-9 w-9 rounded-full bg-[#181818]/80 md:bg-black/60 
            grid place-items-center hover:bg-[#2a2a2a] backdrop-blur-md
            transition-all duration-500 delay-200
            ${isVisible ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}
          `}
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="overflow-y-auto overflow-x-hidden h-full no-scrollbar">
            <div className="relative pt-[70%] md:pt-[56.25%] shrink-0 overflow-hidden bg-[#0a0a0a]">
              <div className="absolute top-0 left-0 w-full h-full">
                <img 
                  src={movie.bannerUrl} 
                  alt={movie.title} 
                  className={`
                    w-full h-full object-cover transition-transform duration-1000 ease-out
                    ${isVisible ? 'scale-100' : 'scale-110'}
                  `} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
              </div>
              
              <div 
                className={`
                    absolute bottom-0 left-0 w-full p-6 md:p-10 space-y-4 md:space-y-6
                    transition-all duration-700 delay-100 ease-out
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
              >
                <h2 className="text-4xl md:text-5xl font-bold text-shadow-lg">{movie.title}</h2>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                  <button className="flex-shrink-0 flex items-center justify-center gap-2 px-6 md:px-8 py-2 md:py-2.5 bg-white text-black font-bold rounded-[4px] hover:bg-white/90 transition active:scale-95">
                    <Play className="w-6 h-6 fill-black" />
                    {t.play}
                  </button>
                  <button className="flex-shrink-0 flex items-center justify-center w-10 h-10 border-2 border-gray-500 rounded-full hover:border-white text-gray-300 hover:text-white transition bg-black/40">
                    <Plus className="w-5 h-5" />
                  </button>
                  <button className="flex-shrink-0 flex items-center justify-center w-10 h-10 border-2 border-gray-500 rounded-full hover:border-white text-gray-300 hover:text-white transition bg-black/40">
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowChat(!showChat)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border-2 transition ml-auto md:ml-0 ${showChat ? 'bg-purple-600 border-purple-600 text-white' : 'border-purple-500 text-purple-400 bg-black/40'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="md:inline">{t.aiChat}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={`
                px-6 md:px-10 py-6 md:py-8 grid md:grid-cols-[2fr_1fr] gap-6 md:gap-8 pb-24 md:pb-8 bg-[#141414]
                transition-all duration-700 delay-200 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}>
                {!showChat ? (
                    <>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm md:text-lg flex-wrap">
                            <span className="text-green-500 font-bold">{movie.match}% {t.match}</span>
                            <span>{movie.year}</span>
                            <span className="bg-gray-700 px-1.5 rounded text-xs border border-gray-500/50">{movie.rating}</span>
                            <span>{movie.duration}</span>
                            <span className="border border-white/40 px-1.5 rounded text-xs text-white/80">HD</span>
                        </div>
                        <p className="text-base md:text-lg leading-relaxed text-gray-300">
                            {movie.description}
                        </p>
                    </div>
                    <div className="text-sm space-y-3 text-gray-400">
                        <div>
                            <span className="text-gray-500">{t.genres}:</span> <span className="text-white block md:inline">{movie.genre.join(', ')}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">{t.originalLanguage}:</span> <span className="text-white">English</span>
                        </div>
                        <div>
                            <span className="text-gray-500">{t.totalVotes}:</span> <span className="text-white">1.2M</span>
                        </div>
                    </div>
                    </>
                ) : (
                    <div className="col-span-2 h-[400px] md:h-[300px] flex flex-col bg-[#222] rounded-lg border border-gray-800">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg text-sm animate-pulse">
                                        {t.thinking}
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-3 border-t border-gray-700 bg-[#222] flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 bg-[#111] text-white px-4 py-3 rounded-full border border-gray-600 focus:outline-none focus:border-purple-500 text-sm"
                                placeholder={t.askGemini}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button 
                                onClick={handleSendMessage}
                                className="bg-purple-600 p-3 rounded-full hover:bg-purple-700 transition disabled:opacity-50 flex-shrink-0"
                                disabled={isLoading}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
