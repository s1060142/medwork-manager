import { useEffect, useState, useMemo } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  Select,
  Slider,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import EmailIcon from '@mui/icons-material/Email'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AssignmentIcon from '@mui/icons-material/Assignment'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { apiGet, apiSend } from '../services/apiClient'

const RECALL_TEMPLATES = [
  {
    id: 'standard',
    name: '1. Convocazione Formale Standard (D.Lgs. 81/08 Art. 41)',
    subject: 'Convocazione a Visita Medica di Sorveglianza Sanitaria D.Lgs. 81/08',
    body: 'Gentile lavoratore/trice,\n\nSi comunica che in ottemperanza agli obblighi di sorveglianza sanitaria di cui all\'Art. 41 del D.Lgs. 81/08, è convocato/a per la visita medica periodica.\n\nLa preghiamo di presentarsi munito/a di documento di riconoscimento in corso di validità e di eventuale documentazione sanitaria recente.',
  },
  {
    id: 'urgente',
    name: '2. Sollecito Urgente (Idoneità Scaduta / Fuori Termine)',
    subject: 'SOLLECITO URGENTE: Scadenza Sorveglianza Sanitaria Obbligatoria',
    body: 'AVVISO URGENTE:\n\nLa Sua idoneità alla mansione specifica risulta scaduta. Ai sensi della normativa vigente, la mancata esecuzione della visita medica comporta la sospensione temporanea dalle mansioni a rischio.\n\nContatti immediatamente la segreteria o risponda alla presente per concordare la data.',
  },
  {
    id: 'selfservice',
    name: '3. Invito con Questionario Anamnestico Digitale',
    subject: 'Visita Medica Programmata - Compila il Questionario Anamnestico',
    body: 'Gentile lavoratore/trice,\n\nIn preparazione alla Sua prossima visita medica di medicina del lavoro, La invitiamo a compilare il questionario anamnestico pre-visita accedendo al portale dipendenti MedWork.\n\nLa compilazione preventiva riduce i tempi di attesa in ambulatorio.',
  },
]

