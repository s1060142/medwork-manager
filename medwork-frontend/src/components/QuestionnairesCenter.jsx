import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'

export default function QuestionnairesCenter() {
  const [templates, setTemplates] = useState([])
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet('/api/questionnaires')
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Errore nel caricamento dei questionari.'))
  }, [])

  const openTemplate = (template) => {
    setSelected(template)
    setAnswers({})
    setResult(null)
  }

  const choose = (itemId, optionIndex) => {
    setAnswers((current) => ({ ...current, [itemId]: optionIndex }))
  }

  const submit = () => {
    if (!selected) return
    const answersJson = JSON.stringify(
      Object.entries(answers).map(([itemId, optionIndex]) => ({
        itemId: Number(itemId),
        optionIndex,
      })),
    )
    apiSend('POST', '/api/questionnaires/responses', {
      questionnaireId: selected.id,
      employeeId: 0,
      medicalVisitId: 0,
      answersJson,
    })
      .then((resp) => {
        setResult(resp)
        appendAuditEvent({ module: 'Questionari', action: 'Invio', detail: selected.title })
      })
      .catch((err) => setError(err.message || 'Invio questionario fallito.'))
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6">Questionari integrati</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          DMS, Audit C, NIOSH e custom per rischio. Lo scoring è calcolato automaticamente lato backend.
        </Typography>
        {!!error && <Alert severity="warning" sx={{ mt: 1.5 }}>{error}</Alert>}
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Titolo</TableCell>
              <TableCell>Rischio</TableCell>
              <TableCell align="right">Apri</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>{t.type}</TableCell>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.riskFactor ? <Chip size="small" label={t.riskFactor} /> : '-'}</TableCell>
                <TableCell align="right">
                  <button type="button" onClick={() => openTemplate(t)}>Apri</button>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary">Nessun questionario disponibile.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {selected && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="subtitle1">{selected.title}</Typography>
          <Box sx={{ mt: 1.5 }}>
            {(() => {
              let items = []
              try {
                items = JSON.parse(selected.definitionJson || '[]')
              } catch {
                items = []
              }
              if (items.length === 0) {
                return (
                  <Typography variant="body2" color="text.secondary">
                    Nessun item definito. Inserisci le risposte tramite API o definisci il template.
                  </Typography>
                )
              }
              return items.map((item, idx) => (
                <Box key={idx} sx={{ mb: 1.5 }}>
                  <Typography variant="body2" fontWeight={600}>{item.text || `Item ${idx + 1}`}</Typography>
                  {(item.options || []).map((opt) => (
                    <label key={opt.index} style={{ display: 'block', marginLeft: 8 }}>
                      <input
                        type="radio"
                        name={`item-${idx}`}
                        checked={answers[idx] === opt.index}
                        onChange={() => choose(idx, opt.index)}
                      />{' '}
                      {opt.label || `Opzione ${opt.index}`}
                    </label>
                  ))}
                </Box>
              ))
            })()}
          </Box>
          <button type="button" onClick={submit}>Calcola score</button>

          {result && (
            <Alert
              severity={result.isAnomalous ? 'error' : 'success'}
              sx={{ mt: 2 }}
            >
              Score: {result.score}
              {result.isAnomalous ? ' — ANOMALIA RILEVATA' : ' — nella norma'}
            </Alert>
          )}
        </Paper>
      )}
    </Stack>
  )
}
