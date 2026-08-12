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
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import { apiSend } from '../services/apiClient'

export default function FirmaGrafometricaCenter() {
  const [hash, setHash] = useState('')
  const [signature, setSignature] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  const verify = async () => {
    setVerifying(true)
    setError('')
    setResult(null)
    try {
      const data = await apiSend('POST', '/api/signatures/verify', {
        contentHash: hash,
        signatureBase64: signature,
        publicKeyBase64: publicKey,
      })
      setResult(data.isValid)
    } catch (err) {
      setError(err.message || 'Verifica firma fallita.')
    } finally {
      setVerifying(false)
    }
  }

  const loadSampleHash = async () => {
    try {
      const data = await apiSend('GET', '/api/signatures/hash-sample')
      setHash(data.hash)
    } catch {
      /* ignore */
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Firma grafometrica — verifica integrità documento
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Incolla l'hash SHA-256 del documento (es. PDF firmato), la firma (base64) e la chiave pubblica del
        firmatario per verificarne l'autenticità e l'integrità.
      </Alert>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={2}>
        <TextField
          label="Content Hash (hex)"
          fullWidth
          value={hash}
          onChange={(e) => setHash(e.target.value)}
        />
        <TextField
          label="Signature (base64)"
          multiline
          rows={3}
          fullWidth
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
        />
        <TextField
          label="Public Key (base64)"
          multiline
          rows={3}
          fullWidth
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
        />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<VerifiedUserIcon />} onClick={verify} disabled={verifying}>
            {verifying ? 'Verifica…' : 'Verifica firma'}
          </Button>
          <Button variant="outlined" onClick={loadSampleHash}>
            Carica hash di esempio
          </Button>
        </Stack>
        {result !== null && (
          <Alert severity={result ? 'success' : 'warning'}>
            {result ? 'Firma valida: documento autentico e non alterato.' : 'Firma NON valida o documento alterato.'}
          </Alert>
        )}
      </Stack>
    </Paper>
  )
}
