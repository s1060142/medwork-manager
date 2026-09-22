/**
 * Global Notification System for MedWork Manager.
 * Replaces native browser alert() popups with elegant graphical Material-UI alerts / snackbars.
 */

export function showNotification(message, severity = 'info') {
  if (typeof window === 'undefined') return

  const cleanMessage =
    typeof message === 'string'
      ? message
      : message?.message || (typeof message === 'object' ? JSON.stringify(message) : String(message))

  const cleanSeverity = ['success', 'error', 'info', 'warning'].includes(severity)
    ? severity
    : 'info'

  window.dispatchEvent(
    new CustomEvent('medwork:notify', {
      detail: {
        message: cleanMessage,
        severity: cleanSeverity,
      },
    })
  )
}

// Global safety interceptor: automatically redirects any legacy window.alert calls
// to the graphical notification toast system across all modules.
if (typeof window !== 'undefined') {
  window.alert = (msg) => {
    const text =
      typeof msg === 'string'
        ? msg
        : msg?.message || (typeof msg === 'object' ? JSON.stringify(msg) : String(msg))

    const lower = text.toLowerCase()
    const severity =
      lower.includes('errore') || lower.includes('fallit') || lower.includes('error') || lower.includes('failed')
        ? 'error'
        : lower.includes('success') || lower.includes('correttamente') || lower.includes('completat')
        ? 'success'
        : lower.includes('attenzione') || lower.includes('warning')
        ? 'warning'
        : 'info'

    showNotification(text, severity)
  }
}
