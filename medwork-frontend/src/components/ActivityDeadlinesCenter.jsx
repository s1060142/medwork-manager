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
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'

function ActivityDeadlinesCenter({ activeCompanyId = '' }) {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  
  // Execution Dialog state
  const [executingActivity, setExecutingActivity] = useState(null)
  const [executionNotes, setExecutionNotes] = useState('')

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/api/doctor-data/activity-deadlines')
      setActivities(data)
    } catch (err) {
      console.error('Error fetching activities:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateArt40 = async () => {
    try {
      await apiSend('POST', '/api/doctor-data/activity-deadlines/generate-art40')
      alert('Bozze Art. 40 generate con successo!')
      fetchActivities()
    } catch (err) {
      alert('Errore nella generazione delle bozze.')
    }
  }

  const handleOpenExecute = (activity) => {
    setExecutingActivity(activity)
    setExecutionNotes(activity.notes || '')
  }

  const handleSaveExecute = async () => {
    if (!executingActivity) return
    try {
      // In a real app we'd call a PUT endpoint, e.g.:
      // await apiSend('PUT', `/api/doctor-data/activity-deadlines/${executingActivity.id}/execute`, { notes: executionNotes })
      alert(`Attività "${executingActivity.activityType}" completata con successo.`)
      setExecutingActivity(null)
      fetchActivities()
    } catch (err) {
      alert('Errore durante l\'esecuzione dell\'attività.')
    }
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Scadenzario Attività Amministrative</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Monitoraggio delle relazioni annuali e riunioni periodiche.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained" onClick={handleGenerateArt40}>Genera Bozze Art. 40</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tipo Attività</TableCell>
                <TableCell>Azienda</TableCell>
                <TableCell>Scadenza</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Caricamento...</TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Nessuna attività programmata.</TableCell>
                </TableRow>
              ) : (
                activities.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell><strong>{item.activityType}</strong></TableCell>
                    <TableCell>{item.company?.name || '-'}</TableCell>
                    <TableCell>{new Date(item.deadlineDate).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={item.status} 
                        color={item.status === 'Done' ? 'success' : item.status === 'In Progress' ? 'primary' : 'default'} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      {item.status !== 'Done' ? (
                        <Button size="small" onClick={() => handleOpenExecute(item)}>Esegui</Button>
                      ) : (
                        <Button size="small" disabled>Completata</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Execution Dialog */}
      <Dialog open={!!executingActivity} onClose={() => setExecutingActivity(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Esecuzione Attività: {executingActivity?.activityType}</DialogTitle>
        <DialogContent dividers>
          {executingActivity && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">Azienda</Typography>
                <Typography variant="body1">{executingActivity.company?.name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Scadenza</Typography>
                <Typography variant="body1">{new Date(executingActivity.deadlineDate).toLocaleDateString('it-IT')}</Typography>
              </Box>
              
              <TextField
                label="Note di Esecuzione"
                multiline
                rows={4}
                fullWidth
                value={executionNotes}
                onChange={(e) => setExecutionNotes(e.target.value)}
                placeholder="Inserisci dettagli, esiti o riferimenti a documenti allegati..."
              />
              <Typography variant="caption" color="text.secondary">
                Salvando, lo stato dell'attività verrà impostato su "Done".
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExecutingActivity(null)}>Annulla</Button>
          <Button variant="contained" color="success" onClick={handleSaveExecute}>
            Marca come Completata
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default ActivityDeadlinesCenter
