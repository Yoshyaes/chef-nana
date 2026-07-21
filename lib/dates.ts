// A plain 'YYYY-MM-DD' string for the given date in the caller's local
// timezone, matching what <input type="date"> produces and what a Postgres
// `date` column stores. Date#toISOString() is UTC-based and rolls over to
// the next calendar day hours before local midnight for negative-UTC-offset
// users, which silently mismatches local due dates if used for "today".
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
