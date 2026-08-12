import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { apiSend } from '../services/apiClient'

export default function AnalyticsCenter() {
  const [features, setFeatures] = useState({
    workerAge: 35, distanceKm: 12, dayOfWeek: 'Monday',
    pastNoShows: 1, pastAppointments: 10, isFirstVisit: false,
  })
  const [noShow, setNoShow] = useState(null)
  const [stopsText, setStopsText] = useState('1, 45.4, 9.1, 101\n2, 45.5, 9.2, 101\n3, 45.3, 9.3, 102')
  const [routes, setRoutes] = useState([])
  const [error, setError] = useState('')

  const runNoShow = async () => {
    try {
      const res = await apiSend('POST', '/api/analytics/no-show', {
        ...features,
        dayOfWeek: features.dayOfWeek,
      })
      setNoShow(res)
    } catch (e) { setError(e.message || 'Errore no-show.') }
  }

  const runRoutes = async () => {
    try {
      const stops = stopsText.split('\n').filter(Boolean).map((line) => {
        const [id, lat, lng, companyId] = line.split(',').map((s) => s.trim())
        return { id: Number(id), lat: Number(lat), lng: Number(lng), companyId: Number(companyId) }
      })
      const res = await apiSend('POST', '/api/analytics/optimize-routes', stops)
      setRoutes(Array.isArray(res) ? res : [])
    } catch (e) { setError(e.message || 'Errore routing.') }
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6">Analytics (FASE 4)</Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="subtitle1">No-Show Prediction</Typography>
        <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
          <Grid item xs={6} md={2}><TextField type="number" label="Età" size="small" fullWidth value={features.workerAge} onChange={(e) => setFeatures({ ...features, workerAge: Number(e.target.value) })} /></Grid>
          <Grid item xs={6} md={2}><TextField type="number" label="Distanza km" size="small" fullWidth value={features.distanceKm} onChange={(e) => setFeatures({ ...features, distanceKm: Number(e.target.value) })} /></Grid>
          <Grid item xs={6} md={2}><TextField select label="Giorno" size="small" fullWidth value={features.dayOfWeek} onChange={(e) => setFeatures({ ...features, dayOfWeek: e.target.value })}>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField></Grid>
          <Grid item xs={6} md={2}><TextField type="number" label="No-show passati" size="small" fullWidth value={features.pastNoShows} onChange={(e) => setFeatures({ ...features, pastNoShows: Number(e.target.value) })} /></Grid>
          <Grid item xs={6} md={2}><TextField type="number" label="App. totali" size="small" fullWidth value={features.pastAppointments} onChange={(e) => setFeatures({ ...features, pastAppointments: Number(e.target.value) })} /></Grid>
        </Grid>
        <Button variant="contained" sx={{ mt: 1.5 }} onClick={runNoShow}>Calcola probabilità</Button>
        {noShow && (
          <Alert severity={noShow.overbook ? 'warning' : 'success'} sx={{ mt: 1 }}>
            Probabilità no-show: {(noShow.probability * 100).toFixed(1)}% — {noShow.overbook ? 'Suggerito overbooking' : 'Nessun overbooking'}
          </Alert>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="subtitle1">Slot / Route Optimization</Typography>
        <TextField label="Fermate: id,lat,lng,companyId (una per riga)" multiline minRows={4} fullWidth size="small"
          value={stopsText} onChange={(e) => setStopsText(e.target.value)} sx={{ mt: 1 }} />
        <Button variant="outlined" sx={{ mt: 1 }} onClick={runRoutes}>Ottimizza per azienda</Button>
        {routes.map((r) => (
          <Paper key={r.companyId} variant="outlined" sx={{ p: 1, mt: 1 }}>
            <Typography variant="body2">Azienda #{r.companyId}: {r.orderedStopIds.join(' → ')} ({r.estimatedKm} km)</Typography>
          </Paper>
        ))}
      </Paper>

      {!!error && <Alert severity="warning">{error}</Alert>}
    </Stack>
  )
}
