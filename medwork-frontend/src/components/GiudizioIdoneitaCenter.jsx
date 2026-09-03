import { useEffect, useState, useMemo } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import SaveIcon from '@mui/icons-material/Save'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import CloseIcon from '@mui/icons-material/Close'

import { apiGet, apiSend, getApiBaseUrl, getHeaders } from '../services/apiClient'
import { currentDateValue, formDateValue, DATE_PICKER_LOCALE } from '../utils/datePicker'

const OUTCOMES = [
  { code: 'IDONE0', label: 'Idoneo alla mansione', color: 'success' },
  { code: 'IDONE0P', label: 'Idoneo alla mansione con prescrizioni', color: 'warning' },
  { code: 'IDONE0L', label: 'Idoneo alla mansione con limitazioni', color: 'warning' },
  { code: 'NONIDONE0', label: 'Non idoneo', color: 'error' },
  { code: 'INATTESA', label: 'In attesa di accertamenti', color: 'info' },
]

function getOutcomeInfo(code, label) {
  const match = OUTCOMES.find((o) => o.code === code)
  if (match) return match
  const lbl = (label || '').toLowerCase()
  if (lbl.includes('non idoneo') || lbl.includes('inidoneo')) {
    return { code: 'NONIDONE0', label: label || 'Non idoneo', color: 'error' }
  }
  if (lbl.includes('prescriz') || lbl.includes('limitaz') || lbl.includes('parzial')) {
    return { code: 'IDONE0P', label: label || 'Idoneo con prescrizioni/limitazioni', color: 'warning' }
  }
  if (lbl.includes('idone')) {
    return { code: 'IDONE0', label: label || 'Idoneo alla mansione', color: 'success' }
  }
  return { code: 'INATTESA', label: label || 'In attesa di accertamenti', color: 'default' }
}

