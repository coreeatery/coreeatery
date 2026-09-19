import i18n from 'i18next'
import { normalizeLanguage } from './content'
export const LANGUAGE_LOCALES = {
  id: 'id-ID',
  en: 'en-US',
  zh: 'zh-CN',
}

export function getLocale(
  language = i18n.resolvedLanguage || i18n.language || 'id',
) {
  return LANGUAGE_LOCALES[normalizeLanguage(language)]
}

export function getLanguageFromI18n(i18n) {
  return normalizeLanguage(i18n?.resolvedLanguage || i18n?.language)
}
