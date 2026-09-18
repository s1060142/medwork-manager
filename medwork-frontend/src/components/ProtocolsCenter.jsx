import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
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
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import { apiGet, apiSend } from '../services/apiClient'
import { downloadCsv } from '../utils/csv'

const EMPTY_FORM = {
  name: '',
  cadenceDays: 365,
  lawReference: 'D.Lgs. 81/08',
  objective: '',
  description: '',
}

const SMART_PRESETS = [
  {
    id: 'rumore',
    title: '🎧 Rischio Rumore (> 85 dB)',
    name: 'Protocollo Sorveglianza Rumore (Art. 196 D.Lgs. 81/08)',
    cadenceDays: 365,
    lawReference: 'D.Lgs. 81/08 Titolo VIII Capo II',
    objective: 'Prevenzione ipoacusia da rumore e sordità professionale',
    description: 'Visita medica annuale con anamnesi audiologica, otoscopia ed esame audiometrico tonale liminare in cabina silente.',
    color: '#1976d2',
  },
  {
    id: 'vdt',
    title: '💻 Videoterminale (VDT > 20h/sett)',
    name: 'Protocollo Videoterminalisti (Art. 176 D.Lgs. 81/08)',
    cadenceDays: 730,
    lawReference: 'D.Lgs. 81/08 Titolo VII',
    objective: 'Prevenzione astenopia, disturbi visivi ed ergoftalmologici',
    description: 'Visita medica biennale (<50 anni) o quinquennale con screening visivo (Visiotest), valutazione posturale e rachide.',
    color: '#0284c7',
  },
  {
    id: 'mmc',
    title: '📦 Movimentazione Manuale Carichi (MMC)',
    name: 'Protocollo Biomeccanico Rachide & MMC (Art. 168 D.Lgs. 81/08)',
    cadenceDays: 365,
    lawReference: 'D.Lgs. 81/08 Titolo VI & ISO 11228',
    objective: 'Prevenzione patologie muscoloscheletriche e discopatie',
    description: 'Valutazione clinica funzionale del rachide, flessibilità, test di Lasègue/Wasserman, dinamometria e consigli ergonomici.',
    color: '#d97706',
  },
  {
    id: 'chimico',
    title: '🧪 Rischio Chimico / Polveri / Solventi',
    name: 'Protocollo Rischio Chimico & Polmonare (Art. 229 D.Lgs. 81/08)',
    cadenceDays: 365,
    lawReference: 'D.Lgs. 81/08 Titolo IX',
    objective: 'Sorveglianza per esposizione a sostanze chimiche e vapori organici',
    description: 'Visita medica annuale, spirometria con curva flusso/volume, monitoraggio biologico urinario (IBE) e funzionalità epatorenale.',
    color: '#9333ea',
  },
  {
    id: 'guida',
    title: '🚜 Mulettisti / Autisti / Incolumità Terzi',
    name: 'Protocollo Idoneità Guida & Mansioni a Rischio Terzi',
    cadenceDays: 365,
    lawReference: 'DPR 309/90 & Accordo Stato-Regioni 30/10/07',
    objective: 'Accertamento assenza di tossicodipendenza e idoneità alla guida',
    description: 'Visita medica annuale con riflessometria, drug test urine a catena di custodia (screening rapido + conferma) e alcolimetria.',
    color: '#dc2626',
  },
  {
    id: 'notturno',
    title: '🌙 Lavoro Notturno (D.Lgs. 66/2003)',
    name: 'Protocollo Lavoro Notturno (D.Lgs. 66/2003 Art. 14)',
    cadenceDays: 730,
    lawReference: 'D.Lgs. 66/2003 Art. 14',
    objective: 'Valutazione idoneità al lavoro notturno (ore 22:00 - 06:00)',
    description: 'Visita medica biennale con monitoraggio profilo cardiovascolare, disturbi del sonno e apparato gastrointestinale.',
    color: '#475569',
  },
]

