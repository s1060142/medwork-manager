import { useMemo, useState } from 'react'
import {
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { clearAuditEvents, readAuditEvents } from '../utils/auditTrail'

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

function AuditCenter() {
  const [events, setEvents] = useState(() => readAuditEvents())
  const [moduleFilter, setModuleFilter] = useState('')

  const modules = useMemo(() => {
    const unique = new Set(events.map((item) => item.module).filter(Boolean))
    return [...unique]
  }, [events])

  const filtered = useMemo(() => {
    if (!moduleFilter) return events
    return events.filter((item) => item.module === moduleFilter)
  }, [events, moduleFilter])

  const reload = () => setEvents(readAuditEvents())

  const clear = () => {
    clearAuditEvents()
    setEvents([])
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'center' }}>
          <BoxHeader />
          <Stack direction="row" spacing={1}>
            <TextField
              select
              size="small"
              label="Modulo"
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Tutti</MenuItem>
              {modules.map((module) => (
                <MenuItem key={module} value={module}>{module}</MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" onClick={reload}>Aggiorna</Button>
            <Button variant="outlined" color="error" onClick={clear}>Svuota</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data/Ora</TableCell>
              <TableCell>Modulo</TableCell>
              <TableCell>Azione</TableCell>
              <TableCell>Dettaglio</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((event) => (
              <TableRow key={event.id} hover>
                <TableCell>{formatDateTime(event.at)}</TableCell>
                <TableCell>{event.module || '-'}</TableCell>
                <TableCell>{event.action || '-'}</TableCell>
                <TableCell>{event.detail || '-'}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary">Nessun evento audit disponibile.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  )
}

function BoxHeader() {
  return (
    <div>
      <Typography variant="h6">Audit</Typography>
      <Typography variant="body2" color="text.secondary">Tracciabilità azioni utente su moduli clinici e amministrativi.</Typography>
    </div>
  )
}

export default AuditCenter
