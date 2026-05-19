import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';

const languages = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);

  useEffect(() => {
    const saved = localStorage.getItem('language');
    if (saved) {
      const found = languages.find(l => l.code === saved);
      if (found) setCurrentLang(found);
    }
  }, []);

  const selectLang = (lang: typeof languages[0]) => {
    setCurrentLang(lang);
    localStorage.setItem('language', lang.code);
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <span className="text-sm font-medium">{currentLang.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 bg-black rounded-xl shadow-2xl border border-gray-800 py-4 min-w-[280px] z-50"
          >
            <div className="px-4 pb-3 border-b border-gray-800">
              <h3 className="text-white font-semibold text-lg">SELECT LANGUAGE</h3>
            </div>
            <div className="pt-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => selectLang(lang)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className={`text-sm ${currentLang.code === lang.code ? 'text-white font-semibold' : 'text-gray-300'}`}>
                      {lang.name}
                    </span>
                  </div>
                  {currentLang.code === lang.code && (
                    <Check className="w-5 h-5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
