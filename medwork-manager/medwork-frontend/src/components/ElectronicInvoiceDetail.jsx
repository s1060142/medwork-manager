import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  CloudDownload as CloudDownloadIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
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

function parseLinesJson(json) {
  try {
    return JSON.parse(json || '[]')
  } catch {
    return []
  }
}

export default function ElectronicInvoiceDetail({ invoice, onClose, onSendToSdi, onCheckStatus, onDownloadXml }) {
  const [loading, setLoading] = useState(false)

  const handleSendToSdi = async () => {
    if (!invoice || !window.confirm('Inviare questa fattura al SDI?')) return
    
    setLoading(true)
    try {
      const result = await apiSend('POST', `/api/electronic-invoice/${invoice.id}/send`)
      if (result.success) {
        appendAuditEvent({ module: 'FatturazioneElettronica', action: 'SendToSdi', detail: `Fattura ${invoice.id} inviata a SDI` })
        alert(`Fattura inviata con successo! ID SDI: ${result.sdiIdentifier}`)
        if (onClose) onClose()
      } else {
        alert(`Errore: ${result.errorMessage}`)
      }
    } catch (err) {
      alert(`Errore: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    if (!invoice) return
    setLoading(true)
    try {
      const result = await apiSend('POST', `/api/electronic-invoice/${invoice.id}/check-status`)
      if (result.success) {
        appendAuditEvent({ module: 'FatturazioneElettronica', action: 'CheckSdiStatus', detail: `Stato fattura ${invoice.id}: ${result.status}` })
        alert(`Stato aggiornato: ${result.status}`)
        if (onClose) onClose()
      } else {
        alert(`Errore: ${result.errorMessage}`)
      }
    } catch (err) {
      alert(`Errore: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadXml = async () => {
    if (!invoice) return
    try {
      const xml = await apiGet(`/api/electronic-invoice/${invoice.id}/xml`)
      const blob = new Blob([xml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `IT${invoice.id}_${new Date().getFullYear()}.xml`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Errore download: ${err.message}`)
    }
  }

  function formatDate(value) {
    if (!value) return '-'
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('it-IT')
  }

  function formatCurrency(value) {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
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

  function parseLinesJson(json) {
    try {
      return JSON.parse(json || '[]')
    } catch {
      return []
    }
  }

  if (!invoice) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Dettaglio Fattura</Typography>
        <Alert severity="info">Nessuna fattura selezionata</Alert>
      </Container>
    )
  }

  const lines = parseLinesJson(invoice.linesJson)

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2} direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Fattura {invoice.number}/{invoice.year}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {invoice.recipientName} - {getDocTypeLabel(invoice.documentType)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Chiudi">
            <IconButton onClick={onClose} aria-label="chiudi">
              <CloseIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download XML">
            <IconButton onClick={onDownloadXml || (() => {})} color="primary">
              <DescriptionIcon />
            </IconButton>
          </Tooltip>
          {invoice.status === 'Bozza' && (
            <Tooltip title="Invia a SDI">
              <Button 
                variant="contained" 
                startIcon={<SendIcon />} 
                onClick={() => {}}
                disabled={true}
              >
                Invia a SDI
              </Button>
            </Tooltip>
          )}
          {invoice.sdiIdentifier && invoice.status === 'Inviata' && (
            <Tooltip title="Verifica stato SDI">
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />} 
                onClick={() => {}}
                disabled={true}
              >
                Verifica Stato
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Download XML">
            <IconButton onClick={onDownloadXml} color="primary">
              <DescriptionIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Numero</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{invoice.number}/{invoice.year}</Typography>
        </Grid>
        <Grid size={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Data Emissione</Typography>
          <Typography>{formatDate(invoice.issueDate)}</Typography>
        </Grid>
        <Grid size={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Tipo Documento</Typography>
          <Typography>{getDocTypeLabel(invoice.documentType)}</Typography>
        </Grid>
        <Grid size={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Stato</Typography>
          <Chip label={invoice.status} color={getStatusColor(invoice.status)} size="small" />
        </Grid>
        <Grid size={12} sm={6}>
          <Typography variant="body2" color="text.secondary">ID SDI</Typography>
          <Typography>{invoice.sdiIdentifier || '-'}</Typography>
        </Grid>
        <Grid size={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Codice Destinatario</Typography>
          <Typography>{invoice.recipientCode || '-'}</Typography>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Destinatario</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{invoice.recipientName}</Typography>
          <Typography variant="body2">P.IVA: {invoice.recipientVatNumber || '-'}</Typography>
          <Typography variant="body2">CF: {invoice.recipientTaxCode || '-'}</Typography>
        </Grid>
        <Grid size={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Codice Destinatario</Typography>
          <Typography>{invoice.recipientCode || '0000000'}</Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>Righe Fattura</Typography>
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
            {lines.map((line, idx) => (
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

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2} direction="row-reverse">
        <Grid size={12} sm={4}>
          <Typography variant="body2" color="text.secondary">Imponibile</Typography>
          <Typography variant="h6">{formatCurrency(invoice.taxableAmount)}</Typography>
        </Grid>
        <Grid size={12} sm={4}>
          <Typography variant="body2" color="text.secondary">IVA</Typography>
          <Typography variant="h6">{formatCurrency(invoice.vatAmount)}</Typography>
        </Grid>
        <Grid size={12} sm={4}>
          <Typography variant="body2" color="text.secondary">Totale</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(invoice.totalAmount)}</Typography>
        </Grid>
      </Grid>

      {invoice.sdiIdentifier && (
        <>
          <Divider sx={{ my: 2 }} />
          <Paper sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.main" gutterBottom>
              <strong>Informazioni SDI:</strong>
            </Typography>
            <Typography variant="body2">ID SDI: {invoice.sdiIdentifier}</Typography>
            <Typography variant="body2">File: {invoice.sdiFileName || '-'}</Typography>
            <Typography variant="body2">Inviato: {formatDate(invoice.sdiSentAt)}</Typography>
            <Typography variant="body2">Risposta: {formatDate(invoice.sdiResponseAt)}</Typography>
            {invoice.sdiResultCode && (
              <Typography variant="body2">Codice: {invoice.sdiResultCode} - {invoice.sdiResultDescription || '-'}</Typography>
            )}
          </Paper>
        </>
      )}
    </Container>
  )
}