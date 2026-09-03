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

function ActivityDeadlinesCenter({ activeCompanyId = '' }) {
  const activities = [
    { id: 1, type: 'Relazione Sanitaria Art. 40', company: 'ACME SpA', deadline: '28/02/2027', status: 'To Do' },
    { id: 2, type: 'Riunione Periodica Art. 35', company: 'Beta Srl', deadline: '15/10/2026', status: 'In Progress' },
    { id: 3, type: 'Aggiornamento DVR', company: 'Gamma Inc', deadline: '01/11/2026', status: 'To Do' }
  ]

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Scadenzario Attività Amministrative</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Monitoraggio delle relazioni annuali e riunioni periodiche.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained">Genera Bozze Art. 40</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tipo Attività</TableCell>
                <TableCell>Azienda</TableCell>
                <TableCell>Scadenza</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><strong>{item.type}</strong></TableCell>
                  <TableCell>{item.company}</TableCell>
                  <TableCell>{item.deadline}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={item.status} 
                      color={item.status === 'Done' ? 'success' : item.status === 'In Progress' ? 'primary' : 'default'} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small">Esegui</Button>
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

export default ActivityDeadlinesCenter
