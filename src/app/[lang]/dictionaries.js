import 'server-only';

const dictionaries = {
  es: () => import('./dictionaries/es.json').then((m) => m.default),
  en: () => import('./dictionaries/en.json').then((m) => m.default),
};

export const SUPPORTED_LOCALES = Object.keys(dictionaries);
export const DEFAULT_LOCALE = 'es';

export const hasLocale = (locale) => locale in dictionaries;

export const getDictionary = async (locale) => dictionaries[locale]();
