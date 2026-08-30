import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
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
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CloseIcon from '@mui/icons-material/Close'
import { apiGet, apiSend } from '../services/apiClient'
import { getItalianMunicipalities } from '../services/municipalityService'
import { calculateItalianTaxCode } from '../utils/taxCode'
import { downloadCsv } from '../utils/csv'
import EmployeeProfileDialog from './EmployeeProfileDialog'

function defaultFormData(fields) {
  return fields.reduce((accumulator, field) => {
    accumulator[field.name] = field.defaultValue ?? ''
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

function getItalianArticle(word, isDefinite = true) {
  if (!word) return isDefinite ? "l'" : 'un'
  const lower = word.toLowerCase()
  if (isDefinite) {
    if (/^[aeiou]/.test(lower)) return "l'"
    if (lower.endsWith('a')) return 'la'
    if (lower.endsWith('e')) return 'la'
    if (lower.endsWith('i')) return 'i'
    if (lower.endsWith('o')) return 'il'
    if (lower.endsWith('u')) return 'lo'
    return 'il'
  }
  if (/^[aeiou]/.test(lower)) return "un'"
  if (lower.endsWith('a')) return 'una'
  if (lower.endsWith('e')) return 'una'
  if (lower.endsWith('i')) return 'dei'
  if (lower.endsWith('o')) return 'un'
  if (lower.endsWith('u')) return 'uno'
  return 'un'
}

function CrudEntityView({
  config,
  currentRole,
  activeCompanyId = '',
  activeBranchId = '',
  externalCreateToken = 0,
  onExternalCreateConsumed,
  onOpenCompanyProfile,
  hiddenUI = false,
  onCreated,
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
  const [profileCompany, setProfileCompany] = useState(null)
  const [queryRules, setQueryRules] = useState([])
  const [dirty, setDirty] = useState(false)
  const markDirty = (updater) => {
    setDirty(true)
    setFormData(updater)
  }

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
          return [endpoint, arrayData]
        }

        if (endpoint.includes('/branches')) {
          if (activeBranchId && activeBranchId !== 'all') {
            return [endpoint, arrayData.filter((item) => Number(item.id) === Number(activeBranchId))]
          }

          if (effectiveCompanyId) {
            return [endpoint, arrayData.filter((item) => Number(item.companyId) === Number(effectiveCompanyId))]
          }

          return [endpoint, []]
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
    if (hiddenUI) return
    loadRows()
  }, [config, hiddenUI])

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
    setDirty(false)
    setDialogOpen(true)
  }

  const openEdit = (row) => {
    setEditingRow(row)
    setFormData(
      config.fields.reduce((accumulator, field) => {
        accumulator[field.name] = row[field.name]
        return accumulator
      }, {}),
    )
    setFormErrors({})
    setDirty(false)
    setDialogOpen(true)
  }

  const handleDelete = async (row) => {
    setConfirmDelete(row)
  }

  const confirmClose = () => {
    if (!dirty) return closeForm()
    const ok = window.confirm('Hai modifiche non salvate. Chiudere comunque?')
    if (ok) closeForm()
  }

  const closeForm = () => {
    setDialogOpen(false)
    setEditingRow(null)
    setFormData(defaultFormData(config.fields))
    setFormErrors({})
    setDirty(false)
  }

  const confirmDeleteRow = async () => {
    if (!confirmDelete || !config.deleteEndpoint) return

    try {
      setSaving(true)

      let deletePayload
      if (config.compositeKey && config.compositeKey.length) {
        deletePayload = buildCompositeQuery(config, confirmDelete)
      } else if (config.idField && confirmDelete[config.idField] != null) {
        const idValue = confirmDelete[config.idField]
        const deleteUrl = `${config.deleteEndpoint}/${encodeURIComponent(idValue)}`
        await apiSend('DELETE', deleteUrl)
        setRows((current) => current.filter((row) => row !== confirmDelete))
        setSuccessMessage('Elemento eliminato correttamente.')
        setSaving(false)
        setConfirmDelete(null)
        return
      } else {
        deletePayload = ''
      }

      if (deletePayload) {
        await apiSend('DELETE', `${config.deleteEndpoint}?${deletePayload}`)
      } else {
        await apiSend('DELETE', config.deleteEndpoint)
      }

      setRows((current) => current.filter((row) => row !== confirmDelete))
      setSuccessMessage('Elemento eliminato correttamente.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
      setConfirmDelete(null)
    }
  }

  const handleSave = async () => {
    const errors = config.customValidate ? config.customValidate(formData) : {}
    const requiredErrors = config.fields.reduce((accumulator, field) => {
      if (field.required && String(formData[field.name] ?? '').trim() === '') {
        accumulator[field.name] = 'Campo obbligatorio'
      }
      return accumulator
    }, {})

    const finalErrors = { ...requiredErrors, ...errors }
    if (Object.keys(finalErrors).length) {
      setFormErrors(finalErrors)
      return
    }

    setFormErrors({})
    setSaving(true)
    try {
      const payload = { ...formData }

      config.fields.forEach((field) => {
        if (field.transform && typeof field.transform === 'function') {
          payload[field.name] = field.transform(payload[field.name])
        }
      })

      if (editingRow) {
        const rowId = editingRow[config.idField || 'id']
        const updateUrl = rowId != null ? `${config.updateEndpoint}/${rowId}` : config.updateEndpoint
        const updated = await apiSend('PUT', updateUrl, payload)
        setRows((current) =>
          current.map((row) => (row === editingRow ? { ...row, ...updated } : row)),
        )
        setSuccessMessage('Elemento aggiornato correttamente.')
        if (typeof onCreated === 'function') {
          onCreated(updated, 'updated')
        }
      } else {
        const payload = { ...formData }
        config.fields.forEach((field) => {
          if (!field.required && payload[field.name] === '') {
            delete payload[field.name]
          }
        })
        const created = await apiSend('POST', config.createEndpoint, payload)
        setRows((current) => [created, ...current])
        setSuccessMessage('Elemento creato correttamente.')
        if (typeof onCreated === 'function') {
          onCreated(created, 'created')
        }
      }

      setDialogOpen(false)
      setEditingRow(null)
      setFormData(defaultFormData(config.fields))
      setDirty(false)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const renderSelectField = (field) => {
    const options = field.options || selectOptions[field.optionsEndpoint] || []
    const resolvedValue = formData[field.name]

    return (
      <TextField
        key={field.name}
        select
        size="small"
        label={field.label}
        error={Boolean(formErrors[field.name])}
        helperText={formErrors[field.name]}
        value={resolvedValue ?? ''}
        onChange={(event) => markDirty((current) => ({ ...current, [field.name]: event.target.value }))}
      >
        <MenuItem value="">Seleziona</MenuItem>
        {options.map((option) => (
          <MenuItem key={option[field.optionValue]} value={option[field.optionValue]}>
            {getOptionLabel(option, field)}
          </MenuItem>
        ))}
      </TextField>
    )
  }

  const renderFormField = (field) => {
    if (field.hiddenInForm) return null

    if (field.type === 'select') {
      return renderSelectField(field)
    }

    if (field.type === 'textarea') {
      return (
        <TextField
          key={field.name}
          size="small"
          label={field.label}
          multiline
          minRows={3}
          error={Boolean(formErrors[field.name])}
          helperText={formErrors[field.name]}
          value={formData[field.name]}
          onChange={(event) => markDirty((current) => ({ ...current, [field.name]: event.target.value }))}
        />
      )
    }

    const inputProps = {}
    if (field.type === 'number') {
      inputProps.inputMode = 'numeric'
      inputProps.pattern = '[0-9]*'
    }
    if (field.type === 'date') {
      inputProps.type = 'date'
      inputProps.shrink = true
    }
    if (field.type === 'email') {
      inputProps.type = 'email'
    }
    if (field.type === 'tel') {
      inputProps.type = 'tel'
    }

    return (
      <TextField
        key={field.name}
        size="small"
        label={field.label}
        error={Boolean(formErrors[field.name])}
        helperText={formErrors[field.name]}
        value={formData[field.name]}
        inputProps={Object.keys(inputProps).length ? inputProps : undefined}
        onChange={(event) => markDirty((current) => ({ ...current, [field.name]: event.target.value }))}
      />
    )
  }

  const visibleFields = useMemo(() => config.fields.filter((field) => !field.hiddenInForm), [config])

  return (
    <Stack spacing={2}>
      <Box sx={{ display: hiddenUI ? 'none' : 'block' }}>
      {config.key !== 'companies' && (
        <Box className="legacy-table-toolbar">
          <Box className="legacy-table-toolbar-filters">
            <TextField
              size="small"
              label="Cerca"
              variant="outlined"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="outlined" onClick={loadRows}>Aggiorna</Button>
            {canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nuovo</Button>}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => downloadCsv(`${config.key}.csv`, configuredColumns, filteredRows)}>
              Esporta CSV
            </Button>
            <Button variant="outlined" onClick={() => setQueryRules([createQueryRule(configuredColumns)])}>
              Filtro avanzato
            </Button>
          </Stack>
        </Box>
      )}

      {!!error && <Alert severity="error">{error}</Alert>}
      {!!successMessage && <Snackbar open autoHideDuration={3000} message={successMessage} onClose={() => setSuccessMessage('')} />}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                {configuredColumns.map((column) => (
                  <TableCell key={column}>{fieldLabels[column] || keyToLabel(column)}</TableCell>
                ))}
                {canEdit && <TableCell align="right">Azione</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedRows.map((row) => (
                <TableRow
                  key={row.id ?? row._id}
                  hover
                  onDoubleClick={
                    config.key === 'companies' && onOpenCompanyProfile
                      ? () => onOpenCompanyProfile(row)
                      : undefined
                  }
                >
                  <TableCell padding="checkbox" />
                  {configuredColumns.map((column) => (
                    <TableCell key={column}>{displayValue(row[column])}</TableCell>
                  ))}
                  {canEdit && (
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => openEdit(row)}>Modifica</Button>
                        <Button size="small" color="error" onClick={() => handleDelete(row)}>Elimina</Button>
                        <Button
                          size="small"
                          onClick={() => {
                            if (config.key === 'companies' && onOpenCompanyProfile) {
                              onOpenCompanyProfile(row)
                            } else {
                              setProfileEmployee(row)
                            }
                          }}
                        >
                          Profilo
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {pagedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit ? configuredColumns.length + 2 : configuredColumns.length + 1}>
                    <Typography variant="body2" color="text.secondary">Nessun elemento disponibile.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {config.key === 'companies' && (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} className="legacy-btn">
              Nuova azienda
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} className="legacy-btn-secondary" onClick={() => window.print()}>Stampa</Button>
          <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={() => downloadCsv('companies', configuredColumns, filteredRows)} className="legacy-btn-success">
            Esporta dati in excel
          </Button>
          <Button variant="outlined" startIcon={<PlaylistAddCheckIcon />} className="legacy-btn-secondary" onClick={() => window.alert('Operazioni massive non ancora disponibile')}>Operazioni massive</Button>
          <Button variant="outlined" startIcon={<UploadFileIcon />} className="legacy-btn-secondary" onClick={() => window.alert('Importazione dati non ancora disponibile')}>Importa dati</Button>
        </Stack>
      )}

      <Box className="legacy-table-footer">
        <Typography variant="caption" color="text.secondary">
          {filteredRows.length} elementi
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            select
            sx={{ minWidth: 110 }}
            value={rowsPerPage}
            onChange={(event) => setRowsPerPage(Number(event.target.value))}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={200}>200</MenuItem>
          </TextField>
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => setRowsPerPage(Number(event.target.value))}
            rowsPerPageOptions={[]}
          />
        </Stack>
      </Box>
      </Box>

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <Typography variant="body2">L'elemento selezionato verrà rimosso in modo definitivo. Procedere?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Annulla</Button>
          <Button color="error" onClick={confirmDeleteRow} disabled={saving}>
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={confirmClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {editingRow
            ? `Modifica ${(config.singularLabel || config.label || 'elemento').toLowerCase()}`
            : `Nuova ${(config.singularLabel || config.label || 'elemento').toLowerCase()}`}
          <IconButton size="small" onClick={confirmClose} aria-label="Chiudi">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5, ...(config.key === 'employees' ? { display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 } : {}) } }>
            {visibleFields.map((field) => renderFormField(field))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmClose}>Annulla</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            Salva
          </Button>
        </DialogActions>
      </Dialog>

      <EmployeeProfileDialog
        open={Boolean(profileEmployee)}
        onClose={() => setProfileEmployee(null)}
        employee={profileEmployee}
        onSaveEmployee={(updated) => {
          setProfileEmployee((current) =>
            current ? { ...current, ...updated } : current,
          )
          loadRows()
        }}
        onEditEmployee={(employee) => {
          setProfileEmployee(null)
          setEditingRow(employee)
          setFormData(
            config.fields.reduce((accumulator, field) => {
              accumulator[field.name] = employee[field.name] ?? ''
              return accumulator
            }, {}),
          )
          setDialogOpen(true)
        }}
      />
    </Stack>
  )
}

export default CrudEntityView
