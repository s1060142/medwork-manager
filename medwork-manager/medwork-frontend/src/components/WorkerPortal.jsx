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
  Typography,
} from '@mui/material'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import EventIcon from '@mui/icons-material/Event'
import AssignmentIcon from '@mui/icons-material/Assignment'
import VaccinesIcon from '@mui/icons-material/Vaccines'
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

export default function WorkerPortal() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiGet('/api/portal/worker/dashboard')
      .then(setData)
      .catch((err) => setError(err.message || 'Errore nel caricamento del fascicolo.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
  }

  if (!data) return null

  const { Worker, MedicalRecord, Visits, LastVisit, Exams, Vaccinations } = data
  const fitness = classifyFitness(LastVisit?.outcome)

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        icon={HealthAndSafetyIcon}
        title="Portale Lavoratori"
        subtitle="Il tuo fascicolo sanitario elettronico"
        color="#00897b"
      />

      <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.dark', color: 'primary.contrastText' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid  size={{ xs: 12, md: 8 }}>
            <Typography variant="h5">
              {Worker.firstName} {Worker.lastName}
            </Typography>
            <Typography>Azienda: {Worker.companyName}</Typography>
            <Typography>Mansione: {Worker.jobRole}</Typography>
            <Typography>Codice Fiscale: {Worker.taxCode}</Typography>
          </Grid>
          <Grid  sx={{ textAlign: 'right' }} size={{ xs: 12, md: 4 }}>
            <Chip label={fitness.label} color={fitness.color} sx={{ fontSize: 16, p: 2 }} />
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Prossima scadenza: {formatDate(LastVisit?.nextDeadlineDate)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid  size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <EventIcon color="primary" />
                <Typography variant="h6">Visite Mediche</Typography>
              </Stack>
              {Visits?.length ? (
                Visits.map((v) => (
                  <Box key={v.id} sx={{ mb: 2 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="body2">Data: {formatDate(v.visitDate)}</Typography>
                    <Typography variant="body2">Tipo: {v.visitType}</Typography>
                    <Typography variant="body2">Esito: {v.outcome}</Typography>
                    {v.clinicalNotes && (
                      <Typography variant="body2" color="text.secondary">
                        Note: {v.clinicalNotes}
                      </Typography>
                    )}
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">Nessuna visita registrata.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid  size={{ xs: 12, md: 6 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <AssignmentIcon color="primary" />
                <Typography variant="h6">Cartella Sanitaria</Typography>
              </Stack>
              <Typography variant="body2">
                <strong>Anamnesi:</strong> {MedicalRecord?.medicalHistory || '-'}
              </Typography>
              <Typography variant="body2">
                <strong>Terapie in corso:</strong> {MedicalRecord?.currentTherapies || '-'}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <VaccinesIcon color="primary" />
                <Typography variant="h6">Vaccinazioni</Typography>
              </Stack>
              {Vaccinations?.length ? (
                Vaccinations.map((v) => (
                  <Typography key={v.id} variant="body2">
                    {v.vaccineName} - {formatDate(v.dateAdministered)}
                  </Typography>
                ))
              ) : (
                <Typography color="text.secondary">Nessuna vaccinazione registrata.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid  size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Esami / Accertamenti</Typography>
              {Exams?.length ? (
                Exams.map((e) => (
                  <Typography key={e.id} variant="body2">
                    {e.result}
                  </Typography>
                ))
              ) : (
                <Typography color="text.secondary">Nessun esame registrato.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        Puoi scaricare il tuo giudizio di idoneità e i referti direttamente dalla sezione Visite.
        I dati sono trattati nel rispetto del D.Lgs. 81/08 e del GDPR (art. 9).
      </Alert>
    </Box>
  )
}
