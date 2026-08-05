import { useState, useMemo } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DateRangeIcon from '@mui/icons-material/DateRange'
import { apiGet, apiSend } from '../services/apiClient'

const DAYS = [
  { key: 1, short: 'Lun', full: 'Lunedì' },
  { key: 2, short: 'Mar', full: 'Martedì' },
  { key: 3, short: 'Mer', full: 'Mercoledì' },
  { key: 4, short: 'Gio', full: 'Giovedì' },
  { key: 5, short: 'Ven', full: 'Venerdì' },
  { key: 6, short: 'Sab', full: 'Sabato' },
  { key: 0, short: 'Dom', full: 'Domenica' },
]

const TIME_SLOTS = [
  { id: 'morning', label: '08:00-13:00', start: '08:00', end: '13:00' },
  { id: 'afternoon', label: '13:00-18:00', start: '13:00', end: '18:00' },
]

const INITIAL_WEEKLY_SCHEDULE = {
  1: ['morning'],    // Lunedì
  2: [],              // Martedì
  3: ['afternoon'],  // Mercoledì
  4: [],              // Giovedì
  5: [],              // Venerdì
  6: [],              // Sabato
  0: [],              // Domenica
}

export default function AvailabilityCenter() {
  const [dateRange, setDateRange] = useState({ start: '2024-11-01', end: '2024-11-30' })
  const [weeklySchedule, setWeeklySchedule] = useState(INITIAL_WEEKLY_SCHEDULE)
  const [extraordinaryPresences, setExtraordinaryPresences] = useState([
    { id: 1, date: '2024-10-30', start: '10:00', end: '13:00', type: 'presence' },
  ])
  const [extraordinaryAbsences, setExtraordinaryAbsences] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeDoctor, setActiveDoctor] = useState({ id: 1, name: 'Vendrame Carlo' })

  const handleDaySlotToggle = (dayKey, slotId) => {
    setWeeklySchedule(prev => {
      const current = prev[dayKey] || []
      const updated = current.includes(slotId)
        ? current.filter(s => s !== slotId)
        : [...current, slotId]
      return { ...prev, [dayKey]: updated }
    })
  }

  const addExtraordinaryPresence = () => {
    const newItem = {
      id: Date.now(),
      date: '',
      start: '08:00',
      end: '13:00',
      type: 'presence',
    }
    setExtraordinaryPresences(prev => [...prev, newItem])
  }

  const addExtraordinaryAbsence = () => {
    const newItem = {
      id: Date.now(),
      date: '',
      type: 'absence',
    }
    setExtraordinaryAbsences(prev => [...prev, newItem])
  }

  const updateExtraordinary = (type, id, field, value) => {
    if (type === 'presence') {
      setExtraordinaryPresences(prev => prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ))
    } else {
      setExtraordinaryAbsences(prev => prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ))
    }
  }

  const removeExtraordinary = (type, id) => {
    if (type === 'presence') {
      setExtraordinaryPresences(prev => prev.filter(item => item.id !== id))
    } else {
      setExtraordinaryAbsences(prev => prev.filter(item => item.id !== id))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        doctorId: activeDoctor.id,
        dateRange,
        weeklySchedule,
        extraordinaryPresences,
        extraordinaryAbsences,
      }
      await apiSend('POST', '/api/doctor-availability', payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Errore salvataggio:', error)
    } finally {
      setSaving(false)
    }
  }

  const dayHasSlots = (dayKey) => (weeklySchedule[dayKey] || []).length > 0

  const getDaySlotsDisplay = (dayKey) => {
    const slots = weeklySchedule[dayKey] || []
    return slots.map(s => TIME_SLOTS.find(ts => ts.id === s)?.label || s).join(', ')
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Left Panel - Weekly Schedule */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <DateRangeIcon color="primary" />
              <Typography variant="h6" gutterBottom>
                Schema disponibilità
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Dal {new Date(dateRange.start).toLocaleDateString('it-IT')} al {new Date(dateRange.end).toLocaleDateString('it-IT')}
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data inizio"
                  type="date"
                  size="small"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data fine"
                  type="date"
                  size="small"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Disponibilità settimanale ricorrente
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Seleziona i giorni e gli orari di disponibilità per il periodo indicato.
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ width: 120 }}><strong>Giorno</strong></TableCell>
                    <TableCell style={{ width: 140 }}><strong>Mattina (08:00-13:00)</strong></TableCell>
                    <TableCell style={{ width: 140 }}><strong>Pomeriggio (13:00-18:00)</strong></TableCell>
                    <TableCell><strong>Attivo</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {DAYS.map((day) => (
                    <TableRow key={day.key} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{day.full}</Typography>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={weeklySchedule[day.key]?.includes('morning')}
                              onChange={() => handleDaySlotToggle(day.key, 'morning')}
                              size="small"
                            />
                          }
                          label=""
                        />
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={weeklySchedule[day.key]?.includes('afternoon')}
                              onChange={() => handleDaySlotToggle(day.key, 'afternoon')}
                              size="small"
                            />
                          }
                          label=""
                        />
                      </TableCell>
                      <TableCell>
                        {dayHasSlots(day.key) ? (
                          <Chip
                            size="small"
                            color="success"
                            label={getDaySlotsDisplay(day.key)}
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Right Panel - Extraordinary Items */}
        <Box sx={{ width: { lg: 400 }, flexShrink: 0 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Eccezioni
              </Typography>
              <Tooltip title="Mostra storico disponibilità">
                <FormControlLabel
                  control={
                    <Checkbox size="small" />
                  }
                  label="Storico disponibilità"
                />
              </Tooltip>
            </Stack>

            {/* Presenze Straordinarie */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" color="primary.main">
                  Presenze straordinarie
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addExtraordinaryPresence}>
                  Aggiungi
                </Button>
              </Stack>
              {extraordinaryPresences.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nessuna presenza straordinaria</Typography>
              ) : (
                <Stack spacing={1}>
                  {extraordinaryPresences.map((item) => (
                    <Paper key={item.id} sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            label="Data"
                            type="date"
                            size="small"
                            value={item.date}
                            onChange={(e) => updateExtraordinary('presence', item.id, 'date', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Ora inizio"
                            type="time"
                            size="small"
                            value={item.start}
                            onChange={(e) => updateExtraordinary('presence', item.id, 'start', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Ora fine"
                            type="time"
                            size="small"
                            value={item.end}
                            onChange={(e) => updateExtraordinary('presence', item.id, 'end', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeExtraordinary('presence', item.id)}
                              aria-label="Rimuovi"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Assenze Straordinarie */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" color="error.main">
                  Assenze straordinarie
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addExtraordinaryAbsence}>
                  Aggiungi
                </Button>
              </Stack>
              {extraordinaryAbsences.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nessuna assenza straordinaria</Typography>
              ) : (
                <Stack spacing={1}>
                  {extraordinaryAbsences.map((item) => (
                    <Paper key={item.id} sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={8}>
                          <TextField
                            label="Data"
                            type="date"
                            size="small"
                            value={item.date}
                            onChange={(e) => updateExtraordinary('absence', item.id, 'date', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeExtraordinary('absence', item.id)}
                              aria-label="Rimuovi"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>

          {/* Save Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {saving ? 'Salvataggio...' : 'Salva disponibilità'}
          </Button>
          {saved && (
            <Typography variant="body2" color="success.main" sx={{ textAlign: 'center', mt: 1 }}>
              ✓ Disponibilità salvata con successo
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  )
}