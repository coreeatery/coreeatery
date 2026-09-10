import i18n from 'i18next'
export const LANGUAGE_LOCALES = {
  id: 'id-ID',
  en: 'en-US',
  zh: 'zh-CN',
}

export function getLocale(
  language = i18n.resolvedLanguage || i18n.language || 'id',
) {
  return LANGUAGE_LOCALES[language] ?? LANGUAGE_LOCALES.id
}

export function getLanguageFromI18n(i18n) {
  const language = i18n?.resolvedLanguage || i18n?.language || 'id'
  return language.split('-')[0]
}
