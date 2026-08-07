import { useEffect, useMemo, useState } from 'react'
import {
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
import { apiGet } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'

const STORAGE_KEY = 'medwork.billing.docs'

function readDocs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveDocs(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function BillingCenter() {
  const [companies, setCompanies] = useState([])
  const [docs, setDocs] = useState(() => readDocs())
  const [formData, setFormData] = useState({
    type: 'preventivo',
    companyId: '',
    amount: '',
    status: 'bozza',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
  })

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

  const createDoc = () => {
    if (!formData.companyId || !formData.amount) return

    const next = [
      {
        id: `${Date.now()}`,
        number: `${formData.type === 'fattura' ? 'FT' : 'PR'}-${Date.now().toString().slice(-6)}`,
        ...formData,
      },
      ...docs,
    ]

    setDocs(next)
    saveDocs(next)
    appendAuditEvent({ module: 'Fatturazione', action: 'Create', detail: `${formData.type} ${formData.amount}€` })

    setFormData((current) => ({
      ...current,
      companyId: '',
      amount: '',
      notes: '',
      dueDate: '',
    }))
  }

  const updateStatus = (id, status) => {
    const next = docs.map((doc) => (doc.id === id ? { ...doc, status } : doc))
    setDocs(next)
    saveDocs(next)
    appendAuditEvent({ module: 'Fatturazione', action: 'Status', detail: `${id} -> ${status}` })
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6">Fatturazione, parcelle e preventivi</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Gestione operativa documenti economici con stato e scadenza.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(6, 1fr)' }, gap: 1.2, mt: 2 }}>
          <TextField select size="small" label="Tipo" value={formData.type} onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value }))}>
            <MenuItem value="preventivo">Preventivo</MenuItem>
            <MenuItem value="fattura">Fattura</MenuItem>
          </TextField>

          <TextField select size="small" label="Azienda" value={formData.companyId} onChange={(event) => setFormData((current) => ({ ...current, companyId: event.target.value }))}>
            <MenuItem value="">Seleziona</MenuItem>
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
            ))}
          </TextField>

          <TextField size="small" type="number" label="Importo" value={formData.amount} onChange={(event) => setFormData((current) => ({ ...current, amount: event.target.value }))} />

          <TextField select size="small" label="Stato" value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}>
            <MenuItem value="bozza">Bozza</MenuItem>
            <MenuItem value="emesso">Emesso</MenuItem>
            <MenuItem value="pagato">Pagato</MenuItem>
            <MenuItem value="scaduto">Scaduto</MenuItem>
          </TextField>

          <TextField size="small" type="date" label="Emissione" InputLabelProps={{ shrink: true }} value={formData.issueDate} onChange={(event) => setFormData((current) => ({ ...current, issueDate: event.target.value }))} />
          <TextField size="small" type="date" label="Scadenza" InputLabelProps={{ shrink: true }} value={formData.dueDate} onChange={(event) => setFormData((current) => ({ ...current, dueDate: event.target.value }))} />
        </Box>

        <TextField size="small" fullWidth sx={{ mt: 1.2 }} label="Note" value={formData.notes} onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} />

        <Button sx={{ mt: 1.5 }} variant="contained" onClick={createDoc}>Registra documento</Button>
      </Paper>

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
              <TableCell>Tipo</TableCell>
              <TableCell>Azienda</TableCell>
              <TableCell>Importo</TableCell>
              <TableCell>Emissione</TableCell>
              <TableCell>Scadenza</TableCell>
              <TableCell>Stato</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {docs.map((doc) => (
              <TableRow key={doc.id} hover>
                <TableCell>{doc.number}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{doc.type}</TableCell>
                <TableCell>{companyMap[doc.companyId] || `Azienda #${doc.companyId}`}</TableCell>
                <TableCell>€ {(Number(doc.amount) || 0).toFixed(2)}</TableCell>
                <TableCell>{doc.issueDate || '-'}</TableCell>
                <TableCell>{doc.dueDate || '-'}</TableCell>
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
