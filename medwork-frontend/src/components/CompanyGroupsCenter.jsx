import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  InputAdornment,
  LinearProgress,
} from '@mui/material'
import EventIcon from '@mui/icons-material/Event'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { apiGet } from '../services/apiClient'

function CompanyGroupsCenter() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)

  useEffect(() => {
    apiGet('/api/doctor-data/company-groups')
      .then(data => {
        setSummary(data.summary)
        setGroups(data.groups)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Errore nel caricamento dei gruppi aziendali')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!summary && groups.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Nessun gruppo aziendale trovato
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Gruppi Aziendali
      </Typography>

      {/* Summary KPIs row */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '6px solid #1976d2' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EventIcon color="primary" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography color="text.secondary" variant="subtitle2">
                      Gruppi Totali
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {summary.totalGroups}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '6px solid #2e7d32' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircleIcon color="primary" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography color="text.secondary" variant="subtitle2">
                      Aziende Attive
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {summary.activeCompanies}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '6px solid #f57c00' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WarningIcon color="primary" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography color="text.secondary" variant="subtitle2">
                      Scadenze Vicine
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {summary.upcomingDeadlines}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '6px solid #d32f2f' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EventIcon color="primary" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography color="text.secondary" variant="subtitle2">
                      Vaccinazioni In corso
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {summary.activeVaccinations}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Groups list table */}
      {groups.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            Elenco Gruppi
          </Typography>
          <Table size="small" aria-label="company groups table">
            <TableHead>
              <TableRow>
                <TableCell>Nome Gruppo</TableCell>
                <TableCell>Aziende</TableCell>
                <TableCell>Protocollo Attivi</TableCell>
                <TableCell>Scadenze</TableCell>
                <TableCell>Ultima Modifica</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id} sx={{ borderBottom: '1px solid #e0e0e0' }}>
                  <TableCell component="td" sx={{ fontWeight: 500 }}>
                    {group.name}
                  </TableCell>
                  <TableCell>{group.companyCount}</TableCell>
                  <TableCell>{group.activeProtocols}</TableCell>
                  <TableCell>{group.dueVisits}</TableCell>
                  <TableCell>
                    <Typography color="text.secondity" variant="caption">
                      {group.lastModified || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Empty state */}
      {!summary && groups.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Clicca su "Crea Gruppo Aziendale" per iniziare
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default CompanyGroupsCenter