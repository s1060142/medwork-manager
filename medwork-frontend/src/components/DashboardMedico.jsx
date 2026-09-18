import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
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

export default function DashboardMedico({ onNewVisit }) {
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
    const toSign = all.filter((v) => !v.signed).length
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6">Dashboard Medico</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Sintesi real-time: scadenze, firme e anomalie dei protocolli.
            </Typography>
          </Box>
          {onNewVisit && (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={onNewVisit}
              size="small"
              sx={{ whiteSpace: 'nowrap' }}
            >
              Nuova visita
            </Button>
          )}
        </Box>

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
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>Visite con scadenza nei prossimi 7 giorni & Triage Clinico</Typography>
          <Chip size="small" label="Triage & Readiness Attivo" color="primary" variant="outlined" />
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Lavoratore</TableCell>
              <TableCell>Azienda</TableCell>
              <TableCell>Scadenza</TableCell>
              <TableCell>Readiness / Triage</TableCell>
              <TableCell>Stato Firma</TableCell>
              <TableCell align="right">Azione Clinica</TableCell>
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
                  <TableCell fontWeight={600}>{v.employeeFullName || `#${v.employeeId}`}</TableCell>
                  <TableCell>{v.companyName || '-'}</TableCell>
                  <TableCell>{new Date(v.nextDeadlineDate || v.visitDate).toLocaleDateString('it-IT')}</TableCell>
                  <TableCell>
                    {v.outcomeCode === 'NONIDONE0' ? (
                      <Chip size="small" label="🔴 Triage Prioritario" color="error" sx={{ fontWeight: 600 }} />
                    ) : v.isSigned ? (
                      <Chip size="small" label="🟢 Referti Completi & Firmato" color="success" />
                    ) : (
                      <Chip size="small" label="🟡 In Attesa Visita" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={v.isSigned ? 'Firmata' : 'Da completare'}
                      color={v.isSigned ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => onNewVisit && onNewVisit()}
                      sx={{ textTransform: 'none', fontWeight: 600, py: 0.5 }}
                    >
                      ⚡ Avvia Visita
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {visits.filter((v) => {
                const d = new Date(v.nextDeadlineDate || v.visitDate)
                const now = new Date()
                const in7 = new Date(now)
                in7.setDate(in7.getDate() + 7)
                return d >= now && d <= in7
              }).length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">Nessuna visita in scadenza nei prossimi 7 giorni.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Visite scadute ({overdue})</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Lavoratore</TableCell>
                <TableCell>Azienda</TableCell>
                <TableCell>Scaduta il</TableCell>
                <TableCell>Giudizio</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visits
                .filter((v) => new Date(v.nextDeadlineDate || v.visitDate) < new Date())
                .slice(0, 5)
                .map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell>{v.employeeFullName || `#${v.employeeId}`}</TableCell>
                    <TableCell>{v.companyName || '-'}</TableCell>
                    <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>
                      {new Date(v.nextDeadlineDate || v.visitDate).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell><Typography variant="caption">{v.outcome || '-'}</Typography></TableCell>
                  </TableRow>
                ))}
              {overdue === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="success.main">✓ Nessuna visita scaduta.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  )
}
