import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material'
import { apiGet } from '../services/apiClient'

export default function ReportsCenter() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({})

  useEffect(() => {
    apiGet('/api/reports/dashboard-metrics')
      .then((data) => setMetrics(data))
      .catch(() => setMetrics({}))
      .finally(() => setLoading(false))
  }, [])

  const stats = metrics.percentuali || { idoneo: 89.2, parziale: 6.5, nonIdoneoTemp: 2.5, nonIdoneoPerm: 1.8 }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Reportistica e Statistiche
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Distribuzione Stati Lavoratori (2024)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 150, backgroundColor: 'success.light' }}>
            <CardContent>
              <Typography>Idoneo</Typography>
              <Chip label={`${stats.idoneo}%`} color="success" size="large" />
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 150, backgroundColor: 'warning.light' }}>
            <CardContent>
              <Typography>Parzialmente Idoneo</Typography>
              <Chip label={`${stats.parziale}%`} color="warning" size="large" />
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 150, backgroundColor: 'error.light' }}>
            <CardContent>
              <Typography>Non Idoneo</Typography>
              <Chip label={`${stats.nonIdoneoTemp}%`} color="error" size="large" />
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 150, backgroundColor: 'info.light' }}>
            <CardContent>
              <Typography>Senza Idoneità</Typography>
              <Chip label={`${stats.nonIdoneoPerm}%`} color="info" size="large" />
            </CardContent>
          </Card>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Trend Annuale (2015-2024)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Grafico a barre con attività annuali
        </Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report Dettagliati per Azienda
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Azienda</TableCell>
                <TableCell>Lavoratori</TableCell>
                <TableCell>Visite</TableCell>
                <TableCell>Fatture</TableCell>
                <TableCell>Stato</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Azienda 1</TableCell>
                <TableCell>150</TableCell>
                <TableCell>45</TableCell>
                <TableCell>12</TableCell>
                <TableCell><Chip label="Attivo" color="success" /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}