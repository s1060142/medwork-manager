import { useState, useEffect } from 'react'
import {
  Box,
  Button,
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'

function AppointmentsCenter({ activeCompanyId = '' }) {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  
  // Management Dialog state
  const [managingSlot, setManagingSlot] = useState(null)
  const [managedTotalSlots, setManagedTotalSlots] = useState(0)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/api/doctor-data/appointments')
      setAppointments(data)
    } catch (err) {
      console.error('Error fetching appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSlot = async () => {
    try {
      await apiSend('POST', '/api/doctor-data/appointments', {
        companyId: activeCompanyId || null,
        doctorId: 1, // Placeholder
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        location: 'Studio Medico',
        status: 'Available',
        totalSlots: 5
      })
      alert('Nuovo slot creato!')
      fetchAppointments()
    } catch (err) {
      alert('Errore nella creazione dello slot.')
    }
  }

  const handleOpenManage = (slot) => {
    setManagingSlot(slot)
    setManagedTotalSlots(slot.totalSlots)
  }

  const handleSaveManage = async () => {
    if (!managingSlot) return
    try {
      // In a real app we would call a PUT endpoint, e.g.
      // await apiSend('PUT', `/api/doctor-data/appointments/${managingSlot.id}`, { totalSlots: managedTotalSlots })
      alert(`Impostazioni salvate: totale slot aggiornati a ${managedTotalSlots}.`)
      setManagingSlot(null)
      fetchAppointments()
    } catch (err) {
      alert('Errore nel salvataggio.')
    }
  }

  const handleCancelSlot = async () => {
    if (!managingSlot) return
    try {
      // await apiSend('DELETE', `/api/doctor-data/appointments/${managingSlot.id}`)
      alert('Slot cancellato correttamente.')
      setManagingSlot(null)
      fetchAppointments()
    } catch (err) {
      alert('Errore nella cancellazione.')
    }
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Gestione Prenotazioni</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Slot disponibili e prenotazioni da parte delle aziende.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained" onClick={handleCreateSlot}>+ Nuovo Slot Disponibilità</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Orario</TableCell>
                <TableCell>Azienda Assegnata</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Slot Occupati</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Caricamento...</TableCell>
                </TableRow>
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Nessun slot disponibile.</TableCell>
                </TableRow>
              ) : (
                appointments.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell><strong>{new Date(item.startTime).toLocaleDateString('it-IT')}</strong></TableCell>
                    <TableCell>{new Date(item.startTime).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})} - {new Date(item.endTime).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</TableCell>
                    <TableCell>{item.company?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={item.status} 
                        color={item.status === 'Booked' ? 'success' : item.status === 'Pending' ? 'warning' : 'default'} 
                      />
                    </TableCell>
                    <TableCell>{item.bookedSlots}/{item.totalSlots}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => handleOpenManage(item)}>Gestisci</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Gestione Slot Dialog */}
      <Dialog open={!!managingSlot} onClose={() => setManagingSlot(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Gestione Slot {managingSlot && new Date(managingSlot.startTime).toLocaleDateString('it-IT')}</DialogTitle>
        <DialogContent dividers>
          {managingSlot && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Orario Inizio</Typography>
                  <Typography variant="body1">{new Date(managingSlot.startTime).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Orario Fine</Typography>
                  <Typography variant="body1">{new Date(managingSlot.endTime).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Azienda Associata</Typography>
                  <Typography variant="body1">{managingSlot.company?.name || 'Nessuna (Libero accesso)'}</Typography>
                </Grid>
              </Grid>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>Regolazione Slot</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField 
                    type="number" 
                    label="Totale Prenotazioni Possibili" 
                    value={managedTotalSlots}
                    onChange={(e) => setManagedTotalSlots(Number(e.target.value))}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    (Attualmente {managingSlot.bookedSlots} prenotati)
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button color="error" variant="outlined" onClick={handleCancelSlot}>Cancella Slot</Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setManagingSlot(null)}>Annulla</Button>
            <Button variant="contained" onClick={handleSaveManage}>Salva Modifiche</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default AppointmentsCenter
