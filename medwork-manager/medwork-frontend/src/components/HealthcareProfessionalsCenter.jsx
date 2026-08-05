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
  TextField,
  Button,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { apiGet } from '../services/apiClient'

export default function HealthcareProfessionalsCenter() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiGet('/api/master-data/doctors')
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
        setDoctors(arr)
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = doctors.filter((d) => {
    const s = search.toLowerCase()
    return (
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(s) ||
      (d.specialty || '').toLowerCase().includes(s) ||
      (d.medicalLicenseNumber || '').toLowerCase().includes(s)
    )
  })

  if (loading) return <Box><Typography>Caricamento...</Typography></Box>

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Operatori sanitari
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="Medici: 0" color="primary" />
          <Chip label="Infermieri: 0" color="secondary" />
          <Chip label="Altro personale: 0" />
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Cerca operatore sanitario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <Button startIcon={<RefreshIcon />} size="small">
          Aggiorna
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cognome</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Specializzazione</TableCell>
              <TableCell>Numero albo</TableCell>
              <TableCell>Stato</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.lastName}</TableCell>
                <TableCell>{row.firstName}</TableCell>
                <TableCell>{row.specialty || '-'}</TableCell>
                <TableCell>{row.medicalLicenseNumber || '-'}</TableCell>
                <TableCell>
                  <Chip label="Attivo" size="small" color="success" />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nessun operatore trovato
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}