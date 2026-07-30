export function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('it-IT')
}

export function formatCurrency(value) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
}

export function getStatusColor(status) {
  switch (status) {
    case 'Bozza': return 'default'
    case 'DaInviare': return 'info'
    case 'Inviata': return 'primary'
    case 'Accettata': return 'success'
    case 'Scartata': return 'error'
    case 'Consegnata': return 'success'
    case 'NonConsegnata': return 'warning'
    case 'DecorrenzaTermini': return 'warning'
    case 'ErroreInvio': return 'error'
    case 'Attivo': return 'success'
    case 'Inattivo': return 'default'
    case 'Scaduto': return 'warning'
    default: return 'default'
  }
}

export function getDocTypeLabel(type) {
  const types = {
    'TD01': 'Fattura',
    'TD02': 'Acconto',
    'TD03': 'Acconto su fattura',
    'TD04': 'Nota di credito',
    'TD05': 'Nota di debito',
    'TD06': 'Parcellazione',
  }
  return types[type] || type
}

export function parseLinesJson(json) {
  try {
    return JSON.parse(json || '[]')
  } catch {
    return []
  }
}