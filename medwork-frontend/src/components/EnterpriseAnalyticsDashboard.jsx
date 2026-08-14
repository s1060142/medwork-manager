import { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  Alert
} from '@mui/material'
import AssessmentIcon from '@mui/icons-material/Assessment'
import { apiGet } from '../services/apiClient'

// A simple bar/stat visualizer since we can't assume Chart.js is installed
function StatBox({ title, value, color = 'primary.main' }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>{title}</Typography>
        <Typography variant="h3" sx={{ color, fontWeight: 'bold' }}>{value}</Typography>
      </CardContent>
    </Card>
  )
}

function DistributionList({ title, data }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">{title}</Typography>
        {Object.entries(data).length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nessun dato disponibile.</Typography>
        ) : (
          <Box sx={{ mt: 2 }}>
            {Object.entries(data)
              .sort((a, b) => b[1] - a[1])
              .map(([key, val]) => (
                <Box key={key} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }} title={key}>{key}</Typography>
                    <Typography variant="body2" fontWeight="bold">{val}</Typography>
                  </Box>
                  <Box sx={{ width: '100%', bgcolor: 'action.hover', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ width: `${total > 0 ? (val / total) * 100 : 0}%`, bgcolor: 'primary.main', height: '100%' }} />
                  </Box>
                </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

function EnterpriseAnalyticsDashboard({ open, onClose, companyId, companyName }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !companyId) return

    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await apiGet(`/api/doctor-data/companies/${companyId}/analytics`)
        setData(result)
      } catch (err) {
        setError(err.message || 'Errore nel caricamento delle statistiche.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [open, companyId])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssessmentIcon color="primary" />
        Analytics Aziendali: {companyName}
      </DialogTitle>
      
      <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
        {loading ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : error ? (
           <Alert severity="error">{error}</Alert>
        ) : data ? (
          <Grid container spacing={3}>
            {/* Top Metrics */}
            <Grid item xs={12} md={3}>
              <StatBox title="Totale Visite" value={data.totalVisits} />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatBox title="Idonei (Pieni)" value={data.idoneiCount} color="success.main" />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatBox title="Idonei con Limitazioni" value={data.prescriptionsCount} color="warning.main" />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatBox title="Non Idonei" value={data.nonIdoneiCount} color="error.main" />
            </Grid>

            {/* Distributions */}
            <Grid item xs={12} md={6}>
              <DistributionList title="Fattori di Rischio (Prevalenza)" data={data.risksDistribution} />
            </Grid>
            <Grid item xs={12} md={6}>
              <DistributionList title="Visite per Mese (Ultimi trend)" data={data.visitsByMonth} />
            </Grid>
          </Grid>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">Chiudi</Button>
      </DialogActions>
    </Dialog>
  )
}

export default EnterpriseAnalyticsDashboard