export default function GiudizioIdoneitaCenter({ medicalVisitId }) {
  const [visits, setVisits] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filters
  const [searchText, setSearchText] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState('all')
  const [selectedOutcomeCode, setSelectedOutcomeCode] = useState('all')

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activeVisit, setActiveVisit] = useState(null)
  const [judgmentForm, setJudgmentForm] = useState({
    outcomeCode: '',
    outcome: '',
    prescriptions: '',
    limitations: '',
    nextReviewDate: '',
  })
  const [saving, setSaving] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [visitsData, companiesData] = await Promise.all([
        apiGet('/api/visit-judgments'),
        apiGet('/api/master-data/companies').catch(() => []),
      ])
      const list = Array.isArray(visitsData) ? visitsData : []
      setVisits(list)
      setCompanies(Array.isArray(companiesData) ? companiesData : [])

      if (medicalVisitId) {
        const found = list.find((v) => Number(v.id) === Number(medicalVisitId))
        if (found) {
          openEdit(found)
        }
      }
    } catch (err) {
      setError(err.message || 'Errore nel caricamento delle visite e dei giudizi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [medicalVisitId])

  const openEdit = (visit) => {
    setActiveVisit(visit)
    const info = getOutcomeInfo(visit.outcomeCode, visit.outcome)
    setJudgmentForm({
      outcomeCode: visit.outcomeCode || info.code,
      outcome: visit.outcome || info.label,
      prescriptions: visit.prescriptions || '',
      limitations: visit.limitations || '',
      nextReviewDate: visit.nextDeadlineDate ? visit.nextDeadlineDate.slice(0, 10) : '',
    })
    setSuccess('')
    setEditDialogOpen(true)
  }

  const handleSaveJudgment = async () => {
    if (!activeVisit?.id) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        outcomeCode: judgmentForm.outcomeCode,
        outcome: judgmentForm.outcome,
        prescriptions: judgmentForm.prescriptions || null,
        limitations: judgmentForm.limitations || null,
        nextReviewDate: judgmentForm.nextReviewDate ? new Date(judgmentForm.nextReviewDate).toISOString() : null,
      }
      await apiSend('PUT', `/api/visit-judgments/${activeVisit.id}`, payload)
      setSuccess('Giudizio di idoneità salvato e aggiornato con successo.')

      // Update in local state
      setVisits((prev) =>
        prev.map((item) =>
          item.id === activeVisit.id
            ? {
                ...item,
                outcomeCode: payload.outcomeCode,
                outcome: payload.outcome,
                prescriptions: payload.prescriptions,
                limitations: payload.limitations,
                nextDeadlineDate: payload.nextReviewDate,
              }
            : item
        )
      )
      setEditDialogOpen(false)
    } catch (err) {
      setError(err.message || 'Salvataggio giudizio fallito.')
    } finally {
      setSaving(false)
    }
  }

  const downloadPdf = async (visitId) => {
    if (!visitId) return
    setDownloadingId(visitId)
    setError('')
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/documents/visits/${visitId}/fitness-judgment-pdf`,
        { headers: getHeaders() }
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `giudizio-idoneita-${visitId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Impossibile scaricare il certificato PDF. Riprovare.')
    } finally {
      setDownloadingId(null)
    }
  }

  // Filtered rows
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (selectedCompanyId !== 'all' && Number(v.companyId) !== Number(selectedCompanyId)) {
        return false
      }
      if (selectedOutcomeCode !== 'all') {
        const info = getOutcomeInfo(v.outcomeCode, v.outcome)
        if (info.code !== selectedOutcomeCode) return false
      }
      if (searchText.trim()) {
        const needle = searchText.trim().toLowerCase()
        const match =
          (v.employeeFullName || '').toLowerCase().includes(needle) ||
          (v.employeeTaxCode || '').toLowerCase().includes(needle) ||
          (v.companyName || '').toLowerCase().includes(needle) ||
          (v.doctorFullName || '').toLowerCase().includes(needle) ||
          (v.outcome || '').toLowerCase().includes(needle)
        if (!match) return false
      }
      return true
    })
  }, [visits, selectedCompanyId, selectedOutcomeCode, searchText])

  // KPIs
  const metrics = useMemo(() => {
    let idonei = 0
    let prescrizioni = 0
    let inidonei = 0
    let inAttesa = 0

    visits.forEach((v) => {
      const info = getOutcomeInfo(v.outcomeCode, v.outcome)
      if (info.code === 'IDONE0') idonei++
      else if (info.code === 'IDONE0P' || info.code === 'IDONE0L') prescrizioni++
      else if (info.code === 'NONIDONE0') inidonei++
      else inAttesa++
    })

    return { total: visits.length, idonei, prescrizioni, inidonei, inAttesa }
  }, [visits])

  return (
    <Box sx={{ p: 2.5, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f1f3d' }}>
          Centro Giudizi di Idoneità (Art. 41 D.Lgs. 81/08)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestione, consultazione, verbalizzazione e rilascio dei certificati di idoneità alla mansione specifica.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderLeft: '4px solid #1976d2' }}>
            <Typography variant="caption" color="text.secondary">Totale Visite</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>{metrics.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderLeft: '4px solid #2e7d32' }}>
            <Typography variant="caption" color="text.secondary">Idonei</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>{metrics.idonei}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderLeft: '4px solid #ed6c02' }}>
            <Typography variant="caption" color="text.secondary">Con Prescrizioni / Limitazioni</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#ed6c02' }}>{metrics.prescrizioni}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderLeft: '4px solid #d32f2f' }}>
            <Typography variant="caption" color="text.secondary">Non Idonei</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>{metrics.inidonei}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderLeft: '4px solid #0288d1' }}>
            <Typography variant="caption" color="text.secondary">In Attesa Accertamenti</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0288d1' }}>{metrics.inAttesa}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Toolbar Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Cerca lavoratore, CF, mansione..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 260, flexGrow: 1 }}
          />
          <TextField
            size="small"
            select
            label="Azienda"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">Tutte le aziende</MenuItem>
            {companies.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Esito Giudizio"
            value={selectedOutcomeCode}
            onChange={(e) => setSelectedOutcomeCode(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">Tutti gli esiti</MenuItem>
            {OUTCOMES.map((o) => (
              <MenuItem key={o.code} value={o.code}>{o.label}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={() => {
              setSearchText('')
              setSelectedCompanyId('all')
              setSelectedOutcomeCode('all')
            }}
          >
            Reset
          </Button>
          <Button variant="contained" startIcon={<SearchIcon />} onClick={loadData}>
            Aggiorna
          </Button>
        </Stack>
      </Paper>

      {/* Main Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress size={36} />
            <Typography variant="body2" sx={{ mt: 1.5 }} color="text.secondary">Caricamento giudizi in corso...</Typography>
          </Box>
        ) : filteredVisits.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">Nessun giudizio di idoneità trovato con i filtri correnti.</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f4f6f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Data Visita</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lavoratore</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Azienda</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Medico Competente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Esito Giudizio</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Prescrizioni / Limitazioni</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Prossima Revisione</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVisits.map((row) => {
                const info = getOutcomeInfo(row.outcomeCode, row.outcome)
                const visitDateStr = row.visitDate ? new Date(row.visitDate).toLocaleDateString('it-IT') : '—'
                const deadlineStr = row.nextDeadlineDate ? new Date(row.nextDeadlineDate).toLocaleDateString('it-IT') : '—'
                const notes = row.prescriptions || row.limitations || row.clinicalNotes || '—'

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>{visitDateStr}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{row.employeeFullName}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.employeeJobRole || '—'} • {row.employeeTaxCode || ''}</Typography>
                    </TableCell>
                    <TableCell>{row.companyName}</TableCell>
                    <TableCell sx={{ color: '#0f4c81', fontWeight: 500 }}>{row.doctorFullName}</TableCell>
                    <TableCell>
                      <Chip
                        label={info.label}
                        color={info.color}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {notes}
                    </TableCell>
                    <TableCell>{deadlineStr}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Modifica Giudizio">
                          <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Scarica Certificato PDF (Art. 41)">
                          <IconButton
                            size="small"
                            color="secondary"
                            disabled={downloadingId === row.id}
                            onClick={() => downloadPdf(row.id)}
                          >
                            {downloadingId === row.id ? <CircularProgress size={18} /> : <DownloadIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Detail / Editing Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0f1f3d', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
              Verbalizzazione Giudizio di Idoneità
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Lavoratore: {activeVisit?.employeeFullName} • {activeVisit?.companyName}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setEditDialogOpen(false)} sx={{ color: '#ffffff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3, mt: 1 }}>
          <Stack spacing={2.5}>
            <TextField
              select
              label="Esito Formale Giudizio *"
              value={judgmentForm.outcomeCode}
              onChange={(e) => {
                const selected = OUTCOMES.find((o) => o.code === e.target.value)
                setJudgmentForm({
                  ...judgmentForm,
                  outcomeCode: e.target.value,
                  outcome: selected?.label || '',
                })
              }}
              fullWidth
            >
              {OUTCOMES.map((o) => (
                <MenuItem key={o.code} value={o.code}>
                  <Chip label={o.label} color={o.color} size="small" sx={{ mr: 1 }} />
                  {o.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Prescrizioni specifiche"
              multiline
              rows={3}
              fullWidth
              value={judgmentForm.prescriptions}
              onChange={(e) => setJudgmentForm({ ...judgmentForm, prescriptions: e.target.value })}
              placeholder="Es. Obbligo di utilizzo DPI uditivi classe SNR ≥ 28 dB durante l'uso di macchine utensili..."
              helperText="Specificare eventuali misure o dispositivi di protezione obbligatori per il lavoratore."
            />

            <TextField
              label="Limitazioni operative"
              multiline
              rows={3}
              fullWidth
              value={judgmentForm.limitations}
              onChange={(e) => setJudgmentForm({ ...judgmentForm, limitations: e.target.value })}
              placeholder="Es. Esclusione dalla movimentazione manuale di carichi > 10 kg; non idoneo al lavoro notturno..."
              helperText="Specificare divieti o esclusioni da mansioni specifiche o posture prolungate."
            />

            <DesktopDatePicker
              label="Data Prossima Revisione / Scadenza Idoneità *"
              InputLabelProps={{ shrink: true }}
              value={currentDateValue(judgmentForm.nextReviewDate)}
              onChange={(date) => setJudgmentForm({ ...judgmentForm, nextReviewDate: formDateValue(date) })}
              inputFormat="dd/MM/yyyy"
              locale={DATE_PICKER_LOCALE}
            />

            <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
              <strong>Comunicazione legale ex art. 41 D.Lgs. 81/08:</strong> Copia del giudizio viene notificata al datore di lavoro e rilasciata al lavoratore. Avverso il presente giudizio è ammesso ricorso entro 30 giorni all&apos;organo di vigilanza territorialmente competente (ASL / Spresal).
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eaeef5' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => downloadPdf(activeVisit?.id)}
            disabled={!activeVisit?.id || saving}
          >
            Scarica PDF Certificato
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setEditDialogOpen(false)}>Chiudi</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveJudgment}
            disabled={saving || !judgmentForm.outcomeCode}
          >
            {saving ? 'Salvataggio…' : 'Salva e Conferma Giudizio'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
