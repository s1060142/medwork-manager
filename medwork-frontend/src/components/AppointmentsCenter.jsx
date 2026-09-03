import { useState } from 'react'
import {
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
  Typography,
  Chip
} from '@mui/material'

function AppointmentsCenter({ activeCompanyId = '' }) {
  const appointments = [
    { id: 1, date: '15/09/2026', time: '10:00 - 12:00', company: 'ACME SpA', status: 'Booked', slots: '4/5' },
    { id: 2, date: '16/09/2026', time: '09:00 - 13:00', company: 'Beta Srl', status: 'Pending', slots: '0/8' },
    { id: 3, date: '20/09/2026', time: '14:00 - 18:00', company: 'Gamma Inc', status: 'Available', slots: '0/10' }
  ]

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Gestione Prenotazioni</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Slot disponibili e prenotazioni da parte delle aziende.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained">+ Nuovo Slot Disponibilità</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Orario</TableCell>
                <TableCell>Azienda Assegnata</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Slot Occupati</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><strong>{item.date}</strong></TableCell>
                  <TableCell>{item.time}</TableCell>
                  <TableCell>{item.company}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={item.status} 
                      color={item.status === 'Booked' ? 'success' : item.status === 'Pending' ? 'warning' : 'default'} 
                    />
                  </TableCell>
                  <TableCell>{item.slots}</TableCell>
                  <TableCell align="right">
                    <Button size="small">Gestisci</Button>
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

export default AppointmentsCenter
