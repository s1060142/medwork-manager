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

function SiteVisitDeadlinesCenter({ activeCompanyId = '' }) {
  const siteVisits = [
    { id: 1, company: 'ACME SpA', branch: 'Sede Principale', lastVisit: '10/10/2025', frequency: 'Annuale', nextDue: '10/10/2026', status: 'Due Soon' },
    { id: 2, company: 'Beta Srl', branch: 'Magazzino Nord', lastVisit: '05/05/2024', frequency: 'Biennale', nextDue: '05/05/2026', status: 'Overdue' }
  ]

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Scadenzario Sopralluoghi</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Pianificazione ispezioni e sopralluoghi periodici.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained">Pianifica Sopralluogo</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Azienda</TableCell>
                <TableCell>Sede</TableCell>
                <TableCell>Ultimo Sopralluogo</TableCell>
                <TableCell>Frequenza</TableCell>
                <TableCell>Prossima Scadenza</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {siteVisits.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><strong>{item.company}</strong></TableCell>
                  <TableCell>{item.branch}</TableCell>
                  <TableCell>{item.lastVisit}</TableCell>
                  <TableCell>{item.frequency}</TableCell>
                  <TableCell>{item.nextDue}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={item.status} 
                      color={item.status === 'Overdue' ? 'error' : item.status === 'Due Soon' ? 'warning' : 'success'} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small">Compila Report</Button>
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

export default SiteVisitDeadlinesCenter