function RecallCampaignsCenter() {
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(0)
  const [daysThreshold, setDaysThreshold] = useState(30)
  const [selectedTemplateId, setSelectedTemplateId] = useState('standard')
  const [previewOpen, setPreviewOpen] = useState(false)
  
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [digestMsg, setDigestMsg] = useState('')

  useEffect(() => {
    apiGet('/api/master-data/companies')
      .then(data => setCompanies(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])))
      .catch(() => setError('Impossibile caricare le aziende.'))
  }, [])

  useEffect(() => {
    const loadCandidates = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await apiGet(`/api/doctor-data/recall-candidates?companyId=${selectedCompanyId}&days=${daysThreshold}`)
        setCandidates(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Errore nel caricamento dei candidati.')
      } finally {
        setLoading(false)
      }
    }
    loadCandidates()
  }, [selectedCompanyId, daysThreshold])

  const currentTemplate = useMemo(() => {
    return RECALL_TEMPLATES.find(t => t.id === selectedTemplateId) || RECALL_TEMPLATES[0]
  }, [selectedTemplateId])

  const handleSendCampaign = async () => {
    if (candidates.length === 0) return
    setSending(true)
    setError('')
    try {
      const response = await apiSend('POST', '/api/doctor-data/recall-campaign', {
        companyId: selectedCompanyId,
        daysThreshold: daysThreshold,
        templateId: selectedTemplateId,
      })
      setSuccessMsg(`✓ Campagna avviata con successo: inviati ${response.notifiedCount || candidates.length} solleciti con template "${currentTemplate.name}".`)
      
      // Refresh candidates
      const data = await apiGet(`/api/doctor-data/recall-candidates?companyId=${selectedCompanyId}&days=${daysThreshold}`)
      setCandidates(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Errore durante l\'invio della campagna.')
    } finally {
      setSending(false)
    }
  }

  const handleMarkNoShow = async (candidate) => {
    try {
      setSending(true)
      await apiSend('POST', '/api/alerts/send', {
        recipient: candidate.companyName || 'Datore di Lavoro',
        channel: 'Pec',
        subject: `COMUNICAZIONE FORMALE: Mancata presentazione visita medica - ${candidate.employeeName}`,
        message: `Si comunica che in data odierna il lavoratore ${candidate.employeeName} non si è presentato alla visita medica di sorveglianza sanitaria programmata ai sensi dell'Art. 41 D.Lgs. 81/08. Ai sensi della normativa, si richiede di concordare nuova data o procedere alle determinazioni di competenza.`,
      })
      setSuccessMsg(`✓ Registrata assenza lavoratore. Notifica formale No-Show inviata via PEC a ${candidate.companyName}.`)
    } catch (err) {
      setError('Errore nella registrazione No-Show: ' + (err.message || 'Server error'))
    } finally {
      setSending(false)
    }
  }

  const handleSendMorningDigest = async () => {
    try {
      setDigestMsg('Invio Morning Digest in corso...')
      await apiSend('POST', '/api/doctor-data/agenda/morning-digest', {})
      setDigestMsg('✓ Morning Digest inviato con successo al medico competente!')
    } catch (err) {
      setDigestMsg('Errore invio digest: ' + (err.message || 'Server error'))
    }
  }

  return (
    <Stack spacing={3} sx={{ pb: 4 }}>
      {/* HEADER & MORNING DIGEST */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#0f1f3d">
              Convocazioni Automatiche & Recall (D.Lgs. 81/08)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generazione massiva e notifica automatica dei richiami per visite mediche in scadenza.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EmailIcon />}
              onClick={handleSendMorningDigest}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Invia Morning Digest Giornaliero
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {digestMsg && <Alert severity={digestMsg.startsWith('✓') ? 'success' : 'info'}>{digestMsg}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      
      {/* FILTERS & TEMPLATE SELECTOR */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Azienda Cliente
            </Typography>
            <Select 
              size="small" 
              fullWidth 
              value={selectedCompanyId} 
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
            >
              <MenuItem value={0}>Tutte le aziende convenzionate</MenuItem>
              {companies.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Template Notifica & Convocazione
            </Typography>
            <Select
              size="small"
              fullWidth
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              {RECALL_TEMPLATES.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ px: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Finestra di Preavviso: <strong>{daysThreshold} giorni</strong>
              </Typography>
              <Slider
                value={daysThreshold}
                onChange={(_, val) => setDaysThreshold(val)}
                step={5}
                marks
                min={5}
                max={90}
                valueLabelDisplay="auto"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* CANDIDATES TABLE & LAUNCH BAR */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f1f3d">
                Lavoratori Candidati al Recall ({candidates.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Idoneità in scadenza entro i prossimi {daysThreshold} giorni per l&apos;azienda selezionata.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => setPreviewOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Anteprima Testo
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />} 
                disabled={candidates.length === 0 || sending || loading}
                onClick={handleSendCampaign}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                {sending ? 'Invio in corso...' : `Lancia Campagna (${candidates.length} Notifiche)`}
              </Button>
            </Stack>
          </Stack>

          {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
          ) : candidates.length === 0 ? (
            <Alert severity="info">Nessun lavoratore in scadenza nella finestra selezionata.</Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eef2f6', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Lavoratore</strong></TableCell>
                    <TableCell><strong>Azienda</strong></TableCell>
                    <TableCell><strong>Data Scadenza</strong></TableCell>
                    <TableCell><strong>Canale Proposto</strong></TableCell>
                    <TableCell align="right"><strong>Stato Recall</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.map(row => (
                    <TableRow key={row.employeeId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{row.employeeName}</Typography>
                      </TableCell>
                      <TableCell>{row.companyName}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={new Date(row.deadlineDate) < new Date() ? 'error' : 'warning'}
                          label={new Date(row.deadlineDate).toLocaleDateString('it-IT')}
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label="Email + PEC" size="small" sx={{ fontSize: '0.75rem' }} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                          <Chip label="In attesa invio" size="small" color="default" sx={{ fontSize: '0.75rem' }} />
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleMarkNoShow(row)}
                            sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.2 }}
                          >
                            No-Show / Sollecito DdL
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* TEMPLATE PREVIEW DIALOG */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Anteprima Convocazione: {currentTemplate.name}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" color="text.secondary">Oggetto:</Typography>
          <Typography variant="body1" fontWeight={700} sx={{ mb: 2 }}>{currentTemplate.subject}</Typography>
          <Typography variant="subtitle2" color="text.secondary">Corpo del Messaggio:</Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem', mt: 0.5 }}>
            {currentTemplate.body}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={Boolean(successMsg)} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMsg('')}
        message={successMsg}
      />
    </Stack>
  )
}

export default RecallCampaignsCenter
