
import React from 'react';
import { ShieldAlert, Lock } from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface BannedViewProps {
  lang: Language;
}

export const BannedView: React.FC<BannedViewProps> = ({ lang }) => {
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6 text-center">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1a0505] to-black opacity-80 pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full animate-fade-in-up">
          <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-[#E50914]/10 border-2 border-[#E50914] flex items-center justify-center shadow-[0_0_30px_rgba(229,9,20,0.3)]">
                  <Lock className="w-10 h-10 text-[#E50914]" />
              </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4 uppercase tracking-wide">
              {t.accessRestricted}
          </h1>
          
          <div className="bg-[#1f1f1f] border border-white/10 rounded-lg p-6 shadow-2xl">
              <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 text-left">
                      <ShieldAlert className="w-6 h-6 text-[#E50914] shrink-0 mt-0.5" />
                      <div>
                          <p className="text-gray-200 font-medium leading-relaxed">
                              {t.banMessage}
                          </p>
                      </div>
                  </div>
                  
                  <div className="h-px bg-white/10 w-full my-1"></div>
                  
                  <p className="text-sm text-gray-500 italic">
                      {t.banSubMessage}
                  </p>
              </div>
          </div>

          <div className="mt-8">
              <span className="text-xs text-[#E50914] font-bold tracking-[0.2em] uppercase opacity-70">
                  MEDIA HUB SECURITY
              </span>
          </div>
      </div>
    </div>
  );
};
