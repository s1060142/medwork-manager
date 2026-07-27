import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import CampaignIcon from '@mui/icons-material/Campaign'
import PersonIcon from '@mui/icons-material/Person'
import { apiGet } from '../services/apiClient'

const API = 'http://127.0.0.1:5000'
function token() { return localStorage.getItem('accessToken') || '' }
function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('it-IT')
}

const VISIT_TYPES = [
  { value: 'Preventive', label: 'Preventiva' },
  { value: 'Periodic', label: 'Periodica' },
  { value: 'RoleChange', label: 'Cambio mansione' },
  { value: 'EmployeeRequest', label: 'Richiesta lavoratore' },
  { value: 'EndOfRelationship', label: 'Fine rapporto' },
]

export default function ConvocazioniCenter() {
  const [employees, setEmployees] = useState([])
  const [selected, setSelected] = useState([])
  const [visitType, setVisitType] = useState('Periodic')
  const [visitDate, setVisitDate] = useState('')
  const [location, setLocation] = useState('')
  const [logs, setLogs] = useState([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    apiGet('/api/master-data/employees')
      .then(setEmployees)
      .catch((e) => setError(e.message || 'Errore nel caricamento lavoratori.'))
    apiGet('/api/master-data/notification-logs').then(setLogs).catch(() => {})
  }, [])

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleAll = (e) => {
    if (e.target.checked) setSelected(employees.map((x) => x.id))
    else setSelected([])
  }

  const sendMass = async () => {
    setError(''); setSuccess('')
    if (selected.length === 0) { setError('Seleziona almeno un lavoratore.'); return }
    if (!visitDate) { setError('Inserisci data e ora della visita.'); return }
    setBusy(true); setProgress(`Invio a ${selected.length} lavoratori...`)
    try {
      const res = await fetch(`${API}/api/convocazioni/invia-massa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          employeeIds: selected,
          visitDate: new Date(visitDate).toISOString(),
          visitType,
          location: location || null,
        }),
      })
      if (!res.ok) throw new Error('Invio fallito.')
      const data = await res.json()
      setSuccess(`Convocazioni inviate: ${data.inviati}.`)
      setProgress('')
      apiGet('/api/master-data/notification-logs').then(setLogs).catch(() => {})
    } catch (e) {
      setError(e.message || 'Errore durante l\'invio.')
      setProgress('')
    } finally { setBusy(false) }
  }

  const sendOne = async (id) => {
    if (!visitDate) { setError('Inserisci data e ora della visita.'); return }
    setBusy(true); setError(''); setSuccess('')
    try {
      const res = await fetch(`${API}/api/convocazioni/invia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ employeeId: id, visitDate: new Date(visitDate).toISOString(), visitType, location: location || null }),
      })
      if (!res.ok) throw new Error('Invio fallito.')
      setSuccess(`Convocazione inviata a ${employees.find((e) => e.id === id)?.lastName}.`)
      apiGet('/api/master-data/notification-logs').then(setLogs).catch(() => {})
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const openPdf = (id) => {
    if (!visitDate) { setError('Seleziona data per generare il PDF.'); return }
    const url = `${API}/api/convocazioni/pdf/${id}?visitDate=${encodeURIComponent(new Date(visitDate).toISOString())}&visitType=${encodeURIComponent(visitType)}&location=${encodeURIComponent(location || '')}`
    window.open(url, '_blank')
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header stile Cartsan */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, background: 'linear-gradient(135deg,#1976d2,#00897b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <CampaignIcon />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700}>Convocazioni</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Invia convocazioni visita medica via email (con PDF allegato) — singole o di massa
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ my: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Pannello configurazione */}
        <Grid  size={{ xs: 12, md: 4 }}>
          <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <SendIcon color="primary" />
                <Typography variant="h6">Parametri convocazione</Typography>
              </Stack>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Tipologia visita</InputLabel>
                  <Select label="Tipologia visita" value={visitType} onChange={(e) => setVisitType(e.target.value)}>
                    {VISIT_TYPES.map((v) => <MenuItem key={v.value} value={v.value}>{v.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Data e ora visita" type="datetime-local" value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                <TextField label="Luogo (opzionale)" value={location} onChange={(e) => setLocation(e.target.value)} fullWidth />
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Selezionati: <strong>{selected.length}</strong> / {employees.length}
                  </Typography>
                  <Button fullWidth variant="contained" size="large" startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <CampaignIcon />}
                    onClick={sendMass} disabled={busy || selected.length === 0} sx={{ borderRadius: 2 }}>
                    Invia convocazioni di massa
                  </Button>
                  {progress && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{progress}</Typography>}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabella lavoratori selezionabili */}
        <Grid  size={{ xs: 12, md: 8 }}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Lavoratori</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Spunta i lavoratori da convocare. Usa il checkbox in alto per selezionare tutti.
              </Typography>
              <Box sx={{ maxHeight: 460, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox checked={selected.length === employees.length && employees.length > 0} onChange={toggleAll} />
                      </TableCell>
                      <TableCell>Lavoratore</TableCell>
                      <TableCell>Mansione</TableCell>
                      <TableCell align="right">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.map((e) => (
                      <TableRow key={e.id} selected={selected.includes(e.id)} hover>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selected.includes(e.id)} onChange={() => toggle(e.id)} />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PersonIcon fontSize="small" color="action" />
                            <span>{e.lastName} {e.firstName}</span>
                          </Stack>
                        </TableCell>
                        <TableCell>{e.jobRole}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={() => openPdf(e.id)}>PDF</Button>
                            <Button size="small" variant="outlined" startIcon={<SendIcon />} onClick={() => sendOne(e.id)} disabled={busy}>Invia</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Storico */}
        <Grid  size={{ xs: 12 }}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Storico convocazioni</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Lavoratore</TableCell>
                    <TableCell>Canale</TableCell>
                    <TableCell>Data invio</TableCell>
                    <TableCell>Dettaglio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(logs || []).slice(0, 30).map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.employeeFullName}</TableCell>
                      <TableCell>{l.channel}</TableCell>
                      <TableCell>{formatDateTime(l.sentDate)}</TableCell>
                      <TableCell>{l.messageText}</TableCell>
                    </TableRow>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <TableRow><TableCell colSpan={4}>Nessuna convocazione inviata.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        In ambiente di sviluppo l'email viene simulata (nessun server SMTP configurato).
        Configura la sezione "Email" in appsettings per l'invio reale.
      </Alert>
    </Box>
  )
}
