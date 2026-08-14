import { useCallback, useEffect, useMemo, useState } from 'react'
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
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import { apiGet, apiSend } from '../services/apiClient'
import { downloadCsv } from '../utils/csv'

const EMPTY_FORM = {
  name: '',
  cadenceDays: 365,
  lawReference: 'D.Lgs. 81/08',
  objective: '',
  description: '',
}

function ProtocolsCenter() {
  const [protocols, setProtocols] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet('/api/doctor-data/protocols')
      setProtocols(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Errore nel caricamento dei protocolli.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const visibleProtocols = useMemo(() => {
    const needle = searchText.toLowerCase()
    if (!needle) return protocols
    return protocols.filter(p =>
      `${p.name} ${p.objective ?? ''}`.toLowerCase().includes(needle)
    )
  }, [protocols, searchText])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError('Il nome del protocollo è obbligatorio.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await apiSend('POST', '/api/doctor-data/protocols', {
        name: formData.name.trim(),
        cadenceDays: Number(formData.cadenceDays),
        lawReference: formData.lawReference,
        objective: formData.objective,
        description: formData.description,
      })
      setDialogOpen(false)
      setFormData(EMPTY_FORM)
      await load()
    } catch (err) {
      setFormError(err.message || 'Errore nel salvataggio del protocollo.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id) => {
    try {
      await apiSend('PATCH', `/api/doctor-data/protocols/${id}/toggle`, {})
      setProtocols(prev =>
        prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p)
      )
    } catch (err) {
      setError(err.message || 'Errore durante la modifica del protocollo.')
    }
  }

  const handleExport = () => {
    const headers = [
      { label: 'Protocollo', value: 'name' },
      { label: 'Obiettivo', value: 'objective' },
      { label: 'Riferimento', value: 'lawReference' },
      { label: 'Cadenza (gg)', value: 'cadenceDays' },
      { label: 'Stato', value: row => row.isActive ? 'Attivo' : 'Disattivo' },
    ]
    downloadCsv('protocolli', headers, visibleProtocols)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      {/* Toolbar */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
        <TextField
          size="small"
          label="Cerca protocollo"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5 }} /> }}
          sx={{ minWidth: 260 }}
        />
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleExport}>Esporta CSV</Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setFormData(EMPTY_FORM); setFormError(''); setDialogOpen(true) }}
          >
            Nuovo protocollo
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Protocollo</TableCell>
                <TableCell>Riferimento normativo</TableCell>
                <TableCell align="center">Cadenza</TableCell>
                <TableCell align="center">Stato</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleProtocols.map(row => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                    {row.objective && (
                      <Typography variant="caption" color="text.secondary">{row.objective}</Typography>
                    )}
                  </TableCell>
                  <TableCell>{row.lawReference}</TableCell>
                  <TableCell align="center">{row.cadenceDays} gg</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      color={row.isActive ? 'success' : 'default'}
                      label={row.isActive ? 'Attivo' : 'Disattivo'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleToggle(row.id)}>
                      {row.isActive ? 'Disattiva' : 'Attiva'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visibleProtocols.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                      Nessun protocollo trovato.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuovo protocollo sanitario</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Nome protocollo *"
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              fullWidth size="small"
            />
            <TextField
              label="Riferimento normativo"
              value={formData.lawReference}
              onChange={e => setFormData(f => ({ ...f, lawReference: e.target.value }))}
              fullWidth size="small"
              placeholder="es. D.Lgs. 81/08 art. 41"
            />
            <TextField
              label="Cadenza visita (giorni)"
              type="number"
              value={formData.cadenceDays}
              onChange={e => setFormData(f => ({ ...f, cadenceDays: Number(e.target.value) }))}
              fullWidth size="small"
              inputProps={{ min: 30, max: 3650, step: 30 }}
            />
            <TextField
              label="Obiettivo / Rischio target"
              value={formData.objective}
              onChange={e => setFormData(f => ({ ...f, objective: e.target.value }))}
              fullWidth size="small" multiline minRows={2}
              placeholder="es. Sorveglianza esposizione a rumore > 85 dB"
            />
            <TextField
              label="Note descrittive"
              value={formData.description}
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
              fullWidth size="small" multiline minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Annulla</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva protocollo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default ProtocolsCenter
