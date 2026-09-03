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

function SiteVisitDeadlinesCenter({ activeCompanyId = '' }) {
  const [loading, setLoading] = useState(true)
  const [siteVisits, setSiteVisits] = useState([])
  
  // Dialog state
  const [planningOpen, setPlanningOpen] = useState(false)
  const [reportingVisit, setReportingVisit] = useState(null)
  
  // Form states
  const [planDate, setPlanDate] = useState('')
  const [reportOutcome, setReportOutcome] = useState('')
  const [reportNotes, setReportNotes] = useState('')

  useEffect(() => {
    fetchSiteVisits()
  }, [])

  const fetchSiteVisits = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/api/master-data/sitevisits')
      setSiteVisits(data)
    } catch (err) {
      console.error('Error fetching site visits:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlan = async () => {
    try {
      // POST to master-data/sitevisits with new scheduled date
      // In a real app we'd pass companyId and locationId
      alert(`Sopralluogo pianificato per il ${planDate}.`)
      setPlanningOpen(false)
      fetchSiteVisits()
    } catch (err) {
      alert('Errore nella pianificazione.')
    }
  }

  const handleOpenReport = (visit) => {
    setReportingVisit(visit)
    setReportOutcome(visit.outcome || '')
    setReportNotes(visit.notes || '')
  }

  const handleSaveReport = async () => {
    if (!reportingVisit) return
    try {
      // In a real app we'd call a PUT endpoint:
      // await apiSend('PUT', `/api/master-data/sitevisits/${reportingVisit.id}/report`, { outcome: reportOutcome, notes: reportNotes })
      alert(`Report salvato per il sopralluogo in ${reportingVisit.workLocation?.name || reportingVisit.visitedStructure}.`)
      setReportingVisit(null)
      fetchSiteVisits()
    } catch (err) {
      alert('Errore durante il salvataggio del report.')
    }
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Scadenzario Sopralluoghi</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Pianificazione ispezioni e sopralluoghi periodici.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained" onClick={() => setPlanningOpen(true)}>Pianifica Sopralluogo</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Azienda</TableCell>
                <TableCell>Sede</TableCell>
                <TableCell>Ultimo Sopralluogo</TableCell>
                <TableCell>Frequenza</TableCell>
                <TableCell>Prossima Scadenza</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Caricamento...</TableCell>
                </TableRow>
              ) : siteVisits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Nessun sopralluogo programmato.</TableCell>
                </TableRow>
              ) : (
                siteVisits.map((item) => {
                  const isOverdue = item.nextDueDate && new Date(item.nextDueDate) < new Date()
                  const statusLabel = isOverdue ? 'Overdue' : 'Due Soon'
                  const statusColor = isOverdue ? 'error' : 'warning'

                  return (
                    <TableRow key={item.id} hover>
                      <TableCell><strong>{item.company?.name || '-'}</strong></TableCell>
                      <TableCell>{item.workLocation?.name || item.visitedStructure}</TableCell>
                      <TableCell>{item.visitDate ? new Date(item.visitDate).toLocaleDateString('it-IT') : '-'}</TableCell>
                      <TableCell>{item.frequency || '-'}</TableCell>
                      <TableCell>{item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString('it-IT') : '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={statusLabel} 
                          color={statusColor} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => handleOpenReport(item)}>Compila Report</Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pianifica Sopralluogo Dialog */}
      <Dialog open={planningOpen} onClose={() => setPlanningOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Pianifica Sopralluogo</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="Data Sopralluogo" 
              type="date" 
              InputLabelProps={{ shrink: true }}
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Sede/Luogo"
              defaultValue=""
              fullWidth
            >
              <MenuItem value="1">Sede Principale</MenuItem>
              <MenuItem value="2">Magazzino</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanningOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleSavePlan} disabled={!planDate}>Pianifica</Button>
        </DialogActions>
      </Dialog>

      {/* Compila Report Dialog */}
      <Dialog open={!!reportingVisit} onClose={() => setReportingVisit(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Compila Report Sopralluogo</DialogTitle>
        <DialogContent dividers>
          {reportingVisit && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">Luogo Visitato</Typography>
                <Typography variant="body1">{reportingVisit.workLocation?.name || reportingVisit.visitedStructure}</Typography>
              </Box>
              <TextField
                select
                label="Esito"
                value={reportOutcome}
                onChange={(e) => setReportOutcome(e.target.value)}
                fullWidth
              >
                <MenuItem value="Conforme">Conforme</MenuItem>
                <MenuItem value="Non Conforme">Non Conforme</MenuItem>
                <MenuItem value="Con Prescrizioni">Con Prescrizioni</MenuItem>
              </TextField>
              <TextField
                label="Note e Prescrizioni"
                multiline
                rows={4}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportingVisit(null)}>Annulla</Button>
          <Button variant="contained" color="primary" onClick={handleSaveReport}>Salva Report</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default SiteVisitDeadlinesCenter
