import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TodayIcon from '@mui/icons-material/Today'
import { apiGet, apiSend } from '../services/apiClient'

const WEEK_DAYS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM']

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

function AppointmentsCalendar({ onCreateAppointment }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visits, setVisits] = useState([])
  const [monthDate, setMonthDate] = useState(() => new Date())
  const monthDays = useMemo(() => buildMonthGrid(monthDate), [monthDate])
  
  const [selectedDate, setSelectedDate] = useState(() => atStartOfDay(new Date()))
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [selectedType, setSelectedType] = useState('all')

  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [magicLinkStatus, setMagicLinkStatus] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')

        if (!monthDays || monthDays.length === 0) return
        
        const start = monthDays[0].toISOString()
        const end = new Date(monthDays[monthDays.length - 1].getTime() + 86400000).toISOString()

        const visitData = await apiGet(`/api/doctor-data/calendar-events?start=${start}&end=${end}`)
        setVisits(Array.isArray(visitData) ? visitData : [])
      } catch (requestError) {
        setError(requestError.message || 'Errore nel caricamento calendario.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [monthDate, monthDays])

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

  const companyOptions = useMemo(() => {
    const map = new Map()
    visits.forEach((visit) => {
      const id = Number(visit.companyId)
      if (!id || map.has(id)) return
      map.set(id, visit.companyName || `Azienda #${id}`)
    })
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [visits])

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
      const companyMatch = selectedCompany === 'all' || Number(selectedCompany) === visit.companyId
      const typeMatch = selectedType === 'all' || selectedType === visit.category
      return companyMatch && typeMatch
    })
  }, [normalizedVisits, selectedCompany, selectedType])

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

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={0.6}>
              <Typography variant="h5" sx={{ minWidth: { xs: 1, sm: 180 } }}>
                {monthDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
              </Typography>
              <Button variant="outlined" size="small" startIcon={<TodayIcon />} onClick={setToday}>Today</Button>
              <Button size="small" onClick={() => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeftIcon /></Button>
              <Button size="small" onClick={() => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRightIcon /></Button>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Select size="small" value={selectedCompany} onChange={(event) => setSelectedCompany(event.target.value)} sx={{ minWidth: 180 }}>
                <MenuItem value="all">Tutte le aziende</MenuItem>
                {companyOptions.map((company) => (
                  <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
                ))}
              </Select>

              <Select size="small" value={selectedType} onChange={(event) => setSelectedType(event.target.value)} sx={{ minWidth: 180 }}>
                <MenuItem value="all">Tutti i tipi</MenuItem>
                <MenuItem value="Medical Visits">Medical Visits</MenuItem>
                <MenuItem value="Vaccinations">Vaccinations</MenuItem>
                <MenuItem value="Clinical Exams">Clinical Exams</MenuItem>
              </Select>
            </Stack>
          </Stack>

          <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateAppointment} sx={{ alignSelf: { xs: 'stretch', md: 'flex-start' } }}>
            Record New Appointment
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 0.8 }}>
          <Chip size="small" color="primary" label="Medical Visits" variant="outlined" />
          <Chip size="small" color="success" label="Vaccinations" variant="outlined" />
          <Chip size="small" color="warning" label="Clinical Exams" variant="outlined" />
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
                <Box key={day} sx={{ p: 1, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" fontWeight={700}>{day}</Typography>
                </Box>
              ))}

              {monthDays.map((day) => {
                const key = atStartOfDay(day).toISOString()
                const isCurrentMonth = day.getMonth() === monthDate.getMonth()
                const isSelected = isSameDay(day, selectedDate)
                const dayEvents = (eventsByDay[key] || []).slice().sort((a, b) => a.date - b.date)

                return (
                  <Box
                    key={key}
                    onClick={() => setSelectedDate(atStartOfDay(day))}
                    sx={{
                      minHeight: 108,
                      p: 0.8,
                      borderRight: '1px solid',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isSelected ? 'action.selected' : 'background.paper',
                      cursor: 'pointer',
                      opacity: isCurrentMonth ? 1 : 0.45,
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: isSelected ? 700 : 500 }}>{day.getDate()}</Typography>
                    <Stack spacing={0.4}>
                      {dayEvents.slice(0, 3).map((event) => (
                        <Chip
                          key={`${event.id}-${event.date.toISOString()}`}
                          size="small"
                          color={categoryColor(event.category)}
                          label={`${formatDayTime(event.date)} • ${event.employeeName}`}
                          onClick={(e) => { e.stopPropagation(); handleOpenPopover(e, event); }}
                          sx={{ justifyContent: 'flex-start', '& .MuiChip-label': { px: 0.8 } }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <Typography variant="caption" color="text.secondary">+{dayEvents.length - 3} more</Typography>
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
              <Typography variant="h6">Today&apos;s Agenda</Typography>
              <Typography variant="caption" color="text.secondary">{formatDateLabel(selectedDate)}</Typography>

              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {selectedDayEvents.map((event) => (
                  <Box key={`${event.id}-${event.date.toISOString()}`} sx={{ p: 1.2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight={700}>{formatDayTime(event.date)} • {event.employeeName}</Typography>
                    <Typography variant="caption" color="text.secondary">{event.eventType || event.category}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{event.companyName}</Typography>
                  </Box>
                ))}
                {!selectedDayEvents.length && <Alert severity="info">Nessun appuntamento in questa giornata.</Alert>}
              </Stack>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>EFFICIENCY</Typography>
              <Typography variant="h4" sx={{ mt: 0.4 }}>{todayStats.count} Visits</Typography>
              <Typography variant="body2" sx={{ opacity: 0.92, mb: 1.5 }}>
                Completion rate della giornata: {todayStats.completionRate}%
              </Typography>
              <Box sx={{ height: 8, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
                <Box sx={{ width: `${todayStats.completionRate}%`, height: '100%', bgcolor: 'rgba(255,255,255,0.95)' }} />
              </Box>
            </Paper>
          </Stack>
        </Box>
      )}

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
