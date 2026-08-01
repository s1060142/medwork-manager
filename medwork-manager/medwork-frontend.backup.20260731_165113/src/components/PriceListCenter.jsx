import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { apiGet, apiSend } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'
import { formatDate, formatCurrency, getStatusColor } from '../utils/formatters'

function initialPriceListForm() {
  return {
    id: null,
    companyId: '',
    name: '',
    description: '',
    isDefault: false,
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    items: [],
  }
}

export default function PriceListCenter({ activeCompanyId = '', activeBranchId = '' }) {
  const [priceLists, setPriceLists] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    companyId: activeCompanyId || '',
    active: 'all',
    search: '',
  })

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingPriceList, setEditingPriceList] = useState(null)
  const [priceListForm, setPriceListForm] = useState(initialPriceListForm())
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadData()
  }, [activeCompanyId, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [priceListsData, companiesData] = await Promise.all([
        apiGet('/api/electronic-invoice/pricelists', {
          companyId: filters.companyId,
          active: filters.active !== 'all' ? filters.active : undefined,
        }),
        apiGet('/api/master-data/companies'),
      ])

      const priceListsArray = Array.isArray(priceListsData) ? priceListsData : (priceListsData?.items || [])
      const companiesArray = Array.isArray(companiesData) ? companiesData : (companiesData?.items || [])

      setPriceLists(priceListsArray)
      setCompanies(companiesArray)
    } catch (err) {
      setError(err.message || 'Errore nel caricamento dei listini')
    } finally {
      setLoading(false)
    }
  }

  const filteredPriceLists = useMemo(() => {
    return priceLists.filter(pl => {
      if (filters.active === 'active' && !pl.isActive) return false
      if (filters.active === 'inactive' && pl.isActive) return false
      if (filters.search) {
        const search = filters.search.toLowerCase()
        const searchable = `${pl.name || ''} ${pl.description || ''} ${pl.company?.name || ''}`.toLowerCase()
        if (!searchable.includes(search)) return false
      }
      return true
    })
  }, [priceLists, filters])

  const handleSave = async () => {
    if (!priceListForm.companyId || !priceListForm.name) {
      setFormError('Compila i campi obbligatori')
      return
    }

    setFormLoading(true)
    setFormError('')

    try {
      const payload = {
        ...priceListForm,
        companyId: parseInt(priceListForm.companyId),
        validTo: priceListForm.validTo || null,
        items: priceListForm.items.map(item => ({
          ...item,
          unitPrice: parseFloat(item.unitPrice) || 0,
          vatRate: parseFloat(item.vatRate) || 22,
          isMandatory: Boolean(item.isMandatory),
        })),
      }

      if (editingPriceList) {
        await apiSend('PUT', `/api/electronic-invoice/pricelists/${editingPriceList.id}`, payload)
        appendAuditEvent({ module: 'FatturazioneElettronica', action: 'UpdatePriceList', detail: `Listino ${payload.name} aggiornato` })
      } else {
        await apiSend('POST', '/api/electronic-invoice/pricelists', payload)
        appendAuditEvent({ module: 'FatturazioneElettronica', action: 'CreatePriceList', detail: `Listino ${payload.name} creato` })
      }

      setCreateDialogOpen(false)
      setEditingPriceList(null)
      setPriceListForm(initialPriceListForm())
      loadData()
    } catch (err) {
      setFormError(err.message || 'Errore nel salvataggio')
    } finally {
      setFormLoading(false)
    }
  }

  const handleNewPriceList = () => {
    setPriceListForm({ ...initialPriceListForm(), companyId: activeCompanyId || '' })
    setEditingPriceList(null)
    setCreateDialogOpen(true)
    setFormError('')
  }

  const handleEditPriceList = (pl) => {
    setEditingPriceList(pl)
    setPriceListForm({
      ...pl,
      validFrom: pl.validFrom?.split('T')[0],
      validTo: pl.validTo?.split('T')[0],
      items: pl.items?.map(item => ({ ...item })) || [],
    })
    setCreateDialogOpen(true)
    setFormError('')
  }

  const handleDeletePriceList = async (pl) => {
    if (!window.confirm(`Eliminare il listino "${pl.name}"?`)) return

    try {
      await apiSend('DELETE', `/api/electronic-invoice/pricelists/${pl.id}`)
      appendAuditEvent({ module: 'FatturazioneElettronica', action: 'DeletePriceList', detail: `Listino ${pl.name} eliminato` })
      loadData()
    } catch (err) {
      alert(`Errore: ${err.message}`)
    }
  }

  const handleItemChange = (index, field, value) => {
    setPriceListForm(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      return { ...prev, items: newItems }
    })
  }

  const handleAddItem = () => {
    setPriceListForm(prev => ({
      ...prev,
      items: [...prev.items, { serviceName: '', serviceCode: '', description: '', unitOfMeasure: 'CAD', unitPrice: 0, vatRate: 22, isMandatory: false }]
    }))
  }

  const handleRemoveItem = (index) => {
    setPriceListForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={3} direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Listini Prezzi per Azienda</Typography>
          <Typography variant="body2" color="text.secondary">Gestione listini personalizzati per fatturazione servizi medicina del lavoro</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewPriceList} size="large">
          Nuovo Listino
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item size={12} sm={4}>
            <TextField
              fullWidth size="small"
              placeholder="Cerca per nome, descrizione..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><FilterIcon sx={{ color: 'action' }}/></InputAdornment> }}
            />
          </Grid>
          <Grid item size={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Stato</InputLabel>
              <Select value={filters.active} onChange={(e) => handleFilterChange('active', e.target.value)}>
                <MenuItem value="all">Tutti</MenuItem>
                <MenuItem value="active">Attivi</MenuItem>
                <MenuItem value="inactive">Inattivi</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item size={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Azienda</InputLabel>
              <Select value={filters.companyId} onChange={(e) => handleFilterChange('companyId', e.target.value)}>
                <MenuItem value="">Tutte</MenuItem>
                {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Price Lists Cards */}
      {priceLists.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <DescriptionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Nessun listino configurato</Typography>
          <Typography variant="body2" color="text.secondary">Crea il primo listino prezzi per un'azienda</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredPriceLists.map(pl => (
            <Grid item xs={12} md={6} key={pl.id}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardHeader
                  title={pl.name}
                  subheader={pl.description}
                  action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={pl.isDefault ? 'Predefinito' : 'Personalizzato'} size="small" color={pl.isDefault ? 'primary' : 'default'} />
                      <Chip label={pl.isActive ? 'Attivo' : 'Inattivo'} size="small" color={pl.isActive ? 'success' : 'default'} />
                      <IconButton size="small" onClick={() => handleEditPriceList(pl)}><EditIcon /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeletePriceList(pl)}><DeleteIcon /></IconButton>
                    </Box>
                  }
                />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Servizio</TableCell>
                          <TableCell>Codice</TableCell>
                          <TableCell>Descrizione</TableCell>
                          <TableCell>UM</TableCell>
                          <TableCell align="right">Prezzo</TableCell>
                          <TableCell>IVA</TableCell>
                          <TableCell>Obbligatorio</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pl.items?.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.serviceName}</TableCell>
                            <TableCell>{item.serviceCode}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.unitOfMeasure}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell>{item.vatRate}%</TableCell>
                            <TableCell>{item.isMandatory ? 'Sì' : 'No'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onClose={() => { setCreateDialogOpen(false); setEditingPriceList(null); setPriceListForm(initialPriceListForm()) }} maxWidth="lg" fullWidth PaperProps={{ sx: { maxHeight: '90vh', overflow: 'auto' } }}>
        <DialogTitle>{editingPriceList ? 'Modifica Listino' : 'Nuovo Listino Prezzi'}</DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ py: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Azienda</InputLabel>
                <Select value={priceListForm.companyId} onChange={(e) => setPriceListForm({...priceListForm, companyId: e.target.value})}>
                  {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Nome Listino *" value={priceListForm.name} onChange={(e) => setPriceListForm({...priceListForm, name: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Descrizione" value={priceListForm.description} onChange={(e) => setPriceListForm({...priceListForm, description: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="date" label="Valido dal" value={priceListForm.validFrom} onChange={(e) => setPriceListForm({...priceListForm, validFrom: e.target.value})} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="date" label="Valido al" value={priceListForm.validTo} onChange={(e) => setPriceListForm({...priceListForm, validTo: e.target.value})} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Switch checked={priceListForm.isDefault} onChange={e => setPriceListForm({...priceListForm, isDefault: e.target.checked})} />} label="Listino predefinito per l&apos;azienda" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Switch checked={priceListForm.isActive} onChange={e => setPriceListForm({...priceListForm, isActive: e.target.checked})} />} label="Attivo" />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Voci Listino</Typography>

          {priceListForm.items.map((item, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 1 }}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth size="small" label="Servizio *" value={item.serviceName} onChange={(e) => handleItemChange(idx, 'serviceName', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField fullWidth size="small" label="Codice" value={item.serviceCode} onChange={(e) => handleItemChange(idx, 'serviceCode', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth size="small" label="Descrizione" value={item.description} onChange={(e) => handleItemChange(idx, 'description', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField fullWidth size="small" label="UM" value={item.unitOfMeasure} onChange={(e) => handleItemChange(idx, 'unitOfMeasure', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField fullWidth size="small" type="number" label="Prezzo" value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField fullWidth size="small" type="number" label="IVA %" value={item.vatRate} onChange={(e) => handleItemChange(idx, 'vatRate', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <FormControlLabel control={<Switch size="small" checked={item.isMandatory} onChange={e => handleItemChange(idx, 'isMandatory', e.target.checked)} />} label="Obbligatorio" />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <Tooltip title="Rimuovi">
                    <IconButton onClick={() => handleRemoveItem(idx)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </Paper>
          ))}

          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem} sx={{ mt: 1 }}>
            Aggiungi Voce
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateDialogOpen(false); setEditingPriceList(null); setPriceListForm(initialPriceListForm()) }}>Annulla</Button>
          <Button variant="contained" onClick={handleSave} disabled={formLoading}>
            {formLoading ? 'Salvataggio...' : (editingPriceList ? 'Aggiorna' : 'Crea')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}