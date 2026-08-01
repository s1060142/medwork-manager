import { useEffect, useState } from 'react'
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { apiGet } from '../services/apiClient'
import { format } from 'date-fns'

export default function HomeDashboard({ userName }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState({
    idonei: 0,
    parziali: 0,
    nonIdonei: 0,
    senzaIdoneita: 0,
  })

  useEffect(() => {
    apiGet('/api/master-data/employees')
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
        const counts = arr.reduce(
          (acc, e) => {
            if (!e.fitnessOutcome) acc.senzaIdoneita++
            else if (e.fitnessOutcome.includes('idoneo')) acc.idonei++
            else if (e.fitnessOutcome.includes('parzialmente')) acc.parziali++
            else acc.nonIdonei++
            return acc
          },
          { idonei: 0, parziali: 0, nonIdonei: 0, senzaIdoneita: 0 }
        )
        setStats(counts)
      })
      .catch(() => {})

    apiGet('/api/schedule/dashboard')
      .then(setActivities)
      .catch(() => setActivities([]))
  }, [])

  const categories = ['SCADENZE', 'FATTURE', 'PROTOCOLLI']

  return (
    <Box>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Benvenuto in Medwork, {userName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sei connesso da: 127.0.0.1 | Ultimo accesso: Oggi alle 12:15:33
        </Typography>
      </Paper>

      {/* Statistics */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Statistiche Lavoratori
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`Idonei: ${stats.idonei}`} color="success" />
          <Chip label={`Parzialmente idonei: ${stats.parziali}`} color="warning" />
          <Chip label={`Non idonei: ${stats.nonIdonei}`} color="error" />
          <Chip label={`Senza idoneità: ${stats.senzaIdoneita}`} />
        </Box>
      </Paper>

      {/* Le tue attività */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Le tue attività
        </Typography>
        {categories.map((cat) => (
          <Box key={cat} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {cat}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Descrizione</TableCell>
                    <TableCell>Azienda</TableCell>
                    <TableCell>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(activities.filter((a) => a.category === cat).slice(0, 3) || []).map(
                    (act, i) => (
                      <TableRow key={i}>
                        <TableCell>{act.title || 'Visita medica'}</TableCell>
                        <TableCell>{act.companyName || '-'}</TableCell>
                        <TableCell>{act.date ? format(new Date(act.date), 'dd/MM/yyyy') : '-'}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
      </Paper>
    </Box>
  )
}