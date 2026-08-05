import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Step,
  StepButton,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Grid,
  Divider,
  Stack,
  Alert,
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'

const steps = ['Benvenuto', 'Linea', 'Dati da fatturare', 'Note', 'Riepilogo']

const INVOICE_TYPES = [
  { value: 'TD01', label: 'TD01 - Fattura elettronica ordinaria' },
  { value: 'TD04', label: 'TD04 - Nota di credito' },
  { value: 'TD05', label: 'TD05 - Nota di debito' },
]

const PAYMENT_METHODS = [
  { value: 'CC', label: 'CC - Carta di credito' },
  { value: 'BON', label: 'Bonifico bancario' },
  { value: 'CON', label: 'Contanti' },
  { value: 'ASG', label: 'Assegno' },
]

export default function BillingCenter() {
  const [activeStep, setActiveStep] = useState(0)
  const [companies, setCompanies] = useState([])
  const [priceLists, setPriceLists] = useState([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [invoiceType, setInvoiceType] = useState('TD01')
  const [paymentMethod, setPaymentMethod] = useState('CC')
  const [paymentTerms, setPaymentTerms] = useState('30gg fine mese')
  const [startDate, setStartDate] = useState('01/09/2024')
  const [endDate, setEndDate] = useState('30/09/2024')
  const [issueDate, setIssueDate] = useState('30/09/2024')
  const [invoiceItems, setInvoiceItems] = useState([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [summaryData, setSummaryData] = useState(null)

  const handleNext = () => {
    if (activeStep === 2) validateStep3()
    else if (activeStep === 3) validateStep4()
    else if (activeStep === 4) handleSave()
    else setActiveStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0))

  const validateStep3 = () => {
    const newErrors = {}
    if (!startDate) newErrors.startDate = 'Data inizio obbligatoria'
    if (!endDate) newErrors.endDate = 'Data fine obbligatoria'
    if (!issueDate) newErrors.issueDate = 'Data emissione obbligatoria'
    if (!selectedCompany && !summaryData?.allCompanies) newErrors.company = 'Selezionare almeno un\'azienda'
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      generatePreview()
      setActiveStep(3)
    }
  }

  const validateStep4 = () => {
    setActiveStep(4)
    generateSummary()
  }

  const generatePreview = async () => {
    setLoading(true)
    try {
      // In a real app, this would call the backend to generate invoice lines
      const mockItems = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        description: `Visita Medica Periodica - Dipendente ${i + 1}`,
        qty: 1,
        price: 45.00,
        iva: 22,
        total: 54.90,
      }))
      setInvoiceItems(mockItems)
    } catch (error) {
      setErrors({ general: 'Errore nel caricamento dei dati da fatturare' })
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0)
    const vatAmount = invoiceItems.reduce((sum, item) => sum + (item.price * item.qty * item.iva / 100), 0)
    const total = subtotal + vatAmount
    setSummaryData({
      invoiceNumber: 7,
      itemCount: invoiceItems.length,
      subtotal: subtotal.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2),
      issueDate,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        companyId: selectedCompany ? parseInt(selectedCompany) : null,
        invoiceType,
        paymentMethod,
        paymentTerms,
        startDate,
        endDate,
        issueDate,
        lines: invoiceItems,
        notes,
      }
      await apiSend('POST', '/api/electronic-invoice', payload)
      setActiveStep(0)
      setSelectedCompany('')
      setInvoiceItems([])
      setNotes('')
      setSummaryData(null)
      setErrors({})
    } catch (error) {
      setErrors({ save: error.message || 'Errore durante il salvataggio' })
    } finally {
      setSaving(false)
    }
  }

  // Load companies on mount
  useEffect(() => {
    apiGet('/api/master-data/companies')
      .then(setCompanies)
      .catch(() => setCompanies([]))
  }, [])

  const step1Content = (
    <Stack spacing={2}>
      <Typography variant="h6" gutterBottom>
        Benvenuto nella fatturazione
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Crea fatture elettroniche per una o più aziende seguendo questi 5 passaggi.
      </Typography>
      <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="subtitle1" gutterBottom>
          Cosa puoi fare:
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">• Fatturazione multi-azienda in un unico flusso</Typography>
          <Typography variant="body2">• Selezione periodo e tipologia prestazioni</Typography>
          <Typography variant="body2">• Anteprima calcolo importi e IVA</Typography>
          <Typography variant="body2">• Salvataggio come bozza o invio diretto a SDI</Typography>
        </Stack>
      </Paper>
    </Stack>
  )

  const step2Content = (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>
        Linea fatturazione
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo fattura</InputLabel>
            <Select value={invoiceType} label="Tipo fattura" onChange={(e) => setInvoiceType(e.target.value)}>
              {INVOICE_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Metodo pagamento</InputLabel>
            <Select value={paymentMethod} label="Metodo pagamento" onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Termini pagamento"
            size="small"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            placeholder="es. 30gg fine mese"
          />
        </Grid>
      </Grid>

      <Divider />
      <Typography variant="body2" color="text.secondary">
        <strong>Configurazione SDI:</strong> Verifica che l'azienda selezionata abbia una configurazione SDI attiva in Impostazioni.
      </Typography>
    </Stack>
  )

  const step3Content = (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>
        Dati da fatturare
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Scegli periodo, aziende e accertamenti da fatturare. Puoi fatturare tutti gli accertamenti non ancora fatturati
        fino a oggi oppure specificare i dettagli manualmente.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Data inizio *"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setErrors(prev => ({ ...prev, startDate: '' })) }}
            error={!!errors.startDate}
            helperText={errors.startDate}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Data fine *"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setErrors(prev => ({ ...prev, endDate: '' })) }}
            error={!!errors.endDate}
            helperText={errors.endDate}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Data emissione *"
            type="date"
            size="small"
            value={issueDate}
            onChange={(e) => { setIssueDate(e.target.value); setErrors(prev => ({ ...prev, issueDate: '' })) }}
            error={!!errors.issueDate}
            helperText={errors.issueDate}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" error={!!errors.company}>
            <InputLabel>Aziende da fatturare</InputLabel>
            <Select
              value={selectedCompany}
              label="Aziende da fatturare"
              onChange={(e) => { setSelectedCompany(e.target.value); setErrors(prev => ({ ...prev, company: '' })) }}
            >
              <MenuItem value="">Tutte le aziende</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
            {errors.company && <FormHelperText>{errors.company}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Prestazioni da fatturare</InputLabel>
            <Select
              value="all"
              label="Prestazioni da fatturare"
              onChange={() => {}}
            >
              <MenuItem value="all">Tutti gli accertamenti non fatturati</MenuItem>
              <MenuItem value="periodic">Solo visite periodiche</MenuItem>
              <MenuItem value="preventive">Solo visite preventive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {errors.general && <Alert severity="error">{errors.general}</Alert>}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && invoiceItems.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Anteprima righe fattura ({invoiceItems.length} elementi)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Prestazione</TableCell>
                  <TableCell align="right">Quantità</TableCell>
                  <TableCell align="right">Prezzo unitario</TableCell>
                  <TableCell align="right">IVA</TableCell>
                  <TableCell align="right">Totale</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{item.qty}</TableCell>
                    <TableCell align="right">{item.price.toFixed(2)} €</TableCell>
                    <TableCell align="right">{item.iva}%</TableCell>
                    <TableCell align="right"><strong>{item.total.toFixed(2)} €</strong></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Stack>
  )

  const step4Content = (
    <Stack spacing={2}>
      <Typography variant="h6" gutterBottom>
        Note per la fattura
      </Typography>
      <TextField
        label="Note"
        multiline
        rows={6}
        fullWidth
        size="small"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Note aggiuntive per la fattura (es. riferimenti ordine, condizioni particolari...)"
      />
      <Typography variant="caption" color="text.secondary">
        Le note saranno incluse nel documento XML inviato allo SDI.
      </Typography>
    </Stack>
  )

  const step5Content = (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>
        Riepilogo
      </Typography>
      
      {summaryData ? (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Numero fattura</Typography>
              <Typography variant="h5" fontWeight="bold">{summaryData.invoiceNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Data emissione</Typography>
              <Typography variant="h5">{summaryData.issueDate}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Elementi fattura</Typography>
              <Typography variant="h5">{summaryData.itemCount}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Tipo documento</Typography>
              <Typography variant="h5">{INVOICE_TYPES.find(t => t.value === invoiceType)?.label || invoiceType}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
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
              <Typography>{PAYMENT_METHODS.find(p => p.value === paymentMethod)?.label || paymentMethod}</Typography>
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
      default: return step1Content
    }
  }

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((label, index) => (
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
          {activeStep < steps.length - 1 ? (
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
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {saving ? 'Salvataggio...' : 'Salva fattura'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  )
}