function ProtocolsCenter() {
  const [protocols, setProtocols] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [smartDialogOpen, setSmartDialogOpen] = useState(false)
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
      p.name.toLowerCase().includes(needle) ||
      p.description?.toLowerCase().includes(needle) ||
      p.objective?.toLowerCase().includes(needle) ||
      JSON.stringify(p.steps).toLowerCase().includes(needle)
    )
  }, [protocols, searchText])

  const handleSave = async (dataToSave = formData) => {
    if (!dataToSave.name.trim()) {
      setFormError('Il nome del protocollo è obbligatorio.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await apiSend('POST', '/api/doctor-data/protocols', {
        name: dataToSave.name.trim(),
        cadenceDays: Number(dataToSave.cadenceDays),
        lawReference: dataToSave.lawReference,
        objective: dataToSave.objective,
        description: dataToSave.description,
      })
      setDialogOpen(false)
      setSmartDialogOpen(false)
      setFormData(EMPTY_FORM)
      await load()
    } catch (err) {
      setFormError(err.message || 'Errore nel salvataggio del protocollo.')
    } finally {
      setSaving(false)
    }
  }

  const handleApplyPreset = (preset) => {
    setFormData({
      name: preset.name,
      cadenceDays: preset.cadenceDays,
      lawReference: preset.lawReference,
      objective: preset.objective,
      description: preset.description,
    })
    handleSave({
      name: preset.name,
      cadenceDays: preset.cadenceDays,
      lawReference: preset.lawReference,
      objective: preset.objective,
      description: preset.description,
    })
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
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#0f1f3d">
              Protocolli Sanitari & Piani di Sorveglianza
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Definizione accertamenti periodici, cadenze e basi normative ex D.Lgs. 81/08.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AutoFixHighIcon />}
              onClick={() => setSmartDialogOpen(true)}
              sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, textTransform: 'none', fontWeight: 700 }}
            >
              ✨ Smart Protocol Generator
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setFormData(EMPTY_FORM); setFormError(''); setDialogOpen(true) }}
              sx={{ textTransform: 'none' }}
            >
              + Nuovo Protocollo
            </Button>
            <Button variant="outlined" onClick={handleExport}>Esporta CSV</Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Toolbar */}
      <Stack direction="row" spacing={1} justifyContent="space-between">
        <TextField
          size="small"
          label="Cerca protocollo per nome, rischio o legge..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5 }} /> }}
          sx={{ minWidth: 320 }}
        />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell><strong>Protocollo Sanitario</strong></TableCell>
                <TableCell><strong>Riferimento Normativo</strong></TableCell>
                <TableCell align="center"><strong>Cadenza</strong></TableCell>
                <TableCell align="center"><strong>Stato</strong></TableCell>
                <TableCell align="right"><strong>Azioni</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleProtocols.map(row => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{row.name}</Typography>
                    {row.objective && (
                      <Typography variant="caption" color="text.secondary">{row.objective}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={row.lawReference || 'D.Lgs. 81/08'} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={600}>{row.cadenceDays} gg</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({row.cadenceDays === 365 ? '1 anno' : row.cadenceDays === 730 ? '2 anni' : `${Math.round(row.cadenceDays / 365)} anni`})
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      color={row.isActive ? 'success' : 'default'}
                      label={row.isActive ? 'Attivo' : 'Disattivo'}
                      sx={{ fontWeight: 600 }}
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
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      Nessun protocollo trovato. Usa lo Smart Generator per crearne subito uno conforme.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* SMART PROTOCOL GENERATOR DIALOG */}
      <Dialog open={smartDialogOpen} onClose={() => setSmartDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#7c3aed', color: '#ffffff', py: 2 }}>
          ✨ Smart Protocol Generator (D.Lgs. 81/08)
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Seleziona un fattore di rischio occupazionale: MedWork compilerà automaticamente la base giuridica, la periodicità di legge, gli accertamenti mirati e le formule sanitarie ministeriali.
          </Typography>

          <Grid container spacing={2}>
            {SMART_PRESETS.map((preset) => (
              <Grid item xs={12} sm={6} key={preset.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 2.5, 
                    borderLeft: `5px solid ${preset.color}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': { boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700} color={preset.color}>
                      {preset.title}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>
                      ⚖️ {preset.lawReference} • ⏱️ {preset.cadenceDays} giorni
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontSize: '0.85rem' }}>
                      {preset.description}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 1.5, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      disabled={saving}
                      onClick={() => handleApplyPreset(preset)}
                      sx={{ bgcolor: preset.color, '&:hover': { opacity: 0.9 }, textTransform: 'none', fontWeight: 700 }}
                    >
                      Genera & Applica Protocollo
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSmartDialogOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Manual Create Dialog */}
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
          <Button variant="contained" onClick={() => handleSave()} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva protocollo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default ProtocolsCenter
