import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  Typography,
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { apiGet, apiSend } from '../services/apiClient'
import { showNotification } from '../utils/notification'
import { calculateItalianTaxCode } from '../utils/taxCode'
import { getItalianMunicipalities } from '../services/municipalityService'
import SearchIcon from '@mui/icons-material/Search'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import BoltIcon from '@mui/icons-material/Bolt'
import WorkerFormDialog from './WorkerFormDialog'

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

function classifyFitness(outcome, outcomeCode) {
  // Prefer structured outcomeCode over regex on text
  if (outcomeCode) {
    if (outcomeCode === 'NONIDONE0') return { key: 'not-fit', label: 'Non idoneo', color: 'error' }
    if (outcomeCode === 'IDONE0L') return { key: 'partial', label: 'Con limitazioni', color: 'warning' }
    if (outcomeCode === 'IDONE0P') return { key: 'partial', label: 'Con prescrizioni', color: 'warning' }
    if (outcomeCode === 'IDONE0') return { key: 'fit', label: 'Idoneo', color: 'success' }
    if (outcomeCode === 'INATTESA') return { key: 'pending', label: 'In attesa', color: 'default' }
  }
  // Fallback regex on text
  const text = normalizeText(outcome)
  if (!text.trim()) return { key: 'none', label: 'Senza idoneità', color: 'default' }
  if (text.includes('non idone')) return { key: 'not-fit', label: 'Non idoneo', color: 'error' }
  if (text.includes('prescr') || text.includes('parzial') || text.includes('limit')) {
    return { key: 'partial', label: 'Parz. idoneo', color: 'warning' }
  }
  if (text.includes('idone')) return { key: 'fit', label: 'Idoneo', color: 'success' }
  return { key: 'none', label: 'Senza idoneità', color: 'default' }
}

