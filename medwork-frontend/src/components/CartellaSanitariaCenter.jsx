import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import { apiGet, apiSend } from '../services/apiClient'

const FIELDS = [
  { key: 'medicalHistory', label: 'Anamnesi (min 20 caratteri)', multiline: true, rows: 4 },
  { key: 'notes', label: 'Note', multiline: true, rows: 2 },
  { key: 'currentTherapies', label: 'Terapie in corso', multiline: true, rows: 2 },
  { key: 'allergies', label: 'Allergie', multiline: true, rows: 2 },
  { key: 'familyHistory', label: 'Anamnesi familiare', multiline: true, rows: 2 },
]

export default function CartellaSanitariaCenter({ employeeId: employeeIdProp }) {
  const [employeeId, setEmployeeId] = useState(employeeIdProp || '')
  const [record, setRecord] = useState(null)
  const [draft, setDraft] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState('')

  useEffect(() => {
    if (!employeeId) return
    setLoading(true)
    setError('')
    apiGet(`/api/medical-records-v2/employee/${employeeId}`)
      .then((data) => {
        setRecord(data)
        setDraft({
          medicalHistory: data.medicalHistory || '',
          notes: data.notes || '',
          currentTherapies: data.currentTherapies || '',
          allergies: data.allergies || '',
          familyHistory: data.familyHistory || '',
        })
      })
      .catch((err) => {
        if (err?.status === 404) {
          setRecord(null)
          setDraft({})
        } else {
          setError(err.message || 'Errore caricamento cartella.')
        }
      })
      .finally(() => setLoading(false))
  }, [employeeId])

  const autosave = () => {
    if (!record) return
    apiSend('PATCH', `/api/medical-records-v2/${record.id}`, draft).catch(() => {})
  }

  const save = async () => {
    if (!employeeId) return
    setSaving(true)
    setError('')
    try {
      const result = record
        ? await apiSend('PUT', `/api/medical-records-v2/${record.id}`, draft)
        : await apiSend('POST', `/api/medical-records-v2/employee/${employeeId}`, draft)
      setRecord(result)
      setSavedAt(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err.message || 'Salvataggio fallito.')
    } finally {
      setSaving(false)
    }
  }

  if (!employeeIdProp) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Cartella Sanitaria 3A</Typography>
        <Stack spacing={2} direction="row" alignItems="center">
          <TextField
            label="Employee ID"
            type="number"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
          {loading && <CircularProgress size={20} />}
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {employeeId && !loading && (
          <Box sx={{ mt: 2 }}>
            <Stack spacing={2}>
              {FIELDS.map((f) => (
                <TextField
                  key={f.key}
                  label={f.label}
                  multiline={f.multiline}
                  rows={f.rows}
                  fullWidth
                  value={draft[f.key] || ''}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  onBlur={autosave}
                />
              ))}
              <Stack direction="row" spacing={2} alignItems="center">
                <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving}>
                  {saving ? 'Salvataggio…' : record ? 'Aggiorna' : 'Crea cartella'}
                </Button>
                {savedAt && <Typography variant="caption" color="success.main">Ultimo autosave: {savedAt}</Typography>}
              </Stack>
            </Stack>
          </Box>
        )}
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
        Cartella Sanitaria 3A
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={2}>
        {FIELDS.map((f) => (
          <TextField
            key={f.key}
            label={f.label}
            multiline={f.multiline}
            rows={f.rows}
            fullWidth
            value={draft[f.key] || ''}
            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            onBlur={autosave}
          />
        ))}
        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving}>
            {saving ? 'Salvataggio…' : record ? 'Aggiorna' : 'Crea cartella'}
          </Button>
          {savedAt && <Typography variant="caption" color="success.main">Ultimo autosave: {savedAt}</Typography>}
        </Stack>
      </Stack>
    </Paper>
  )
}
