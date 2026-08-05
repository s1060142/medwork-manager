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
  Stepper,
  Step,
  StepButton,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import { apiGet, apiSend } from '../services/apiClient'

const CREDIT_NOTE_STEPS = ['Benvenuto', 'Cliente', 'Data', 'Storno', 'Pagamento', 'Note', 'Riepilogo']

export default function CreditNoteCenter() {
  const [activeStep, setActiveStep] = useState(0)
  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [companies, setCompanies] = useState([])
  const [creditNoteItems, setCreditNoteItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [summaryData, setSummaryData] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('CC')
  const [paymentTerms, setPaymentTerms] = useState('30gg fine mese')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    apiGet('/api/master-data/companies')
      .then(setCompanies)
      .catch(() => setCompanies([]))
    
    apiGet('/api/electronic-invoice?status=Emesa')
      .then(setInvoices)
      .catch(() => setInvoices([]))
  }, [])

  const handleNext = () => {
    if (activeStep === 2) validateStep3()
    else if (activeStep === 3) validateStep4()
    else if (activeStep === 4) validateStep5()
    else if (activeStep === 5) validateStep6()
    else if (activeStep === 6) handleSave()
    else setActiveStep((s) => Math.min(s + 1, CREDIT_NOTE_STEPS.length - 1))
  }

  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0))

  const validateStep3 = () => {
    const newErrors = {}
    if (!selectedInvoice) newErrors.invoice = 'Selezionare una fattura da stornare'
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      generatePreview()
      setActiveStep(3)
    }
  }

  const validateStep4 = () => {
    if (!creditNoteItems.length) {
      setErrors({ items: 'Aggiungere almeno una riga da stornare' })
      return
    }
    setErrors({})
    setActiveStep(4)
  }

  const validateStep5 = () => {
    setActiveStep(5)
  }

  const validateStep6 = () => {
    setActiveStep(6)
    generateSummary()
  }

  const generatePreview = async () => {
    if (!selectedInvoice) return
    setLoading(true)
    try {
      const invoice = invoices.find(i => i.id === selectedInvoice)
      if (invoice) {
        // Mock credit note lines based on invoice
        const lines = invoice.lines || [
          { id: 1, description: 'STORNO AUDIOMETRIA', qty: 3, price: 46.29, iva: 22, total: 169.53 }
        ]
        setCreditNoteItems(lines)
      }
    } catch (error) {
      setErrors({ general: 'Errore nel caricamento dei dati' })
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = () => {
    const subtotal = creditNoteItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
    const vatAmount = creditNoteItems.reduce((sum, item) => sum + (item.price * item.qty * item.iva / 100), 0)
    const total = subtotal + vatAmount
    setSummaryData({
      creditNoteNumber: 'NC-' + Date.now().toString().slice(-5),
      invoiceNumber: invoices.find(i => i.id === selectedInvoice)?.number || '-',
      companyName: companies.find(c => c.id === selectedCompany)?.name || '-',
      itemCount: creditNoteItems.length,
      subtotal: subtotal.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2),
      issueDate: new Date().toLocaleDateString('it-IT'),
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        companyId: parseInt(selectedCompany),
        originalInvoiceId: selectedInvoice,
        lines: creditNoteItems,
        paymentMethod,
        paymentTerms,
        notes,
      }
      await apiSend('POST', '/api/electronic-invoice/credit-notes', payload)
      setActiveStep(0)
      setSelectedInvoice(null)
      setSelectedCompany('')
      setCreditNoteItems([])
      setNotes('')
      setSummaryData(null)
      setErrors({})
    } catch (error) {
      setErrors({ save: error.message || 'Errore durante il salvataggio' })
    } finally {
      setSaving(false)
    }
  }

  const handleLineChange = (index, field, value) => {
    setCreditNoteItems(prev => prev.map((line, i) => i === index ? { ...line, [field]: value } : line))
  }

  const handleRemoveLine = (index) => {
    setCreditNoteItems(prev => prev.filter((_, i) => i !== index))
  }

  const calculateLineTotal = (line) => {
    return line.price * line.qty
  }

  const calculateTotals = () => {
    return creditNoteItems.reduce((sum, item) => ({
      taxable: sum.taxable + (item.price * item.qty),
      vat: sum.vat + (item.price * item.qty * item.iva / 100),
      total: sum.total + (item.price * item.qty) + (item.price * item.qty * item.iva / 100)
    }), { taxable: 0, vat: 0, total: 0 })
  }

  const step1Content = (
    <Stack spacing={2}>
      <Typography variant="h6" gutterBottom>
        Benvenuto nella creazione nota di credito
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Crea una nota di credito per stornare una fattura emessa seguendo questi 7 passaggi.
      </Typography>
      <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="subtitle1" gutterBottom>
          Cosa puoi fare:
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">• Storno parziale o totale di fatture emesse</Typography>
          <Typography variant="body2">• Selezione automatica delle righe dalla fattura originale</Typography>
          <Typography variant="body2">• Gestione modalità pagamento e note</Typography>
          <Typography variant="body2">• Invio diretto a SDI</Typography>
        </Stack>
      </Paper>
    </Stack>
  )

  const step2Content = (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>
        Cliente
      </Typography>
      <FormControl fullWidth size="small" error={!!errors.invoice}>
        <InputLabel>Seleziona fattura da stornare</InputLabel>
        <Select
          value={selectedInvoice?.toString() || ''}
          label="Fattura"
          onChange={(e) => { setSelectedInvoice(e.target.value ? parseInt(e.target.value) : null); setErrors(prev => ({ ...prev, invoice: '' })) }}
        >
          <MenuItem value="">Seleziona una fattura</MenuItem>
          {invoices.map((inv) => (
            <MenuItem key={inv.id} value={inv.id}>
              {inv.number} - {inv.companyName} - {new Date(inv.issueDate).toLocaleDateString('it-IT')} - {inv.totalAmount?.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
            </MenuItem>
          ))}
        </Select>
        {errors.invoice && <FormHelperText>{errors.invoice}</FormHelperText>}
      </FormControl>

      <Divider />
      <Typography variant="body2" color="text.secondary">
        <strong>Configurazione SDI:</strong> Verifica che l'azienda selezionata abbia una configurazione SDI attiva in Impostazioni.
      </Typography>
    </Stack>
  )

  const step3Content = (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>
        Data
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Seleziona la data di emissione della nota di credito.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Data emissione *"
            type="date"
            size="small"
            value={new Date().toISOString().split('T')[0]}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" error={!!errors.company}>
            <InputLabel>Azienda</InputLabel>
            <Select
              value={selectedCompany}
              label="Azienda"
              onChange={(e) => { setSelectedCompany(e.target.value); setErrors(prev => ({ ...prev, company: '' })) }}
            >
              <MenuItem value="">Seleziona azienda</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
            {errors.company && <FormHelperText>{errors.company}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>

      <Divider />
      <Typography variant="body2" color="text.secondary">
        <strong>Configurazione SDI:</strong> Verifica che l'azienda selezionata abbia una configurazione SDI attiva in Impostazioni.
      </Typography>
    </Stack>
  )

  const step4Content = (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>
        Storno
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Seleziona le righe della fattura da stornare. Puoi modificare quantità e prezzi se necessario.
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {errors.items && <Alert severity="error">{errors.items}</Alert>}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 40 }} />
              <TableCell><strong>Descrizione</strong></TableCell>
              <TableCell align="right"><strong>Quantità</strong></TableCell>
              <TableCell align="right"><strong>Prezzo unitario</strong></TableCell>
              <TableCell align="right"><strong>IVA</strong></TableCell>
              <TableCell align="right"><strong>Totale</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {creditNoteItems.map((line, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <IconButton size="small" onClick={() => handleRemoveLine(index)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={line.description}
                    onChange={(e) => handleLineChange(index, 'description', e.target.value)}
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
                  <strong>{calculateLineTotal(line).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</strong>
                </TableCell>
              </TableRow>
            ))}
            {creditNoteItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">Nessuna riga da stornare. Carica una fattura al passaggio precedente.</Typography>
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
          <Typography variant="h6">{calculateTotals().taxable.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">IVA</Typography>
          <Typography variant="h6">{calculateTotals().vat.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Totale</Typography>
          <Typography variant="h4" fontWeight="bold" color="primary.main">{calculateTotals().total.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</Typography>
        </Grid>
      </Grid>
    </Stack>
  )

  const step5Content = (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>
        Pagamento
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel id="payment-label">Metodo pagamento</InputLabel>
            <Select labelId="payment-label" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
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
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            placeholder="es. 30gg fine mese"
          />
        </Grid>
      </Grid>
    </Stack>
  )

  const step6Content = (
    <Stack spacing={2}>
      <Typography variant="h6" gutterBottom>
        Note
      </Typography>
      <TextField
        label="Note per la nota di credito"
        multiline
        rows={6}
        fullWidth
        size="small"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Note aggiuntive (es. motivo storno, riferimenti ordine...)"
      />
      <Typography variant="caption" color="text.secondary">
        Le note saranno incluse nel documento XML inviato allo SDI.
      </Typography>
    </Stack>
  )

  const step7Content = (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>
        Riepilogo
      </Typography>

      {summaryData ? (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Numero nota di credito</Typography>
              <Typography variant="h5" fontWeight="bold">{summaryData.creditNoteNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Fattura stornata</Typography>
              <Typography variant="h5">{summaryData.invoiceNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Cliente</Typography>
              <Typography variant="h5">{summaryData.companyName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Data emissione</Typography>
              <Typography variant="h5">{summaryData.issueDate}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">Elementi</Typography>
              <Typography variant="h5">{summaryData.itemCount}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">Imponibile</Typography>
              <Typography variant="h6">{parseFloat(summaryData.subtotal).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">IVA</Typography>
              <Typography variant="h6">{parseFloat(summaryData.vatAmount).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">Totale</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">{parseFloat(summaryData.total).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Metodo pagamento</Typography>
              <Typography>{paymentMethod === 'CC' ? 'CC - Carta di credito' : paymentMethod}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Termini pagamento</Typography>
              <Typography>{paymentTerms}</Typography>
            </Grid>
            {notes && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Note</Typography>
                <Typography>{notes}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      ) : (
        <Typography variant="body2" color="text.secondary">Caricamento riepilogo...</Typography>
      )}
    </Stack>
  )

  const getStepContent = (step) => {
    switch (step) {
      case 0: return step1Content
      case 1: return step2Content
      case 2: return step3Content
      case 3: return step4Content
      case 4: return step5Content
      case 5: return step6Content
      case 6: return step7Content
      default: return step1Content
    }
  }

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {CREDIT_NOTE_STEPS.map((label, index) => (
          <Step key={label}>
            <StepButton
              onClick={() => setActiveStep(index)}
              active={activeStep === index}
              disabled={activeStep < index && index > 0}
            >
              <StepLabel>{label}</StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3, mb: 3 }}>
        {getStepContent(activeStep)}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0 || saving}
          onClick={handleBack}
        >
          {'<'} Indietro
        </Button>
        <Box>
          {activeStep < CREDIT_NOTE_STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || saving}
            >
              Avanti >
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {saving ? 'Salvataggio...' : 'Crea nota di credito'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  )
}