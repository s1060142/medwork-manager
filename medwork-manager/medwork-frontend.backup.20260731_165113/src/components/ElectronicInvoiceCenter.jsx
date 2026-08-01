import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  OutlinedInput,
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
  Download as DownloadIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material'
import { apiGet, apiSend } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'
import { formatDate, formatCurrency, getStatusColor, getDocTypeLabel, parseLinesJson } from '../utils/formatters'

export default function ElectronicInvoiceCenter({ activeCompanyId = '', activeBranchId = '', onOpenElectronicInvoiceCrud, onOpenElectronicInvoiceDetail }) {
  const [invoices, setInvoices] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    companyId: activeCompanyId || '',
    year: new Date().getFullYear(),
    status: 'all',
    search: '',
  })
  const [stats, setStats] = useState({ total: 0, draft: 0, sent: 0, accepted: 0, rejected: 0 })

  // Form state for new invoice
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    companyId: activeCompanyId || '',
    documentType: 'TD01',
    issueDate: new Date().toISOString().split('T')[0],
    recipientCode: '0000000',
    recipientVatNumber: '',
    recipientTaxCode: '',
    recipientName: '',
    lines: [],
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeCompanyId, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [invoicesData, companiesData] = await Promise.all([
        apiGet('/api/electronic-invoice', { 
          companyId: filters.companyId, 
          year: filters.year,
          status: filters.status !== 'all' ? filters.status : undefined,
        }),
        apiGet('/api/master-data/companies'),
      ])
      
      const invoicesArray = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.items || [])
      const companiesArray = Array.isArray(companiesData) ? companiesData : (companiesData?.items || [])
      
      setInvoices(invoicesArray)
      setCompanies(companiesArray)
      
      // Calculate stats
      const computedStats = {
        total: invoicesArray.length,
        draft: invoicesArray.filter(i => i.status === 'Bozza').length,
        sent: invoicesArray.filter(i => i.status === 'Inviata').length,
        accepted: invoicesArray.filter(i => i.status === 'Accettata').length,
        rejected: invoicesArray.filter(i => i.status === 'Scartata').length,
      }
      setStats(computedStats)
    } catch (err) {
      setError(err.message || 'Errore nel caricamento delle fatture')
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (filters.search) {
        const search = filters.search.toLowerCase()
        const searchable = `${inv.number || ''}/${inv.year || ''} ${inv.recipientName || ''} ${inv.recipientVatNumber || ''} ${inv.status || ''}`.toLowerCase()
        if (!searchable.includes(search)) return false
      }
      return true
    })
  }, [invoices, filters])

  const handleCreateInvoice = async () => {
    if (!createFormData.companyId || !createFormData.recipientName) {
      setCreateError('Compila i campi obbligatori')
      return
    }
    
    setCreateLoading(true)
    setCreateError('')
    
    try {
      // Calculate totals from lines
      const lines = createFormData.lines || []
      const taxableAmount = lines.reduce((sum, l) => sum + (parseFloat(l.netAmount) || 0), 0)
      const vatAmount = lines.reduce((sum, l) => sum + (parseFloat(l.netAmount) || 0) * (parseFloat(l.vatRate) || 0) / 100, 0)
      
      const payload = {
        ...createFormData,
        companyId: parseInt(createFormData.companyId),
        number: 0, // Will be auto-generated
        year: new Date(createFormData.issueDate).getFullYear(),
        totalAmount: taxableAmount + vatAmount,
        taxableAmount,
        vatAmount,
        linesJson: JSON.stringify(lines.map((l, idx) => ({
          ...l,
          lineNumber: idx + 1,
          netAmount: parseFloat(l.netAmount) || 0,
          vatRate: parseFloat(l.vatRate) || 22,
        }))),
      }
      
      await apiSend('POST', '/api/electronic-invoice', payload)
      
      setCreateDialogOpen(false)
      setCreateFormData({
        companyId: activeCompanyId || '',
        documentType: 'TD01',
        issueDate: new Date().toISOString().split('T')[0],
        recipientCode: '0000000',
        recipientVatNumber: '',
        recipientTaxCode: '',
        recipientName: '',
        lines: [],
      })
      appendAuditEvent({ module: 'FatturazioneElettronica', action: 'Create', detail: 'Nuova fattura creata' })
      loadData()
    } catch (err) {
      setCreateError(err.message || 'Errore nella creazione')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleSendToSdi = async (invoiceId) => {
    if (!window.confirm('Inviare questa fattura al SDI?')) return
    
    try {
      const result = await apiSend('POST', `/api/electronic-invoice/${invoiceId}/send`)
      if (result.success) {
        appendAuditEvent({ module: 'FatturazioneElettronica', action: 'SendToSdi', detail: `Fattura ${invoiceId} inviata a SDI` })
        loadData()
        alert(`Fattura inviata con successo! ID SDI: ${result.sdiIdentifier}`)
      } else {
        alert(`Errore: ${result.errorMessage}`)
      }
    } catch (err) {
      alert(`Errore: ${err.message}`)
    }
  }

  const handleCheckStatus = async (invoiceId) => {
    try {
      const result = await apiSend('POST', `/api/electronic-invoice/${invoiceId}/check-status`)
      if (result.success) {
        appendAuditEvent({ module: 'FatturazioneElettronica', action: 'CheckSdiStatus', detail: `Stato fattura ${invoiceId}: ${result.status}` })
        loadData()
        alert(`Stato aggiornato: ${result.status}`)
      } else {
        alert(`Errore: ${result.errorMessage}`)
      }
    } catch (err) {
      alert(`Errore: ${err.message}`)
    }
  }

  const handleDownloadXml = async (invoiceId) => {
    try {
      const xml = await apiGet(`/api/electronic-invoice/${invoiceId}/xml`)
      const blob = new Blob([xml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `IT${invoiceId}_${new Date().getFullYear()}.xml`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Errore download: ${err.message}`)
    }
  }

  const handleOpenDetail = (invoice) => {
    setSelectedInvoice(invoice)
    setDetailDialogOpen(true)
  }

  const handleOpenCreate = () => {
    setCreateFormData(prev => ({
      ...prev,
      companyId: activeCompanyId || '',
      issueDate: new Date().toISOString().split('T')[0],
    }))
    setCreateDialogOpen(true)
    setCreateError('')
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
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Fatturazione Elettronica</Typography>
          <Typography variant="body2" color="text.secondary">Gestione fatture elettroniche (SDI) - FatturaPA v1.2.1</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size="large"
        >
          Nuova Fattura
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">Totale Fatture</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">Bozze</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'default.main' }}>{stats.draft}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">Inviate</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>{stats.sent}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">Accettate</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>{stats.accepted}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">Scartate</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>{stats.rejected}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid size={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Anno</InputLabel>
              <Select value={filters.year} onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Stato</InputLabel>
              <Select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <MenuItem value="all">Tutti</MenuItem>
                <MenuItem value="Bozza">Bozza</MenuItem>
                <MenuItem value="DaInviare">Da Inviare</MenuItem>
                <MenuItem value="Inviata">Inviata</MenuItem>
                <MenuItem value="Accettata">Accettata</MenuItem>
                <MenuItem value="Scartata">Scartata</MenuItem>
                <MenuItem value="Consegnata">Consegnata</MenuItem>
                <MenuItem value="NonConsegnata">Non Consegnata</MenuItem>
                <MenuItem value="DecorrenzaTermini">Decorrenza Termini</MenuItem>
                <MenuItem value="ErroreInvio">Errore Invio</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Azienda</InputLabel>
              <Select value={filters.companyId} onChange={(e) => handleFilterChange('companyId', e.target.value)}>
                <MenuItem value="">Tutte</MenuItem>
                {companies.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={12} sm={6}>
            <TextField
              size="small"
              placeholder="Cerca per numero, destinatario, P.IVA..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><FilterIcon sx={{ color: 'action' }}/></InputAdornment>,
              }}
            />
          </Grid>
          <Grid size={12} sm={2}>
            <Button variant="outlined" onClick={loadData} startIcon={<RefreshIcon />}>
              Aggiorna
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoices Table */}
      <Paper variant="outlined">
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Numero</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Destinatario</TableCell>
                <TableCell align="right">Imponibile</TableCell>
                <TableCell align="right">IVA</TableCell>
                <TableCell align="right">Totale</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>SDI</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Nessuna fattura trovata</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {inv.number}/{inv.year}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(inv.issueDate)}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={getDocTypeLabel(inv.documentType)} 
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{inv.recipientName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {inv.recipientVatNumber ? `P.IVA: ${inv.recipientVatNumber}` : ''}
                          {inv.recipientTaxCode ? ` CF: ${inv.recipientTaxCode}` : ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(inv.taxableAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(inv.vatAmount)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(inv.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={inv.status} 
                        color={getStatusColor(inv.status)}
                        variant={inv.status === 'Bozza' ? 'outlined' : 'filled'}
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      {inv.sdiIdentifier ? (
                        <Tooltip title={`ID SDI: ${inv.sdiIdentifier}`}>
                          <Chip 
                            size="small" 
                            label="SDI" 
                            icon={<CloudUploadIcon fontSize="small" />} 
                            color="primary" 
                            variant="outlined"
                            sx={{ fontSize: 10 }}
                          />
                        </Tooltip>
                      ) : (
                        <Chip size="small" label="Locale" variant="outlined" sx={{ fontSize: 10 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Visualizza dettagli">
                        <IconButton size="small" onClick={() => handleOpenDetail(inv)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {inv.status === 'Bozza' && (
                        <Tooltip title="Invia a SDI">
                          <IconButton size="small" onClick={() => handleSendToSdi(inv.id)} color="primary">
                            <SendIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {inv.sdiIdentifier && inv.status === 'Inviata' && (
                        <Tooltip title="Verifica stato SDI">
                          <IconButton size="small" onClick={() => handleCheckStatus(inv.id)} color="info">
                            <CloudDownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {inv.sdiIdentifier && (
                        <Tooltip title="Download XML">
                          <IconButton size="small" onClick={() => handleDownloadXml(inv.id)}>
                            <DescriptionIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Elimina (solo bozze)">
                        <IconButton size="small" onClick={() => {}} disabled={inv.status !== 'Bozza'} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Nuova Fattura Elettronica</DialogTitle>
        <DialogContent>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
          <Grid container spacing={2} sx={{ py: 1 }}>
            <Grid size={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Azienda</InputLabel>
                <Select value={createFormData.companyId} onChange={(e) => setCreateFormData({...createFormData, companyId: e.target.value})}>
                  {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo Documento</InputLabel>
                <Select value={createFormData.documentType} onChange={(e) => setCreateFormData({...createFormData, documentType: e.target.value})}>
                  <MenuItem value="TD01">Fattura (TD01)</MenuItem>
                  <MenuItem value="TD02">Acconto (TD02)</MenuItem>
                  <MenuItem value="TD03">Acconto su fattura (TD03)</MenuItem>
                  <MenuItem value="TD04">Nota di credito (TD04)</MenuItem>
                  <MenuItem value="TD05">Nota di debito (TD05)</MenuItem>
                  <MenuItem value="TD06">Parcellazione (TD06)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Data Emissione"
                value={createFormData.issueDate}
                onChange={(e) => setCreateFormData({...createFormData, issueDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Codice Destinatario (7 char)"
                value={createFormData.recipientCode}
                onChange={(e) => setCreateFormData({...createFormData, recipientCode: e.target.value})}
              />
            </Grid>
            <Grid size={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="P.IVA Destinatario"
                value={createFormData.recipientVatNumber}
                onChange={(e) => setCreateFormData({...createFormData, recipientVatNumber: e.target.value})}
              />
            </Grid>
            <Grid size={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Codice Fiscale Destinatario"
                value={createFormData.recipientTaxCode}
                onChange={(e) => setCreateFormData({...createFormData, recipientTaxCode: e.target.value})}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Denominazione Destinatario *"
                value={createFormData.recipientName}
                onChange={(e) => setCreateFormData({...createFormData, recipientName: e.target.value})}
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Righe Fattura</Typography>
          
          {createFormData.lines.map((line, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 1 }}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid size={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Descrizione *"
                    value={line.description}
                    onChange={(e) => {
                      const newLines = [...createFormData.lines]
                      newLines[idx] = { ...line, description: e.target.value }
                      setCreateFormData({...createFormData, lines: newLines})
                    }}
                  />
                </Grid>
                <Grid size={12} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Quantità"
                    value={line.quantity || 1}
                    onChange={(e) => {
                      const newLines = [...createFormData.lines]
                      newLines[idx] = { ...line, quantity: parseFloat(e.target.value) || 1 }
                      setCreateFormData({...createFormData, lines: newLines})
                    }}
                  />
                </Grid>
                <Grid size={12} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Prezzo Unitario"
                    type="number"
                    value={line.unitPrice || 0}
                    onChange={(e) => {
                      const newLines = [...createFormData.lines]
                      newLines[idx] = { ...line, unitPrice: parseFloat(e.target.value) || 0 }
                      setCreateFormData({...createFormData, lines: newLines})
                    }}
                  />
                </Grid>
                <Grid size={12} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="IVA %"
                    type="number"
                    value={line.vatRate || 22}
                    onChange={(e) => {
                      const newLines = [...createFormData.lines]
                      newLines[idx] = { ...line, vatRate: parseFloat(e.target.value) || 22 }
                      setCreateFormData({...createFormData, lines: newLines})
                    }}
                  />
                </Grid>
                <Grid size={12} sm={2}>
                  <Box sx={{ mt: '25px' }}>
                    <Tooltip title="Rimuovi riga">
                      <IconButton onClick={() => {
                        const newLines = createFormData.lines.filter((_, i) => i !== idx)
                        setCreateFormData({...createFormData, lines: newLines})
                      }} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ))}
          
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              setCreateFormData(prev => ({
                ...prev,
                lines: [...prev.lines, { description: '', quantity: 1, unitPrice: 0, vatRate: 22 }]
              }))
            }}
            sx={{ mt: 1 }}
          >
            Aggiungi Riga
          </Button>

          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Totale: {formatCurrency(
                (createFormData.lines || []).reduce((sum, l) => sum + ((parseFloat(l.quantity) || 1) * (parseFloat(l.unitPrice) || 0)), 0) +
                (createFormData.lines || []).reduce((sum, l) => sum + ((parseFloat(l.quantity) || 1) * (parseFloat(l.unitPrice) || 0) * (parseFloat(l.vatRate) || 22) / 100), 0)
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateInvoice}
            disabled={createLoading}
            startIcon={createLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
          >
            {createLoading ? 'Creazione...' : 'Crea Fattura'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedInvoice ? `Fattura {selectedInvoice.number}/{selectedInvoice.year} - {selectedInvoice.recipientName}` : 'Dettaglio Fattura'}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <>
              <Grid container spacing={2}>
                <Grid item size={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Numero</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedInvoice.number}/{selectedInvoice.year}</Typography>
                </Grid>
                <Grid item size={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Data Emissione</Typography>
                  <Typography>{formatDate(selectedInvoice.issueDate)}</Typography>
                </Grid>
                <Grid item size={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Tipo Documento</Typography>
                  <Typography>{getDocTypeLabel(selectedInvoice.documentType)}</Typography>
                </Grid>
                <Grid item size={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Stato</Typography>
                  <Chip label={selectedInvoice.status} color={getStatusColor(selectedInvoice.status)} size="small" />
                </Grid>
                <Grid item size={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">ID SDI</Typography>
                  <Typography>{selectedInvoice.sdiIdentifier || '-'}</Typography>
                </Grid>
                <Grid item size={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Codice Destinatario</Typography>
                  <Typography>{selectedInvoice.recipientCode || '-'}</Typography>
                </Grid>
                <Grid item size={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item size={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Destinatario</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedInvoice.recipientName}</Typography>
                  <Typography variant="body2">P.IVA: {selectedInvoice.recipientVatNumber || '-'}</Typography>
                  <Typography variant="body2">CF: {selectedInvoice.recipientTaxCode || '-'}</Typography>
                </Grid>
                <Grid item size={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Codice Destinatario</Typography>
                  <Typography>{selectedInvoice.recipientCode || '0000000'}</Typography>
                </Grid>
                <Grid item size={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item size={12}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Descrizione</TableCell>
                          <TableCell align="right">Qtà</TableCell>
                          <TableCell align="right">Prezzo Unit.</TableCell>
                          <TableCell align="right">IVA %</TableCell>
                          <TableCell align="right">Netto</TableCell>
                          <TableCell align="right">IVA</TableCell>
                          <TableCell align="right">Totale</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parseLinesJson(selectedInvoice.linesJson).map((line, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{line.description}</TableCell>
                            <TableCell align="right">{line.quantity || 1}</TableCell>
                            <TableCell align="right">{formatCurrency(line.unitPrice || 0)}</TableCell>
                            <TableCell align="right">{line.vatRate || 22}%</TableCell>
                            <TableCell align="right">{formatCurrency(line.netAmount || ((line.quantity || 1) * (line.unitPrice || 0)))}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(((line.quantity || 1) * (line.unitPrice || 0) * (line.vatRate || 22) / 100))}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(((line.quantity || 1) * (line.unitPrice || 0)) + ((line.quantity || 1) * (line.unitPrice || 0) * (line.vatRate || 22) / 100))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item size={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
              </Grid>
              <Grid container spacing={2} direction="row-reverse">
                <Grid item size={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Imponibile</Typography>
                  <Typography variant="h6">{formatCurrency(selectedInvoice.taxableAmount)}</Typography>
                </Grid>
                <Grid item size={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">IVA</Typography>
                  <Typography variant="h6">{formatCurrency(selectedInvoice.vatAmount)}</Typography>
                </Grid>
                <Grid item size={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Totale</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(selectedInvoice.totalAmount)}</Typography>
                </Grid>
              </Grid>
              {selectedInvoice.sdiIdentifier && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.main" gutterBottom>
                      <strong>Informazioni SDI:</strong>
                    </Typography>
                    <Typography variant="body2">ID SDI: {selectedInvoice.sdiIdentifier}</Typography>
                    <Typography variant="body2">File: {selectedInvoice.sdiFileName || '-'}</Typography>
                    <Typography variant="body2">Inviato: {formatDate(selectedInvoice.sdiSentAt)}</Typography>
                    <Typography variant="body2">Risposta: {formatDate(selectedInvoice.sdiResponseAt)}</Typography>
                    {selectedInvoice.sdiResultCode && (
                      <Typography variant="body2">Codice: {selectedInvoice.sdiResultCode} - {selectedInvoice.sdiResultDescription || '-'}</Typography>
                    )}
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDetailDialogOpen(false)}>Chiudi</Button>
                </DialogActions>
              </Dialog>
            </Container>
          );
}
