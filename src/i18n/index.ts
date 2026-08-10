import { ar, type Translations } from './ar'

const translations: Record<string, Translations> = {
  ar,
  // en: enTranslations, // Future: add English
}

export function getTranslation(lang: string = 'ar'): Translations {
  return translations[lang] || ar
}

export { ar }
export type { Translations }
