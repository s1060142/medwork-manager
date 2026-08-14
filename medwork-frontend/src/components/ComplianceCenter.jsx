import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { apiGet } from '../services/apiClient'

function ComplianceCenter() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await apiGet('/api/doctor-data/compliance-alerts')
        setAlerts(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Errore nel caricamento degli alert di compliance.')
      } finally {
        setLoading(false)
      }
    }
    loadAlerts()
  }, [])

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Compliance Operativa</Typography>
      
      <Alert severity="info" icon={<ErrorOutlineIcon />}>
        Questo modulo monitora in tempo reale anomalie operative e dati mancanti che potrebbero invalidare la conformità normativa della sorveglianza sanitaria.
      </Alert>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Alerts Rilevati ({alerts.length})
          </Typography>

          {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : alerts.length === 0 ? (
            <Alert severity="success">Nessuna anomalia rilevata. Ottimo lavoro!</Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell><strong>Gravità</strong></TableCell>
                    <TableCell><strong>Tipo Entità</strong></TableCell>
                    <TableCell><strong>Entità</strong></TableCell>
                    <TableCell><strong>Problema Rilevato</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts.map((row, index) => (
                    <TableRow key={`${row.entityType}-${row.entityId}-${index}`}>
                      <TableCell>
                        <Chip 
                          label={row.severity} 
                          color={row.severity === 'Critical' ? 'error' : 'warning'} 
                          size="small"
                          icon={row.severity === 'Critical' ? <ErrorOutlineIcon /> : <WarningAmberIcon />}
                        />
                      </TableCell>
                      <TableCell>{row.entityType}</TableCell>
                      <TableCell>{row.entityName} (ID: {row.entityId})</TableCell>
                      <TableCell>{row.alertMessage}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}

export default ComplianceCenter
