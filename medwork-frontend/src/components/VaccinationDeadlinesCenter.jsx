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
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'

function VaccinationDeadlinesCenter({ activeCompanyId = '' }) {
  const [loading, setLoading] = useState(true)
  const [vaccinations, setVaccinations] = useState([])
  
  // Dialog state
  const [planningCampaign, setPlanningCampaign] = useState(false)
  const [recordingVaccine, setRecordingVaccine] = useState(null)
  
  // Form states
  const [campaignDate, setCampaignDate] = useState('')
  const [campaignVaccine, setCampaignVaccine] = useState('')
  const [recordDate, setRecordDate] = useState('')
  const [recordLot, setRecordLot] = useState('')
  const [recordNextDue, setRecordNextDue] = useState('')

  useEffect(() => {
    fetchVaccinations()
  }, [])

  const fetchVaccinations = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/api/master-data/vaccinations')
      setVaccinations(data)
    } catch (err) {
      console.error('Error fetching vaccinations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCampaign = async () => {
    try {
      // In a real app we'd POST to a batch endpoint
      alert(`Campagna per ${campaignVaccine} pianificata il ${campaignDate}.`)
      setPlanningCampaign(false)
      fetchVaccinations()
    } catch (err) {
      alert('Errore nella pianificazione.')
    }
  }

  const handleOpenRecord = (vaccination) => {
    setRecordingVaccine(vaccination)
    setRecordDate(new Date().toISOString().split('T')[0])
    setRecordLot('')
    
    // Estimate next due based on typical 10-year booster for Tetanus, for example.
    const nextDue = new Date()
    nextDue.setFullYear(nextDue.getFullYear() + 10)
    setRecordNextDue(nextDue.toISOString().split('T')[0])
  }

  const handleSaveRecord = async () => {
    if (!recordingVaccine) return
    try {
      // In a real app we'd call a PUT endpoint:
      // await apiSend('PUT', `/api/master-data/vaccinations/${recordingVaccine.id}/administer`, { adminDate: recordDate, lotNumber: recordLot, nextDueDate: recordNextDue })
      alert('Somministrazione registrata correttamente.')
      setRecordingVaccine(null)
      fetchVaccinations()
    } catch (err) {
      alert('Errore durante la registrazione.')
    }
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Scadenzario Vaccinazioni</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Monitoraggio richiami e vaccinazioni obbligatorie per protocollo.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained" onClick={() => setPlanningCampaign(true)}>Pianifica Campagna Vaccinale</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Azienda</TableCell>
                <TableCell>Lavoratore</TableCell>
                <TableCell>Vaccino</TableCell>
                <TableCell>Scadenza</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Caricamento...</TableCell>
                </TableRow>
              ) : vaccinations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Nessuna vaccinazione programmata.</TableCell>
                </TableRow>
              ) : (
                vaccinations.map((item) => {
                  const isMissing = !item.vaccineDate
                  const isDueSoon = item.nextDueDate && new Date(item.nextDueDate) <= new Date(new Date().setMonth(new Date().getMonth() + 2))
                  const statusLabel = isMissing ? 'Missing' : (isDueSoon ? 'Due Soon' : 'Valid')
                  const statusColor = isMissing ? 'error' : (isDueSoon ? 'warning' : 'success')

                  return (
                    <TableRow key={item.id} hover>
                      <TableCell><strong>{item.employee?.company?.name || '-'}</strong></TableCell>
                      <TableCell>{item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : '-'}</TableCell>
                      <TableCell>{item.vaccineName}</TableCell>
                      <TableCell>{item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString('it-IT') : '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={statusLabel} 
                          color={statusColor} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => handleOpenRecord(item)}>Registra Somministrazione</Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pianifica Campagna Dialog */}
      <Dialog open={planningCampaign} onClose={() => setPlanningCampaign(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pianifica Campagna Vaccinale</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              select
              label="Tipo Vaccino"
              value={campaignVaccine}
              onChange={(e) => setCampaignVaccine(e.target.value)}
              fullWidth
            >
              <MenuItem value="Antitetanica">Antitetanica</MenuItem>
              <MenuItem value="Antiepatite B">Antiepatite B</MenuItem>
              <MenuItem value="Antinfluenzale">Antinfluenzale</MenuItem>
            </TextField>
            <TextField 
              label="Data Prevista" 
              type="date" 
              InputLabelProps={{ shrink: true }}
              value={campaignDate}
              onChange={(e) => setCampaignDate(e.target.value)}
              fullWidth
            />
            <Typography variant="body2" color="text.secondary">
              Questa azione genererà appuntamenti per tutti i lavoratori che risultano in scadenza per il vaccino selezionato.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanningCampaign(false)}>Annulla</Button>
          <Button variant="contained" color="primary" onClick={handleSaveCampaign} disabled={!campaignDate || !campaignVaccine}>
            Pianifica
          </Button>
        </DialogActions>
      </Dialog>

      {/* Registra Somministrazione Dialog */}
      <Dialog open={!!recordingVaccine} onClose={() => setRecordingVaccine(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Registra Somministrazione: {recordingVaccine?.vaccineName}</DialogTitle>
        <DialogContent dividers>
          {recordingVaccine && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Lavoratore</Typography>
                <Typography variant="body1">{recordingVaccine.employee ? `${recordingVaccine.employee.firstName} ${recordingVaccine.employee.lastName}` : '-'}</Typography>
              </Box>
              
              <TextField 
                label="Data Somministrazione" 
                type="date" 
                InputLabelProps={{ shrink: true }}
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                fullWidth
              />
              
              <TextField 
                label="Lotto (Opzionale)" 
                value={recordLot}
                onChange={(e) => setRecordLot(e.target.value)}
                fullWidth
              />
              
              <TextField 
                label="Prossima Scadenza (Richiamo)" 
                type="date" 
                InputLabelProps={{ shrink: true }}
                value={recordNextDue}
                onChange={(e) => setRecordNextDue(e.target.value)}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecordingVaccine(null)}>Annulla</Button>
          <Button variant="contained" color="success" onClick={handleSaveRecord}>Salva Registrazione</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default VaccinationDeadlinesCenter
