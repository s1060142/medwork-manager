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
  Send as SendIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ContentCopy as CopyIcon,
  ContentPaste as PasteIcon,
} from '@mui/icons-material'
import { apiGet, apiSend } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'
import { formatDate, formatCurrency, getStatusColor } from '../utils/formatters'

export default function QuoteCenter({ activeCompanyId = '', activeBranchId = '' }) {
  const [quotes, setQuotes] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    companyId: activeCompanyId || '',
    year: new Date().getFullYear(),
    status: 'all',
    search: '',
  })
  const [stats, setStats] = useState({ total: 0, draft: 0, sent: 0, accepted: 0, rejected: 0, converted: 0 })

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    companyId: '',
    issueDate: new Date().toISOString().split('T')[0],
    validityDate: '',
    notes: '',
    lines: [],
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  const [selectedQuote, setSelectedQuote] = useState(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeCompanyId, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [quotesData, companiesData] = await Promise.all([
        apiGet('/api/electronic-invoice/quotes', { 
          companyId: filters.companyId, 
          year: filters.year,
          status: filters.status !== 'all' ? filters.status : undefined,
        }),
        apiGet('/api/master-data/companies'),
      ])
      
      const quotesArray = Array.isArray(quotesData) ? quotesData : (quotesData?.items || [])
      const companiesArray = Array.isArray(companiesData) ? companiesData : (companiesData?.items || [])
      
      setQuotes(quotesArray)
      setCompanies(companiesArray)
      
      const computedStats = {
        total: quotesArray.length,
        draft: quotesArray.filter(q => q.status === 'Bozza').length,
        sent: quotesArray.filter(q => q.status === 'Inviato').length,
        accepted: quotesArray.filter(q => q.status === 'Accettato').length,
        rejected: quotesArray.filter(q => q.status === 'Rifiutato').length,
        converted: quotesArray.filter(q => q.status === 'Convertito').length,
      }
      setStats(computedStats)
    } catch (err) {
      setError(err.message || 'Errore nel caricamento dei preventivi')
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      if (filters.search) {
        const search = filters.search.toLowerCase()
        const searchable = `${q.number || ''}/${q.year || ''} ${q.company?.name || ''} ${q.status || ''}`.toLowerCase()
        if (!searchable.includes(search)) return false
      }
      return true
    })
  }, [quotes, filters])

  const handleCreateQuote = async () => {
    if (!createFormData.companyId) {
      setCreateError('Seleziona un\'azienda')
      return
    }
    
    setCreateLoading(true)
    setCreateError('')
    
    try {
      const lines = createFormData.lines || []
      const taxableAmount = lines.reduce((sum, l) => sum + (parseFloat(l.netAmount) || 0), 0)
      const vatAmount = lines.reduce((sum, l) => sum + (parseFloat(l.netAmount) || 0) * (parseFloat(l.vatRate) || 0) / 100, 0)
      
      const payload = {
        ...createFormData,
        companyId: parseInt(createFormData.companyId),
        number: 0,
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
      
      await apiSend('POST', '/api/electronic-invoice/quotes', payload)
      
      setCreateDialogOpen(false)
      setCreateFormData({
        companyId: '',
        issueDate: new Date().toISOString().split('T')[0],
        validityDate: '',
        notes: '',
        lines: [],
      })
      appendAuditEvent({ module: 'FatturazioneElettronica', action: 'CreateQuote', detail: 'Nuovo preventivo creato' })
      loadData()
    } catch (err) {
      setCreateError(err.message || 'Errore nella creazione')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleConvertToInvoice = async (quoteId) => {
    if (!window.confirm('Convertire questo preventivo in fattura?')) return
    
    try {
      const result = await apiSend('POST', `/api/electronic-invoice/quotes/${quoteId}/convert-to-invoice`)
      appendAuditEvent({ module: 'FatturazioneElettronica', action: 'ConvertQuote', detail: `Preventivo ${quoteId} convertito in fattura` })
      loadData()
      alert('Preventivo convertito in fattura con successo!')
    } catch (err) {
      alert(`Errore: ${err.message}`)
    }
  }

  const handleOpenDetail = (quote) => {
    setSelectedQuote(quote)
    setDetailDialogOpen(true)
  }

  const handleOpenCreate = () => {
    setCreateFormData(prev => ({
      ...prev,
      companyId: '',
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
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Preventivi</Typography>
          <Typography variant="body2" color="text.secondary">Gestione preventivi e offerte commerciali</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size="large"
        >
          Nuovo Preventivo
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">Totale</Typography>
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
              <Typography variant="caption" color="text.secondary">Accettati</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>{stats.accepted}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">Convertiti</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>{stats.converted}</Typography>
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
                <MenuItem value="Inviato">Inviato</MenuItem>
                <MenuItem value="Accettato">Accettato</MenuItem>
                <MenuItem value="Rifiutato">Rifiutato</MenuItem>
                <MenuItem value="Scaduto">Scaduto</MenuItem>
                <MenuItem value="Convertito">Convertito</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={12} sm={4}>
            <TextField
              size="small"
              placeholder="Cerca per numero, cliente..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><FilterIcon sx={{ color: 'action' }}/></InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Quotes Table */}
      <Paper variant="outlined">
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Numero</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Scadenza</TableCell>
                <TableCell align="right">Imponibile</TableCell>
                <TableCell align="right">IVA</TableCell>
                <TableCell align="right">Totale</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Nessun preventivo trovato</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((q) => (
                  <TableRow key={q.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {q.number}/{q.year}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(q.issueDate)}</TableCell>
                    <TableCell>{q.company?.name || '-'}</TableCell>
                    <TableCell>{formatDate(q.validityDate)}</TableCell>
                    <TableCell align="right">{formatCurrency(q.taxableAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(q.vatAmount)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(q.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={q.status} 
                        color={getStatusColor(q.status)}
                        variant={q.status === 'Bozza' ? 'outlined' : 'filled'}
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Visualizza dettagli">
                        <IconButton size="small" onClick={() => handleOpenDetail(q)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {q.status === 'Accettato' && (
                        <Tooltip title="Converti in Fattura">
                          <Button size="small" onClick={() => handleConvertToInvoice(q.id)} startIcon={<SendIcon />}>
                            Fattura
                          </Button>
                        </Tooltip>
                      )}
                      {q.status === 'Bozza' && (
                        <Tooltip title="Duplica">
                          <IconButton size="small" onClick={() => {}} color="primary">
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Quote Dialog - simplified for brevity */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Nuovo Preventivo</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Implementazione completa del dialog di creazione preventivo
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleCreateQuote} disabled={createLoading}>
            {createLoading ? 'Creazione...' : 'Crea Preventivo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog - simplified */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Dettaglio Preventivo</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Implementazione dettaglio preventivo
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}