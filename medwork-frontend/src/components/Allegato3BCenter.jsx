import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DescriptionIcon from '@mui/icons-material/Description'
import { apiSend } from '../services/apiClient'

export default function Allegato3BCenter() {
  const [companyId, setCompanyId] = useState('')
  const [validateResult, setValidateResult] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const validate = async () => {
    setBusy(true)
    setError('')
    setValidateResult(null)
    try {
      const data = await apiSend('POST', `/api/documents/allegato-3b/${companyId}/validate`)
      setValidateResult(data)
    } catch (err) {
      setError(err.message || 'Validazione fallita.')
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    setBusy(true)
    setError('')
    setSubmitResult(null)
    try {
      const data = await apiSend('POST', `/api/documents/allegato-3b/${companyId}/submit`)
      setSubmitResult(data)
    } catch (err) {
      setError(err.message || 'Invio fallito.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Allegato 3B INAIL — validazione XSD e invio telematico
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={2}>
        <TextField
          label="Company ID"
          type="number"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        />
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<DescriptionIcon />} onClick={validate} disabled={busy || !companyId}>
            Valida XSD
          </Button>
          <Button variant="contained" onClick={submit} disabled={busy || !companyId}>
            Invia a INAIL
          </Button>
        </Stack>
        {validateResult && (
          <Alert severity={validateResult.isValid ? 'success' : 'error'}>
            {validateResult.isValid
              ? 'XML conforme allo schema XSD.'
              : 'Errori di validazione: ' + validateResult.errors.join('; ')}
          </Alert>
        )}
        {submitResult && (
          <Alert severity={submitResult.success ? 'success' : 'error'}>
            {submitResult.success
              ? `Invio completato. Ricevuta: ${submitResult.receiptId}`
              : submitResult.message}
          </Alert>
        )}
      </Stack>
    </Paper>
  )
}
