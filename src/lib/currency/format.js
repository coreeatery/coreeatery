import { getLocale } from '../i18n/locale'

export function formatCurrency(value) {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}
