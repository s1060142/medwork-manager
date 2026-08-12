import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import DrawIcon from '@mui/icons-material/Draw'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { apiGet } from '../services/apiClient'

function MetricCard({ title, count, icon, color, subtitle }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderLeft: `4px solid ${color}` }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ color }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="text.secondary">{title}</Typography>
          <Typography variant="h4">{count}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Stack>
    </Paper>
  )
}

export default function DashboardMedico() {
  const [visits, setVisits] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiGet('/api/master-data/medical-visits').catch(() => []),
      apiGet('/api/master-data/medical-records').catch(() => []),
    ])
      .then(([visitData, recordData]) => {
        setVisits(Array.isArray(visitData) ? visitData : [])
        setRecords(Array.isArray(recordData) ? recordData : [])
      })
      .catch((err) => setError(err.message || 'Errore nel caricamento della dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  const { next7, overdue, toSign, anomalies } = useMemo(() => {
    const now = new Date()
    const in7 = new Date(now)
    in7.setDate(in7.getDate() + 7)

    const all = visits.map((v) => ({
      ...v,
      due: new Date(v.nextDeadlineDate || v.visitDate),
      signed: !!v.isSigned,
    }))

    const next7 = all.filter((v) => v.due >= now && v.due <= in7).length
    const overdue = all.filter((v) => v.due < now).length
    const toSign = all.filter((v) => v.due >= now && v.due <= in7 && !v.signed).length
    const anomalies = records.filter((r) => r.status === 'Anomalia' || r.status === 'Flagged').length

    return { next7, overdue, toSign, anomalies }
  }, [visits, records])

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 6 }}>
        <CircularProgress />
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6">Dashboard Medico</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Sintesi real-time: scadenze, firme e anomalie dei protocolli.
        </Typography>

        <Grid container spacing={1.5} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Prossime 7 giorni"
              count={next7}
              color="#1976d2"
              icon={<EventAvailableIcon />}
              subtitle="visite in scadenza"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Scaduti"
              count={overdue}
              color="#d32f2f"
              icon={<ErrorOutlineIcon />}
              subtitle="oltre la data"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Da firmare"
              count={toSign}
              color="#ed6c02"
              icon={<DrawIcon />}
              subtitle="entro 7 gg"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Anomalie protocolli"
              count={anomalies}
              color="#9c27b0"
              icon={<WarningAmberIcon />}
              subtitle="da rivedere"
            />
          </Grid>
        </Grid>

        {!!error && <Alert severity="warning" sx={{ mt: 1.5 }}>{error}</Alert>}
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Typography variant="subtitle1" sx={{ p: 2 }}>Visite in scadenza (prossime 7 giorni)</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Lavoratore</TableCell>
              <TableCell>Azienda</TableCell>
              <TableCell>Scadenza</TableCell>
              <TableCell>Stato</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visits
              .filter((v) => {
                const d = new Date(v.nextDeadlineDate || v.visitDate)
                const now = new Date()
                const in7 = new Date(now)
                in7.setDate(in7.getDate() + 7)
                return d >= now && d <= in7
              })
              .slice(0, 10)
              .map((v) => (
                <TableRow key={v.id} hover>
                  <TableCell>{`${v.employeeFirstName || ''} ${v.employeeLastName || ''}`.trim() || `#${v.employeeId}`}</TableCell>
                  <TableCell>{v.companyName || '-'}</TableCell>
                  <TableCell>{new Date(v.nextDeadlineDate || v.visitDate).toLocaleDateString('it-IT')}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={v.isSigned ? 'Firmata' : 'Da firmare'}
                      color={v.isSigned ? 'success' : 'warning'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            {visits.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary">Nessuna visita disponibile.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  )
}
