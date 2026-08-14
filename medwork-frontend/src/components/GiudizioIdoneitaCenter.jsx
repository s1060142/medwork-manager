import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import DownloadIcon from '@mui/icons-material/Download'
import { apiGet, apiSend, getApiBaseUrl, getHeaders } from '../services/apiClient'

const OUTCOMES = [
  { code: 'IDONE0', label: 'Idoneo alla mansione' },
  { code: 'IDONE0P', label: 'Idoneo alla mansione con prescrizioni' },
  { code: 'IDONE0L', label: 'Idoneo alla mansione con limitazioni' },
  { code: 'NONIDONE0', label: 'Non idoneo' },
  { code: 'INATTESA', label: 'In attesa di accertamenti' },
]

export default function GiudizioIdoneitaCenter({ medicalVisitId }) {
  const [judgment, setJudgment] = useState({
    outcomeCode: '',
    outcome: '',
    prescriptions: '',
    limitations: '',
    nextReviewDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!medicalVisitId) return
    setLoading(true)
    setError('')
    apiGet(`/api/visit-judgments/${medicalVisitId}`)
      .then((data) => {
        setJudgment({
          outcomeCode: data.outcomeCode || '',
          outcome: data.outcome || '',
          prescriptions: data.clinicalNotes || '',
          limitations: data.objectiveExam || '',
          nextReviewDate: data.nextDeadlineDate ? data.nextDeadlineDate.slice(0, 10) : '',
        })
      })
      .catch((err) => {
        if (err?.status !== 404) setError(err.message || 'Errore caricamento giudizio.')
      })
      .finally(() => setLoading(false))
  }, [medicalVisitId])

  const save = async () => {
    if (!medicalVisitId) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const payload = {
        outcomeCode: judgment.outcomeCode,
        outcome: judgment.outcome,
        prescriptions: judgment.prescriptions,
        limitations: judgment.limitations,
        nextReviewDate: judgment.nextReviewDate ? new Date(judgment.nextReviewDate).toISOString() : null,
      }
      await apiSend('PUT', `/api/visit-judgments/${medicalVisitId}`, payload)
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Salvataggio giudizio fallito.')
    } finally {
      setSaving(false)
    }
  }

  const downloadPdf = async () => {
    if (!medicalVisitId) return
    setDownloading(true)
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/documents/visits/${medicalVisitId}/fitness-judgment-pdf`,
        { headers: getHeaders() }
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `giudizio-idoneita-${medicalVisitId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Impossibile scaricare il PDF. Riprovare.')
    } finally {
      setDownloading(false)
    }
  }

  if (!medicalVisitId) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body2">Seleziona una visita medica per registrare il giudizio di idoneità.</Typography>
      </Paper>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Giudizio di idoneità strutturato
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Giudizio salvato.</Alert>}
      <Stack spacing={2}>
        <TextField
          select
          label="Esito"
          value={judgment.outcomeCode}
          onChange={(e) => {
            const selected = OUTCOMES.find((o) => o.code === e.target.value)
            setJudgment({ ...judgment, outcomeCode: e.target.value, outcome: selected?.label || '' })
          }}
        >
          {OUTCOMES.map((o) => (
            <MenuItem key={o.code} value={o.code}>{o.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Prescrizioni"
          multiline
          rows={3}
          fullWidth
          value={judgment.prescriptions}
          onChange={(e) => setJudgment({ ...judgment, prescriptions: e.target.value })}
        />
        <TextField
          label="Limitazioni"
          multiline
          rows={3}
          fullWidth
          value={judgment.limitations}
          onChange={(e) => setJudgment({ ...judgment, limitations: e.target.value })}
        />
        <TextField
          label="Data prossima revisione"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={judgment.nextReviewDate}
          onChange={(e) => setJudgment({ ...judgment, nextReviewDate: e.target.value })}
        />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva giudizio'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadPdf}
            disabled={downloading || !judgment.outcomeCode}
          >
            {downloading ? 'Generazione…' : 'Scarica PDF'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
