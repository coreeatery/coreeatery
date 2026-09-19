export function normalizeLanguage(language) {
  const normalized = String(language || 'id').trim().toLowerCase().split('-')[0]

  return ['id', 'en', 'zh'].includes(normalized) ? normalized : 'id'
}

export function pickLocalized(row, field, language) {
  if (!row || !field) return ''

  const suffix = normalizeLanguage(language)
  const values = [
    row[`${field}_${suffix}`],
    row[`${field}_id`],
    row[field],
  ]
  const value = values.find((candidate) => {
    if (candidate == null) return false
    return typeof candidate !== 'string' || candidate.trim() !== ''
  })

  return value == null ? '' : String(value)
}
