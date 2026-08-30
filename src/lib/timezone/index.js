export const APP_TIMEZONE = 'Asia/Jakarta'

export function formatDateTime(value, options = {}) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: APP_TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(new Date(value))
}
