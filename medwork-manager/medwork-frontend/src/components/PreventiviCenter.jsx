import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Chip,
  Divider,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import { apiGet, apiSend } from '../services/apiClient'

export default function PreventiviCenter() {
  const [quotes, setQuotes] = useState([])
  const [companies, setCompanies] = useState([])
  const [priceLists, setPriceLists] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editQuote, setEditQuote] = useState(null)
  const [quoteForm, setQuoteForm] = useState({
    companyId: '',
    year: new Date().getFullYear().toString(),
    status: 'Bozza',
    validityDate: '',
    notes: '',
    paymentMethod: 'CC',
    paymentTerms: '30gg fine mese',
    lines: [],
  })

  useEffect(() => {
    Promise.all([
      apiGet('/api/master-data/companies'),
      apiGet('/api/electronic-invoice/pricelist'),
    ]).then(([companyData, priceListData]) => {
      setCompanies(Array.isArray(companyData) ? companyData : [])
      setPriceLists(Array.isArray(priceListData) ? priceListData : [])
    })
  }, [])

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      // In real app, call backend API
      const mockQuotes = [
        { id: 1, companyId: 1, companyName: 'Dilaxia S.p.A.', number: '00001', year: 2024, status: 'Bozza', issueDate: '2024-10-17', totalAmount: 140.00, lines: [] },
        { id: 2, companyId: 2, companyName: 'Albox S.r.l.', number: '00002', year: 2024, status: 'Accettato', issueDate: '2024-10-15', totalAmount: 2500.00, lines: [] },
      ]
      setQuotes(mockQuotes)
    } catch (error) {
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  const filteredQuotes = quotes.filter(q =>
    q.companyName.toLowerCase().includes(search.toLowerCase()) ||
    q.number.toLowerCase().includes(search.toLowerCase()) ||
    q.status.toLowerCase().includes(search.toLowerCase())
  )

  const paginatedQuotes = filteredQuotes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const openDialog = (quote = null) => {
    if (quote) {
      setEditQuote(quote)
      setQuoteForm({
        companyId: quote.companyId.toString(),
        year: quote.year.toString(),
        status: quote.status,
        validityDate: quote.validityDate || '',
        notes: quote.notes || '',
        paymentMethod: quote.paymentMethod || 'CC',
        paymentTerms: quote.paymentTerms || '30gg fine mese',
        lines: quote.lines || [],
      })
    } else {
      setEditQuote(null)
      setQuoteForm({
        companyId: '',
        year: new Date().getFullYear().toString(),
        status: 'Bozza',
        validityDate: '',
        notes: '',
        paymentMethod: 'CC',
        paymentTerms: '30gg fine mese',
        lines: [],
      })
    }
    setDialogOpen(true)
  }

  const handleLineChange = (index, field, value) => {
    setQuoteForm(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => i === index ? { ...line, [field]: value } : line)
    }))
  }

  const addLine = () => {
    setQuoteForm(prev => ({
      ...prev,
      lines: [...prev.lines, { id: Date.now(), description: '', qty: 1, price: 0, iva: 22, discount: 0 }]
    }))
  }

  const removeLine = (index) => {
    setQuoteForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }))
  }

  const calculateLineTotal = (line) => {
    const base = line.price * line.qty
    const discount = base * (line.discount || 0) / 100
    const taxable = base - discount
    const vat = taxable * (line.iva || 0) / 100
    return { taxable, vat, total: taxable + vat }
  }

  const calculateTotals = () => {
    return quoteForm.lines.reduce((sum, line) => {
      const { taxable, vat, total } = calculateLineTotal(line)
      return { 
        taxable: sum.taxable + taxable, 
        vat: sum.vat + vat, 
        total: sum.total + total 
      }
    }, { taxable: 0, vat: 0, total: 0 })
  }

  const saveQuote = async () => {
    if (!quoteForm.companyId || quoteForm.lines.length === 0) return
    setSaving(true)
    try {
      const totals = calculateTotals()
      const payload = {
        ...quoteForm,
        companyId: parseInt(quoteForm.companyId),
        year: parseInt(quoteForm.year),
        taxableAmount: totals.taxable,
        vatAmount: totals.vat,
        totalAmount: totals.total,
      }
      
      if (editQuote) {
        await apiSend('PUT', `/api/electronic-invoice/quotes/${editQuote.id}`, payload)
        setQuotes(prev => prev.map(q => q.id === editQuote.id ? { ...q, ...payload } : q))
      } else {
        const newId = Date.now()
        setQuotes(prev => [...prev, { id: newId, ...payload, number: `0000${newId}`, companyName: companies.find(c => c.id === parseInt(quoteForm.companyId))?.name }])
      }
      setDialogOpen(false)
    } catch (error) {
      alert('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const deleteQuote = async (id) => {
    if (!window.confirm('Eliminare questo preventivo?')) return
    try {
      await apiSend('DELETE', `/api/electronic-invoice/quotes/${id}`)
      setQuotes(prev => prev.filter(q => q.id !== id))
    } catch (error) {
      alert('Errore durante l\'eliminazione')
    }
  }

  const handleConvert = async (quote) => {
    try {
      const invoice = {
        companyId: quote.companyId,
        invoiceType: 'TD01',
        lines: quote.lines,
        paymentMethod: quote.paymentMethod,
        paymentTerms: quote.paymentTerms,
        notes: quote.notes,
      }
      await apiSend('POST', `/api/electronic-invoice/quotes/${quote.id}/convert-to-invoice`)
      alert('Preventivo convertito in fattura!')
    } catch (error) {
      alert('Errore durante la conversione')
    }
  }

  const statusColors = {
    'Bozza': 'default',
    'Inviato': 'info',
    'Accettato': 'success',
    'Rifiutato': 'error',
    'Convertito': 'warning',
  }

  const totals = calculateTotals()

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Preventivi</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>
          Nuovo preventivo
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Cerca preventivo..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          sx={{ minWidth: 250 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Numero</strong></TableCell>
              <TableCell><strong>Cliente</strong></TableCell>
              <TableCell><strong>Data</strong></TableCell>
              <TableCell><strong>Stato</strong></TableCell>
              <TableCell align="right"><strong>Totale</strong></TableCell>
              <TableCell align="right" style={{ width: 180 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedQuotes.map((quote) => (
              <TableRow key={quote.id} hover>
                <TableCell>{quote.number}</TableCell>
                <TableCell>{quote.companyName}</TableCell>
                <TableCell>{quote.issueDate ? new Date(quote.issueDate).toLocaleDateString('it-IT') : '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={quote.status} color={statusColors[quote.status] || 'default'} variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <strong>{quote.totalAmount?.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</strong>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openDialog(quote)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteQuote(quote.id)}><DeleteIcon fontSize="small" /></IconButton>
                  {quote.status === 'Accettato' && (
                    <Button size="small" onClick={() => handleConvert(quote)} variant="outlined">Converti</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {paginatedQuotes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">Nessun preventivo trovato</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredQuotes.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditQuote(null); }} maxWidth="xl" fullWidth>
        <DialogTitle>{editQuote ? 'Modifica preventivo' : 'Nuovo preventivo'}</DialogTitle>
        <DialogContent>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ maxHeight: '80vh', overflow: 'auto' }}>
            {/* Left Column - Form */}
            <Box sx={{ flexGrow: 1 }}>
              <Paper sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" variant="outlined" error={!quoteForm.companyId}>
                      <InputLabel id="company-label">Cliente *</InputLabel>
                      <Select labelId="company-label" label="Cliente" value={quoteForm.companyId} onChange={(e) => setQuoteForm({ ...quoteForm, companyId: e.target.value })} required>
                        <MenuItem value="">Seleziona cliente</MenuItem>
                        {companies.map((c) => (
                          <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Anno *"
                      type="number"
                      size="small"
                      fullWidth
                      value={quoteForm.year}
                      onChange={(e) => setQuoteForm({ ...quoteForm, year: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small" variant="outlined">
                      <InputLabel id="status-label">Stato</InputLabel>
                      <Select labelId="status-label" value={quoteForm.status} onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value })}>
                        <MenuItem value="Bozza">Bozza</MenuItem>
                        <MenuItem value="Inviato">Inviato</MenuItem>
                        <MenuItem value="Accettato">Accettato</MenuItem>
                        <MenuItem value="Rifiutato">Rifiutato</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Data validità"
                      type="date"
                      size="small"
                      fullWidth
                      value={quoteForm.validityDate}
                      onChange={(e) => setQuoteForm({ ...quoteForm, validityDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" variant="outlined">
                      <InputLabel id="payment-label">Metodo pagamento</InputLabel>
                      <Select labelId="payment-label" value={quoteForm.paymentMethod} onChange={(e) => setQuoteForm({ ...quoteForm, paymentMethod: e.target.value })}>
                        <MenuItem value="CC">CC - Carta di credito</MenuItem>
                        <MenuItem value="BON">Bonifico bancario</MenuItem>
                        <MenuItem value="CON">Contanti</MenuItem>
                        <MenuItem value="ASG">Assegno</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Termini pagamento"
                      size="small"
                      fullWidth
                      value={quoteForm.paymentTerms}
                      onChange={(e) => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Note"
                      multiline
                      rows={3}
                      fullWidth
                      size="small"
                      value={quoteForm.notes}
                      onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                      placeholder="Note per il preventivo..."
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>Prestazioni</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button variant="outlined" startIcon={<AddIcon />} size="small" onClick={addLine}>
                    Aggiungi riga
                  </Button>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ width: 40 }} />
                        <TableCell><strong>Prestazione</strong></TableCell>
                        <TableCell align="right"><strong>Quantità</strong></TableCell>
                        <TableCell align="right"><strong>Prezzo unitario</strong></TableCell>
                        <TableCell align="right"><strong>IVA</strong></TableCell>
                        <TableCell align="right"><strong>Sconto %</strong></TableCell>
                        <TableCell align="right"><strong>Totale</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quoteForm.lines.map((line, index) => (
                        <TableRow key={line.id} hover>
                          <TableCell>
                            <IconButton size="small" onClick={() => removeLine(index)}><DeleteIcon fontSize="small" /></IconButton>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={line.description}
                              onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                              placeholder="Descrizione prestazione"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={line.qty}
                              onChange={(e) => handleLineChange(index, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                              inputProps={{ style: { width: 80, textAlign: 'right' } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={line.price}
                              onChange={(e) => handleLineChange(index, 'price', parseFloat(e.target.value) || 0)}
                              inputProps={{ style: { width: 120, textAlign: 'right' } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <FormControl size="small" variant="outlined">
                              <Select value={line.iva} onChange={(e) => handleLineChange(index, 'iva', parseInt(e.target.value))} native>
                                <option value={22}>22%</option>
                                <option value={10}>10%</option>
                                <option value={4}>4%</option>
                                <option value={0}>0%</option>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={line.discount || 0}
                              onChange={(e) => handleLineChange(index, 'discount', parseFloat(e.target.value) || 0)}
                              inputProps={{ style: { width: 100, textAlign: 'right' } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <strong>{calculateLineTotal(line).total.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</strong>
                          </TableCell>
                        </TableRow>
                      ))}
                      {quoteForm.lines.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography variant="body2" color="text.secondary">Nessuna riga. Clicca "Aggiungi riga" per iniziare.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2} justifyContent="flex-end">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Imponibile</Typography>
                    <Typography variant="h6">{totals.taxable.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">IVA</Typography>
                    <Typography variant="h6">{totals.vat.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Sconto</Typography>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      value={0}
                      onChange={(e) => setQuoteForm({ ...quoteForm, discount: parseFloat(e.target.value) || 0 })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Totale</Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">{totals.total.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            {/* Right Column - Preview */}
            <Box sx={{ width: { lg: 380 }, flexShrink: 0 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Anteprima preventivo</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {editQuote ? `Preventivo #${editQuote.number}` : 'Nuovo preventivo'}
                </Typography>
                <Typography variant="body2">
                  <strong>Cliente:</strong> {companies.find(c => c.id === parseInt(quoteForm.companyId))?.name || 'Seleziona cliente'}
                </Typography>
                <Typography variant="body2">
                  <strong>Data:</strong> {new Date().toLocaleDateString('it-IT')}
                </Typography>
                <Typography variant="body2">
                  <strong>Righe:</strong> {quoteForm.lines.length}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" color="primary.main">
                  Totale: {totals.total.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setEditQuote(null); setQuoteForm({ ...quoteForm, lines: [] }); }}>Annulla</Button>
          <Button variant="contained" onClick={saveQuote} disabled={saving}>
            {saving ? 'Salvataggio...' : (editQuote ? 'Salva modifiche' : 'Crea preventivo')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}