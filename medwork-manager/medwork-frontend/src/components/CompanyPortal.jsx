import { useEffect, useState, useMemo } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
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
import BusinessIcon from '@mui/icons-material/Business'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import GroupIcon from '@mui/icons-material/Group'
import PageHeader from './PageHeader'
import { apiGet } from '../services/apiClient'

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('it-IT')
}

function classifyFitness(outcome) {
  const text = String(outcome || '').toLowerCase()
  if (text.includes('non idone')) return { label: 'Non idoneo', color: 'error' }
  if (text.includes('prescr') || text.includes('limit') || text.includes('parzial'))
    return { label: 'Idoneo con prescrizioni', color: 'warning' }
  if (text.includes('idone')) return { label: 'Idoneo', color: 'success' }
  return { label: 'Da classificare', color: 'default' }
}

export default function CompanyPortal() {
  const [dash, setDash] = useState(null)
  const [workers, setWorkers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiGet('/api/portal/company/dashboard'),
      apiGet('/api/portal/company/workers'),
    ])
      .then(([d, w]) => {
        setDash(d)
        setWorkers(Array.isArray(w) ? w : [])
      })
      .catch((err) => setError(err.message || 'Errore nel caricamento dei dati aziendali.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
  if (!dash) return null

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        icon={BusinessIcon}
        title="Portale Aziende"
        subtitle={`Sorveglianza Sanitaria — ${dash.Company?.name}`}
        color="#1976d2"
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid  size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <GroupIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h3">{dash.TotalWorkers}</Typography>
            <Typography>Lavoratori monitorati</Typography>
          </Paper>
        </Grid>
        <Grid  size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <EventBusyIcon color={dash.OverdueVisits > 0 ? 'error' : 'success'} sx={{ fontSize: 40 }} />
            <Typography variant="h3">{dash.OverdueVisits}</Typography>
            <Typography>Visite scadute</Typography>
          </Paper>
        </Grid>
        <Grid  size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3">{dash.ExpiringSoon?.length || 0}</Typography>
            <Typography>In scadenza (90 gg)</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid  size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Lavoratori e scadenze</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Lavoratore</TableCell>
                    <TableCell>Mansione</TableCell>
                    <TableCell>Ultima visita</TableCell>
                    <TableCell>Prossima scadenza</TableCell>
                    <TableCell>Esito</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workers.map((w) => {
                    const f = classifyFitness(w.lastOutcome)
                    return (
                      <TableRow key={w.id}>
                        <TableCell>{w.lastName} {w.firstName}</TableCell>
                        <TableCell>{w.jobRole}</TableCell>
                        <TableCell>{formatDate(w.lastVisit)}</TableCell>
                        <TableCell>{formatDate(w.nextDeadline)}</TableCell>
                        <TableCell><Chip size="small" label={f.label} color={f.color} /></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid  size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Scadenze imminenti</Typography>
              {dash.ExpiringSoon?.length ? (
                dash.ExpiringSoon.map((s, i) => (
                  <Box key={i} sx={{ mb: 1 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="body2">{s.employee}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.visitType} — {formatDate(s.nextDeadlineDate)}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">Nessuna scadenza imminente.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        Puoi scaricare i giudizi di idoneità in formato PDF dalla sezione Reportistica.
        Dati forniti ai sensi del D.Lgs. 81/08 (Sorveglianza Sanitaria).
      </Alert>
    </Box>
  )
}
