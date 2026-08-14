import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Grid, Typography, CircularProgress, Alert } from '@mui/material'
import EventIcon from '@mui/icons-material/Event'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { apiGet } from '../services/apiClient'

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet('/api/doctor-data/dashboard')
      .then(data => {
        setSummary(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Errore nel caricamento della dashboard')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Il Mio Giorno</Typography>
      
      <Grid container spacing={3}>
        {/* Visite Oggi */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '6px solid #1976d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">
                    Visite in programma oggi
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {summary?.visitsToday || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Scadenze questa settimana */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '6px solid #ed6c02' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">
                    Scadenze (prossimi 7 gg)
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {summary?.deadlinesThisWeek || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Visite Overdue */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '6px solid #d32f2f' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">
                    Visite scadute
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {summary?.overdueVisits || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
