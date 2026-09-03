import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  Typography,
  Chip
} from '@mui/material'

function toDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleDateString('it-IT') : '-'
}

function AgendaCenter({ activeCompanyId = '' }) {
  const [loading, setLoading] = useState(false)
  
  // Dummy data for the prototype
  const agendaItems = [
    { id: 1, time: '09:00', type: 'Visita Medica', description: 'Mario Rossi - Periodica', location: 'ACME SpA', status: 'pending' },
    { id: 2, time: '11:00', type: 'Sopralluogo', description: 'Reparto Produzione', location: 'Beta Srl', status: 'pending' },
    { id: 3, time: '14:30', type: 'Visita Medica', description: 'Anna Bianchi - Preventiva', location: 'ACME SpA', status: 'pending' }
  ]

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Agenda Giornaliera</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Pianificazione oraria degli impegni e spostamenti.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField type="date" size="small" defaultValue={new Date().toISOString().split('T')[0]} />
            <Button variant="outlined">Oggi</Button>
            <Button variant="contained">Invia Morning Digest</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Orario</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Descrizione</TableCell>
                <TableCell>Luogo</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agendaItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><strong>{item.time}</strong></TableCell>
                  <TableCell>
                    <Chip size="small" label={item.type} color={item.type === 'Visita Medica' ? 'primary' : 'secondary'} />
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell align="right">
                    <Button size="small">Dettagli</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}

export default AgendaCenter
