import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { apiSend } from '../services/apiClient'

const DEFAULT_CONTEXT = {
  riskFactors: [],
  examTypeNames: [],
  workerAge: 40,
  visitType: 'Periodic',
  outcomeCode: null,
  hasPrescriptionOrNotes: false,
}

export default function ComplianceCenter() {
  const [ctx, setCtx] = useState(DEFAULT_CONTEXT)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [regRaw, setRegRaw] = useState('source: GURI\ndate: 2026-01-15\nref: DM 9 Luglio 2012\ntitle: Aggiornamento soglie rumore\nsummary: Abbassate le soglie di esposizione\naffects: D.Lgs.81/08, Allegato 3B')
  const [regChanges, setRegChanges] = useState([])

  const runEvaluate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiSend('POST', '/api/compliance/evaluate-protocol', ctx)
      setResult(res)
    } catch (e) {
      setError(e.message || 'Errore valutazione compliance.')
    } finally {
      setLoading(false)
    }
  }

  const runChangelog = async () => {
    try {
      const res = await apiSend('POST', '/api/compliance/regulatory-changelog', [regRaw])
      setRegChanges(Array.isArray(res) ? res : [])
    } catch (e) {
      setError(e.message || 'Errore changelog.')
    }
  }

  const listStr = (arr) => (Array.isArray(arr) ? arr.join(', ') : '')

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6">Compliance Engine (D.Lgs. 81/08)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Valuta un protocollo di sorveglianza contro le regole codificate.
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            label="Fattori di rischio (virgola)"
            size="small"
            fullWidth
            value={listStr(ctx.riskFactors)}
            onChange={(e) => setCtx({ ...ctx, riskFactors: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
          />
          <TextField
            label="Esami (virgola)"
            size="small"
            fullWidth
            value={listStr(ctx.examTypeNames)}
            onChange={(e) => setCtx({ ...ctx, examTypeNames: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
          />
          <TextField type="number" label="Età" size="small" value={ctx.workerAge}
            onChange={(e) => setCtx({ ...ctx, workerAge: Number(e.target.value) })} sx={{ width: 100 }} />
          <TextField select label="Tipo" size="small" value={ctx.visitType}
            onChange={(e) => setCtx({ ...ctx, visitType: e.target.value })} sx={{ width: 140 }}>
            <MenuItem value="Periodic">Periodica</MenuItem>
            <MenuItem value="Preventive">Preventiva</MenuItem>
            <MenuItem value="ReturnToWork">Rientro</MenuItem>
            <MenuItem value="Hiring">Assunzione</MenuItem>
          </TextField>
        </Stack>
        <Box sx={{ mt: 1.5 }}>
          <Button variant="contained" onClick={runEvaluate} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : 'Valuta protocollo'}
          </Button>
        </Box>

        {!!error && <Alert severity="warning" sx={{ mt: 1.5 }}>{error}</Alert>}

        {result && (
          <Box sx={{ mt: 2 }}>
            <Chip
              icon={result.compliant ? <CheckCircleIcon /> : <ErrorIcon />}
              label={result.compliant ? 'CONFORME' : 'NON CONFORME'}
              color={result.compliant ? 'success' : 'error'}
              sx={{ mb: 1 }}
            />
            <Stack spacing={0.5}>
              {result.results.map((r) => (
                <Paper key={r.ruleId} variant="outlined" sx={{ p: 1, borderLeft: `4px solid ${r.passed ? '#2e7d32' : (r.severity === 'error' ? '#d32f2f' : '#ed6c02')}` }}>
                  <Typography variant="body2">
                    <strong>{r.ruleId}</strong> — {r.description}: {r.passed ? 'OK' : 'FALLITA'}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="subtitle1">Regulatory Changelog (GURI / Circolari / INAIL)</Typography>
        <TextField
          label="Testo sorgente (key:value per riga)"
          multiline minRows={6} fullWidth size="small"
          value={regRaw} onChange={(e) => setRegRaw(e.target.value)} sx={{ mt: 1 }}
        />
        <Button variant="outlined" sx={{ mt: 1 }} onClick={runChangelog}>Parsa changelog</Button>
        {regChanges.map((c, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 1, mt: 1 }}>
            <Typography variant="body2"><strong>{c.title}</strong> ({c.source} – {c.reference})</Typography>
            <Typography variant="caption" color="text.secondary">{c.summary}</Typography>
            <Box>{c.affectedRegulations?.map((r) => <Chip key={r} size="small" label={r} sx={{ mr: 0.5, mt: 0.5 }} />)}</Box>
          </Paper>
        ))}
      </Paper>
    </Stack>
  )
}
