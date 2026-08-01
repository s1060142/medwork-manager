import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
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
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EditIcon from '@mui/icons-material/Edit'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import ArchiveIcon from '@mui/icons-material/Archive'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import MoreVertIcon from '@mui/icons-material/MoreVert'

const defaultEmployeeFormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  taxCode: '',
  email: '',
  phone: '',
  address: '',
  companyId: '',
  branchId: '',
  jobRole: '',
  hireDate: '',
}

export default function WorkersCenter({
  config,
  currentRole = '',
  activeCompanyId = '',
  activeBranchId = '',
  externalCreateToken = 0,
  onExternalCreateConsumed = () => {},
}) {
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
  const [archivedIds, setArchivedIds] = useState(() => {
    try {
      const archived = localStorage.getItem('medwork.archivedEmployees')
      return archived ? JSON.parse(archived) : []
    } catch {
      return []
    }
  })
  const [companyFilter, setCompanyFilter] = useState('')

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

  const saveArchived = (ids) => {
    try {
      localStorage.setItem('medwork.archivedEmployees', JSON.stringify(ids))
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    saveArchived(archivedIds)
  }, [archivedIds])

  const toDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString)
  }

  const classifyFitness = (outcome) => {
    if (!outcome) return { key: 'none', label: 'Non valutato', color: 'grey' }
    const outcomeLower = outcome.toLowerCase()
    if (outcomeLower.includes('idoneo') || outcomeLower.includes('fit')) {
      if (outcomeLower.includes('parziale') || outcomeLower.includes('partial'))
        return { key: 'partial', label: 'Parzialmente idoneo', color: 'orange' }
      return { key: 'fit', label: 'Idoneo', color: 'green' }
    }
    if (outcomeLower.includes('non idoneo') || outcomeLower.includes('not fit'))
      return { key: 'not-fit', label: 'Non idoneo', color: 'red' }
    return { key: 'none', label: 'Non valutato', color: 'grey' }
  }

  const normalizeText = (text) => {
    if (!text) return ''
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  useEffect(() => {
    if (externalCreateToken && externalCreateToken !== 0) {
      setCreateDialogOpen(true)
    }
  }, [externalCreateToken])

  const workerRows = useMemo(() => {
    return employees
      .map((employee) => {
        const latestVisit = visits.reduce((latest, visit) => {
          if (Number(visit.employeeId) === Number(employee.id)) {
            const visitDate = toDate(visit.visitDate)
            if (!latest) return visit
            const latestDate = toDate(latest.visitDate)
            if (!latestDate) return visit
            return visitDate > latestDate ? visit : latest
          }
          return latest
        }, null)

        const fitness = classifyFitness(latestVisit?.outcome)
        return {
          ...employee,
          latestVisitDate: latestVisit?.visitDate || null,
          latestOutcome: latestVisit?.outcome || '',
          fitness,
          isArchived: archivedIds.includes(Number(employee.id)),
          jobRoleDisplay: employee.jobRole || '-',
          workingStatus: 'Attivo',
        }
      })
      .sort((left, right) => String(left.lastName || '').localeCompare(String(right.lastName || '')))
  }, [employees, visits, archivedIds])

  const filteredRows = useMemo(() => {
    const needle = normalizeText(search)

    return workerRows.filter((row) => {
      if (!showArchived && row.isArchived) return false
      if (fitnessFilter !== 'all' && row.fitness.key !== fitnessFilter) return false
      if (companyFilter && String(row.companyId) !== String(companyFilter)) return false

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
    appendAuditEvent({
      module: 'Lavoratori',
      action: archivedIds.includes(id) ? 'Restore' : 'Archive',
      detail: `ID: ${id}`
    })
  }

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Eliminare definitivamente questo lavoratore? Questa azione è irreversibile.')) return

    try {
      await apiSend('DELETE', `/api/master-data/employees/${employeeId}`)
      setEmployees(prev => prev.filter(emp => Number(emp.id) !== Number(employeeId)))
      setArchivedIds(prev => prev.filter(id => id !== Number(employeeId)))
      appendAuditEvent({
        module: 'Lavoratori',
        action: 'Delete',
        detail: `ID: ${employeeId}`
      })
    } catch (error) {
      setError(`Errore nell'eliminazione: ${error.message}`)
    }
  }

  const handleArchive = (employeeId) => {
    toggleArchived(employeeId)
  }

  const handleRestore = (employeeId) => {
    toggleArchived(employeeId)
  }

  const handleEdit = (employeeId) => {
    const employee = employees.find(emp => Number(emp.id) === Number(employeeId))
    if (!employee) return

    setEditFormData({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      dateOfBirth: employee.dateOfBirth || '',
      taxCode: employee.taxCode || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      companyId: employee.companyId || '',
      branchId: employee.branchId || '',
      jobRole: employee.jobRole || '',
      hireDate: employee.hireDate || '',
    })
    setEditingEmployeeId(employeeId)
    setEditDialogOpen(true)
  }

  const handleEditSave = async () => {
    if (!editingEmployeeId) return

    setEditLoading(true)
    setEditError('')

    try {
      await apiSend('PUT', `/api/master-data/employees/${editingEmployeeId}`, editFormData)
      setEmployees(prev =>
        prev.map(emp =>
          Number(emp.id) === Number(editingEmployeeId)
            ? { ...emp, ...editFormData }
            : emp
        )
      )
      setEditDialogOpen(false)
      appendAuditEvent({
        module: 'Lavoratori',
        action: 'Update',
        detail: `ID: ${editingEmployeeId}`
      })
    } catch (error) {
      setEditError(`Errore nel salvataggio: ${error.message}`)
    } finally {
      setEditLoading(false)
    }
  }

  const handleEditCancel = () => {
    setEditDialogOpen(false)
    setEditError('')
  }

  const handleCreate = () => {
    setCreateFormData(defaultEmployeeFormData)
    setCreateDialogOpen(true)
  }

  const handleCreateSave = async () => {
    setCreateLoading(true)
    setCreateError('')

    try {
      const newEmployee = await apiSend('POST', `/api/master-data/employees`, createFormData)
      setEmployees(prev => [...prev, newEmployee])
      setCreateDialogOpen(false)
      appendAuditEvent({
        module: 'Lavoratori',
        action: 'Create',
        detail: `ID: ${newEmployee.id}`
      })
      onExternalCreateConsumed()
    } catch (error) {
      setCreateError(`Errore nella creazione: ${error.message}`)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCreateCancel = () => {
    setCreateDialogOpen(false)
    setCreateError('')
  }

  const handleExternalCreate = () => {
    setCreateDialogOpen(true)
  }

  const renderTabContent = () => {
    if (activeTab === 'workers') {
      return (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200 }}>
              <TextField
                label="Cerca lavoratori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca per nome, cognome, codice fiscale..."
                size="small"
                variant="outlined"
                sx={{ width: 250 }}
              />
              <Tooltip title="Filtro per idoneità">
                <IconButton
                  size="small"
                  aria-label="Filtro idoneità"
                  onClick={() => {
                    // Simple toggle for demo
                    setFitnessFilter(fitnessFilter === 'all' ? 'fit' : 'all')
                  }}
                >
                  <FilterListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mostra archiviati">
                <IconButton
                  size="small"
                  aria-label="Mostra archiviati"
                  onClick={() => setShowArchived(!showArchived)}
                  color={showArchived ? 'success' : 'default'}
                >
                  {showArchived ? <ArchiveIcon fontSize="small" /> : <UnarchiveIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Aggiungi nuovo lavoratore">
                <IconButton
                  size="small"
                  aria-label="Aggiungi lavoratore"
                  color="success"
                  onClick={handleCreate}
                >
                  <PersonIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {companyFilter && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Filtro azienda:
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setCompanyFilter('')
                  }}
                >
                  X
                </Button>
              </Box>
            )}
          </Box>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h6">
                    Lavoratori ({filteredRows.length} su {employees.length} totali)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Tooltip title="Esporta elenco">
                    <IconButton size="small" aria-label="Esporta elenco">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cognome</TableCell>
                      <TableCell>Nome</TableCell>
                      <TableCell>Codice Fiscale</TableCell>
                      <TableCell>Data Nascita</TableCell>
                      <TableCell>Ruolo</TableCell>
                      <TableCell>Azienda</TableCell>
                      <TableCell>Sede</TableCell>
                      <TableCell>Ultima Visita</TableCell>
                      <TableCell>Idoneità</TableCell>
                      <TableCell>Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.lastName || '-'}</TableCell>
                        <TableCell>{row.firstName || '-'}</TableCell>
                        <TableCell>{row.taxCode || '-'}</TableCell>
                        <TableCell>
                          {row.dateOfBirth ? new Date(row.dateOfBirth).toLocaleDateString('it-IT') : '-'}
                        </TableCell>
                        <TableCell>{row.jobRoleDisplay}</TableCell>
                        <TableCell>
                          {companies.find(c => Number(c.id) === Number(row.companyId))?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {branches.find(b => Number(b.id) === Number(row.branchId))?.city || '-'}
                        </TableCell>
                        <TableCell>
                          {row.latestVisitDate ? new Date(row.latestVisitDate).toLocaleDateString('it-IT') : 'Nessuna visita'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DotIndicator color={row.fitness.key} />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {row.fitness.label}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {!row.isArchived && (
                              <Tooltip title="Modifica lavoratore">
                                <IconButton
                                  size="small"
                                  aria-label="Modifica lavoratore"
                                  onClick={() => handleEdit(row.id)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {!row.isArchived && (
                              <Tooltip title="Archivia lavoratore">
                                <IconButton
                                  size="small"
                                  aria-label="Archivia lavoratore"
                                  color="warning"
                                  onClick={() => handleArchive(row.id)}
                                >
                                  <ArchiveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {row.isArchived && (
                              <Tooltip title="Ripristina lavoratore">
                                <IconButton
                                  size="small"
                                  aria-label="Ripristina lavoratore"
                                  color="success"
                                  onClick={() => handleRestore(row.id)}
                                >
                                  <UnarchiveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {!row.isArchived && (
                              <Tooltip title="Elimina lavoratore">
                                <IconButton
                                  size="small"
                                  aria-label="Elimina lavoratore"
                                  color="error"
                                  onClick={() => handleDelete(row.id)}
                                >
                                  <DeleteForeverIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10}>
                          <Box sx={{ textAlign: 'center', py: 3 }}>
                            {showArchived
                              ? 'Nessun lavoratore archiviato trovato'
                              : 'Nessun lavoratore trovato corrispondente ai filtri'}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Statistiche idoneità (attivi):
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="success.main">
                        {kpi.fit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Idonei
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="warning.main">
                        {kpi.partial}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Parzialmente idonei
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="error.main">
                        {kpi.notFit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Non idonei
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="grey">
                        {kpi.none}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Non valutati
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Distribuzione per ruolo (attivi):
                  </Typography>
                  {contextualRolesWithCount.map((role) => (
                    <Box key={role.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {role.name}:
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ ml: 1, fontWeight: 500 }}>
                        {role.count}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </>
          )}
        </>
      )
    }

    if (activeTab === 'visits') {
      return (
        <Box>
          <Typography variant="h5" gutterBottom>
            Visite mediche
          </Typography>
          {/* Visite tab content would go here */}
          <Typography variant="body2" color="text.secondary">
            Sezione visite in sviluppo...
          </Typography>
        </Box>
      )
    }

    return null
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Button
          variant="text"
          size="small"
          selected={activeTab === 'workers'}
          onClick={() => setActiveTab('workers')}
        >
          Lavoratori
        </Button>
        <Button
          variant="text"
          size="small"
          selected={activeTab === 'visits'}
          onClick={() => setActiveTab('visits')}
        >
          Visite
        </Button>
      </Box>

      {renderTabContent()}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Modifica lavoratore
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Nome"
            value={editFormData.firstName || ''}
            onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Cognome"
            value={editFormData.lastName || ''}
            onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Data di nascita"
            type="date"
            value={editFormData.dateOfBirth || ''}
            onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
            inputFormat="yyyy-MM-dd"
            fullWidth
          />
          <TextField
            label="Codice fiscale"
            value={editFormData.taxCode || ''}
            onChange={(e) => setEditFormData({ ...editFormData, taxCode: e.target.value })}
            required
            fullWidth
            inputMode="text"
          />
          <TextField
            label="Email"
            value={editFormData.email || ''}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            type="email"
            fullWidth
          />
          <TextField
            label="Telefono"
            value={editFormData.phone || ''}
            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            fullWidth
          />
          <TextField
            label="Indirizzo"
            value={editFormData.address || ''}
            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
            fullWidth
          />
          <FormControlLabel
            control={
              <Select
                label="Azienda"
                value={editFormData.companyId || ''}
                onChange={(e) => setEditFormData({ ...editFormData, companyId: e.target.value })}
                labelId="company-label"
                id="company-select"
                fullWidth
              >
                <MenuItem value="">
                  Nessuna azienda
                </MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            }
          />
          <FormControlLabel
            control={
              <Select
                label="Sede"
                value={editFormData.branchId || ''}
                onChange={(e) => setEditFormData({ ...editFormData, branchId: e.target.value })}
                labelId="branch-label"
                id="branch-select"
                fullWidth
                disabled={!editFormData.companyId}
              >
                <MenuItem value="">
                  Nessuna sede
                </MenuItem>
                {editFormData.companyId
                  ? branches
                      .filter(b => Number(b.companyId) === Number(editFormData.companyId))
                      .map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.city || ''} {branch.address || ''}
                        </MenuItem>
                      ))
                  : []}
              </Select>
            }
          />
          <FormControlLabel
            control={
              <Select
                label="Mansione"
                value={editFormData.jobRole || ''}
                onChange={(e) => setEditFormData({ ...editFormData, jobRole: e.target.value })}
                labelId="role-label"
                id="role-select"
                fullWidth
              >
                <MenuItem value="">
                  Nessuna mansione
                </MenuItem>
                {jobRoles.map((role) => (
                  <MenuItem key={role.id} value={role.name}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            }
          />
          <TextField
            label="Data assunzione"
            type="date"
            value={editFormData.hireDate || ''}
            onChange={(e) => setEditFormData({ ...editFormData, hireDate: e.target.value })}
            inputFormat="yyyy-MM-dd"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>
            Annulla
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleEditSave}
            disabled={editLoading}
          >
            {editLoading ? 'Salvataggio...' : 'Salva modifiche'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCreateCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Nuovo lavoratore
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Nome"
            value={createFormData.firstName || ''}
            onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Cognome"
            value={createFormData.lastName || ''}
            onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Data di nascita"
            type="date"
            value={createFormData.dateOfBirth || ''}
            onChange={(e) => setCreateFormData({ ...createFormData, dateOfBirth: e.target.value })}
            inputFormat="yyyy-MM-dd"
            fullWidth
          />
          <TextField
            label="Codice fiscale"
            value={createFormData.taxCode || ''}
            onChange={(e) => setCreateFormData({ ...createFormData, taxCode: e.target.value })}
            required
            fullWidth
            inputMode="text"
          />
          <TextField
            label="Email"
            value={createFormData.email || ''}
            onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
            type="email"
            fullWidth
          />
          <TextField
            label="Telefono"
            value={createFormData.phone || ''}
            onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
            fullWidth
          />
          <TextField
            label="Indirizzo"
            value={createFormData.address || ''}
            onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
            fullWidth
          />
          <FormControlLabel
            control={
              <Select
                label="Azienda"
                value={createFormData.companyId || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, companyId: e.target.value })}
                labelId="company-label-create"
                id="company-select-create"
                fullWidth
              >
                <MenuItem value="">
                  Nessuna azienda
                </MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            }
          />
          <FormControlLabel
            control={
              <Select
                label="Sede"
                value={createFormData.branchId || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, branchId: e.target.value })}
                labelId="branch-label-create"
                id="branch-select-create"
                fullWidth
                disabled={!createFormData.companyId}
              >
                <MenuItem value="">
                  Nessuna sede
                </MenuItem>
                {createFormData.companyId
                  ? branches
                      .filter(b => Number(b.companyId) === Number(createFormData.companyId))
                      .map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.city || ''} {branch.address || ''}
                        </MenuItem>
                      ))
                  : []}
              </Select>
            }
          />
          <FormControlLabel
            control={
              <Select
                label="Mansione"
                value={createFormData.jobRole || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, jobRole: e.target.value })}
                labelId="role-label-create"
                id="role-select-create"
                fullWidth
              >
                <MenuItem value="">
                  Nessuna mansione
                </MenuItem>
                {jobRoles.map((role) => (
                  <MenuItem key={role.id} value={role.name}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            }
          />
          <TextField
            label="Data assunzione"
            type="date"
            value={createFormData.hireDate || ''}
            onChange={(e) => setCreateFormData({ ...createFormData, hireDate: e.target.value })}
            inputFormat="yyyy-MM-dd"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateCancel}>
            Annulla
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateSave}
            disabled={createLoading}
          >
            {createLoading ? 'Creazione...' : 'Crea lavoratore'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// Helper component for dot indicator
function DotIndicator({ color }) {
  const colorMap = {
    fit: 'success.main',
    partial: 'warning.main',
    'not-fit': 'error.main',
    none: 'grey',
    grey: 'grey',
  }
  return (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: colorMap[color] || 'grey',
      }}
    />
  )
}

// Unarchive icon (since MUI doesn't have one, we'll use Archive with rotation)
function UnarchiveIcon(props) {
  return (
    <ArchiveIcon
      {...props}
      sx={{ transform: 'rotate(180deg)' }}
    />
  )
}