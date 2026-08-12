import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { apiSend } from '../services/apiClient'

const CHANNELS = [
  { value: 1, label: 'SMS' },
  { value: 2, label: 'Email' },
  { value: 3, label: 'PEC' },
  { value: 4, label: 'Push' },
  { value: 5, label: 'WhatsApp' },
]

export default function AlertMulticanaleCenter() {
  const [employeeId, setEmployeeId] = useState('')
  const [channel, setChannel] = useState(3)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    setSending(true)
    setError('')
    setResults([])
    try {
      const recipients = employeeId
        .split(/[\s,]+/)
        .map((x) => parseInt(x, 10))
        .filter((x) => !isNaN(x))

      if (recipients.length === 0) {
        setError('Inserisci almeno un Employee ID.')
        return
      }

      const data = await apiSend('POST', '/api/alerts/send-bulk', {
        recipients,
        channel,
        message,
      })
      setResults(data)
    } catch (err) {
      setError(err.message || 'Invio alert fallito.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Alert multi-canale (PEC / SMS / Push / WhatsApp)
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={2}>
        <TextField
          label="Employee IDs (separati da virgola)"
          fullWidth
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
        <TextField
          select
          label="Canale"
          value={channel}
          onChange={(e) => setChannel(Number(e.target.value))}
        >
          {CHANNELS.map((c) => (
            <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Messaggio"
          multiline
          rows={3}
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Box>
          <Button variant="contained" startIcon={<SendIcon />} onClick={send} disabled={sending}>
            {sending ? 'Invio…' : 'Invia alert'}
          </Button>
        </Box>
        {results.length > 0 && (
          <Stack spacing={1}>
            {results.map((r, i) => (
              <Alert key={i} severity={r.isDelivered ? 'success' : 'warning'}>
                Employee {r.employeeId}: {r.isDelivered ? 'consegnato' : 'NON consegnato' + (r.errorMessage ? ` (${r.errorMessage})` : '')}
              </Alert>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
