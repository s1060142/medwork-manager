import { useEffect, useState, useMemo } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Snackbar
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { apiGet, apiSend } from '../services/apiClient'

function RecallCampaignsCenter() {
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(0)
  const [daysThreshold, setDaysThreshold] = useState(30)
  
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    apiGet('/api/master-data/companies')
      .then(data => setCompanies(Array.isArray(data) ? data : []))
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

  const handleSendCampaign = async () => {
    if (candidates.length === 0) return
    setSending(true)
    setError('')
    try {
      const response = await apiSend('POST', '/api/doctor-data/recall-campaign', {
        companyId: selectedCompanyId,
        daysThreshold: daysThreshold
      })
      setSuccessMsg(`Campagna avviata. Inviati ${response.notifiedCount} richiami.`)
      
      // Refresh candidates
      const data = await apiGet(`/api/doctor-data/recall-candidates?companyId=${selectedCompanyId}&days=${daysThreshold}`)
      setCandidates(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Errore durante l\'invio della campagna.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Convocazioni Automatiche (Recall)</Typography>
      
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={3} direction={{ xs: 'column', md: 'row' }} alignItems="center">
          <Box sx={{ minWidth: 250 }}>
            <Typography variant="subtitle2" gutterBottom>Filtro Azienda</Typography>
            <Select 
              size="small" 
              fullWidth 
              value={selectedCompanyId} 
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
            >
              <MenuItem value={0}>Tutte le aziende</MenuItem>
              {companies.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ flexGrow: 1, px: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Finestra di preavviso (Giorni): {daysThreshold}</Typography>
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
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Lavoratori in Scadenza ({candidates.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />} 
              disabled={candidates.length === 0 || sending || loading}
              onClick={handleSendCampaign}
            >
              Lancia Campagna
            </Button>
          </Stack>

          {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : candidates.length === 0 ? (
            <Alert severity="info">Nessun lavoratore in scadenza nella finestra selezionata.</Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell><strong>Lavoratore</strong></TableCell>
                    <TableCell><strong>Azienda</strong></TableCell>
                    <TableCell><strong>Data Scadenza</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.map(row => (
                    <TableRow key={row.employeeId}>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{row.companyName}</TableCell>
                      <TableCell>{new Date(row.deadlineDate).toLocaleDateString('it-IT')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

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
