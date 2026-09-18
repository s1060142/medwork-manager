import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
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
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SendIcon from '@mui/icons-material/Send'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import { apiGet, apiSend } from '../services/apiClient'

function toDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleDateString('it-IT') : '-'
}

function addDays(fromDate, days) {
  const date = new Date(fromDate)
  date.setDate(date.getDate() + days)
  return date
}

function VisitPlanningCenter({ activeCompanyId = '', activeBranchId = '', onOpenMedicalVisitCreate }) {
  const [days, setDays] = useState(60)
  const [visits, setVisits] = useState([])
  const [employees, setEmployees] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  
  // Multi-select for Batch Scheduling
  const [selectedEmpIds, setSelectedEmpIds] = useState([])
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchDoctorId, setBatchDoctorId] = useState('')
  const [batchDate, setBatchDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [batchStartTime, setBatchStartTime] = useState('08:30')
  const [batchInterval, setBatchInterval] = useState(20)
  const [batchLocation, setBatchLocation] = useState('Sede Aziendale / Ambulatorio')
  const [planningBatch, setPlanningBatch] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      setSaveMessage('')

      const [visitData, employeeData, doctorData] = await Promise.all([
        apiGet('/api/master-data/medical-visits'),
        apiGet('/api/master-data/employees'),
        apiGet('/api/master-data/doctors').catch(() => []),
      ])

      setVisits(Array.isArray(visitData) ? visitData : [])
      setEmployees(Array.isArray(employeeData) ? employeeData : [])
      setDoctors(Array.isArray(doctorData) ? doctorData : [])
      if (Array.isArray(doctorData) && doctorData.length > 0) {
        setBatchDoctorId(doctorData[0].id)
      }
    } catch (requestError) {
      setError(requestError.message || 'Errore nel caricamento della pianificazione visite.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const latestVisitsByEmployee = useMemo(() => {
    return visits.reduce((accumulator, item) => {
      const key = Number(item.employeeId)
      const date = toDate(item.visitDate)
      if (!date) return accumulator
      if (!accumulator[key] || date > toDate(accumulator[key].visitDate)) {
        accumulator[key] = item
      }
      return accumulator
    }, {})
  }, [visits])

  const scopedEmployees = useMemo(() => {
    return employees.filter((item) => {
      if (activeCompanyId && activeCompanyId !== 'all' && Number(item.companyId) !== Number(activeCompanyId)) {
        return false
      }

      if (activeBranchId && activeBranchId !== 'all' && Number(item.branchId) !== Number(activeBranchId)) {
        return false
      }

      return true
    })
  }, [employees, activeCompanyId, activeBranchId])

  const scopedEmployeeIds = useMemo(() => new Set(scopedEmployees.map((item) => Number(item.id))), [scopedEmployees])

  const scopedLatestVisits = useMemo(() => {
    return Object.fromEntries(
      Object.entries(latestVisitsByEmployee).filter(([employeeId]) => scopedEmployeeIds.has(Number(employeeId))),
    )
  }, [latestVisitsByEmployee, scopedEmployeeIds])

  const planRows = useMemo(() => {
    const now = new Date()
    const max = new Date(now)
    max.setDate(max.getDate() + days)

    // Also include active workers who have never had a visit
    const workersWithVisits = Object.values(scopedLatestVisits)
      .filter((visit) => {
        const deadline = toDate(visit.nextDeadlineDate)
        return deadline && deadline <= max
      })
      .map((visit) => {
        const deadline = toDate(visit.nextDeadlineDate)
        const suggestedDate = addDays(deadline || now, -3)
        const emp = scopedEmployees.find((x) => Number(x.id) === Number(visit.employeeId))

        return {
          employeeId: visit.employeeId,
          employeeFullName: emp ? `${emp.firstName} ${emp.lastName}` : (visit.employeeFullName || `Dipendente #${visit.employeeId}`),
          taxCode: emp?.taxCode || 'N/D',
          companyName: emp?.companyName || '-',
          jobRole: emp?.jobRole || 'Mansione N/D',
          visitType: visit.visitType || 'Periodica',
          deadline: visit.nextDeadlineDate,
          suggestedDate,
          suggestedDoctorName: 'Medico competente',
        }
      })

    const workersWithoutVisits = scopedEmployees
      .filter(e => !scopedLatestVisits[e.id])
      .map(emp => ({
        employeeId: emp.id,
        employeeFullName: `${emp.firstName} ${emp.lastName}`,
        taxCode: emp.taxCode || 'N/D',
        companyName: emp.companyName || '-',
        jobRole: emp.jobRole || 'Mansione N/D',
        visitType: 'Preventiva (Assunzione)',
        deadline: new Date().toISOString(),
        suggestedDate: new Date(),
        suggestedDoctorName: 'Medico competente',
      }))

    return [...workersWithVisits, ...workersWithoutVisits]
      .sort((left, right) => new Date(left.deadline) - new Date(right.deadline))
  }, [scopedLatestVisits, days, scopedEmployees])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmpIds(planRows.map(r => r.employeeId))
    } else {
      setSelectedEmpIds([])
    }
  }

  const handleToggleRow = (empId) => {
    setSelectedEmpIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    )
  }

  const handleBatchPlanSubmit = async () => {
    if (selectedEmpIds.length === 0) return
    setPlanningBatch(true)
    setError('')
    try {
      const res = await apiSend('POST', '/api/doctor-data/batch-plan-visits', {
        companyId: activeCompanyId ? Number(activeCompanyId) : 0,
        doctorId: Number(batchDoctorId) || 0,
        startDate: new Date(batchDate).toISOString(),
        startTime: batchStartTime,
        intervalMinutes: Number(batchInterval),
        location: batchLocation,
        employeeIds: selectedEmpIds,
      })
      setSaveMessage(`✓ ${res.message || `Pianificate con successo ${selectedEmpIds.length} visite mediche!`}`)
      setBatchModalOpen(false)
      setSelectedEmpIds([])
      await load()
    } catch (err) {
      setError(err.message || 'Errore durante la pianificazione massiva.')
    } finally {
      setPlanningBatch(false)
    }
  }

  const sendConvocation = async (row) => {
    try {
      setSaveMessage('')
      await apiSend('POST', '/api/doctor-data/convocations', {
        employeeId: row.employeeId,
        channel: 'Email',
        messageText: `Convocazione visita ${row.visitType} per ${row.employeeFullName}. Data proposta: ${formatDate(row.suggestedDate)} con il medico competente.`,
      })
      setSaveMessage(`Convocazione registrata per ${row.employeeFullName}.`)
    } catch (requestError) {
      setError(requestError.message || 'Errore durante la convocazione.')
    }
  }

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#0f1f3d">
              Pianificazione Visite & Batch Session Planner
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Incrocio automatico tra scadenze lavoratori e pianificazione in blocco di sessioni di visita.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <TextField
              select
              size="small"
              label="Orizzonte temporale"
              value={days}
              onChange={(event) => setDays(Number(event.target.value) || 60)}
              sx={{ minWidth: 160 }}
            >
              {[15, 30, 45, 60, 90, 180].map((value) => (
                <MenuItem key={value} value={value}>{value} giorni</MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained"
              color="primary"
              startIcon={<GroupAddIcon />}
              disabled={selectedEmpIds.length === 0}
              onClick={() => setBatchModalOpen(true)}
              sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, textTransform: 'none', fontWeight: 700 }}
            >
              ⚡ Pianifica Sessione Massiva ({selectedEmpIds.length})
            </Button>

            <Button variant="outlined" onClick={load}>Aggiorna</Button>
            <Button variant="contained" color="success" onClick={() => onOpenMedicalVisitCreate && onOpenMedicalVisitCreate()}>
              + Nuova Visita Singola
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {!!error && <Alert severity="error">{error}</Alert>}
      {!!saveMessage && <Alert severity="success">{saveMessage}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={planRows.length > 0 && selectedEmpIds.length === planRows.length}
                    indeterminate={selectedEmpIds.length > 0 && selectedEmpIds.length < planRows.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell><strong>Lavoratore</strong></TableCell>
                <TableCell><strong>Azienda & Mansione</strong></TableCell>
                <TableCell><strong>Scadenza / Stato</strong></TableCell>
                <TableCell><strong>Tipo Visita</strong></TableCell>
                <TableCell><strong>Data Proposta</strong></TableCell>
                <TableCell align="right"><strong>Azioni Rapide</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : planRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">Nessuna visita in scadenza entro l&apos;orizzonte selezionato.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                planRows.map((row) => {
                  const isSelected = selectedEmpIds.includes(row.employeeId)
                  return (
                    <TableRow key={`${row.employeeId}-${row.deadline}`} hover selected={isSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleRow(row.employeeId)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{row.employeeFullName}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{row.taxCode}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.companyName}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.jobRole}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={new Date(row.deadline) < new Date() ? 'error' : 'warning'}
                          label={formatDate(row.deadline)}
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{row.visitType}</TableCell>
                      <TableCell>{formatDate(row.suggestedDate)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => onOpenMedicalVisitCreate && onOpenMedicalVisitCreate(row.employeeId)}
                            sx={{ textTransform: 'none' }}
                          >
                            Visita
                          </Button>
                          <Button size="small" variant="outlined" onClick={() => sendConvocation(row)} sx={{ textTransform: 'none' }}>
                            Convoca
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* BATCH SCHEDULING MODAL */}
      <Dialog open={batchModalOpen} onClose={() => setBatchModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0284c7', color: '#ffffff', py: 2 }}>
          ⚡ Pianifica Sessione Massiva Visite ({selectedEmpIds.length} Lavoratori Selezionati)
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Imposta i parametri della sessione medica: MedWork calcolerà automaticamente gli slot orari consecutivi per ciascun lavoratore e genererà le schede di visita in blocco.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Medico Competente Incaricato *"
                value={batchDoctorId}
                onChange={(e) => setBatchDoctorId(e.target.value)}
              >
                {doctors.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Data della Sessione *"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                type="time"
                fullWidth
                size="small"
                label="Ora Inizio Sessione *"
                value={batchStartTime}
                onChange={(e) => setBatchStartTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Durata per Visita"
                value={batchInterval}
                onChange={(e) => setBatchInterval(Number(e.target.value))}
              >
                <MenuItem value={15}>15 minuti per lavoratore</MenuItem>
                <MenuItem value={20}>20 minuti per lavoratore</MenuItem>
                <MenuItem value={30}>30 minuti per lavoratore</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Luogo / Ambulatorio"
                value={batchLocation}
                onChange={(e) => setBatchLocation(e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Anteprima Slot Orari Generati ({selectedEmpIds.length} Pazienti):
          </Typography>

          <Box sx={{ maxHeight: 180, overflowY: 'auto', bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Stack spacing={1}>
              {selectedEmpIds.map((id, index) => {
                const emp = planRows.find(r => r.employeeId === id)
                const startMins = (parseInt(batchStartTime.split(':')[0] || '8', 10) * 60) + parseInt(batchStartTime.split(':')[1] || '30', 10)
                const itemMins = startMins + (index * batchInterval)
                const hours = Math.floor(itemMins / 60).toString().padStart(2, '0')
                const mins = (itemMins % 60).toString().padStart(2, '0')
                return (
                  <Stack key={id} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      <strong>{hours}:{mins}</strong> — {emp?.employeeFullName || `Dipendente #${id}`} ({emp?.companyName || 'Azienda'})
                    </Typography>
                    <Chip label="Periodica" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                  </Stack>
                )
              })}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBatchModalOpen(false)} disabled={planningBatch}>Annulla</Button>
          <Button
            variant="contained"
            onClick={handleBatchPlanSubmit}
            disabled={planningBatch}
            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 700 }}
          >
            {planningBatch ? 'Generazione in corso...' : 'Conferma & Genera Sessione in Blocco'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default VisitPlanningCenter
