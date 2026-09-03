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

function NominationsDeadlinesCenter({ activeCompanyId = '' }) {
  const nominations = [
    { id: 1, company: 'ACME SpA', role: 'Addetto Antincendio', worker: 'Mario Rossi', certExpiration: '12/12/2026', status: 'Valid' },
    { id: 2, company: 'Beta Srl', role: 'Addetto Primo Soccorso', worker: 'Anna Bianchi', certExpiration: '01/05/2026', status: 'Expired' },
    { id: 3, company: 'Gamma Inc', role: 'RLS', worker: 'Carlo Verdi', certExpiration: '30/11/2026', status: 'Due Soon' }
  ]

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Scadenzario Nomine e Formazione</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Monitoraggio delle scadenze per i ruoli della sicurezza (RSPP, RLS, Antincendio).
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained">Richiedi Aggiornamento a HR</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Azienda</TableCell>
                <TableCell>Ruolo</TableCell>
                <TableCell>Lavoratore Nominato</TableCell>
                <TableCell>Scadenza Certificato</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nominations.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><strong>{item.company}</strong></TableCell>
                  <TableCell>{item.role}</TableCell>
                  <TableCell>{item.worker}</TableCell>
                  <TableCell>{item.certExpiration}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={item.status} 
                      color={item.status === 'Expired' ? 'error' : item.status === 'Due Soon' ? 'warning' : 'success'} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small">Modifica</Button>
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

export default NominationsDeadlinesCenter
