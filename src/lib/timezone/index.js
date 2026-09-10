import { getLocale } from '../i18n/locale'

export function formatDateTime(value, language = 'id') {
  if (!value) return '-'

  return new Intl.DateTimeFormat(getLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

export function formatDate(value, language = 'id') {
  if (!value) return '-'

  return new Intl.DateTimeFormat(getLocale(language), {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}
