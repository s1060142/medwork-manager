import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import { apiGet, apiSend } from '../services/apiClient'
import { getItalianMunicipalities } from '../services/municipalityService'
import { calculateItalianTaxCode } from '../utils/taxCode'
import EmployeeProfileDialog from './EmployeeProfileDialog'

function defaultFormData(fields) {
  return fields.reduce((accumulator, field) => {
    accumulator[field.name] = ''
    return accumulator
  }, {})
}

function isDateString(value) {
  if (typeof value !== 'string') return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && value.includes('T')
}

function displayValue(value) {
  if (value === null || value === undefined) return '-'
  if (Array.isArray(value)) return value.length ? value.join(' • ') : '-'
  if (typeof value === 'boolean') return value ? 'Sì' : 'No'
  if (isDateString(value)) return new Date(value).toLocaleDateString('it-IT')
  return String(value)
}

function keyToLabel(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase())
}

function buildCompositeQuery(config, row) {
  return config.compositeKey
    .map((field) => `${field}=${encodeURIComponent(row[field])}`)
    .join('&')
}

function escapeCsvCell(value) {
  const text = String(value ?? '')
  if (text.includes(';') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function downloadCsv(filename, headers, rows) {
  const csvRows = [headers.map(escapeCsvCell).join(';')]
  rows.forEach((row) => {
    csvRows.push(row.map(escapeCsvCell).join(';'))
  })

  const blob = new Blob([`\uFEFF${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function getOptionLabel(option, field) {
  if (field.optionLabel === 'lastName') {
    const firstName = option.firstName ? `${option.firstName} ` : ''
    return `${firstName}${option.lastName}`.trim()
  }

  if (field.optionLabel === 'address') {
    return `${option.address}${option.city ? ` (${option.city})` : ''}`
  }

  if (field.optionLabel === 'outcome') {
    const dateText = option.visitDate ? ` - ${new Date(option.visitDate).toLocaleDateString('it-IT')}` : ''
    return `${option.outcome}${dateText}`
  }

  return option[field.optionLabel] ?? String(option[field.optionValue])
}

const QUERY_OPERATORS = [
  { value: 'contains', label: 'Contiene' },
  { value: 'equals', label: 'Uguale a' },
  { value: 'startsWith', label: 'Inizia con' },
  { value: 'endsWith', label: 'Finisce con' },
  { value: 'gt', label: 'Maggiore di' },
  { value: 'gte', label: 'Maggiore o uguale' },
  { value: 'lt', label: 'Minore di' },
  { value: 'lte', label: 'Minore o uguale' },
  { value: 'isEmpty', label: 'Vuoto' },
  { value: 'isNotEmpty', label: 'Non vuoto' },
]

function operatorNeedsValue(operator) {
  return operator !== 'isEmpty' && operator !== 'isNotEmpty'
}

function parseComparableValue(value) {
  if (value === null || value === undefined) return null

  if (typeof value === 'number') return value

  const number = Number(value)
  if (!Number.isNaN(number) && String(value).trim() !== '') return number

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) return date.getTime()

  return null
}

function evaluateRule(rawValue, rule) {
  const text = (rawValue ?? '').toString().toLowerCase()
  const rawText = String(rawValue ?? '').trim()
  const query = String(rule.value ?? '').toLowerCase().trim()

  if (rule.operator === 'isEmpty') {
    if (Array.isArray(rawValue)) return rawValue.length === 0
    return rawValue === null || rawValue === undefined || rawText === ''
  }

  if (rule.operator === 'isNotEmpty') {
    if (Array.isArray(rawValue)) return rawValue.length > 0
    return !(rawValue === null || rawValue === undefined || rawText === '')
  }

  if (!query) return true

  if (rule.operator === 'contains') return text.includes(query)
  if (rule.operator === 'equals') return text === query
  if (rule.operator === 'startsWith') return text.startsWith(query)
  if (rule.operator === 'endsWith') return text.endsWith(query)

  const left = parseComparableValue(rawValue)
  const right = parseComparableValue(rule.value)

  if (left === null || right === null) return false

  if (rule.operator === 'gt') return left > right
  if (rule.operator === 'gte') return left >= right
  if (rule.operator === 'lt') return left < right
  if (rule.operator === 'lte') return left <= right

  return true
}

function createQueryRule(columns) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    field: columns[0] || '',
    operator: 'contains',
    value: '',
  }
}

function getDefaultVisibleColumns(config, configuredColumns, fields) {
  const byPriority = (priority) => priority.filter((column) => configuredColumns.includes(column))

  if (config.key === 'employees') {
    const preferred = byPriority([
      'firstName',
      'lastName',
      'taxCode',
      'companyName',
      'branchAddress',
      'jobRole',
      'birthDate',
    ])
    return preferred.slice(0, 6)
  }

  const excludedFieldNames = new Set(
    fields
      .filter((field) => field.type === 'textarea')
      .map((field) => field.name),
  )

  const compactColumns = configuredColumns.filter((column) => !excludedFieldNames.has(column))
  const fallback = compactColumns.length ? compactColumns : configuredColumns
  return fallback.slice(0, 6)
}

function CrudEntityView({
  config,
  currentRole,
  activeCompanyId = '',
  activeBranchId = '',
  externalCreateToken = 0,
  onExternalCreateConsumed,
}) {
  const [rows, setRows] = useState([])
  const [contextEmployees, setContextEmployees] = useState([])
  const [contextBranches, setContextBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [formData, setFormData] = useState(defaultFormData(config.fields))
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [selectOptions, setSelectOptions] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [searchText, setSearchText] = useState('')
  const [municipalities, setMunicipalities] = useState([])
  const [municipalitiesError, setMunicipalitiesError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [successMessage, setSuccessMessage] = useState('')
  const [profileEmployee, setProfileEmployee] = useState(null)
  const [queryRules, setQueryRules] = useState([])

  const canEdit = !config.readOnly && (currentRole === 'Admin' || currentRole === config.role)

  const columns = useMemo(() => {
    if (!rows.length) return []

    const keys = new Set()
    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => keys.add(key))
    })

    return [...keys]
  }, [rows])

  const configuredColumns = useMemo(() => {
    const configuredNames = config.fields.map((field) => field.name)
    const extraColumns = columns.filter((column) => !configuredNames.includes(column))
    return [...configuredNames, ...extraColumns]
  }, [columns, config])

  const defaultColumns = useMemo(
    () => getDefaultVisibleColumns(config, configuredColumns, config.fields),
    [config, configuredColumns],
  )

  const effectiveCompanyId = useMemo(() => {
    if (activeCompanyId && activeCompanyId !== 'all') {
      return String(activeCompanyId)
    }

    if (activeBranchId && activeBranchId !== 'all') {
      const branch = contextBranches.find((item) => Number(item.id) === Number(activeBranchId))
      if (branch?.companyId) {
        return String(branch.companyId)
      }
    }

    return ''
  }, [activeCompanyId, activeBranchId, contextBranches])

  const scopedBranchIds = useMemo(() => {
    if (activeBranchId && activeBranchId !== 'all') {
      return new Set([Number(activeBranchId)])
    }

    if (effectiveCompanyId) {
      return new Set(
        contextBranches
          .filter((item) => Number(item.companyId) === Number(effectiveCompanyId))
          .map((item) => Number(item.id)),
      )
    }

    return new Set(contextBranches.map((item) => Number(item.id)))
  }, [activeBranchId, effectiveCompanyId, contextBranches])

  const scopedEmployeeIds = useMemo(() => {
    const filtered = contextEmployees.filter((item) => {
      if (effectiveCompanyId && Number(item.companyId) !== Number(effectiveCompanyId)) {
        return false
      }

      if (activeBranchId && activeBranchId !== 'all' && Number(item.branchId) !== Number(activeBranchId)) {
        return false
      }

      return true
    })

    return new Set(filtered.map((item) => Number(item.id)))
  }, [contextEmployees, effectiveCompanyId, activeBranchId])

  const scopedRows = useMemo(() => {
    const hasCompanyScope = Boolean(effectiveCompanyId)
    const hasBranchScope = Boolean(activeBranchId && activeBranchId !== 'all')

    if (!hasCompanyScope && !hasBranchScope) {
      return rows
    }

    if (config.key === 'companies') {
      if (hasCompanyScope) {
        return rows.filter((row) => Number(row.id) === Number(effectiveCompanyId))
      }
      return rows
    }

    if (config.key === 'branches') {
      if (hasBranchScope) {
        return rows.filter((row) => Number(row.id) === Number(activeBranchId))
      }
      return rows.filter((row) => Number(row.companyId) === Number(effectiveCompanyId))
    }

    return rows.filter((row) => {
      if (row.companyId !== undefined && row.companyId !== null) {
        return Number(row.companyId) === Number(effectiveCompanyId)
      }

      if (row.branchId !== undefined && row.branchId !== null) {
        if (hasBranchScope) {
          return Number(row.branchId) === Number(activeBranchId)
        }
        return scopedBranchIds.has(Number(row.branchId))
      }

      if (row.employeeId !== undefined && row.employeeId !== null) {
        return scopedEmployeeIds.has(Number(row.employeeId))
      }

      if (config.key === 'employees') {
        return scopedEmployeeIds.has(Number(row.id))
      }

      if (config.key === 'site-visits' && row.workLocationId) {
        return true
      }

      return true
    })
  }, [rows, config.key, effectiveCompanyId, activeBranchId, scopedBranchIds, scopedEmployeeIds])

  const queryFilteredRows = useMemo(() => {
    if (!queryRules.length) return scopedRows

    const activeRules = queryRules.filter((rule) => {
      if (!rule.field) return false
      if (!operatorNeedsValue(rule.operator)) return true
      return String(rule.value ?? '').trim() !== ''
    })

    if (!activeRules.length) return scopedRows

    return scopedRows.filter((row) =>
      activeRules.every((rule) => evaluateRule(row[rule.field], rule)),
    )
  }, [scopedRows, queryRules])

  const filteredRows = useMemo(() => {
    if (!searchText.trim()) return queryFilteredRows
    const needle = searchText.toLowerCase()
    return queryFilteredRows.filter((row) =>
      defaultColumns.some((column) => displayValue(row[column]).toLowerCase().includes(needle)),
    )
  }, [queryFilteredRows, defaultColumns, searchText])

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, page, rowsPerPage])

  const fieldLabels = useMemo(() => {
    return config.fields.reduce((accumulator, field) => {
      accumulator[field.name] = field.label
      return accumulator
    }, {})
  }, [config])

  const loadRows = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet(config.readEndpoint)
      setRows(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSelects = async () => {
    const selectFields = config.fields.filter((field) => field.type === 'select' && field.optionsEndpoint)
    const uniqueEndpoints = [...new Set(selectFields.map((field) => field.optionsEndpoint))]
    const entries = await Promise.all(
      uniqueEndpoints.map(async (endpoint) => {
        const data = await apiGet(endpoint)
        const arrayData = Array.isArray(data) ? data : []

        if (endpoint.includes('/companies')) {
          if (!effectiveCompanyId) return [endpoint, arrayData]
          return [endpoint, arrayData.filter((item) => Number(item.id) === Number(effectiveCompanyId))]
        }

        if (endpoint.includes('/branches')) {
          if (activeBranchId && activeBranchId !== 'all') {
            return [endpoint, arrayData.filter((item) => Number(item.id) === Number(activeBranchId))]
          }

          if (effectiveCompanyId) {
            return [endpoint, arrayData.filter((item) => Number(item.companyId) === Number(effectiveCompanyId))]
          }
        }

        if (endpoint.includes('/employees')) {
          return [endpoint, arrayData.filter((item) => scopedEmployeeIds.has(Number(item.id)))]
        }

        return [endpoint, arrayData]
      }),
    )

    setSelectOptions(Object.fromEntries(entries))
  }

  useEffect(() => {
    loadRows()
  }, [config])

  useEffect(() => {
    Promise.all([
      apiGet('/api/master-data/employees').catch(() => []),
      apiGet('/api/master-data/branches').catch(() => []),
    ]).then(([employeesData, branchesData]) => {
      setContextEmployees(Array.isArray(employeesData) ? employeesData : [])
      setContextBranches(Array.isArray(branchesData) ? branchesData : [])
    })
  }, [])

  useEffect(() => {
    loadSelects().catch(() => {})
  }, [config, effectiveCompanyId, activeBranchId, scopedEmployeeIds])

  useEffect(() => {
    setPage(0)
  }, [searchText, rowsPerPage, config, rows.length, queryRules])

  useEffect(() => {
    if (config.key !== 'employees') {
      setMunicipalities([])
      setMunicipalitiesError('')
      return
    }

    getItalianMunicipalities()
      .then((data) => {
        setMunicipalities(data)
        setMunicipalitiesError('')
      })
      .catch(() => {
        setMunicipalities([])
        setMunicipalitiesError('Database comuni non disponibile al momento. Inserisci il codice manualmente.')
      })
  }, [config])

  useEffect(() => {
    if (!externalCreateToken || !canEdit) return
    openCreate()
    if (typeof onExternalCreateConsumed === 'function') {
      onExternalCreateConsumed()
    }
  }, [externalCreateToken, canEdit])

  const openCreate = () => {
    setEditingRow(null)
    setFormData(defaultFormData(config.fields))
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEdit = (row) => {
    setEditingRow(row)
    const nextData = defaultFormData(config.fields)
    config.fields.forEach((field) => {
      const value = row[field.name]
      if (field.type === 'date' && value) {
        nextData[field.name] = String(value).split('T')[0]
      } else {
        nextData[field.name] = value ?? ''
      }
    })
    setFormData(nextData)
    setFormErrors({})
    setDialogOpen(true)
  }

  const closeDialog = () => {
    if (saving) return
    setDialogOpen(false)
  }

  const handleChange = (field, value) => {
    const nextValue = field.transform ? field.transform(value) : value
    setFormData((current) => {
      if (config.key === 'employees' && field.name === 'companyId') {
        return { ...current, companyId: nextValue, branchId: '' }
      }

      return { ...current, [field.name]: nextValue }
    })
    setFormErrors((current) => ({ ...current, [field.name]: undefined }))
  }

  const handleGenerateTaxCode = () => {
    try {
      const taxCode = calculateItalianTaxCode({
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formData.birthDate,
        gender: formData.gender,
        birthCityCode: formData.birthCityCode,
      })

      setFormData((current) => ({ ...current, taxCode }))
      setFormErrors((current) => ({ ...current, taxCode: undefined }))
    } catch (taxCodeError) {
      setFormErrors((current) => ({ ...current, taxCode: taxCodeError.message }))
    }
  }

  const validateField = (field, value) => {
    const textValue = typeof value === 'string' ? value.trim() : value

    if (field.required && (textValue === '' || textValue === null || textValue === undefined)) {
      return 'Campo obbligatorio.'
    }

    if (typeof textValue === 'string' && field.minLength && textValue.length < field.minLength) {
      return `Minimo ${field.minLength} caratteri.`
    }

    if (typeof textValue === 'string' && field.maxLength && textValue.length > field.maxLength) {
      return `Massimo ${field.maxLength} caratteri.`
    }

    if (typeof textValue === 'string' && textValue && field.pattern && !field.pattern.test(textValue)) {
      return field.patternMessage || 'Formato non valido.'
    }

    if (field.type === 'number' && textValue !== '' && textValue !== null && textValue !== undefined) {
      const numericValue = Number(textValue)
      if (Number.isNaN(numericValue)) {
        return 'Valore numerico non valido.'
      }
      if (typeof field.min === 'number' && numericValue < field.min) {
        return `Valore minimo: ${field.min}.`
      }
      if (typeof field.max === 'number' && numericValue > field.max) {
        return `Valore massimo: ${field.max}.`
      }
    }

    return undefined
  }

  const validateForm = () => {
    const nextErrors = {}
    config.fields.forEach((field) => {
      const error = validateField(field, formData[field.name])
      if (error) {
        nextErrors[field.name] = error
      }
    })

    if (typeof config.customValidate === 'function') {
      const customErrors = config.customValidate(formData)
      Object.assign(nextErrors, customErrors)
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const normalizePayload = () => {
    const payload = {}
    config.fields.forEach((field) => {
      const rawValue = formData[field.name]
      if (field.type === 'number') {
        payload[field.name] = rawValue === '' ? null : Number(rawValue)
      } else if (field.type === 'select') {
        payload[field.name] = field.options ? rawValue : (rawValue === '' ? null : Number(rawValue))
      } else if (field.type === 'date') {
        payload[field.name] = rawValue ? new Date(rawValue).toISOString() : null
      } else {
        payload[field.name] = rawValue === '' ? null : rawValue
      }
    })
    return payload
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = normalizePayload()

      if (editingRow) {
        if (config.compositeKey) {
          const query = buildCompositeQuery(config, editingRow)
          await apiSend('PUT', `${config.updateEndpoint}?${query}`, payload)
        } else {
          await apiSend('PUT', `${config.updateEndpoint}/${editingRow[config.idField]}`, payload)
        }
      } else {
        await apiSend('POST', config.createEndpoint, payload)
      }

      setDialogOpen(false)
      setSuccessMessage(editingRow ? 'Record aggiornato con successo.' : 'Record creato con successo.')
      await loadRows()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setSaving(true)
    setError('')
    try {
      if (config.compositeKey) {
        const query = buildCompositeQuery(config, confirmDelete)
        await apiSend('DELETE', `${config.deleteEndpoint}?${query}`)
      } else {
        await apiSend('DELETE', `${config.deleteEndpoint}/${confirmDelete[config.idField]}`)
      }

      setConfirmDelete(null)
      setSuccessMessage('Record eliminato con successo.')
      await loadRows()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleExportCsv = () => {
    const exportColumns = defaultColumns.length ? defaultColumns : configuredColumns
    const headers = exportColumns.map((column) => fieldLabels[column] || keyToLabel(column))
    const dataRows = filteredRows.map((row) => exportColumns.map((column) => displayValue(row[column])))
    downloadCsv(`${config.key}-export.csv`, headers, dataRows)
    setSuccessMessage('Export CSV completato.')
  }

  const addQueryRule = () => {
    setQueryRules((current) => [...current, createQueryRule(configuredColumns)])
  }

  const removeQueryRule = (id) => {
    setQueryRules((current) => current.filter((rule) => rule.id !== id))
  }

  const updateQueryRule = (id, patch) => {
    setQueryRules((current) =>
      current.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              ...patch,
              value: patch.operator && !operatorNeedsValue(patch.operator) ? '' : (patch.value ?? rule.value),
            }
          : rule,
      ),
    )
  }

  const openProfile = (row) => {
    setProfileEmployee(row)
  }

  const closeProfile = () => {
    setProfileEmployee(null)
  }

  const handleEditFromProfile = (row) => {
    closeProfile()
    openEdit(row)
  }

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3, border: '1px solid #e6ebf2' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6">{config.label}</Typography>
          <Typography variant="body2" color="text.secondary">
            {config.readOnly
              ? 'Vista informativa in sola lettura sincronizzata dal backend.'
              : 'Gestione completa: inserimento, modifica con doppio click sulla riga e cancellazione.'}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.8 }}>
            <Chip size="small" label={`Totale: ${scopedRows.length}`} variant="outlined" />
            <Chip size="small" label={`Filtrati: ${filteredRows.length}`} variant="outlined" />
          </Stack>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={handleExportCsv} disabled={!filteredRows.length}>Export CSV</Button>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nuovo</Button>
          )}
        </Stack>
      </Stack>

      {!canEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {config.readOnly
            ? 'Visualizzazione in sola lettura: questa entita e disponibile solo per consultazione.'
            : `Visualizzazione in sola lettura: per modificare questa entita e richiesto il ruolo ${config.role}.`}
        </Alert>
      )}

      <TextField
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="Cerca nei dati visualizzati..."
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2 }}>
        <Stack spacing={1.2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={0.8}>
              <Typography variant="subtitle2">Filtri avanzati</Typography>
              <Chip size="small" label={`Regole attive: ${queryRules.length}`} variant="outlined" />
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={0.8}>
              <Button size="small" variant="outlined" onClick={addQueryRule}>Aggiungi Filtro</Button>
              <Button size="small" onClick={() => setQueryRules([])}>Reset Filtri</Button>
            </Stack>
          </Stack>

          {queryRules.map((rule) => (
            <Stack key={rule.id} direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField
                select
                size="small"
                label="Campo"
                value={rule.field}
                onChange={(event) => updateQueryRule(rule.id, { field: event.target.value })}
                sx={{ minWidth: { md: 220 } }}
              >
                {configuredColumns.map((column) => (
                  <MenuItem key={column} value={column}>{fieldLabels[column] || keyToLabel(column)}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Operatore"
                value={rule.operator}
                onChange={(event) => updateQueryRule(rule.id, { operator: event.target.value })}
                sx={{ minWidth: { md: 190 } }}
              >
                {QUERY_OPERATORS.map((operator) => (
                  <MenuItem key={operator.value} value={operator.value}>{operator.label}</MenuItem>
                ))}
              </TextField>

              {operatorNeedsValue(rule.operator) && (
                <TextField
                  size="small"
                  label="Valore"
                  value={rule.value}
                  onChange={(event) => updateQueryRule(rule.id, { value: event.target.value })}
                  fullWidth
                />
              )}

              <Button color="error" onClick={() => removeQueryRule(rule.id)}>Rimuovi</Button>
            </Stack>
          ))}
        </Stack>
      </Paper>

      {!!error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredRows.length === 0 ? (
        <Alert severity="info">Nessun dato disponibile.</Alert>
      ) : (
        <TableContainer sx={{ borderRadius: 2, border: '1px solid #e6ebf2', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f7f9fc' }}>
                {(defaultColumns.length ? defaultColumns : configuredColumns).map((column) => (
                  <TableCell key={column}>{fieldLabels[column] || keyToLabel(column)}</TableCell>
                ))}
                {(canEdit || config.key === 'employees') && <TableCell align="right">Azioni</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedRows.map((row, index) => (
                <TableRow
                  key={
                    config.compositeKey
                      ? config.compositeKey.map((field) => row[field]).join('-')
                      : row[config.idField] ?? index
                  }
                  hover
                  onDoubleClick={canEdit ? () => openEdit(row) : undefined}
                  sx={canEdit ? { cursor: 'pointer' } : undefined}
                >
                  {(defaultColumns.length ? defaultColumns : configuredColumns).map((column) => (
                    <TableCell key={`${index}-${column}`}>{displayValue(row[column])}</TableCell>
                  ))}
                  {(canEdit || config.key === 'employees') && (
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        {config.key === 'employees' && (
                          <Button size="small" variant="outlined" onClick={() => openProfile(row)}>Profilo</Button>
                        )}
                        {canEdit && <Button size="small" color="error" variant="outlined" onClick={() => setConfirmDelete(row)}>Elimina</Button>}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Righe per pagina"
            sx={{
              '& .MuiTablePagination-toolbar': {
                flexWrap: 'wrap',
                rowGap: 0.5,
                px: { xs: 1, sm: 2 },
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                m: 0,
              },
            }}
          />
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>{editingRow ? `Modifica ${config.label}` : `Nuovo ${config.label}`}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Compila i campi richiesti. Le validazioni vengono applicate prima del salvataggio.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {config.fields.map((field) => {
              if (field.hiddenInForm) {
                return null
              }

              if (config.key === 'employees' && field.name === 'birthCity') {
                const selectedMunicipality = municipalities.find(
                  (item) =>
                    item.cadastralCode === formData.birthCityCode ||
                    item.name.toLowerCase() === String(formData.birthCity || '').toLowerCase(),
                ) || null

                return (
                  <Autocomplete
                    key={field.name}
                    options={municipalities}
                    value={selectedMunicipality}
                    onChange={(_, value) => {
                      if (!value) {
                        handleChange(field, '')
                        return
                      }

                      handleChange(field, value.name)
                      setFormData((current) => ({
                        ...current,
                        birthCity: value.name,
                        birthCityCode: value.cadastralCode,
                      }))
                      setFormErrors((current) => ({
                        ...current,
                        birthCity: undefined,
                        birthCityCode: undefined,
                      }))
                    }}
                    onInputChange={(_, inputValue, reason) => {
                      if (reason === 'input') {
                        handleChange(field, inputValue)
                      }
                    }}
                    getOptionLabel={(option) =>
                      typeof option === 'string'
                        ? option
                        : `${option.name}${option.provinceCode ? ` (${option.provinceCode})` : ''}`
                    }
                    isOptionEqualToValue={(option, value) => option.cadastralCode === value.cadastralCode}
                    filterOptions={(options, state) => {
                      const query = state.inputValue.trim().toLowerCase()
                      if (!query) return options
                      return options
                        .filter(
                          (item) =>
                            item.name.toLowerCase().includes(query) ||
                            (item.provinceCode || '').toLowerCase().includes(query),
                        )
                    }}
                    noOptionsText="Nessun comune trovato"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={field.label}
                        required={field.required}
                        fullWidth
                        placeholder="Cerca comune..."
                        error={Boolean(formErrors[field.name])}
                        helperText={formErrors[field.name] || municipalitiesError || 'Selezionando un comune, il codice viene compilato automaticamente in background.'}
                      />
                    )}
                  />
                )
              }

              if (field.type === 'select') {
                const options = field.options || selectOptions[field.optionsEndpoint] || []
                const filteredOptions =
                  config.key === 'employees' && field.name === 'branchId' && formData.companyId
                    ? options.filter((option) => Number(option.companyId) === Number(formData.companyId))
                    : options
                return (
                  <TextField
                    key={field.name}
                    select
                    label={field.label}
                    value={formData[field.name] ?? ''}
                    onChange={(event) => handleChange(field, event.target.value)}
                    required={field.required}
                    fullWidth
                    error={Boolean(formErrors[field.name])}
                    helperText={formErrors[field.name]}
                  >
                    <MenuItem value="">Seleziona...</MenuItem>
                    {filteredOptions.map((option) => {
                      const value = field.options ? option.value : option[field.optionValue]
                      const label = field.options ? option.label : getOptionLabel(option, field)
                      return (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    )})}
                  </TextField>
                )
              }

              if (config.key === 'employees' && field.name === 'taxCode') {
                return (
                  <Stack key={field.name} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="flex-start">
                    <TextField
                      label={field.label}
                      value={formData[field.name] ?? ''}
                      onChange={(event) => handleChange(field, event.target.value)}
                      required={field.required}
                      fullWidth
                      placeholder={field.placeholder}
                      type="text"
                      inputProps={{ maxLength: field.maxLength }}
                      error={Boolean(formErrors[field.name])}
                      helperText={formErrors[field.name]}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<AutoFixHighIcon />}
                      onClick={handleGenerateTaxCode}
                      sx={{ minWidth: { xs: '100%', md: 240 }, height: 56 }}
                    >
                      Calcola Codice Fiscale
                    </Button>
                  </Stack>
                )
              }

              return (
                <TextField
                  key={field.name}
                  label={field.label}
                  value={formData[field.name] ?? ''}
                  onChange={(event) => handleChange(field, event.target.value)}
                  required={field.required}
                  fullWidth
                  placeholder={field.placeholder}
                  type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                  multiline={field.type === 'textarea'}
                  minRows={field.type === 'textarea' ? 3 : undefined}
                  InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                  inputProps={{ maxLength: field.maxLength, min: field.min, max: field.max }}
                  error={Boolean(formErrors[field.name])}
                  helperText={formErrors[field.name]}
                  sx={field.type === 'textarea' ? { gridColumn: { xs: '1 / -1', md: '1 / -1' } } : undefined}
                />
              )
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>Annulla</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <Typography>Questa operazione non può essere annullata. Vuoi continuare?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} disabled={saving}>Annulla</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={saving}>
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={2500}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />

      {config.key === 'employees' && (
        <EmployeeProfileDialog
          open={Boolean(profileEmployee)}
          onClose={closeProfile}
          employee={profileEmployee}
          onEditEmployee={handleEditFromProfile}
        />
      )}
    </Paper>
  )
}

export default CrudEntityView
