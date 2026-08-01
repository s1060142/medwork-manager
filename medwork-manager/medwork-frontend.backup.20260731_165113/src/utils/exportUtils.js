import * as XLSX from 'xlsx'

/**
 * Converte un array di oggetti in CSV (separatore ';' per Excel italiano).
 * @param {Array<Object>} rows
 * @param {string[]} columns colonne da esportare (chiavi di row)
 * @param {string} filename
 */
export function exportToCsv(rows, columns, filename) {
  if (!rows || rows.length === 0) {
    // eslint-disable-next-line no-alert
    alert('Nessun dato da esportare.')
    return
  }

  const header = columns.join(';')
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const value = row[col]
          if (value === null || value === undefined) return ''
          const text = String(value).replace(/;/g, ',').replace(/\r?\n/g, ' ')
          return `"${text}"`
        })
        .join(';'),
    )
    .join('\r\n')

  const csv = `${header}\r\n${body}`
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename)
}

/**
 * Esporta un array di oggetti in un file .xlsx (multi-foglio opzionale).
 * @param {Array<{ name: string, rows: Array<Object>, columns: string[] }>} sheets
 * @param {string} filename
 */
export function exportToExcel(sheets, filename) {
  if (!sheets || sheets.length === 0) return

  const workbook = XLSX.utils.book_new()

  sheets.forEach((sheet) => {
    const rows = sheet.rows || []
    const columns = sheet.columns || (rows[0] ? Object.keys(rows[0]) : [])
    const data = [columns, ...rows.map((row) => columns.map((col) => row[col] ?? ''))]
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    worksheet['!cols'] = columns.map((c) => ({ wch: Math.max(12, String(c).length + 2) }))
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31))
  })

  const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  triggerDownload(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename)
}

/**
 * Genera un file iCalendar (.ics) da una lista di appuntamenti.
 * @param {Array<{ title: string, start: Date|string, end?: Date|string, description?: string, location?: string }>} events
 * @param {string} filename
 */
export function exportToIcs(events, filename = 'scadenze.ics') {
  if (!events || events.length === 0) {
    // eslint-disable-next-line no-alert
    alert('Nessun appuntamento da esportare.')
    return
  }

  const pad = (n) => String(n).padStart(2, '0')
  const toIcsDate = (value) => {
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  }

  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MedWork//Scadenzario//IT', 'CALSCALE:GREGORIAN']
  events.forEach((event, index) => {
    const start = toIcsDate(event.start)
    const end = event.end ? toIcsDate(event.end) : null
    if (!start) return
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:medwork-${index}-${start}@medwork`)
    lines.push(`DTSTAMP:${start}`)
    lines.push(`DTSTART:${start}`)
    if (end) lines.push(`DTEND:${end}`)
    lines.push(`SUMMARY:${escapeIcs(event.title || 'Scadenza')}`)
    if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`)
    if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`)
    lines.push('END:VEVENT')
  })
  lines.push('END:VCALENDAR')

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' })
  triggerDownload(blob, filename)
}

function escapeIcs(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
