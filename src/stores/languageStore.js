import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations } from '../lib/translations';

const useLanguageStore = create(
  persist(
    (set, get) => ({
      language: 'ar', // Default to Arabic

      setLanguage: (lang) => {
        set({ language: lang });
        // Update HTML attributes
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      },

      t: (path) => {
        const lang = get().language;
        const keys = path.split('.');
        let result = translations[lang];

        for (const key of keys) {
          if (result && result[key]) {
            result = result[key];
          } else {
            // Fallback to key itself if not found
            return path;
          }
        }

        return result;
      },

      isRTL: () => get().language === 'ar'
    }),
    {
      name: 'zein-language-storage',
      // Ensure we apply the HTML attributes on rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.lang = state.language;
          document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
        }
      }
    }
  )
);

export default useLanguageStore;
