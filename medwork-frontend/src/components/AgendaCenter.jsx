import { useState, useEffect } from 'react'
import {
  Alert,
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
  Divider,
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'

function toDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleDateString('it-IT') : '-'
}

function AgendaCenter({ activeCompanyId = '', onOpenMedicalVisitCreate }) {
  const [loading, setLoading] = useState(true)
  const [agendaItems, setAgendaItems] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState(null)
  
  // Dialog state
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    fetchAgenda()
  }, [selectedDate])

  const fetchAgenda = async () => {
    try {
      setLoading(true)
      const data = await apiGet(`/api/doctor-data/agenda?date=${selectedDate}`)
      setAgendaItems(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching agenda:', err)
      setError('Errore durante il caricamento dell\'agenda.')
    } finally {
      setLoading(false)
    }
  }

  const handleMorningDigest = async () => {
    try {
      await apiSend('POST', '/api/doctor-data/agenda/morning-digest')
      alert('Morning Digest inviato con successo!')
    } catch (err) {
      alert('Errore nell\'invio del Morning Digest.')
    }
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Agenda Giornaliera</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Pianificazione oraria degli impegni e spostamenti.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField 
              type="date" 
              size="small" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
            <Button variant="outlined" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>Oggi</Button>
            <Button variant="contained" onClick={handleMorningDigest}>Invia Morning Digest</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Orario</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Descrizione</TableCell>
                <TableCell>Luogo</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Caricamento...</TableCell>
                </TableRow>
              ) : agendaItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Nessun impegno per questa data.</TableCell>
                </TableRow>
              ) : (
                agendaItems.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`} hover>
                    <TableCell><strong>{item.time}</strong></TableCell>
                    <TableCell>
                      <Chip size="small" label={item.type} color={item.type === 'Visita Medica' ? 'primary' : 'secondary'} />
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => setSelectedItem(item)}>Dettagli</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dettagli Dialog */}
      <Dialog open={!!selectedItem} onClose={() => setSelectedItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Dettagli {selectedItem?.type}</DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Stack spacing={2}>
              <Typography variant="subtitle1"><strong>Orario:</strong> {selectedItem.time}</Typography>
              <Typography variant="subtitle1"><strong>Descrizione:</strong> {selectedItem.description}</Typography>
              <Typography variant="subtitle1"><strong>Luogo:</strong> {selectedItem.location}</Typography>
              <Typography variant="subtitle1">
                <strong>Stato:</strong> <Chip size="small" label={selectedItem.status} color={selectedItem.status === 'completed' ? 'success' : 'warning'} />
              </Typography>
              
              <Divider />
              
              <Typography variant="body2" color="text.secondary">
                {selectedItem.type === 'Visita Medica' 
                  ? 'Usa il pulsante qui sotto per avviare direttamente la cartella sanitaria e registrare la visita per questo lavoratore.' 
                  : 'Questo è un sopralluogo programmato. Per compilare il report, usa lo Scadenzario Sopralluoghi.'}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedItem(null)}>Chiudi</Button>
          {selectedItem?.type === 'Visita Medica' && selectedItem?.status !== 'completed' && (
            <Button variant="contained" color="primary" onClick={() => {
              setSelectedItem(null)
              if (onOpenMedicalVisitCreate) onOpenMedicalVisitCreate()
            }}>
              Inizia Visita
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default AgendaCenter
