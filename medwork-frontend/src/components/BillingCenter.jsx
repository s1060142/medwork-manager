import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'

function BillingCenter() {
  const [companies, setCompanies] = useState([])
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [genBusy, setGenBusy] = useState(false)

  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')

  useEffect(() => {
    apiGet('/api/billing/documents')
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    apiGet('/api/master-data/companies')
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => setCompanies([]))
  }, [])

  const companyMap = useMemo(
    () =>
      companies.reduce((accumulator, company) => {
        accumulator[company.id] = company.name
        return accumulator
      }, {}),
    [companies],
  )

  const totals = useMemo(() => {
    return docs.reduce(
      (accumulator, doc) => {
        const amount = Number(doc.amount) || 0
        accumulator.total += amount
        if (doc.status === 'pagato') accumulator.paid += amount
        if (doc.status === 'scaduto') accumulator.overdue += amount
        return accumulator
      },
      { total: 0, paid: 0, overdue: 0 },
    )
  }, [docs])

  const handleGenerate = async () => {
    if (!periodFrom || !periodTo) return
    setGenBusy(true)
    setError('')
    setSuccess('')
    try {
      const payload = { from: periodFrom, to: periodTo }
      const created = await apiSend('POST', '/api/billing/documents', payload)
      const list = Array.isArray(created) ? created : []
      setDocs(list)
      setSuccess(`Generati ${list.length} documenti di fatturazione.`)
      appendAuditEvent({ module: 'Fatturazione', action: 'Generate', detail: `${periodFrom} → ${periodTo}: ${list.length} docs` })
    } catch (requestError) {
      setError(requestError?.message || 'Errore durante la generazione dei documenti.')
    } finally {
      setGenBusy(false)
    }
  }

  const updateStatus = async (id, status) => {
    // Optimistic local update; in a real system this would be a PATCH endpoint
    const next = docs.map((doc) => (doc.id === id ? { ...doc, status } : doc))
    setDocs(next)
    appendAuditEvent({ module: 'Fatturazione', action: 'Status', detail: `${id} -> ${status}` })
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Caricamento documenti...</Typography>
      </Paper>
    )
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6">Fatturazione, parcelle e preventivi</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Genera documenti di fatturazione dal conteggio visite mediche per periodo.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.2, mt: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            type="date"
            label="Da"
            InputLabelProps={{ shrink: true }}
            value={periodFrom}
            onChange={(e) => setPeriodFrom(e.target.value)}
          />
          <TextField
            size="small"
            type="date"
            label="A"
            InputLabelProps={{ shrink: true }}
            value={periodTo}
            onChange={(e) => setPeriodTo(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={genBusy || !periodFrom || !periodTo}
            sx={{ alignSelf: 'center' }}
          >
            {genBusy ? 'Generazione...' : 'Genera fatture'}
          </Button>
        </Box>
      </Paper>

      {!!error && <Alert severity="error">{error}</Alert>}
      {!!success && <Alert severity="success">{success}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="caption" color="text.secondary">Totale documenti</Typography>
          <Typography variant="h5">€ {totals.total.toFixed(2)}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="caption" color="text.secondary">Incassato</Typography>
          <Typography variant="h5" color="success.main">€ {totals.paid.toFixed(2)}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="caption" color="text.secondary">Scaduto</Typography>
          <Typography variant="h5" color="error.main">€ {totals.overdue.toFixed(2)}</Typography>
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Numero</TableCell>
              <TableCell>Periodo</TableCell>
              <TableCell>Azienda</TableCell>
              <TableCell>Visite</TableCell>
              <TableCell>Importo</TableCell>
              <TableCell>Emissione</TableCell>
              <TableCell>Stato</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {docs.map((doc) => (
              <TableRow key={doc.id} hover>
                <TableCell>{doc.invoiceNumber}</TableCell>
                <TableCell>{doc.period || '-'}</TableCell>
                <TableCell>{companyMap[doc.companyId] || `Azienda #${doc.companyId}`}</TableCell>
                <TableCell>{doc.visitCount ?? 0}</TableCell>
                <TableCell>€ {(Number(doc.amount) || 0).toFixed(2)}</TableCell>
                <TableCell>{doc.issuedAt ? new Date(doc.issuedAt).toLocaleDateString('it-IT') : '-'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.7}>
                    {['bozza', 'emesso', 'pagato', 'scaduto'].map((status) => (
                      <Chip
                        key={status}
                        size="small"
                        label={status}
                        variant={doc.status === status ? 'filled' : 'outlined'}
                        color={
                          status === 'pagato'
                            ? 'success'
                            : status === 'scaduto'
                              ? 'error'
                              : status === 'emesso'
                                ? 'primary'
                                : 'default'
                        }
                        onClick={() => updateStatus(doc.id, status)}
                      />
                    ))}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {docs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary">Nessun documento registrato.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  )
}

export default BillingCenter
