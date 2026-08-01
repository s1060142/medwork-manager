import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
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
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'

function toDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleDateString('it-IT') : '-'
}

function addDays(fromDate, days) {
  const date = new Date(fromDate)
  date.setDate(date.getDate() + days)
  return date
}

function VisitPlanningCenter({ activeCompanyId = '', activeBranchId = '', onOpenMedicalVisitCreate }) {
  const [days, setDays] = useState(45)
  const [visits, setVisits] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      setSaveMessage('')

      const [visitData, employeeData] = await Promise.all([
        apiGet('/api/master-data/medical-visits'),
        apiGet('/api/master-data/employees'),
      ])

      setVisits(Array.isArray(visitData) ? visitData : [])
      setEmployees(Array.isArray(employeeData) ? employeeData : [])
    } catch (requestError) {
      setError(requestError.message || 'Errore nel caricamento della pianificazione visite.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const latestVisitsByEmployee = useMemo(() => {
    return visits.reduce((accumulator, item) => {
      const key = Number(item.employeeId)
      const date = toDate(item.visitDate)
      if (!date) return accumulator
      if (!accumulator[key] || date > toDate(accumulator[key].visitDate)) {
        accumulator[key] = item
      }
      return accumulator
    }, {})
  }, [visits])

  const scopedEmployees = useMemo(() => {
    return employees.filter((item) => {
      if (activeCompanyId && activeCompanyId !== 'all' && Number(item.companyId) !== Number(activeCompanyId)) {
        return false
      }

      if (activeBranchId && activeBranchId !== 'all' && Number(item.branchId) !== Number(activeBranchId)) {
        return false
      }

      return true
    })
  }, [employees, activeCompanyId, activeBranchId])

  const scopedEmployeeIds = useMemo(() => new Set(scopedEmployees.map((item) => Number(item.id))), [scopedEmployees])

  const scopedLatestVisits = useMemo(() => {
    return Object.fromEntries(
      Object.entries(latestVisitsByEmployee).filter(([employeeId]) => scopedEmployeeIds.has(Number(employeeId))),
    )
  }, [latestVisitsByEmployee, scopedEmployeeIds])

  const planRows = useMemo(() => {
    const now = new Date()
    const max = new Date(now)
    max.setDate(max.getDate() + days)

    return Object.values(scopedLatestVisits)
      .filter((visit) => {
        const deadline = toDate(visit.nextDeadlineDate)
        return deadline && deadline <= max
      })
      .map((visit) => {
        const deadline = toDate(visit.nextDeadlineDate)
        const suggestedDate = addDays(deadline || now, -3)

        return {
          employeeId: visit.employeeId,
          employeeFullName: visit.employeeFullName,
          companyName: scopedEmployees.find((x) => Number(x.id) === Number(visit.employeeId))?.companyName || '-',
          visitType: visit.visitType || 'Periodic',
          deadline: visit.nextDeadlineDate,
          suggestedDate,
          suggestedDoctorName: 'Medico competente',
        }
      })
      .sort((left, right) => new Date(left.deadline) - new Date(right.deadline))
  }, [scopedLatestVisits, days, scopedEmployees])

  const sendConvocation = async (row) => {
    try {
      setSaveMessage('')
      await apiSend('POST', '/api/doctor-data/convocations', {
        employeeId: row.employeeId,
        channel: 'Email',
        messageText: `Convocazione visita ${row.visitType} per ${row.employeeFullName}. Data proposta: ${formatDate(row.suggestedDate)} con il medico competente.`,
      })
      setSaveMessage(`Convocazione registrata per ${row.employeeFullName}.`)
    } catch (requestError) {
      setError(requestError.message || 'Errore durante la convocazione.')
    }
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Pianificazione Visite</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Incrocio automatico tra scadenze lavoratori e agenda del medico competente.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <TextField
              select
              size="small"
              label="Orizzonte"
              value={days}
              onChange={(event) => setDays(Number(event.target.value) || 45)}
              sx={{ minWidth: 140 }}
            >
              {[15, 30, 45, 60, 90].map((value) => (
                <MenuItem key={value} value={value}>{value} giorni</MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" onClick={load}>Aggiorna</Button>
            <Button variant="contained" onClick={onOpenMedicalVisitCreate}>Nuova visita</Button>
          </Stack>
        </Stack>
      </Paper>

      {!!error && <Alert severity="error">{error}</Alert>}
      {!!saveMessage && <Alert severity="success">{saveMessage}</Alert>}
      {loading && <Alert severity="info">Caricamento pianificazione in corso...</Alert>}

      {!loading && !error && (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                <TableCell>Lavoratore</TableCell>
                <TableCell>Azienda</TableCell>
                <TableCell>Scadenza</TableCell>
                <TableCell>Tipo visita</TableCell>
                <TableCell>Medico suggerito</TableCell>
                <TableCell>Data proposta</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {planRows.map((row) => (
                <TableRow key={`${row.employeeId}-${row.deadline}`} hover>
                  <TableCell>{row.employeeFullName}</TableCell>
                  <TableCell>{row.companyName}</TableCell>
                  <TableCell>
                    <Chip size="small" color="warning" label={formatDate(row.deadline)} variant="outlined" />
                  </TableCell>
                  <TableCell>{row.visitType}</TableCell>
                  <TableCell>{row.suggestedDoctorName}</TableCell>
                  <TableCell>{formatDate(row.suggestedDate)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => sendConvocation(row)}>
                      Convoca
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {planRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary">Nessuna scadenza entro l'orizzonte selezionato.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </TableContainer>
        </Paper>
      )}
    </Stack>
  )
}

export default VisitPlanningCenter
