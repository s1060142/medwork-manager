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
  Grid,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
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
  Visibility as ViewIcon,
  Send as SendIcon,
  CloudDownload as CloudDownloadIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material'
import { apiGet, apiSend } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('it-IT')
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
}

function getStatusColor(status) {
  switch (status) {
    case 'Bozza': return 'default'
    case 'DaInviare': return 'info'
    case 'Inviata': return 'primary'
    case 'Accettata': return 'success'
    case 'Scartata': return 'error'
    case 'Consegnata': return 'success'
    case 'NonConsegnata': return 'warning'
    case 'DecorrenzaTermini': return 'warning'
    case 'ErroreInvio': return 'error'
    default: return 'default'
  }
}

function getDocTypeLabel(type) {
  const types = {
    'TD01': 'Fattura',
    'TD02': 'Acconto',
    'TD03': 'Acconto su fattura',
    'TD04': 'Nota di credito',
    'TD05': 'Nota di debito',
    'TD06': 'Parcellazione',
  }
  return types[type] || type
}

export default function ElectronicInvoiceList({ activeCompanyId = '', activeBranchId = '', onOpenElectronicInvoiceDetail }) {
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleOpenDetail = (invoice) => {
    if (onOpenElectronicInvoiceDetail) {
      onOpenElectronicInvoiceDetail(invoice)
    }
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
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Elenco Fatture Elettroniche</Typography>
          <Typography variant="body2" color="text.secondary">Gestione elenco fatture SDI</Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item size={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              select
              label="Anno"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item size={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              select
              label="Stato"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
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
            </TextField>
          </Grid>
          <Grid item size={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Cerca per numero, destinatario, P.IVA..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><FilterIcon sx={{ color: 'action' }}/></InputAdornment>,
              }}
            />
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
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Nessuna fattura trovata</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
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
                      <Tooltip title="Invia a SDI">
                        <IconButton size="small" onClick={() => handleSendToSdi(inv.id)} color="primary" disabled={inv.status !== 'Bozza'}>
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  )
}