function WorkersCenter({ activeCompanyId = '', activeBranchId = '', onOpenEmployeeCreate, onOpenEmployeeProfile, onOpenMedicalVisitCreate, onDeleteConfirm }) {
  const [employees, setEmployees] = useState([])
  const [visits, setVisits] = useState([])
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [jobRoles, setJobRoles] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [workerSearch, setWorkerSearch] = useState('')
  const [workerStatus, setWorkerStatus] = useState('active')
  const [selectedDoctorId, setSelectedDoctorId] = useState('all')
  const [selectedRowId, setSelectedRowId] = useState(null)

  const handleOpenRow = (row) => {
    if (!row) return
    setSelectedRowId(row.id)
    onOpenEmployeeProfile?.(row)
  }

  const activeCompanyName = useMemo(() => {
    if (!activeCompanyId || activeCompanyId === 'all') return ''
    const c = companies.find((item) => String(item.id) === String(activeCompanyId))
    return c?.name || c?.ragioneSociale || `Azienda #${activeCompanyId}`
  }, [companies, activeCompanyId])

  const activeBranchName = useMemo(() => {
    if (!activeBranchId || activeBranchId === 'all') return ''
    const b = branches.find((item) => String(item.id) === String(activeBranchId))
    return b?.name || b?.address || `Sede #${activeBranchId}`
  }, [branches, activeBranchId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      params.set('includeArchived', 'true')
      params.set('pageSize', '1000')
      if (activeCompanyId && activeCompanyId !== 'all') {
        params.set('companyId', String(activeCompanyId))
      }

      const [employeesData, visitsData, companiesData, branchesData, rolesData, doctorsData] = await Promise.all([
        apiGet(`/api/master-data/employees?${params.toString()}`).catch(() => []),
        apiGet('/api/master-data/medical-visits').catch(() => []),
        apiGet('/api/master-data/companies').catch(() => []),
        apiGet('/api/master-data/branches').catch(() => []),
        apiGet('/api/master-data/job-roles').catch(() => []),
        apiGet('/api/master-data/doctors').catch(() => []),
      ])

      const unwrap = (d) => (Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []))

      setEmployees(unwrap(employeesData))
      setVisits(unwrap(visitsData))
      setCompanies(unwrap(companiesData))
      setBranches(unwrap(branchesData))
      setJobRoles(unwrap(rolesData))
      setDoctors(unwrap(doctorsData))
    } catch (requestError) {
      setError(requestError.message || 'Errore nel caricamento dati lavoratori.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeCompanyId, activeBranchId])

  useEffect(() => {
    const handleEmployeeCreated = () => {
      loadData()
    }
    const handleEmployeeUpdated = (event) => {
      const updated = event.detail
      if (updated && updated.id) {
        setEmployees((prev) =>
          prev.map((emp) =>
            Number(emp.id) === Number(updated.id)
              ? {
                  ...emp,
                  ...updated,
                  companyName: updated.companyName ?? emp.companyName,
                  companyDoctorName: updated.companyDoctorName ?? emp.companyDoctorName,
                  jobRoleName: updated.jobRoleName ?? emp.jobRoleName,
                  branchAddress: updated.branchAddress ?? emp.branchAddress,
                }
              : emp
          )
        )
      } else {
        loadData()
      }
    }
    const handleCompanyUpdated = () => {
      loadData()
    }
    window.addEventListener('medwork:employee-created', handleEmployeeCreated)
    window.addEventListener('medwork:employee-updated', handleEmployeeUpdated)
    window.addEventListener('medwork:company-updated', handleCompanyUpdated)
    return () => {
      window.removeEventListener('medwork:company-updated', handleCompanyUpdated)
      window.removeEventListener('medwork:employee-created', handleEmployeeCreated)
      window.removeEventListener('medwork:employee-updated', handleEmployeeUpdated)
    }
  }, [activeCompanyId, activeBranchId])

  const handleResetFilters = () => {
    setWorkerSearch('')
    setWorkerStatus('active')
    setSelectedDoctorId('all')
  }

  const handleToggleArchive = async (row) => {
    const employeeId = Number(row.id)
    const currentArchived = row.isArchived === true
    const newArchived = !currentArchived

    // Optimistically update
    setEmployees((previous) =>
      previous.map((item) =>
        Number(item.id) === employeeId ? { ...item, isArchived: newArchived } : item
      )
    )

    try {
      await apiSend('PATCH', `/api/admin-data/employees/${employeeId}/archive`, {
        isArchived: newArchived,
      })
    } catch (requestError) {
      // Revert on error
      setEmployees((previous) =>
        previous.map((item) =>
          Number(item.id) === employeeId ? { ...item, isArchived: currentArchived } : item
        )
      )
      showNotification(requestError?.message || "Errore durante l'aggiornamento dello stato del lavoratore.", 'error')
    }
  }

  const [workerFormOpen, setWorkerFormOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState(null)

  const handleOpenCreateWorker = () => {
    setEditingWorker(null)
    setWorkerFormOpen(true)
  }

  const handleOpenEditWorker = (row) => {
    setEditingWorker(row)
    setWorkerFormOpen(true)
  }

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, employeeId: undefined, label: '' })

  const handleDeleteEmployee = async (row) => {
    const employeeId = Number(row.id)
    const label = `${row.lastName || ''} ${row.firstName || ''}`.trim() || `ID ${employeeId}`
    setDeleteConfirm({ open: true, employeeId, label })
  }

  const handleDeleteConfirm = async () => {
    const { employeeId } = deleteConfirm
    setDeleteConfirm({ open: false, employeeId: undefined, label: '' })
    if (!employeeId) return
    try {
      await apiSend('DELETE', `/api/admin-data/employees/${employeeId}`)
      setEmployees((previous) => previous.filter((item) => Number(item.id) !== employeeId))
      showNotification('Lavoratore eliminato con successo.', 'success')
      if (onDeleteConfirm) {
        onDeleteConfirm(deleteConfirm)
      }
    } catch (requestError) {
      showNotification(requestError?.message || "Errore durante l'eliminazione del lavoratore.", 'error')
    }
  }

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

  function employeeStatusFilter(list, status) {
    if (status === 'all') return list
    if (status === 'active') return list.filter((item) => !item.isArchived)
    if (status === 'archived') return list.filter((item) => item.isArchived)
    return list
  }

  const filteredWorkerRows = useMemo(() => {
    const needle = normalizeText(workerSearch)
    const source = employees.filter((row) => {
      if (activeCompanyId && activeCompanyId !== 'all' && Number(row.companyId) !== Number(activeCompanyId)) {
        return false
      }
      if (activeBranchId && activeBranchId !== 'all' && Number(row.branchId) !== Number(activeBranchId)) {
        return false
      }
      if (selectedDoctorId && selectedDoctorId !== 'all' && Number(row.companyDoctorId) !== Number(selectedDoctorId)) {
        return false
      }
      return true
    })

    const statusFiltered = employeeStatusFilter(source, workerStatus)

    return statusFiltered
      .map((employee) => {
        const latestVisit = latestVisitByEmployee[Number(employee.id)]
        const fitness = classifyFitness(latestVisit?.outcome, latestVisit?.outcomeCode)
        const nextDue = latestVisit?.nextDeadlineDate ? new Date(latestVisit.nextDeadlineDate) : null
        const isOverdue = nextDue && nextDue < new Date()
        const isDueSoon = nextDue && !isOverdue && nextDue - new Date() < 30 * 24 * 60 * 60 * 1000
        return {
          ...employee,
          latestVisitDate: latestVisit?.visitDate || null,
          latestOutcome: latestVisit?.outcome || '',
          latestOutcomeCode: latestVisit?.outcomeCode || null,
          latestNextDeadline: latestVisit?.nextDeadlineDate || null,
          fitness,
          isOverdue,
          isDueSoon,
          isArchived: employee.isArchived === true,
          jobRoleDisplay: employee.jobRoleName || employee.jobRole || '-',
          workingStatus: 'Attivo',
        }
      })
      .sort((left, right) => String(left.lastName || '').localeCompare(String(right.lastName || '')))
      .filter((row) => {
        if (!needle) return true
        const searchable = `${row.lastName || ''} ${row.firstName || ''} ${row.taxCode || ''} ${row.jobRoleDisplay || ''} ${row.companyDoctorName || ''}`.toLowerCase()
        return searchable.includes(needle)
      })
  }, [employees, workerSearch, workerStatus, selectedDoctorId, latestVisitByEmployee, activeCompanyId, activeBranchId])

  const stats = useMemo(() => {
    const total = filteredWorkerRows.length
    const active = filteredWorkerRows.filter((w) => !w.isArchived).length
    const fit = filteredWorkerRows.filter((w) => w.fitness?.key === 'fit').length
    const overdue = filteredWorkerRows.filter((w) => w.isOverdue).length
    const dueSoon = filteredWorkerRows.filter((w) => w.isDueSoon).length
    return { total, active, fit, overdue, dueSoon }
  }, [filteredWorkerRows])

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 280px' }, gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#ffffff' }}>
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Typography variant="h6" fontWeight={700}>
                Gestione Lavoratori
              </Typography>
              {activeCompanyName ? (
                <Chip
                  icon={<BusinessIcon sx={{ fontSize: '16px !important' }} />}
                  label={`Azienda: ${activeCompanyName}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              ) : (
                <Chip
                  label="Tutte le aziende"
                  size="small"
                  variant="outlined"
                  sx={{ color: 'text.secondary' }}
                />
              )}
              {activeBranchName && (
                <Chip
                  icon={<LocationOnIcon sx={{ fontSize: '16px !important' }} />}
                  label={`Sede: ${activeBranchName}`}
                  color="success"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Anagrafica lavoratori, idoneità e fascicoli sanitari della sorveglianza sanitaria attiva.
            </Typography>
          </Box>

          {/* Quick Metrics / Stats Chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip
              label={`Totale: ${stats.total}`}
              size="small"
              sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}
            />
            <Chip
              label={`Attivi: ${stats.active}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={`Idonei: ${stats.fit}`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            {stats.overdue > 0 && (
              <Chip
                label={`Visite Scadute: ${stats.overdue}`}
                size="small"
                color="error"
                sx={{ fontWeight: 600 }}
              />
            )}
            {stats.dueSoon > 0 && (
              <Chip
                label={`In Scadenza (30gg): ${stats.dueSoon}`}
                size="small"
                color="warning"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Stack>

          {/* Filters Toolbar */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              label="Cerca lavoratore (cognome, nome, CF, mansione...)"
              variant="outlined"
              value={workerSearch}
              onChange={(event) => setWorkerSearch(event.target.value)}
              sx={{ minWidth: 260, flexGrow: 1 }}
            />
            <TextField
              size="small"
              label="Stato Lavoratore"
              select
              variant="outlined"
              value={workerStatus}
              onChange={(event) => setWorkerStatus(event.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="active">Non cessati (Attivi)</MenuItem>
              <MenuItem value="all">Tutti (inclusi archiviati)</MenuItem>
              <MenuItem value="archived">Solo archiviati</MenuItem>
            </TextField>
            <TextField
              size="small"
              label="Medico Competente"
              select
              variant="outlined"
              value={selectedDoctorId}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">Tutti i medici</MenuItem>
              {doctors.map((doc) => (
                <MenuItem key={doc.id} value={doc.id}>
                  {`Dott. ${doc.firstName} ${doc.lastName}`}
                </MenuItem>
              ))}
            </TextField>
            <Button
              type="button"
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleResetFilters}
              sx={{ textTransform: 'none' }}
            >
              Reset
            </Button>
          </Stack>
        </Paper>

        {/* Quick Actions Card */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <BoltIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>
              Quick Actions
            </Typography>
          </Stack>
          <Stack spacing={1}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => onOpenMedicalVisitCreate?.(selectedRowId)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#0f3a74',
                '&:hover': { bgcolor: '#0b2a54' },
              }}
            >
              Nuova Visita Medica
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleOpenCreateWorker}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Nuovo Lavoratore
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={loadData}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Ricarica dati
            </Button>
          </Stack>
        </Paper>
      </Box>

      {/* Workers Table Card */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#ffffff' }}>

        {/* Workers Table */}
        <TableContainer sx={{ borderRadius: 2, border: '1px solid #e5e7eb' }}>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Lavoratore</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Azienda</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Data nascita</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mansione</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Medico Competente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reparto</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ultima visita</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Prossima scadenza</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Idoneità</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWorkerRows.map((row) => {
                const latestVisit = latestVisitByEmployee[Number(row.id)]
                const isSelected = selectedRowId === row.id
                return (
                  <TableRow
                    key={row.id}
                    hover
                    tabIndex={0}
                    selected={isSelected}
                    onClick={() => setSelectedRowId(row.id)}
                    onDoubleClick={() => handleOpenRow(row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleOpenRow(row)
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.12) !important' },
                      '&:focus': { outline: '2px solid #3b82f6', outlineOffset: '-2px' },
                      backgroundColor: row.isOverdue
                        ? 'rgba(211,47,47,0.05)'
                        : row.isDueSoon
                        ? 'rgba(237,108,2,0.04)'
                        : 'inherit',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {row.isOverdue && <span title="Visita scaduta">🔴</span>}
                        {row.isDueSoon && !row.isOverdue && <span title="Visita in scadenza">🟡</span>}
                        {`${row.lastName || ''} ${row.firstName || ''}`.trim()}
                      </Box>
                      {row.taxCode && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {row.taxCode}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{row.companyName || '-'}</TableCell>
                    <TableCell>{formatDate(row.birthDate)}</TableCell>
                    <TableCell>{row.jobRoleDisplay}</TableCell>
                    <TableCell sx={{ color: row.companyDoctorName ? '#0f4c81' : 'text.secondary', fontWeight: row.companyDoctorName ? 500 : 400 }}>
                      {row.companyDoctorName || '-'}
                    </TableCell>
                    <TableCell>{row.reparto || '-'}</TableCell>
                    <TableCell>{formatDate(row.dataUltimaVisita || latestVisit?.visitDate)}</TableCell>
                    <TableCell
                      sx={{
                        color: row.isOverdue ? 'error.main' : row.isDueSoon ? 'warning.main' : 'inherit',
                        fontWeight: row.isOverdue || row.isDueSoon ? 600 : 400,
                      }}
                    >
                      {formatDate(latestVisit?.nextDeadlineDate || row.dataProssimaVisita)}
                    </TableCell>
                    <TableCell>
                      {row.fitness.key !== 'none' ? (
                        <Chip
                          size="small"
                          label={row.fitness.label}
                          color={row.fitness.color}
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          title="Apri cartella sanitaria"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenEmployeeProfile?.(row)
                          }}
                          sx={{ minWidth: 32, px: 1, textTransform: 'none', fontSize: '12px' }}
                        >
                          📋 Cartella
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          title="Modifica anagrafica lavoratore"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEditWorker(row)
                          }}
                          sx={{ minWidth: 32, px: 0.8 }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color={row.isArchived ? 'info' : 'warning'}
                          title={row.isArchived ? 'Ripristina lavoratore' : 'Archivia lavoratore'}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleArchive(row)
                          }}
                          sx={{ minWidth: 32, px: 0.8 }}
                        >
                          📁
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          title="Elimina lavoratore"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEmployee(row)
                          }}
                          sx={{ minWidth: 32, px: 0.8 }}
                        >
                          🗑️
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredWorkerRows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nessun lavoratore trovato per il contesto e i filtri selezionati.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box />
          <Typography variant="caption" color="text.secondary">
            {filteredWorkerRows.length
              ? `${filteredWorkerRows.length} lavoratori mostrati`
              : 'Nessun lavoratore'}
          </Typography>
        </Box>
      </Paper>

      {!!error && <Alert severity="error">{error}</Alert>}
      {loading && <Alert severity="info">Caricamento dati in corso...</Alert>}

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, employeeId: undefined, label: '' })}>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14, color: '#4b5563', mt: 1 }}>
            Sei sicuro di voler eliminare il lavoratore <strong>{deleteConfirm.label}</strong>? L'operazione non è reversibile.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setDeleteConfirm({ open: false, employeeId: undefined, label: '' })}>
            Annulla
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      {/* UNIFIED WORKER FORM DIALOG */}
      <WorkerFormDialog
        open={workerFormOpen}
        onClose={() => {
          setWorkerFormOpen(false)
          setEditingWorker(null)
        }}
        onSaved={() => {
          loadData()
        }}
        initialCompanyId={activeCompanyId}
        initialBranchId={activeBranchId}
        worker={editingWorker}
      />
    </Stack>
  )
}

export default WorkersCenter
