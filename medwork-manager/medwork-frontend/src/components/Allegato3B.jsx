import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  TextField,
  Typography,
} from '@mui/material'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PageHeader from './PageHeader'
import { apiGet } from '../services/apiClient'

export default function Allegato3B() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    setLoading(true)
    apiGet(`/api/portal/company/allegato-3b?year=${year}`)
      .then(setData)
      .catch((err) => setError(err.message || 'Errore nel calcolo dell\'Allegato 3B.'))
      .finally(() => setLoading(false))
  }, [year])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
  if (!data) return null

  const fitness = data.fitnessDistribution || {}
  const fitnessRows = Object.entries(fitness)

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        icon={AssessmentIcon}
        title="Allegato 3B"
        subtitle={`Dati aggregati sanitari e di rischio — ${data.Company?.name}`}
        color="#1976d2"
        actions={
          <TextField label="Anno" type="number" size="small" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        }
      />

      <Grid container spacing={3}>
        <Grid  size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3">{data.TotalWorkers}</Typography>
            <Typography>Lavoratori totali</Typography>
          </Paper>
        </Grid>
        <Grid  size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Distribuzione esiti idoneità</Typography>
              {fitnessRows.map(([k, v]) => (
                <Box key={k} sx={{ mb: 1 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">{k}</Typography>
                    <Typography variant="body2" fontWeight="bold">{v}</Typography>
                  </Stack>
                  <Divider />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid  size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Visite per tipologia ({data.ReferenceYear})</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tipologia</TableCell>
                    <TableCell align="right">N.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.visitsByType || []).map((r) => (
                    <TableRow key={r.type}>
                      <TableCell>{r.type}</TableCell>
                      <TableCell align="right">{r.count}</TableCell>
                    </TableRow>
                  ))}
                  {(!data.visitsByType || data.visitsByType.length === 0) && (
                    <TableRow><TableCell colSpan={2}>Nessun dato</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid  size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Esposizione a fattori di rischio</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Categoria (Allegato 3B)</TableCell>
                    <TableCell align="right">Esposti</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.riskExposureCategories || []).map((r) => (
                    <TableRow key={r.category}>
                      <TableCell>{r.category}</TableCell>
                      <TableCell align="right">{r.exposedWorkers}</TableCell>
                    </TableRow>
                  ))}
                  {(!data.riskExposureCategories || data.riskExposureCategories.length === 0) && (
                    <TableRow><TableCell colSpan={2}>Nessun rischio associato</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid  size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Scadenze visite (prossimi 90 gg)</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Lavoratore</TableCell>
                    <TableCell>Tipologia</TableCell>
                    <TableCell>Scadenza</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.expiringVisits || []).map((v, i) => (
                    <TableRow key={i}>
                      <TableCell>{v.employee}</TableCell>
                      <TableCell>{v.visitType}</TableCell>
                      <TableCell>{new Date(v.nextDeadlineDate).toLocaleDateString('it-IT')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button variant="contained" startIcon={<PictureAsPdfIcon />} href={`/api/documents/allegato-3b?year=${year}`}>
          Esporta PDF
        </Button>
        <Alert severity="info" sx={{ flex: 1 }}>
          {data.legend}
        </Alert>
      </Stack>
    </Box>
  )
}
