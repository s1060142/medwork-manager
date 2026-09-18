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
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { apiGet, apiSend } from '../services/apiClient'

function SiteVisitDeadlinesCenter({ activeCompanyId = '' }) {
  const [loading, setLoading] = useState(true)
  const [siteVisits, setSiteVisits] = useState([])
  const [companies, setCompanies] = useState([])
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState(activeCompanyId || '')
  const [feedback, setFeedback] = useState(null)

  // Dialog states
  const [planningOpen, setPlanningOpen] = useState(false)
  const [reportingVisit, setReportingVisit] = useState(null)

  // Planning form state
  const [planCompanyId, setPlanCompanyId] = useState('')
  const [planStructure, setPlanStructure] = useState('Stabilimento Principale / Reparto Produttivo')
  const [planLocation, setPlanLocation] = useState('Sede Legale ed Operativa')
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0])
  const [planFrequency, setPlanFrequency] = useState('Annuale (Art. 25 c.1 lett. l)')
  const [planNotes, setPlanNotes] = useState('')

  // Report form state
  const [reportOutcome, setReportOutcome] = useState('Conforme')
  const [reportNotes, setReportNotes] = useState('')
  const [reportNextDueDate, setReportNextDueDate] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeCompanyId) {
      setSelectedCompanyFilter(activeCompanyId)
      setPlanCompanyId(activeCompanyId)
    }
  }, [activeCompanyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [visitsData, compData] = await Promise.all([
        apiGet('/api/doctor-data/site-visits').catch(() => []),
        apiGet('/api/master-data/companies').catch(() => [])
      ])
      setSiteVisits(Array.isArray(visitsData) ? visitsData : [])
      const compList = Array.isArray(compData) ? compData : (compData?.items || [])
      setCompanies(compList)
      if (compList.length > 0) {
        setPlanCompanyId((prev) => prev || compList[0].id)
      }
    } catch (err) {
      console.error('Error loading site visits data:', err)
      setFeedback({ type: 'error', message: 'Errore nel caricamento dei dati sopralluoghi.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlan = async () => {
    const targetCompanyId = Number(planCompanyId || (companies[0] ? companies[0].id : 1))
    if (!targetCompanyId || !planDate || !planStructure) {
      setFeedback({ type: 'error', message: 'Compila tutti i campi obbligatori per pianificare il sopralluogo.' })
      return
    }

    try {
      const visitDateTime = new Date(planDate)
      const nextDue = new Date(visitDateTime)
      nextDue.setFullYear(nextDue.getFullYear() + 1)

      const payload = {
        companyId: targetCompanyId,
        visitedStructure: planStructure,
        location: planLocation,
        visitDate: visitDateTime.toISOString(),
        frequency: planFrequency,
        nextDueDate: nextDue.toISOString(),
        notes: planNotes,
        outcome: 'Pianificato'
      }

      await apiSend('POST', '/api/doctor-data/site-visits', payload)
      setFeedback({ type: 'success', message: 'Sopralluogo programmato con successo ex Art. 25 D.Lgs. 81/08!' })
      setPlanningOpen(false)
      setPlanNotes('')
      await loadData()
    } catch (err) {
      console.error('Error saving site visit plan:', err)
      setFeedback({ type: 'error', message: 'Errore durante la pianificazione del sopralluogo.' })
    }
  }

  const handleOpenReport = (visit) => {
    setReportingVisit(visit)
    setReportOutcome(visit.outcome && visit.outcome !== 'Pianificato' ? visit.outcome : 'Conforme')
    setReportNotes(visit.notes || '')
    const defaultNext = new Date()
    defaultNext.setFullYear(defaultNext.getFullYear() + 1)
    setReportNextDueDate(visit.nextDueDate ? visit.nextDueDate.split('T')[0] : defaultNext.toISOString().split('T')[0])
  }

  const handleSaveReport = async () => {
    if (!reportingVisit) return
    try {
      const payload = {
        companyId: reportingVisit.companyId,
        visitedStructure: reportingVisit.visitedStructure,
        location: reportingVisit.location,
        doctorName: reportingVisit.doctorName,
        visitDate: reportingVisit.visitDate,
        frequency: reportingVisit.frequency,
        nextDueDate: reportNextDueDate ? new Date(reportNextDueDate).toISOString() : null,
        notes: reportNotes,
        outcome: reportOutcome
      }

      await apiSend('PUT', `/api/doctor-data/site-visits/${reportingVisit.id}`, payload)
      setFeedback({ type: 'success', message: 'Verbale e rilievi di sopralluogo salvati con successo!' })
      setReportingVisit(null)
      await loadData()
    } catch (err) {
      console.error('Error saving site visit report:', err)
      setFeedback({ type: 'error', message: 'Errore durante il salvataggio del verbale.' })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo sopralluogo?')) return
    try {
      await apiSend('DELETE', `/api/doctor-data/site-visits/${id}`)
      setFeedback({ type: 'info', message: 'Sopralluogo rimosso.' })
      await loadData()
    } catch (err) {
      console.error('Error deleting site visit:', err)
      setFeedback({ type: 'error', message: 'Errore durante l\'eliminazione.' })
    }
  }

  const filteredVisits = selectedCompanyFilter
    ? siteVisits.filter(v => v.companyId === Number(selectedCompanyFilter))
    : siteVisits

  // KPI Calculations
  const totalCount = filteredVisits.length
  const compliantCount = filteredVisits.filter(v => v.outcome === 'Conforme').length
  const prescriptionCount = filteredVisits.filter(v => v.outcome === 'Con Prescrizioni' || v.outcome === 'Non Conforme').length
  const overdueCount = filteredVisits.filter(v => {
    if (!v.nextDueDate) return false
    return new Date(v.nextDueDate) < new Date() && v.outcome === 'Pianificato'
  }).length

  return (
    <Stack spacing={2.5}>
      {feedback && (
        <Alert severity={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Header Banner */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)', color: '#fff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <VerifiedUserIcon sx={{ fontSize: 32 }} />
              <Typography variant="h5" fontWeight={700}>
                Sopralluoghi Ambienti di Lavoro (Art. 25 c.1 lett. l D.Lgs. 81/08)
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Pianificazione, esecuzione dei sopralluoghi periodici del Medico Competente e redazione dei verbali ispettivi.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddLocationAltIcon />}
            onClick={() => setPlanningOpen(true)}
            sx={{ fontWeight: 700, px: 2.5, py: 1, backgroundColor: '#fff', color: '#0d47a1', '&:hover': { backgroundColor: '#f0f4f8' } }}
          >
            Pianifica Nuovo Sopralluogo
          </Button>
        </Stack>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Totale Sopralluoghi</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">{totalCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Conformi (Nessun Rilievo)</Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">{compliantCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Con Prescrizioni / Rilievi</Typography>
              <Typography variant="h5" fontWeight={700} color="warning.main">{prescriptionCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Scaduti / Da Eseguire</Typography>
              <Typography variant="h5" fontWeight={700} color="error.main">{overdueCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter & Controls */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <TextField
            select
            size="small"
            label="Filtra per Azienda"
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            sx={{ minWidth: 260 }}
          >
            <MenuItem value="">Tutte le aziende</MenuItem>
            {companies.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>

          <Typography variant="body2" color="text.secondary">
            Visualizzati <strong>{filteredVisits.length}</strong> sopralluoghi
          </Typography>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell><strong>Azienda</strong></TableCell>
                <TableCell><strong>Struttura / Luogo</strong></TableCell>
                <TableCell><strong>Data Visita</strong></TableCell>
                <TableCell><strong>Frequenza</strong></TableCell>
                <TableCell><strong>Prossima Scadenza</strong></TableCell>
                <TableCell><strong>Esito Verbale</strong></TableCell>
                <TableCell align="right"><strong>Azioni</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>Caricamento sopralluoghi...</TableCell>
                </TableRow>
              ) : filteredVisits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nessun sopralluogo programmato o registrato per i criteri selezionati.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1.5 }}
                      startIcon={<AddLocationAltIcon />}
                      onClick={() => setPlanningOpen(true)}
                    >
                      Pianifica il primo sopralluogo
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisits.map((item) => {
                  const isOverdue = item.nextDueDate && new Date(item.nextDueDate) < new Date() && item.outcome === 'Pianificato'
                  let outcomeChipColor = 'default'
                  if (item.outcome === 'Conforme') outcomeChipColor = 'success'
                  else if (item.outcome === 'Con Prescrizioni') outcomeChipColor = 'warning'
                  else if (item.outcome === 'Non Conforme') outcomeChipColor = 'error'
                  else if (item.outcome === 'Pianificato') outcomeChipColor = isOverdue ? 'error' : 'info'

                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <BusinessIcon fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight={600}>
                            {item.companyName || companies.find(c => c.id === item.companyId)?.name || `Azienda #${item.companyId}`}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.visitedStructure}</Typography>
                        {item.location && (
                          <Typography variant="caption" color="text.secondary">{item.location}</Typography>
                        )}
                      </TableCell>
                      <TableCell>{item.visitDate ? new Date(item.visitDate).toLocaleDateString('it-IT') : '-'}</TableCell>
                      <TableCell>{item.frequency || 'Annuale'}</TableCell>
                      <TableCell>
                        {item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString('it-IT') : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={isOverdue ? 'Scaduto' : (item.outcome || 'Pianificato')}
                          color={outcomeChipColor}
                          variant={item.outcome === 'Pianificato' ? 'outlined' : 'filled'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AssignmentTurnedInIcon />}
                            onClick={() => handleOpenReport(item)}
                            sx={{ textTransform: 'none', py: 0.2 }}
                          >
                            Verbale
                          </Button>
                          <Tooltip title="Elimina Sopralluogo">
                            <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

      {/* Pianifica Sopralluogo Dialog */}
      <Dialog open={planningOpen} onClose={() => setPlanningOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Pianifica Sopralluogo Ambienti di Lavoro</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              select
              label="Azienda *"
              value={planCompanyId}
              onChange={(e) => setPlanCompanyId(e.target.value)}
              fullWidth
            >
              {companies.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Struttura / Luogo Visitato *"
              value={planStructure}
              onChange={(e) => setPlanStructure(e.target.value)}
              placeholder="es. Sede Operativa / Reparto Stampaggio / Magazzino"
              fullWidth
            />

            <TextField
              label="Indirizzo / Ubicazione"
              value={planLocation}
              onChange={(e) => setPlanLocation(e.target.value)}
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Data Sopralluogo *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Periodicità / Frequenza"
                  value={planFrequency}
                  onChange={(e) => setPlanFrequency(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="Annuale (Art. 25 c.1 lett. l)">Annuale (Art. 25 c.1 lett. l)</MenuItem>
                  <MenuItem value="Semestrale (Alto Rischio)">Semestrale (Alto Rischio)</MenuItem>
                  <MenuItem value="Biennale">Biennale</MenuItem>
                  <MenuItem value="Straordinario / Su Richiesta">Straordinario / Su Richiesta</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Note e Obiettivi Ispettivi"
              multiline
              rows={3}
              value={planNotes}
              onChange={(e) => setPlanNotes(e.target.value)}
              placeholder="es. Verifica microclima, aerazione, postazioni VDT e dispositivi di protezione..."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPlanningOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleSavePlan} disabled={!planDate || !planStructure}>
            Conferma Pianificazione
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compila Report / Verbale Dialog */}
      <Dialog open={!!reportingVisit} onClose={() => setReportingVisit(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Verbale di Sopralluogo & Rilievi</DialogTitle>
        <DialogContent dividers>
          {reportingVisit && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Box sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">Struttura / Azienda:</Typography>
                <Typography variant="subtitle2" fontWeight={700}>
                  {reportingVisit.companyName || 'Azienda'} — {reportingVisit.visitedStructure}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Data Esecuzione: {reportingVisit.visitDate ? new Date(reportingVisit.visitDate).toLocaleDateString('it-IT') : '-'}
                </Typography>
              </Box>

              <TextField
                select
                label="Esito del Sopralluogo *"
                value={reportOutcome}
                onChange={(e) => setReportOutcome(e.target.value)}
                fullWidth
              >
                <MenuItem value="Conforme">Conforme (Ambienti e presidi a norma)</MenuItem>
                <MenuItem value="Con Prescrizioni">Con Prescrizioni (Rilevate non conformità minori)</MenuItem>
                <MenuItem value="Non Conforme">Non Conforme (Gravi carenze igienico-sanitarie)</MenuItem>
              </TextField>

              <TextField
                label="Data Prossimo Sopralluogo"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={reportNextDueDate}
                onChange={(e) => setReportNextDueDate(e.target.value)}
                fullWidth
              />

              <TextField
                label="Verbale, Prescrizioni e Misure di Miglioramento"
                multiline
                rows={5}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Dettagliare lo stato dei luoghi, conformità dei presidi di primo soccorso, illuminazione, ergonomia e prescrizioni per il Datore di Lavoro/RSPP..."
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setReportingVisit(null)}>Annulla</Button>
          <Button variant="contained" color="primary" onClick={handleSaveReport}>
            Salva Verbale Ufficiale
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default SiteVisitDeadlinesCenter
