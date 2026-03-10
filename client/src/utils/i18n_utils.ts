import React from 'react';
import lang_data from '../locales/lang.json';
import { F_Get_Preference, F_Set_Preference } from './storage_utils';

type Language_Type = 'tr' | 'en';

const DEFAULT_LANGUAGE: Language_Type = 'tr';
const FALLBACK_CHAIN: Language_Type[] = ['tr', 'en'];
const LANGUAGE_CHANGE_EVENT = 'kabak_ai_language_change';
const STORAGE_LANG_KEY = 'kabak_ai_lang';

const F_Read_Path = (obj: unknown, keys: string[]): string | null => {
  let current: any = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
      continue;
    }
    return null;
  }

  return typeof current === 'string' ? current : null;
};

export const F_Get_Language = (): Language_Type => {
  const saved_lang = F_Get_Preference('lang');
  if (saved_lang === 'tr' || saved_lang === 'en') {
    return saved_lang;
  }

  const browser_lang = navigator.language.substring(0, 2).toLowerCase();
  return browser_lang === 'tr' ? 'tr' : DEFAULT_LANGUAGE;
};

export const F_Set_Language = (p_language: Language_Type): void => {
  F_Set_Preference('lang', p_language);
  window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: p_language }));
};

export const F_Get_Text = (p_key_path: string, p_language?: Language_Type): string => {
  const keys = p_key_path.split('.');
  const current_lang = p_language || F_Get_Language();

  const language_order: Language_Type[] = [
    current_lang,
    ...FALLBACK_CHAIN.filter((lang) => lang !== current_lang),
  ];

  for (const lang of language_order) {
    const translation = F_Read_Path((lang_data as any)[lang], keys);
    if (translation) {
      return translation;
    }
  }

  return p_key_path;
};

export const F_Use_Language = (): Language_Type => {
  const [current_lang, set_current_lang] = React.useState<Language_Type>(F_Get_Language());

  React.useEffect(() => {
    const F_Handle_Change = () => set_current_lang(F_Get_Language());
    const F_Handle_Storage = (event: StorageEvent) => {
      if (event.key === STORAGE_LANG_KEY) {
        set_current_lang(F_Get_Language());
      }
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, F_Handle_Change);
    window.addEventListener('storage', F_Handle_Storage);
    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, F_Handle_Change);
      window.removeEventListener('storage', F_Handle_Storage);
    };
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = current_lang;
  }, [current_lang]);

  return current_lang;
};
