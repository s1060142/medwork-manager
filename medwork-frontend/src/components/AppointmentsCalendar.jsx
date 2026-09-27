import { useEffect, useMemo, useState, useCallback } from 'react'
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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TodayIcon from '@mui/icons-material/Today'
import EventIcon from '@mui/icons-material/Event'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import { apiGet, apiSend } from '../services/apiClient'
import { showNotification } from '../utils/notification'

const WEEK_DAYS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM']

const VISIT_TYPES = [
  { value: 'Periodic', label: 'Visita Periodica (Sorveglianza Sanitaria)' },
  { value: 'Preventive', label: 'Visita Preventiva / Preassuntiva' },
  { value: 'OnRequest', label: 'Visita su Richiesta del Lavoratore' },
  { value: 'ChangeOfDuty', label: 'Visita per Cambio Mansione' },
  { value: 'ReturnFromIllness', label: 'Visita Rientro Malattia / Infortunio (>60gg)' },
  { value: 'Extraordinary', label: 'Visita Straordinaria' },
  { value: 'Termination', label: 'Visita di Fine Rapporto' },
  { value: 'Vaccination', label: 'Vaccinazione Lavorativa' },
  { value: 'ClinicalExams', label: 'Accertamenti Strumentali / Esami' },
]

function atStartOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatDayTime(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(date) {
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateInput(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function visitCategory(visitType) {
  const value = String(visitType || '').toLowerCase()
  if (value.includes('vacc')) return 'Vaccinations'
  if (value.includes('exam') || value.includes('esam')) return 'Clinical Exams'
  return 'Medical Visits'
}

function categoryColor(category) {
  if (category === 'Vaccinations') return 'success'
  if (category === 'Clinical Exams') return 'warning'
  return 'primary'
}

function buildMonthGrid(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - startOffset)

  const days = []
  for (let index = 0; index < 42; index += 1) {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    days.push(day)
  }

  return days
}

function AppointmentsCalendar({ onCreateAppointment, onOpenMedicalVisitCreate, activeCompanyId = '', activeBranchId = '' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visits, setVisits] = useState([])
  const [employees, setEmployees] = useState([])
  const [monthDate, setMonthDate] = useState(() => new Date())
  const monthDays = useMemo(() => buildMonthGrid(monthDate), [monthDate])
  
  const [selectedDate, setSelectedDate] = useState(() => atStartOfDay(new Date()))
  const [selectedType, setSelectedType] = useState('all')

  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [magicLinkStatus, setMagicLinkStatus] = useState('')

  // Dialog State for Recording New Appointment
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false)
  const [dialogDate, setDialogDate] = useState(() => formatDateInput(new Date()))
  const [dialogTime, setDialogTime] = useState('09:00')
  const [dialogEmployeeId, setDialogEmployeeId] = useState('')
  const [dialogVisitType, setDialogVisitType] = useState('Periodic')
  const [dialogNotes, setDialogNotes] = useState('')
  const [savingAppointment, setSavingAppointment] = useState(false)

  const loadVisits = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      if (!monthDays || monthDays.length === 0) return
      
      const start = monthDays[0].toISOString()
      const end = new Date(monthDays[monthDays.length - 1].getTime() + 86400000).toISOString()
      const companyParam = activeCompanyId && activeCompanyId !== 'all' ? `&companyId=${activeCompanyId}` : ''

      const [visitData, empData] = await Promise.all([
        apiGet(`/api/doctor-data/calendar-events?start=${start}&end=${end}${companyParam}`),
        apiGet(activeCompanyId && activeCompanyId !== 'all' ? `/api/master-data/employees?companyId=${activeCompanyId}` : '/api/master-data/employees').catch(() => [])
      ])

      setVisits(Array.isArray(visitData) ? visitData : [])
      setEmployees(Array.isArray(empData) ? empData : [])
    } catch (requestError) {
      setError(requestError.message || 'Errore nel caricamento calendario.')
    } finally {
      setLoading(false)
    }
  }, [monthDays, activeCompanyId])

  useEffect(() => {
    loadVisits()
  }, [loadVisits])

  const handleOpenAppointmentModal = (targetDate) => {
    const d = targetDate || selectedDate || new Date()
    setSelectedDate(atStartOfDay(d))
    setDialogDate(formatDateInput(d))
    setDialogTime('09:00')
    setDialogEmployeeId('')
    setDialogVisitType('Periodic')
    setDialogNotes('')
    setAppointmentDialogOpen(true)
  }

  const handleSaveAppointment = async () => {
    if (!dialogEmployeeId) {
      showNotification('Seleziona un dipendente per registrare l\'appuntamento.', 'warning')
      return
    }

    try {
      setSavingAppointment(true)
      const dateTimeString = `${dialogDate}T${dialogTime || '09:00'}:00`
      const visitDateIso = new Date(dateTimeString).toISOString()
      const nextYearDate = new Date(new Date(visitDateIso).setFullYear(new Date(visitDateIso).getFullYear() + 1)).toISOString()

      await apiSend('/api/master-data/medical-visits', 'POST', {
        employeeId: Number(dialogEmployeeId),
        visitDate: visitDateIso,
        visitType: dialogVisitType,
        notes: dialogNotes || 'Appuntamento programmato da Calendario Visite',
        isFit: true,
        fitnessNotes: 'Programmata da Calendario',
        nextDeadlineDate: nextYearDate,
      })

      showNotification('Appuntamento e visita programmata con successo!', 'success')
      setAppointmentDialogOpen(false)
      loadVisits()
    } catch (err) {
      showNotification(err.message || 'Errore durante la registrazione dell\'appuntamento.', 'error')
    } finally {
      setSavingAppointment(false)
    }
  }

  const handleLaunchStepperFromDialog = () => {
    setAppointmentDialogOpen(false)
    if (onOpenMedicalVisitCreate) {
      onOpenMedicalVisitCreate(dialogEmployeeId ? Number(dialogEmployeeId) : undefined)
    } else if (onCreateAppointment) {
      onCreateAppointment()
    }
  }

  const handleSendMagicLink = async () => {
    if (!selectedEvent) return
    
    try {
      setMagicLinkStatus('Invio...')
      await apiSend('/api/doctor-data/anamnesis-magic-link', 'POST', { visitId: selectedEvent.id })
      setMagicLinkStatus('Inviato!')
      setTimeout(() => setMagicLinkStatus(''), 3000)
    } catch (err) {
      setMagicLinkStatus('Errore')
      setTimeout(() => setMagicLinkStatus(''), 3000)
    }
  }

  const normalizedVisits = useMemo(() => {
    return visits
      .map((visit) => {
        const date = new Date(visit.eventDate)
        if (Number.isNaN(date.getTime())) return null
        const category = visitCategory(visit.eventType)

        return {
          ...visit,
          date,
          dayKey: atStartOfDay(date).toISOString(),
          category,
          companyId: Number(visit.companyId || 0),
          companyName: visit.companyName || '-',
          employeeName: visit.employeeName || `Dipendente #${visit.employeeId}`,
        }
      })
      .filter(Boolean)
  }, [visits])

  const filteredVisits = useMemo(() => {
    return normalizedVisits.filter((visit) => {
      const companyMatch = !activeCompanyId || activeCompanyId === 'all' || Number(activeCompanyId) === visit.companyId
      const typeMatch = selectedType === 'all' || selectedType === visit.category
      return companyMatch && typeMatch
    })
  }, [normalizedVisits, activeCompanyId, selectedType])

  const eventsByDay = useMemo(() => {
    return filteredVisits.reduce((accumulator, visit) => {
      if (!accumulator[visit.dayKey]) accumulator[visit.dayKey] = []
      accumulator[visit.dayKey].push(visit)
      return accumulator
    }, {})
  }, [filteredVisits])

  const selectedDayEvents = useMemo(() => {
    const key = atStartOfDay(selectedDate).toISOString()
    return (eventsByDay[key] || []).slice().sort((a, b) => a.date - b.date)
  }, [eventsByDay, selectedDate])

  const todayStats = useMemo(() => {
    const today = atStartOfDay(new Date()).toISOString()
    const todayEvents = eventsByDay[today] || []
    const done = todayEvents.filter((item) => item.date < new Date()).length
    const completionRate = todayEvents.length ? Math.round((done / todayEvents.length) * 100) : 0
    return {
      count: todayEvents.length,
      completionRate,
    }
  }, [eventsByDay])

  const setToday = () => {
    const today = new Date()
    setMonthDate(today)
    setSelectedDate(atStartOfDay(today))
  }

  const handleOpenPopover = (event, visit) => {
    setAnchorEl(event.currentTarget)
    setSelectedEvent(visit)
  }

  const selectedEmployeeObj = useMemo(() => {
    return employees.find((e) => String(e.id) === String(dialogEmployeeId)) || null
  }, [employees, dialogEmployeeId])

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={0.6}>
              <Typography variant="h5" sx={{ minWidth: { xs: 1, sm: 180 }, fontWeight: 700 }}>
                {monthDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
              </Typography>
              <Button variant="outlined" size="small" startIcon={<TodayIcon />} onClick={setToday}>Oggi</Button>
              <Button size="small" onClick={() => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeftIcon /></Button>
              <Button size="small" onClick={() => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRightIcon /></Button>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Select size="small" value={selectedType} onChange={(event) => setSelectedType(event.target.value)} sx={{ minWidth: 180 }}>
                <MenuItem value="all">Tutti i tipi</MenuItem>
                <MenuItem value="Medical Visits">Visite Mediche</MenuItem>
                <MenuItem value="Vaccinations">Vaccinazioni</MenuItem>
                <MenuItem value="Clinical Exams">Esami Clinici</MenuItem>
              </Select>
            </Stack>
          </Stack>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenAppointmentModal(selectedDate)}
            sx={{ alignSelf: { xs: 'stretch', md: 'flex-start' }, fontWeight: 700 }}
          >
            Nuovo Appuntamento / Visita
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 0.8 }}>
          <Chip size="small" color="primary" label="Visite Mediche" variant="outlined" />
          <Chip size="small" color="success" label="Vaccinazioni" variant="outlined" />
          <Chip size="small" color="warning" label="Esami Clinici" variant="outlined" />
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1, display: 'flex', alignItems: 'center' }}>
            💡 <em>Fai doppio click su un giorno per fissare un appuntamento</em>
          </Typography>
        </Stack>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!!error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '2.2fr 0.8fr' }, gap: 2 }}>
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', minWidth: 760 }}>
              {WEEK_DAYS.map((day) => (
                <Box key={day} sx={{ p: 1, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={700}>{day}</Typography>
                </Box>
              ))}

              {monthDays.map((day) => {
                const key = atStartOfDay(day).toISOString()
                const isCurrentMonth = day.getMonth() === monthDate.getMonth()
                const isSelected = isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())
                const dayEvents = (eventsByDay[key] || []).slice().sort((a, b) => a.date - b.date)

                return (
                  <Box
                    key={key}
                    onClick={() => setSelectedDate(atStartOfDay(day))}
                    onDoubleClick={() => handleOpenAppointmentModal(day)}
                    title="Doppio click per registrare un nuovo appuntamento"
                    sx={{
                      minHeight: 110,
                      p: 0.8,
                      borderRight: '1px solid',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isSelected ? 'action.selected' : isToday ? 'rgba(37, 99, 235, 0.04)' : 'background.paper',
                      cursor: 'pointer',
                      opacity: isCurrentMonth ? 1 : 0.45,
                      transition: 'background-color 0.15s ease-in-out',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isSelected || isToday ? 700 : 500,
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isToday ? 'primary.main' : 'transparent',
                          color: isToday ? '#ffffff' : 'inherit',
                        }}
                      >
                        {day.getDate()}
                      </Typography>
                    </Stack>
                    <Stack spacing={0.4}>
                      {dayEvents.slice(0, 3).map((event) => (
                        <Chip
                          key={`${event.id}-${event.date.toISOString()}`}
                          size="small"
                          color={categoryColor(event.category)}
                          label={`${formatDayTime(event.date)} • ${event.employeeName}`}
                          onClick={(e) => { e.stopPropagation(); handleOpenPopover(e, event); }}
                          sx={{ justifyContent: 'flex-start', '& .MuiChip-label': { px: 0.8, overflow: 'hidden', textOverflow: 'ellipsis' } }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <Typography variant="caption" color="text.secondary">+{dayEvents.length - 3} altri</Typography>
                      )}
                    </Stack>
                  </Box>
                )
              })}
            </Box>
            </Box>
          </Paper>

          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={700}>Agenda Giornata</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenAppointmentModal(selectedDate)}
                >
                  + Aggiungi
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">{formatDateLabel(selectedDate)}</Typography>

              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {selectedDayEvents.map((event) => (
                  <Box key={`${event.id}-${event.date.toISOString()}`} sx={{ p: 1.2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Typography variant="body2" fontWeight={700}>{formatDayTime(event.date)} • {event.employeeName}</Typography>
                    <Typography variant="caption" color="text.secondary">{event.eventType || event.category}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{event.companyName}</Typography>
                  </Box>
                ))}
                {!selectedDayEvents.length && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Nessun appuntamento in questa data. Fai doppio click sul giorno per pianificare una visita.
                  </Alert>
                )}
              </Stack>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#0f1f3d', color: '#ffffff' }}>
              <Typography variant="caption" sx={{ opacity: 0.85, letterSpacing: 1 }}>EFFICIENZA GIORNALIERA</Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 0.4 }}>{todayStats.count} Visite</Typography>
              <Typography variant="body2" sx={{ opacity: 0.92, mb: 1.5 }}>
                Tasso completamento della giornata: {todayStats.completionRate}%
              </Typography>
              <Box sx={{ height: 8, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
                <Box sx={{ width: `${todayStats.completionRate}%`, height: '100%', bgcolor: '#22c55e' }} />
              </Box>
            </Paper>
          </Stack>
        </Box>
      )}

      {/* NEW APPOINTMENT MODAL */}
      <Dialog
        open={appointmentDialogOpen}
        onClose={() => setAppointmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <EventIcon color="primary" /> Nuovo Appuntamento / Visita Medica
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Autocomplete
              options={employees}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option
                const name = `${option.lastName || ''} ${option.firstName || ''}`.trim()
                const details = [option.taxCode, option.companyName || option.jobRole].filter(Boolean).join(' • ')
                return details ? `${name} (${details})` : name || `Lavoratore #${option.id}`
              }}
              value={selectedEmployeeObj}
              onChange={(_, newValue) => {
                setDialogEmployeeId(newValue ? newValue.id : '')
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Dipendente *"
                  placeholder="Cerca per cognome, nome, CF..."
                  size="small"
                  required
                />
              )}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField
                  label="Data Visita *"
                  type="date"
                  fullWidth
                  size="small"
                  value={dialogDate}
                  onChange={(e) => setDialogDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Orario"
                  type="time"
                  fullWidth
                  size="small"
                  value={dialogTime}
                  onChange={(e) => setDialogTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth size="small">
              <InputLabel>Tipologia Visita *</InputLabel>
              <Select
                value={dialogVisitType}
                label="Tipologia Visita *"
                onChange={(e) => setDialogVisitType(e.target.value)}
              >
                {VISIT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Note Organizzative / Sede"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={dialogNotes}
              onChange={(e) => setDialogNotes(e.target.value)}
              placeholder="Es. Ambulatorio centrale, portare referti precedenti..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setAppointmentDialogOpen(false)} color="inherit">
            Annulla
          </Button>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<MedicalServicesIcon />}
              onClick={handleLaunchStepperFromDialog}
              disabled={!dialogEmployeeId}
            >
              Apri Stepper Clinico
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveAppointment}
              disabled={savingAppointment || !dialogEmployeeId}
            >
              {savingAppointment ? <CircularProgress size={24} /> : 'Salva in Agenda'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* EVENT POPOVER */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          {selectedEvent && (
            <>
              <Typography variant="subtitle1" fontWeight="bold">{selectedEvent.employeeName}</Typography>
              <Typography variant="body2" color="text.secondary">{formatDayTime(selectedEvent.date)} - {selectedEvent.companyName}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>Tipo: <strong>{selectedEvent.eventType || selectedEvent.category}</strong></Typography>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => setAnchorEl(null)}
                >
                  Chiudi
                </Button>
                
                <Button
                  variant="contained"
                  size="small"
                  color="secondary"
                  onClick={handleSendMagicLink}
                  disabled={magicLinkStatus === 'Invio...'}
                >
                  {magicLinkStatus || 'Invia Link Anamnesi'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </Stack>
  )
}

export default AppointmentsCalendar

