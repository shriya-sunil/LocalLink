import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

export const LanguageSwitcher: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  if (variant === 'full') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {LANGUAGES.map((lang) => {
          const active = i18n.language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`p-3 rounded-2xl border text-center transition-all ${
                active
                  ? 'border-teal bg-teal-light text-teal-dark font-bold ring-2 ring-teal shadow-sm'
                  : 'border-sage-border bg-white text-navy font-medium hover:bg-sage-light'
              }`}
            >
              <div className="text-sm">{lang.native}</div>
              <div className="text-xs text-gray-500 mt-0.5">{lang.label}</div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-full hover:bg-white/10 text-white flex items-center gap-1 text-xs font-semibold"
        aria-label="Switch Language"
        title="Language / भाषा / ಭಾಷೆ"
      >
        <Globe size={18} />
        <span className="uppercase text-[11px] font-bold">{currentLang.code}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-sage-border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {LANGUAGES.map((lang) => {
            const active = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-sage-light transition-colors ${
                  active ? 'font-bold text-teal bg-teal-light/50' : 'text-navy'
                }`}
              >
                <div>
                  <span className="font-semibold block">{lang.native}</span>
                  <span className="text-[10px] text-gray-500">{lang.label}</span>
                </div>
                {active && <Check size={14} className="text-teal" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
