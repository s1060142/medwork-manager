import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
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
  Tooltip,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CloseIcon from '@mui/icons-material/Close'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { apiGet, apiSend } from '../services/apiClient'
import { getItalianMunicipalities } from '../services/municipalityService'
import { calculateItalianTaxCode } from '../utils/taxCode'
import { downloadCsv } from '../utils/csv'
import { formDateValue } from '../utils/datePicker'
import EmployeeProfileDialog from './EmployeeProfileDialog'
import CompanyProfileDialog from './CompanyProfileDialog'
import { showNotification } from '../utils/notification'

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
  if (!option) return ''
  if (field?.optionLabel === 'doctor') {
    const name = `Dott. ${option.firstName || ''} ${option.lastName || ''}`.trim()
    const spec = option.specialty ? ` (${option.specialty})` : ''
    const albo = option.medicalLicenseNumber ? ` • Albo: ${option.medicalLicenseNumber}` : ''
    return `${name}${spec}${albo}`
  }

  if (field?.optionLabel === 'lastName') {
    const firstName = option.firstName ? `${option.firstName} ` : ''
    return `${firstName}${option.lastName}`.trim()
  }

  if (field?.optionLabel === 'address') {
    return `${option.address}${option.city ? ` (${option.city})` : ''}`
  }

  if (field?.optionLabel === 'outcome') {
    const dateText = option.visitDate ? ` - ${new Date(option.visitDate).toLocaleDateString('it-IT')}` : ''
    return `${option.outcome}${dateText}`
  }

  return option[field?.optionLabel] ?? option.label ?? String(option[field?.optionValue] ?? option.value ?? option)
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
  refreshToken = 0,
  onExternalCreateConsumed,
  onOpenCompanyProfile,
  onOpenEmployeeProfile,
  hiddenUI = false,
  onCreated,
  onDeleteConfirm,
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
  const [doctorLookupModalOpen, setDoctorLookupModalOpen] = useState(false)
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('')
  const [activeLookupField, setActiveLookupField] = useState(null)
  const [queryRules, setQueryRules] = useState([])
  const [dirty, setDirty] = useState(false)
  const markDirty = (updater) => {
    setDirty(true)
    setFormData(updater)
  }

  const handleOpenRow = (row) => {
    if (!row) return
    if (config.key === 'companies') {
      if (onOpenCompanyProfile) {
        onOpenCompanyProfile(row)
      } else {
        setProfileCompany(row)
      }
    } else if (config.key === 'employees') {
      if (onOpenEmployeeProfile) {
        onOpenEmployeeProfile(row)
      } else {
        setProfileEmployee(row)
      }
    } else if (canEdit) {
      openEdit(row)
    }
  }

  const canEdit = !config.readOnly && (currentRole === 'Admin' || currentRole === config.role || currentRole === 'Doctor' || !config.role)

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
      const res = await apiGet(config.readEndpoint)
      const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])
      setRows(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSelects = async () => {
    const selectFields = config.fields.filter(
      (field) => (field.type === 'select' || field.type === 'lookup') && field.optionsEndpoint,
    )
    const uniqueEndpoints = [...new Set(selectFields.map((field) => field.optionsEndpoint))]
    const entries = await Promise.all(
      uniqueEndpoints.map(async (endpoint) => {
        const res = await apiGet(endpoint)
        const arrayData = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])

        if (endpoint.includes('/companies')) {
          return [endpoint, arrayData]
        }

        if (endpoint.includes('/branches')) {
          // All branches are loaded here. The branch dropdown is scoped at render
          // time to the company actually chosen inside the form (formData.companyId),
          // so it stays empty until a company is selected.
          return [endpoint, arrayData]
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
  }, [config, hiddenUI, refreshToken])

  useEffect(() => {
    const handleCompanyUpdated = (e) => {
      if (config.key === 'companies') {
        if (e?.detail?.id) {
          setRows((current) =>
            current.map((row) => {
              const id = row[config.idField || 'id']
              return Number(id) === Number(e.detail.id) ? { ...row, ...e.detail } : row
            }),
          )
        }
        loadRows()
      }
    }
    window.addEventListener('medwork:company-updated', handleCompanyUpdated)
    return () => {
      window.removeEventListener('medwork:company-updated', handleCompanyUpdated)
    }
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
    if (!externalCreateToken) return
    openCreate()
    if (typeof onExternalCreateConsumed === 'function') {
      onExternalCreateConsumed()
    }
  }, [externalCreateToken])

  const openCreate = () => {
    setEditingRow(null)
    const initial = defaultFormData(config.fields)
    if (effectiveCompanyId && config.fields.some((f) => f.name === 'companyId')) {
      initial.companyId = Number(effectiveCompanyId)
    }
    if (activeBranchId && activeBranchId !== 'all' && config.fields.some((f) => f.name === 'branchId')) {
      initial.branchId = Number(activeBranchId)
    }
    setFormData(initial)
    setFormErrors({})
    setDirty(false)
    setDialogOpen(true)
  }

  const openEdit = (row) => {
    setEditingRow(row)
    setFormData(
      config.fields.reduce((accumulator, field) => {
        let rawValue = row[field.name]
        if (field.name === 'coordinatorDoctorId') {
          if (rawValue === undefined || rawValue === null || rawValue === '') {
            rawValue = row.coordinatorDoctorId ?? row.doctorId ?? ''
          }
          if (!rawValue && (row.coordinatorDoctorName || row.doctorName)) {
            const doctors = selectOptions[field.optionsEndpoint] || []
            const targetName = (row.coordinatorDoctorName || row.doctorName).trim().toLowerCase()
            const found = doctors.find(
              (d) =>
                `Dott. ${d.firstName} ${d.lastName}`.toLowerCase() === targetName ||
                `${d.lastName} ${d.firstName}`.toLowerCase() === targetName ||
                `${d.firstName} ${d.lastName}`.toLowerCase() === targetName,
            )
            if (found) rawValue = found.id
          }
        }
        if (field.type === 'date') {
          accumulator[field.name] = formDateValue(rawValue ? new Date(rawValue) : null)
        } else {
          accumulator[field.name] = rawValue ?? ''
        }
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

  const [unsavedDialog, setUnsavedDialog] = useState({ open: false, onConfirm: () => {} })

  const confirmClose = () => {
    if (!dirty) return closeForm()
    setUnsavedDialog({ open: true, onConfirm: closeForm })
  }

  const handleUnsavedConfirm = () => {
    setUnsavedDialog({ open: false, onConfirm: () => {} })
    closeForm()
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

      const deletedRow = confirmDelete
      setRows((current) => current.filter((row) => row !== confirmDelete))
      setSuccessMessage('Elemento eliminato correttamente.')
      if (onDeleteConfirm) {
        onDeleteConfirm(deletedRow)
      }
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
      
      // Sanitize empty strings to null to prevent ASP.NET Core 400 Regex validation errors.
      // Exclude numeric/select fields that are required FK references — for those, preserve
      // the existing value from the editing row to avoid sending null for non-nullable ints.
      const numericFields = new Set(['companyId', 'branchId', 'departmentId', 'workLocationId', 'jobRoleId', 'riskLevelId'])
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          if (numericFields.has(key) && editingRow && editingRow[key] != null) {
            payload[key] = editingRow[key]
          } else {
            payload[key] = null
          }
        }
      })

      config.fields.forEach((field) => {
        if (field.transform && typeof field.transform === 'function') {
          payload[field.name] = field.transform(payload[field.name])
        }
      })

      if (config.key === 'companies' && payload.coordinatorDoctorId !== undefined) {
        payload.coordinatorDoctorId = payload.coordinatorDoctorId ? Number(payload.coordinatorDoctorId) : null
      }

      if (editingRow) {
        const rowId = editingRow[config.idField || 'id']
        const updateUrl = rowId != null ? `${config.updateEndpoint}/${rowId}` : config.updateEndpoint
        const updated = await apiSend('PUT', updateUrl, payload)

        if (config.key === 'companies') {
          const compId = rowId || updated?.id
          const docId = payload.coordinatorDoctorId ? Number(payload.coordinatorDoctorId) : null
          await apiSend('PUT', '/api/admin-data/company-doctors', {
            companyId: Number(compId),
            doctorIds: docId ? [docId] : [],
            coordinatorDoctorId: docId,
          }).catch(console.warn)

          const docObj = (selectOptions['/api/master-data/doctors'] || []).find((d) => Number(d.id) === Number(docId))
          const docName = docObj ? `Dott. ${docObj.firstName} ${docObj.lastName}` : null
          if (updated) {
            updated.coordinatorDoctorId = docId
            updated.coordinatorDoctorName = docName
            updated.doctorName = docName
          }
          window.dispatchEvent(
            new CustomEvent('medwork:company-updated', {
              detail: {
                id: compId,
                coordinatorDoctorId: docId,
                coordinatorDoctorName: docName,
                doctorName: docName,
              },
            }),
          )
        }

        setRows((current) =>
          current.map((row) => {
            const id = row[config.idField || 'id']
            return id === rowId ? { ...row, ...updated } : row
          }),
        )
        setSuccessMessage('Elemento aggiornato correttamente.')
        if (typeof onCreated === 'function') {
          onCreated(updated, 'updated')
        }
        loadRows()
      } else {
        config.fields.forEach((field) => {
          if (!field.required && (payload[field.name] === '' || payload[field.name] === undefined)) {
            delete payload[field.name]
          }
        })
        const created = await apiSend('POST', config.createEndpoint, payload)
        if (config.key === 'companies' && created?.id && payload.coordinatorDoctorId) {
          const docId = Number(payload.coordinatorDoctorId)
          await apiSend('PUT', '/api/admin-data/company-doctors', {
            companyId: Number(created.id),
            doctorIds: [docId],
            coordinatorDoctorId: docId,
          }).catch(console.warn)
        }
        setRows((current) => [created, ...current])
        setSuccessMessage('Elemento creato correttamente.')
        if (typeof onCreated === 'function') {
          onCreated(created, 'created')
        }
        loadRows()
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
    const baseOptions = field.options || selectOptions[field.optionsEndpoint] || []
    const options =
      field.optionsEndpoint && field.optionsEndpoint.includes('/branches')
        ? formData.companyId
          ? baseOptions.filter((option) => Number(option.companyId) === Number(formData.companyId))
          : []
        : baseOptions
    const resolvedValue = formData[field.name]

    const handleChange = (event) => {
      if (field.name === 'companyId') {
        // Changing the company invalidates any previously selected branch.
        markDirty((current) => ({ ...current, companyId: event.target.value, branchId: '' }))
      } else {
        markDirty((current) => ({ ...current, [field.name]: event.target.value }))
      }
    }

    return (
      <TextField
        key={field.name}
        select
        size="small"
        label={field.label}
        error={Boolean(formErrors[field.name])}
        helperText={formErrors[field.name]}
        value={resolvedValue ?? ''}
        onChange={handleChange}
      >
        <MenuItem value="">Seleziona</MenuItem>
        {options.map((option) => {
          const optionValue = option[field.optionValue] ?? option.value ?? option
          return (
            <MenuItem key={optionValue} value={optionValue}>
              {getOptionLabel(option, field)}
            </MenuItem>
          )
        })}
      </TextField>
    )
  }

  const renderLookupField = (field) => {
    const options = field.options || selectOptions[field.optionsEndpoint] || []
    const currentValue = formData[field.name]
    const selectedOption =
      options.find((opt) => Number(opt[field.optionValue || 'id']) === Number(currentValue)) || null

    return (
      <Autocomplete
        key={field.name}
        size="small"
        options={options}
        value={selectedOption}
        onChange={(_, newValue) => {
          const val = newValue ? newValue[field.optionValue || 'id'] : ''
          markDirty((current) => ({
            ...current,
            [field.name]: val,
            coordinatorDoctorName: newValue ? `Dott. ${newValue.firstName} ${newValue.lastName}` : '',
          }))
        }}
        getOptionLabel={(option) => {
          if (!option) return ''
          if (typeof option === 'string') return option
          return getOptionLabel(option, field)
        }}
        isOptionEqualToValue={(option, val) =>
          Number(option[field.optionValue || 'id']) === Number(val[field.optionValue || 'id'] || val)
        }
        filterOptions={(opts, state) => {
          const query = (state.inputValue || '').toLowerCase().trim()
          if (!query) return opts
          return opts.filter((opt) => {
            const fullName = `${opt.firstName || ''} ${opt.lastName || ''} ${opt.lastName || ''} ${opt.firstName || ''}`.toLowerCase()
            const spec = (opt.specialty || '').toLowerCase()
            const albo = (opt.medicalLicenseNumber || '').toLowerCase()
            const mail = (opt.email || '').toLowerCase()
            return fullName.includes(query) || spec.includes(query) || albo.includes(query) || mail.includes(query)
          })
        }}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 0.8, gap: 0.2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MedicalServicesIcon fontSize="small" color="primary" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Dott. {option.firstName} {option.lastName}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 3.2 }}>
              {option.specialty || 'Medico Competente'}
              {option.medicalLicenseNumber ? ` • Albo: ${option.medicalLicenseNumber}` : ''}
              {option.email ? ` • ${option.email}` : ''}
            </Typography>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label={field.label}
            placeholder={field.placeholder || 'Cerca per nome, albo, specialità...'}
            error={Boolean(formErrors[field.name])}
            helperText={formErrors[field.name]}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {params.InputProps.endAdornment}
                  <InputAdornment position="end">
                    <Tooltip title="Apri ricerca avanzata medico (Lookup)">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveLookupField(field)
                          setDoctorSearchQuery('')
                          setDoctorLookupModalOpen(true)
                        }}
                        aria-label="Cerca medico nella lookup"
                        sx={{ color: 'primary.main', mr: -0.5 }}
                      >
                        <PersonSearchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                </>
              ),
            }}
          />
        )}
      />
    )
  }

  const renderFormField = (field) => {
    if (field.hiddenInForm) return null

    if (field.type === 'select') {
      return renderSelectField(field)
    }

    if (field.type === 'lookup') {
      return renderLookupField(field)
    }

    if (field.type === 'textarea') {
      return (
        <TextField
          key={field.name}
          size='small'
          label={field.label}
          multiline
          minRows={3}
          error={Boolean(formErrors[field.name])}
          helperText={formErrors[field.name]}
          value={formData[field.name]}
          onChange={(event) => markDirty((current) => ({ ...current, [field.name]: event.target.value }))}
          sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}
        />
      )
    }

    const inputProps = {}
    if (field.type === 'number') {
      inputProps.inputMode = 'numeric'
      inputProps.pattern = '[0-9]*'
    }
    if (field.type === 'email') {
      inputProps.type = 'email'
    }
    if (field.type === 'tel') {
      inputProps.type = 'tel'
    }
    if (field.type === 'date') {
      inputProps.type = 'date'
      inputProps.required = field.required
    }

    return (
      <TextField
        key={field.name}
        size='small'
        label={field.label}
        error={Boolean(formErrors[field.name])}
        helperText={formErrors[field.name]}
        value={formData[field.name]}
        inputProps={Object.keys(inputProps).length ? inputProps : undefined}
        onChange={(event) => markDirty((current) => ({ ...current, [field.name]: event.target.value }))}
        className={field.type === 'date' && formData[field.name] ? 'date-has-value' : undefined}
      />
    )
  }

  const visibleFields = useMemo(() => config.fields.filter((field) => !field.hiddenInForm), [config])

  return (
    <Stack spacing={2}>
      <Box sx={{ display: hiddenUI ? 'none' : 'block' }}>
      {config.key !== 'companies' && (
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
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
              sx={{ minWidth: 250 }}
            />
            {canEdit && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreate}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {['companies', 'branches', 'anamneses', 'vaccinations', 'site-visits'].includes(config.key) || config.gender === 'f'
                  ? `Nuova ${config.singularLabel || config.label || 'Voce'}`
                  : `Nuovo ${config.singularLabel || config.label || 'Elemento'}`}
              </Button>
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => downloadCsv(`${config.key}.csv`, configuredColumns, filteredRows)}>
              Esporta CSV
            </Button>
            <Button variant="outlined" onClick={() => setQueryRules([createQueryRule(configuredColumns)])}>
              Filtro avanzato
            </Button>
          </Stack>
        </Stack>
      )}

      {!!error && <Alert severity="error">{error}</Alert>}
      {!!successMessage && <Snackbar open autoHideDuration={3000} message={successMessage} onClose={() => setSuccessMessage('')} />}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                {defaultColumns.map((column) => (
                  <TableCell key={column}>{fieldLabels[column] || keyToLabel(column)}</TableCell>
                ))}
                {canEdit && <TableCell align="right">Azione</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedRows.map((row) => {
                const rowId = row[config.idField || 'id'] ?? row._id
                return (
                  <TableRow
                    key={rowId}
                    hover
                    onDoubleClick={() => handleOpenRow(row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleOpenRow(row)
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    {defaultColumns.map((column) => {
                      if (column === 'coordinatorDoctorId') {
                        const docObj = (selectOptions['/api/master-data/doctors'] || []).find(
                          (d) => Number(d.id) === Number(row[column]),
                        )
                        const label =
                          row.coordinatorDoctorName ||
                          row.doctorName ||
                          (docObj ? `Dott. ${docObj.firstName} ${docObj.lastName}` : (row[column] ? `Medico #${row[column]}` : 'Non assegnato'))
                        return (
                          <TableCell key={column}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: row[column] || row.coordinatorDoctorName ? 500 : 400,
                                color: row[column] || row.coordinatorDoctorName ? 'text.primary' : 'text.secondary',
                              }}
                            >
                              {label}
                            </Typography>
                          </TableCell>
                        )
                      }
                      if (column === 'companyGroupId') {
                        const grp = (selectOptions['/api/master-data/company-groups'] || []).find(
                          (g) => Number(g.id) === Number(row[column]),
                        )
                        return (
                          <TableCell key={column}>
                            {row.companyGroupName || (grp ? grp.name : displayValue(row[column]))}
                          </TableCell>
                        )
                      }
                      return <TableCell key={column}>{displayValue(row[column])}</TableCell>
                    })}
                    {canEdit && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                          <IconButton
                            size="small"
                            color="primary"
                            title="Modifica"
                            aria-label="Modifica"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(row)
                            }}
                            sx={{ p: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <Button size="small" onClick={() => openEdit(row)} sx={{ fontSize: 12, px: 1 }}>Modifica</Button>
                          <Button size="small" color="error" onClick={() => handleDelete(row)} sx={{ fontSize: 12, px: 1 }}>Elimina</Button>
                          <Button
                            size="small"
                            onClick={() => {
                              if (config.key === 'companies') {
                                if (onOpenCompanyProfile) {
                                  onOpenCompanyProfile(row)
                                } else {
                                  setProfileCompany(row)
                                }
                              } else {
                                setProfileEmployee(row)
                              }
                            }}
                            sx={{ fontSize: 12, px: 1 }}
                          >
                            Profilo
                          </Button>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
              {pagedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit ? defaultColumns.length + 1 : defaultColumns.length}>
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} >
              Nuova azienda
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Stampa</Button>
          <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={() => downloadCsv('companies', configuredColumns, filteredRows)}>
            Esporta dati in excel
          </Button>
          <Button variant="outlined" startIcon={<PlaylistAddCheckIcon />} onClick={() => showNotification('Operazioni massive non ancora disponibili per questa tabella.', 'info')}>Operazioni massive</Button>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => showNotification('Importazione dati non ancora disponibile per questa tabella.', 'info')}>Importa dati</Button>
        </Stack>
      )}

      <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        <DialogTitle sx={{ fontWeight: 700 }}>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Sei sicuro di voler eliminare questo elemento? Questa azione non può essere annullata.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} sx={{ textTransform: 'none' }}>Annulla</Button>
          <Button color="error" onClick={confirmDeleteRow} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>Elimina</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={confirmClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            {editingRow
              ? `Modifica ${(config.singularLabel || config.label || 'elemento').toLowerCase()}`
              : `${['companies', 'branches', 'anamneses', 'vaccinations', 'site-visits'].includes(config.key) || config.gender === 'f' ? 'Nuova' : 'Nuovo'} ${(config.singularLabel || config.label || 'elemento').toLowerCase()}`}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={confirmClose} aria-label="Chiudi">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {config.key === 'employees' || config.key === 'companies' ? (
            <Box sx={{ mt: 0.5, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5, alignItems: 'start' }}>
              {visibleFields.map((field) => renderFormField(field))}
            </Box>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              {visibleFields.map((field) => renderFormField(field))}
            </Stack>
          )}
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
      <CompanyProfileDialog
        open={Boolean(profileCompany)}
        onClose={() => setProfileCompany(null)}
        company={profileCompany}
        onSaveCompany={(updated) => {
          setProfileCompany((current) => (current ? { ...current, ...updated } : current))
          loadRows()
        }}
      />

      {/* LOOKUP MODALE AVANZATA MEDICO COMPETENTE */}
      <Dialog
        open={doctorLookupModalOpen}
        onClose={() => setDoctorLookupModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <MedicalServicesIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Lookup Medico Competente
              </Typography>
              <Typography variant="caption" color="text.secondary">
                D.Lgs. 81/08 Art. 38 • Seleziona il Medico Competente da nominare per questa azienda
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setDoctorLookupModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Cerca per cognome, nome, specializzazione, albo, email..."
            value={doctorSearchQuery}
            onChange={(e) => setDoctorSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: doctorSearchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setDoctorSearchQuery('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ mb: 2 }}
          />

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Medico</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Specializzazione</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Iscrizione Albo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Contatti</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Azione</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const doctors = selectOptions[activeLookupField?.optionsEndpoint || '/api/master-data/doctors'] || []
                  const q = doctorSearchQuery.toLowerCase().trim()
                  const filtered = doctors.filter((d) => {
                    if (!q) return true
                    const fullName = `${d.firstName || ''} ${d.lastName || ''} ${d.lastName || ''} ${d.firstName || ''}`.toLowerCase()
                    const spec = (d.specialty || '').toLowerCase()
                    const albo = (d.medicalLicenseNumber || '').toLowerCase()
                    const mail = (d.email || '').toLowerCase()
                    return fullName.includes(q) || spec.includes(q) || albo.includes(q) || mail.includes(q)
                  })

                  if (filtered.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            Nessun medico trovato con i criteri di ricerca inseriti.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  }

                  const selectedDocId = Number(formData[activeLookupField?.name || 'coordinatorDoctorId'])

                  return filtered.map((doc) => {
                    const isSelected = selectedDocId === Number(doc.id)
                    return (
                      <TableRow
                        key={doc.id}
                        hover
                        selected={isSelected}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          const targetFieldName = activeLookupField?.name || 'coordinatorDoctorId'
                          markDirty((current) => ({
                            ...current,
                            [targetFieldName]: doc.id,
                            coordinatorDoctorName: `Dott. ${doc.firstName} ${doc.lastName}`,
                          }))
                          setDoctorLookupModalOpen(false)
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            Dott. {doc.firstName} {doc.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={doc.specialty || 'Medicina del Lavoro'} color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">
                            {doc.medicalLicenseNumber || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {doc.email || '—'}
                          </Typography>
                          {doc.phone && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {doc.phone}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isSelected ? (
                            <Chip size="small" label="Assegnato" color="success" icon={<CheckCircleIcon />} />
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              sx={{ textTransform: 'none', px: 1.5 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                const targetFieldName = activeLookupField?.name || 'coordinatorDoctorId'
                                markDirty((current) => ({
                                  ...current,
                                  [targetFieldName]: doc.id,
                                  coordinatorDoctorName: `Dott. ${doc.firstName} ${doc.lastName}`,
                                }))
                                setDoctorLookupModalOpen(false)
                              }}
                            >
                              Seleziona
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, justifyContent: 'space-between' }}>
          <Button
            color="error"
            onClick={() => {
              const targetFieldName = activeLookupField?.name || 'coordinatorDoctorId'
              markDirty((current) => ({
                ...current,
                [targetFieldName]: '',
                coordinatorDoctorName: '',
              }))
              setDoctorLookupModalOpen(false)
            }}
            sx={{ textTransform: 'none' }}
          >
            Rimuovi assegnazione
          </Button>
          <Button variant="outlined" onClick={() => setDoctorLookupModalOpen(false)} sx={{ textTransform: 'none' }}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      {/* UNSAVED CHANGES CONFIRMATION DIALOG */}
      <Dialog open={unsavedDialog.open} onClose={() => setUnsavedDialog({ open: false, onConfirm: () => {} })}>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>Modifiche non salvate</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14, color: '#4b5563', mt: 1 }}>
            Hai modifiche non salvate. Vuoi chiudere comunque?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setUnsavedDialog({ open: false, onConfirm: () => {} })}>Continua a modificare</Button>
          <Button variant="contained" color="warning" onClick={handleUnsavedConfirm}>Chiudi senza salvare</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default CrudEntityView


