import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
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
} from '@mui/material'
import { apiGet } from '../services/apiClient'

const steps = ['Benvenuto', 'Linea', 'Dati da fatturare', 'Note', 'Riepilogo']

export default function BillingCenter() {
  const [activeStep, setActiveStep] = useState(0)
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [invoiceItems, setInvoiceItems] = useState([])
  const [loading, setLoading] = useState(false)

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1))
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0))

  // Load companies
  useEffect(() => {
    apiGet('/api/master-data/companies')
      .then(setCompanies)
      .catch(() => setCompanies([]))
  }, [])

  const step1Content = (
    <Box>
      <Typography variant="h6" gutterBottom>
        Benvenuto nella fatturazione
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Crea fatture per una o più aziende seguendo questi passaggi.
      </Typography>
    </Box>
  )

  const step2Content = (
    <Box>
      <Typography variant="h6" gutterBottom>
        Linea
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Azienda</InputLabel>
        <Select
          value={selectedCompany}
          label="Azienda"
          onChange={(e) => setSelectedCompany(e.target.value)}
        >
          {companies.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )

  const step3Content = (
    <Box>
      <Typography variant="h6" gutterBottom>
        Dati da fatturare
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Prestazione</TableCell>
              <TableCell>Quantità</TableCell>
              <TableCell>Prezzo unitario</TableCell>
              <TableCell>Iva</TableCell>
              <TableCell>Totale</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoiceItems.map((item, i) => (
              <TableRow key={i}>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>{item.price} €</TableCell>
                <TableCell>{item.iva}%</TableCell>
                <TableCell>{(item.qty * item.price).toFixed(2)} €</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

  const step4Content = (
    <Box>
      <Typography variant="h6" gutterBottom>
        Note
      </Typography>
      <TextField
        label="Note per la fattura"
        multiline
        rows={3}
        fullWidth
        sx={{ mb: 2 }}
      />
    </Box>
  )

  const step5Content = (
    <Box>
      <Typography variant="h6" gutterBottom>
        Riepilogo
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2">
          Numero fattura: 7
        </Typography>
        <Typography variant="body2">
          Elementi: 2491
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          Totale: 86.523,48 €
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Data: 29/09/2021
        </Typography>
      </Paper>
    </Box>
  )

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return step1Content
      case 1:
        return step2Content
      case 2:
        return step3Content
      case 3:
        return step4Content
      case 4:
        return step5Content
      default:
        return step1Content
    }
  }

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepButton onClick={() => setActiveStep(index)} active={activeStep === index}>
              <StepLabel>{label}</StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 3, mb: 3 }}>
        {getStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Indietro
        </Button>
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext}>
            Avanti
          </Button>
        ) : (
          <Button variant="contained">Salva fattura</Button>
        )}
      </Box>
    </Box>
  )
}