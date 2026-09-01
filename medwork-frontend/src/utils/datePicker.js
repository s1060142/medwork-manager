import { parseISO, format as formatDateFns } from 'date-fns'
import { it } from 'date-fns/locale'

/**
 * Convert a value coming from a form state (typically a `yyyy-MM-dd` string
 * or `null`) into a `Date` object suitable for `@mui/x-date-pickers`.
 * Returns `null` for empty / invalid values.
 */
export function currentDateValue(value) {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const parsed = parseISO(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Convert a `Date` (or `null`) coming from a `@mui/x-date-pickers` callback
 * back into the `yyyy-MM-dd` string used in form state and stored on the
 * backend. Returns `''` when the date is null/invalid.
 */
export function formDateValue(dateValue) {
  if (!dateValue) return ''
  if (Number.isNaN(dateValue.getTime())) return ''
  return formatDateFns(dateValue, 'yyyy-MM-dd')
}

/**
 * Format a date value for display. Accepts Date objects, ISO strings, or null.
 * Returns a formatted string using dd/MM/yyyy format, or empty string for invalid values.
 */
export function formatDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : parseISO(String(value))
  if (Number.isNaN(date.getTime())) return ''
  return formatDateFns(date, 'dd/MM/yyyy')
}

/** Italian locale used by every DatePicker in the app. */
export const DATE_PICKER_LOCALE = it

/**
 * Returns the number of days between today and the given target date.
 * Positive = future, negative = past, 0 = today.
 */
export function daysDiffFromToday(targetDate) {
  const date = targetDate instanceof Date ? targetDate : parseISO(String(targetDate || ''))
  if (Number.isNaN(date.getTime())) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}
