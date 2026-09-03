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

function VaccinationDeadlinesCenter({ activeCompanyId = '' }) {
  const vaccinations = [
    { id: 1, company: 'ACME SpA', worker: 'Mario Rossi', vaccine: 'Antitetanica', deadline: '15/10/2026', status: 'Due Soon' },
    { id: 2, company: 'Beta Srl', worker: 'Anna Bianchi', vaccine: 'Epatite B', deadline: '01/01/2025', status: 'Missing' },
    { id: 3, company: 'Gamma Inc', worker: 'Carlo Verdi', vaccine: 'Antitetanica', deadline: '10/08/2028', status: 'Valid' }
  ]

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Scadenzario Vaccinazioni</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Monitoraggio richiami e vaccinazioni obbligatorie per protocollo.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained">Pianifica Campagna Vaccinale</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Azienda</TableCell>
                <TableCell>Lavoratore</TableCell>
                <TableCell>Vaccino</TableCell>
                <TableCell>Scadenza</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vaccinations.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><strong>{item.company}</strong></TableCell>
                  <TableCell>{item.worker}</TableCell>
                  <TableCell>{item.vaccine}</TableCell>
                  <TableCell>{item.deadline}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={item.status} 
                      color={item.status === 'Missing' ? 'error' : item.status === 'Due Soon' ? 'warning' : 'success'} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small">Registra Somministrazione</Button>
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

export default VaccinationDeadlinesCenter
