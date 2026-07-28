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
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'

const STORAGE_KEY = 'medwork.archivedEmployees'

function toDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleDateString('it-IT') : '-'
}

function normalizeText(value) {
  return String(value || '').toLowerCase()
}

function classifyFitness(outcome) {
  const text = normalizeText(outcome)
  if (!text.trim()) return { key: 'none', label: 'Senza idoneità', color: 'default' }
  if (text.includes('non idone')) return { key: 'not-fit', label: 'Non idoneo', color: 'error' }
  if (text.includes('prescr') || text.includes('parzial') || text.includes('limit')) {
    return { key: 'partial', label: 'Parzialmente idoneo', color: 'warning' }
  }
  if (text.includes('idone')) return { key: 'fit', label: 'Idoneo', color: 'success' }
  return { key: 'none', label: 'Senza idoneità', color: 'default' }
}

function loadArchived() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveArchived(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

// Default form data for new employee
const defaultEmployeeFormData = {
  companyId: '',
  branchId: '',
  firstName: '',
  lastName: '',
  taxCode: '',
  jobRole: '',
  birthDate: '',
  gender: '',
  birthCity: '',
  personalEmail: '',
  phoneNumber: '',
}

function getFitnessClass(fitnessKey) {
  const classes = {
    fit: 'fitness-idoneo',
    partial: 'fitness-parziale',
    'not-fit': 'fitness-non-idoneo',
    none: 'fitness-nessuna',
  }
  return classes[fitnessKey] || 'fitness-nessuna'
}

function WorkersCenter({ activeCompanyId = '', activeBranchId = '', onOpenEmployeeCreate, onOpenEmployeeCrud }) {
  const [activeTab, setActiveTab] = useState('workers')
  const [employees, setEmployees] = useState([])
  const [visits, setVisits] = useState([])
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [jobRoles, setJobRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [fitnessFilter, setFitnessFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [archivedIds, setArchivedIds] = useState(() => loadArchived())

  // Edit employee state
  const [editingEmployeeId, setEditingEmployeeId] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  // Create employee state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState(defaultEmployeeFormData)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [employeesData, visitsData, companiesData, branchesData, rolesData] = await Promise.all([
          apiGet('/api/master-data/employees'),
          apiGet('/api/master-data/medical-visits'),
          apiGet('/api/master-data/companies'),
          apiGet('/api/master-data/branches'),
          apiGet('/api/master-data/job-roles'),
        ])

        // Le API restituiscono un wrapper paginato { total, items: [...] } oppure un array grezzo.
        const asArray = (d) => (Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : [])
        setEmployees(asArray(employeesData))
        setVisits(asArray(visitsData))
        setCompanies(asArray(companiesData))
        setBranches(asArray(branchesData))
        setJobRoles(asArray(rolesData))
      } catch (requestError) {
        setError(requestError.message || 'Errore nel caricamento dati lavoratori.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const latestVisitByEmployee = useMemo(() => {
    return visits.reduce((accumulator, visit) => {
      const employeeId = Number(visit.employeeId)
      const date = toDate(visit.visitDate)
      if (!date) return accumulator
      if (!accumulator[employeeId] || date > toDate(accumulator[employeeId].visitDate)) {
        accumulator[employeeId] = visit
      }
      return accumulator
    }, {})
  }, [visits])

  const workerRows = useMemo(() => {
    return employees
      .map((employee) => {
        const latestVisit = latestVisitByEmployee[Number(employee.id)]
        const fitness = classifyFitness(latestVisit?.outcome)
        return {
          ...employee,
          latestVisitDate: latestVisit?.visitDate || null,
          latestOutcome: latestVisit?.outcome || '',
          fitness,
          isArchived: archivedIds.includes(Number(employee.id)),
          jobRoleDisplay: employee.jobRole || employee.jobRole || '-',
          workingStatus: 'Attivo',
        }
      })
      .sort((left, right) => String(left.lastName || '').localeCompare(String(right.lastName || '')))
  }, [employees, latestVisitByEmployee, archivedIds])

  const filteredRows = useMemo(() => {
    const needle = normalizeText(search)

    return workerRows.filter((row) => {
      if (!showArchived && row.isArchived) return false
      if (fitnessFilter !== 'all' && row.fitness.key !== fitnessFilter) return false

      if (!needle) return true

      const searchable = `${row.lastName} ${row.firstName} ${row.taxCode} ${row.jobRoleDisplay} ${row.companyName || ''}`.toLowerCase()
      return searchable.includes(needle)
    })
  }, [workerRows, showArchived, fitnessFilter, search])

  const kpi = useMemo(() => {
    const source = workerRows.filter((row) => !row.isArchived)
    return {
      fit: source.filter((item) => item.fitness.key === 'fit').length,
      partial: source.filter((item) => item.fitness.key === 'partial').length,
      notFit: source.filter((item) => item.fitness.key === 'not-fit').length,
      none: source.filter((item) => item.fitness.key === 'none').length,
    }
  }, [workerRows])

  const contextualRolesWithCount = useMemo(() => {
    const counts = workerRows
      .filter((row) => !row.isArchived)
      .reduce((accumulator, row) => {
        const key = row.jobRoleDisplay || '-'
        accumulator[key] = (accumulator[key] || 0) + 1
        return accumulator
      }, {})

    const rows = []
    Object.keys(counts).forEach((name) => {
      const role = jobRoles.find((item) => item.name === name)
      rows.push({
        id: role?.id || name,
        name,
        count: counts[name],
      })
    })

    return rows.sort((a, b) => b.count - a.count)
  }, [workerRows, jobRoles])

  // Filter branches by company
  const companyBranches = useMemo(() => {
    if (!createFormData.companyId) return []
    return branches.filter(b => Number(b.companyId) === Number(createFormData.companyId))
  }, [branches, createFormData.companyId])

  const toggleArchived = (employeeId) => {
    const id = Number(employeeId)
    const next = archivedIds.includes(id)
      ? archivedIds.filter((item) => item !== id)
      : [...archivedIds, id]

    setArchivedIds(next)
    saveArchived(next)
  }

  // Handle "Aggiungi" button click - opens create dialog directly
  const handleOpenCreateDialog = () => {
    // Pre-fill with current context company/branch if available
    setCreateFormData({
      ...defaultEmployeeFormData,
      companyId: activeCompanyId || companies[0]?.id || '',
      branchId: activeBranchId || '',
    })
    setCreateDialogOpen(true)
    setCreateError('')
  }

  const handleCreateChange = (field, value) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateEmployee = async () => {
    setCreateLoading(true)
    setCreateError('')
    try {
      const newEmployee = {
        ...createFormData,
        taxCode: (createFormData.taxCode || '').toUpperCase(),
        birthDate: createFormData.birthDate ? `${createFormData.birthDate}T00:00:00` : null,
      }

      await apiSend('POST', '/api/admin-data/employees', newEmployee)

      setCreateDialogOpen(false)
      setCreateFormData(defaultEmployeeFormData)

      // Refresh employees list
      const refresh = async () => {
        try {
          const data = await apiGet('/api/master-data/employees')
          const asArray = (d) => (Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : [])
          setEmployees(asArray(data))
        } catch (err) {
          setError(err.message || 'Errore nel ricarico lavoratori.')
        }
      }
      await refresh()
    } catch (err) {
      setCreateError(err.message || 'Errore nella creazione.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCancelCreate = () => {
    setCreateDialogOpen(false)
    setCreateFormData(defaultEmployeeFormData)
    setCreateError('')
  }

  const handleEditEmployee = (employee) => {
    setEditingEmployeeId(employee.id)
    // Prepare form data with fields we want to edit
    const formData = {
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      taxCode: employee.taxCode || '',
      jobRole: employee.jobRole || '',
      birthDate: employee.birthDate ? employee.birthDate.split('T')[0] : '', // format for date input
      gender: employee.gender || '',
      birthCity: employee.birthCity || '',
      personalEmail: employee.personalEmail || '',
      phoneNumber: employee.phoneNumber || '',
    }
    setEditFormData(formData)
    setEditDialogOpen(true)
    setEditError('')
  }

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveEdit = async () => {
    if (!editingEmployeeId) return
    setEditLoading(true)
    setEditError('')
    try {
      // Prepare data for PUT request
      const original = employees.find(emp => emp.id === editingEmployeeId)
      if (!original) throw new Error('Employee not found')
      const updatedData = {
        ...original,
        ...editFormData,
        // Ensure taxCode is uppercase
        taxCode: (editFormData.taxCode || '').toUpperCase(),
        // Ensure birthDate is string
        birthDate: editFormData.birthDate ? `${editFormData.birthDate}T00:00:00` : original.birthDate,
      }
      await apiSend('PUT', `/api/admin-data/employees/${editingEmployeeId}`, updatedData)
      setEditDialogOpen(false)
      // Refresh employees list
      const refresh = async () => {
        try {
          const data = await apiGet('/api/master-data/employees')
          const asArray = (d) => (Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : [])
          setEmployees(asArray(data))
        } catch (err) {
          setError(err.message || 'Errore nel ricarico lavoratori.')
        }
      }
      await refresh()
    } catch (err) {
      setEditError(err.message || 'Errore nel salvataggio.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditDialogOpen(false)
    setEditError('')
  }

  return (
    <Stack spacing={2}>
      {/* Header Card */}
      <Paper className="modern-card" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Aziende / Lavoratori</Typography>
            <Typography variant="body2" color="text.secondary">Gestisci anagrafiche, idoneità e scadenze</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button className="btn-primary-modern" onClick={handleOpenCreateDialog} startIcon={<span style={{fontSize: 18}}>+</span>}>
              Aggiungi Lavoratore
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Context Info Bar */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems={{ md: 'center' }} sx={{ mt: 1.5 }}>
        <Stack direction="row" spacing={0.8} alignItems="center">
          <Typography variant="body2" color="text.secondary">Contesto attivo</Typography>
          <Typography variant="body2" color="text.secondary">›</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{companies.length} aziende caricate</Typography>
          <Chip size="small" variant="outlined" label={`${workerRows.filter((x) => !x.isArchived).length} lavoratori`} className="kpi-card-info" sx={{ height: 24, fontSize: 12 }} />
        </Stack>
      </Stack>

      {/* Modern Tabs */}
      <div className="modern-tabs" sx={{ mt: 1.5 }}>
        <Tab value="general" label={`Generali (${companies.length})`} onChange={(_, value) => setActiveTab(value)} />
        <Tab value="places" label={`Luoghi (${branches.length})`} onChange={(_, value) => setActiveTab(value)} />
        <Tab value="roles" label={`Mansioni (${contextualRolesWithCount.length})`} onChange={(_, value) => setActiveTab(value)} />
        <Tab value="workers" label={`Lavoratori (${workerRows.filter((x) => !x.isArchived).length})`} onChange={(_, value) => setActiveTab(value)} />
      </div>

      {!!error && <Alert severity="error" className="animate-fade-in">{error}</Alert>}
      {loading && <Alert severity="info" className="animate-fade-in">Caricamento dati in corso...</Alert>}

      {/* GENERAL TAB */}
      {!loading && activeTab === 'general' && (
        <>
          {/* KPI Cards */}
          <div className="dashboard-grid" sx={{ mb: 2 }}>
            <Paper className="kpi-card kpi-card-primary" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                  <span style={{fontSize: 24}}>🏢</span>
                </Box>
                <Chip label={companies.length} size="small" color="primary" variant="outlined" sx={{ height: 24, fontSize: 11 }} />
              </Stack>
              <Typography variant="caption" color="text.secondary">Aziende</Typography>
              <Typography variant="h5" sx={{ lineHeight: 1.1 }}>{companies.length}</Typography>
            </Paper>
            <Paper className="kpi-card kpi-card-teal" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                  <span style={{fontSize: 24}}>📍</span>
                </Box>
                <Chip label={branches.length} size="small" color="success" variant="outlined" sx={{ height: 24, fontSize: 11 }} />
              </Stack>
              <Typography variant="caption" color="text.secondary">Sedi</Typography>
              <Typography variant="h5" sx={{ lineHeight: 1.1 }}>{branches.length}</Typography>
            </Paper>
            <Paper className="kpi-card kpi-card-warning" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                  <span style={{fontSize: 24}}>💼</span>
                </Box>
                <Chip label={contextualRolesWithCount.length} size="small" color="warning" variant="outlined" sx={{ height: 24, fontSize: 11 }} />
              </Stack>
              <Typography variant="caption" color="text.secondary">Mansioni</Typography>
              <Typography variant="h5" sx={{ lineHeight: 1.1 }}>{contextualRolesWithCount.length}</Typography>
            </Paper>
            <Paper className="kpi-card kpi-card-info" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                  <span style={{fontSize: 24}}>👥</span>
                </Box>
                <Chip label={workerRows.filter((x) => !x.isArchived).length} size="small" color="info" variant="outlined" sx={{ height: 24, fontSize: 11 }} />
              </Stack>
              <Typography variant="caption" color="text.secondary">Lavoratori attivi</Typography>
              <Typography variant="h5" sx={{ lineHeight: 1.1 }}>{workerRows.filter((x) => !x.isArchived).length}</Typography>
            </Paper>
          </div>
        </>
      )}

      {/* PLACES TAB */}
      {!loading && activeTab === 'places' && (
        <Paper className="modern-table-container" sx={{ borderRadius: 3 }}>
          <TableContainer className="modern-table-sticky">
            <Table className="modern-table" size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Azienda</TableCell>
                  <TableCell>Città</TableCell>
                  <TableCell>Indirizzo</TableCell>
                  <TableCell>Provincia</TableCell>
                  <TableCell>Dipendenti</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branches.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.companyName || '-'}</TableCell>
                    <TableCell>{row.city || '-'}</TableCell>
                    <TableCell>{row.address || '-'}</TableCell>
                    <TableCell>{row.province || '-'}</TableCell>
                    <TableCell>{row.employeesCount ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ROLES TAB */}
      {!loading && activeTab === 'roles' && (
        <Paper className="modern-table-container" sx={{ borderRadius: 3 }}>
          <TableContainer className="modern-table-sticky">
            <Table className="modern-table" size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Mansione</TableCell>
                  <TableCell>Dipendenti</TableCell>
                  <TableCell>Descrizione</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contextualRolesWithCount.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{jobRoles.find((x) => x.name === row.name)?.description || '-'}</TableCell>
                  </TableRow>
                ))}
                {contextualRolesWithCount.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className="empty-state">
                        <div className="empty-state-icon">💼</div>
                        <Typography className="empty-state-title">Nessuna mansione</Typography>
                        <Typography className="empty-state-text">Nessuna mansione presente nel contesto selezionato.</Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* WORKERS TAB */}
      {!loading && activeTab === 'workers' && (
        <>
          {/* Fitness KPI Cards */}
          <div className="dashboard-grid" sx={{ mb: 2 }}>
            <Paper className="kpi-card kpi-card-success" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Lavoratori idonei</Typography>
              <Typography variant="h5">{kpi.fit}</Typography>
            </Paper>
            <Paper className="kpi-card kpi-card-warning" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Parzialmente idonei</Typography>
              <Typography variant="h5">{kpi.partial}</Typography>
            </Paper>
            <Paper className="kpi-card kpi-card-error" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Non idonei</Typography>
              <Typography variant="h5">{kpi.notFit}</Typography>
            </Paper>
            <Paper className="kpi-card kpi-card-default" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Senza idoneità</Typography>
              <Typography variant="h5">{kpi.none}</Typography>
            </Paper>
          </div>

          {/* Search/Filter Bar */}
          <Paper className="search-filter-bar" sx={{ mb: 2 }}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.2} alignItems={{ lg: 'center' }}>
              <TextField
                size="small"
                label="Cerca lavoratore"
                placeholder="Cognome, nome, codice fiscale, mansione..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: { lg: 260 }, flexGrow: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <span style={{fontSize: 18}}>🔍</span>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                size="small"
                label="Stato idoneità"
                value={fitnessFilter}
                onChange={(event) => setFitnessFilter(event.target.value)}
                sx={{ minWidth: { lg: 200 } }}
              >
                <MenuItem value="all">Tutti</MenuItem>
                <MenuItem value="fit">Idoneo</MenuItem>
                <MenuItem value="partial">Parzialmente idoneo</MenuItem>
                <MenuItem value="not-fit">Non idoneo</MenuItem>
                <MenuItem value="none">Senza idoneità</MenuItem>
              </TextField>

              <FormControlLabel
                sx={{ ml: { lg: 'auto' } }}
                control={<Switch checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />}
                label="Mostra archiviati"
              />
            </Stack>
          </Paper>

          {/* Workers Table */}
          <Paper className="modern-table-container" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer className="modern-table-sticky">
              <Table className="modern-table" size="small" stickyHeader sx={{ minWidth: 980 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Cognome</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>Codice fiscale</TableCell>
                    <TableCell>Mansione</TableCell>
                    <TableCell>Stato idoneità</TableCell>
                    <TableCell>Data ultimo giudizio</TableCell>
                    <TableCell>Stato lavorativo</TableCell>
                    <TableCell align="right">Azione</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.lastName}</TableCell>
                      <TableCell>{row.firstName}</TableCell>
                      <TableCell>{row.taxCode || '-'}</TableCell>
                      <TableCell>{row.jobRoleDisplay}</TableCell>
                      <TableCell>
                        <Chip size="small" className={getFitnessClass(row.fitness.key)} label={row.fitness.label} variant="outlined" />
                      </TableCell>
                      <TableCell>{formatDate(row.latestVisitDate)}</TableCell>
                      <TableCell>
                        <Chip size="small" color="success" label={row.workingStatus} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            className="btn-primary-modern"
                            onClick={() => handleEditEmployee(row)}
                            startIcon={<span style={{ fontSize: 18 }}>✏️</span>}
                            title="Modifica"
                          />
                          <Button
                            size="small"
                            className="btn-secondary-modern"
                            onClick={() => toggleArchived(row.id)}
                          >
                            {row.isArchived ? 'Ripristina' : 'Archivia'}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <div className="empty-state" sx={{ py: 4 }}>
                          <div className="empty-state-icon">👥</div>
                          <Typography className="empty-state-title">Nessun lavoratore trovato</Typography>
                          <Typography className="empty-state-text">Prova a modificare i filtri di ricerca.</Typography>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 12 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Modifica Lavoratore</DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Nome"
              value={editFormData.firstName || ''}
              onChange={(e) => handleEditChange('firstName', e.target.value)}
              required
              autoFocus
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Cognome"
              value={editFormData.lastName || ''}
              onChange={(e) => handleEditChange('lastName', e.target.value)}
              required
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Codice fiscale"
              value={editFormData.taxCode || ''}
              onChange={(e) => handleEditChange('taxCode', e.target.value.toUpperCase())}
              inputProps={{ maxLength: 16 }}
              required
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Mansione"
              value={editFormData.jobRole || ''}
              onChange={(e) => handleEditChange('jobRole', e.target.value)}
              required
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Data di nascita"
              type="date"
              value={editFormData.birthDate || ''}
              onChange={(e) => handleEditChange('birthDate', e.target.value)}
              inputProps={{ min: '1900-01-01' }}
              required
              fullWidth
              className="form-field-modern"
            />
            <FormControl fullWidth className="form-field-modern">
              <FormLabel>Sesso</FormLabel>
              <RadioGroup row value={editFormData.gender || ''} onChange={(e) => handleEditChange('gender', e.target.value)}>
                <Radio value="M" label="Maschio" />
                <Radio value="F" label="Femmina" />
              </RadioGroup>
            </FormControl>
            <TextField
              label="Comune di nascita"
              value={editFormData.birthCity || ''}
              onChange={(e) => handleEditChange('birthCity', e.target.value)}
              required
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Email personale"
              type="email"
              value={editFormData.personalEmail || ''}
              onChange={(e) => handleEditChange('personalEmail', e.target.value)}
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Telefono"
              value={editFormData.phoneNumber || ''}
              onChange={(e) => handleEditChange('phoneNumber', e.target.value)}
              fullWidth
              className="form-field-modern"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button className="btn-ghost-modern" onClick={handleCancelEdit}>Annulla</Button>
          <Button
            className="btn-primary-modern"
            onClick={handleSaveEdit}
            disabled={editLoading}
          >
            {editLoading ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Employee Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCancelCreate} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 12 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Nuovo Lavoratore</DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            <TextField
              select
              label="Azienda"
              value={createFormData.companyId || ''}
              onChange={(e) => handleCreateChange('companyId', e.target.value)}
              required
              fullWidth
              className="form-field-modern"
              inputProps={{ minWidth: 200 }}
            >
              {companies.map(company => (
                <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Sede"
              value={createFormData.branchId || ''}
              onChange={(e) => handleCreateChange('branchId', e.target.value)}
              required
              fullWidth
              className="form-field-modern"
              inputProps={{ minWidth: 200 }}
              disabled={!createFormData.companyId}
            >
              {companyBranches.map(branch => (
                <MenuItem key={branch.id} value={branch.id}>{branch.city} - {branch.address}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Nome"
              value={createFormData.firstName || ''}
              onChange={(e) => handleCreateChange('firstName', e.target.value)}
              required
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Cognome"
              value={createFormData.lastName || ''}
              onChange={(e) => handleCreateChange('lastName', e.target.value)}
              required
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Codice fiscale"
              value={createFormData.taxCode || ''}
              onChange={(e) => handleCreateChange('taxCode', e.target.value.toUpperCase())}
              inputProps={{ maxLength: 16 }}
              required
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Mansione"
              value={createFormData.jobRole || ''}
              onChange={(e) => handleCreateChange('jobRole', e.target.value)}
              required
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Data di nascita"
              type="date"
              value={createFormData.birthDate || ''}
              onChange={(e) => handleCreateChange('birthDate', e.target.value)}
              inputProps={{ min: '1900-01-01' }}
              required
              fullWidth
              className="form-field-modern"
            />
            <FormControl fullWidth className="form-field-modern">
              <FormLabel>Sesso</FormLabel>
              <RadioGroup
                row
                value={createFormData.gender || ''}
                onChange={(e) => handleCreateChange('gender', e.target.value)}
              >
                <Radio value="M" label="Maschio" />
                <Radio value="F" label="Femmina" />
              </RadioGroup>
            </FormControl>
            <TextField
              label="Comune di nascita"
              value={createFormData.birthCity || ''}
              onChange={(e) => handleCreateChange('birthCity', e.target.value)}
              required
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Email personale"
              type="email"
              value={createFormData.personalEmail || ''}
              onChange={(e) => handleCreateChange('personalEmail', e.target.value)}
              fullWidth
              className="form-field-modern"
            />
            <TextField
              label="Telefono"
              value={createFormData.phoneNumber || ''}
              onChange={(e) => handleCreateChange('phoneNumber', e.target.value)}
              fullWidth
              className="form-field-modern"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button className="btn-ghost-modern" onClick={handleCancelCreate}>Annulla</Button>
          <Button
            className="btn-primary-modern"
            onClick={handleCreateEmployee}
            disabled={createLoading}
          >
            {createLoading ? 'Creazione...' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default WorkersCenter