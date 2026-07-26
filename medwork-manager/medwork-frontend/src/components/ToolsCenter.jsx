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
  TextField,
  Typography,
} from '@mui/material'
import { apiGet } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'

const SIGNATURE_STORAGE_KEY = 'medwork.digital.signatures'

function readSignatures() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SIGNATURE_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSignatures(list) {
  localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify(list))
}

function ToolsCenter() {
  const [employees, setEmployees] = useState([])
  const [examTypes, setExamTypes] = useState([])
  const [visits, setVisits] = useState([])
  const [signatures, setSignatures] = useState(() => readSignatures())
  const [online, setOnline] = useState(() => navigator.onLine)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    employeeId: '',
    signer: '',
    note: '',
    method: 'digitale',
  })

  useEffect(() => {
    Promise.all([apiGet('/api/master-data/employees'), apiGet('/api/master-data/exam-types'), apiGet('/api/master-data/medical-visits')])
      .then(([employeeData, examData, visitData]) => {
        setEmployees(Array.isArray(employeeData) ? employeeData : [])
        setExamTypes(Array.isArray(examData) ? examData : [])
        setVisits(Array.isArray(visitData) ? visitData : [])
      })
      .catch((requestError) => setError(requestError.message || 'Errore nel caricamento strumenti diagnostici.'))

    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const diagnostics = useMemo(() => {
    const now = new Date()
    const next30 = new Date(now)
    next30.setDate(next30.getDate() + 30)

    const expiringVisits = visits.filter((visit) => {
      const date = new Date(visit.nextDeadlineDate)
      return !Number.isNaN(date.getTime()) && date >= now && date <= next30
    }).length

    return {
      employees: employees.length,
      examTypes: examTypes.length,
      expiringVisits,
    }
  }, [employees, examTypes, visits])

  const employeeMap = useMemo(
    () =>
      employees.reduce((accumulator, employee) => {
        accumulator[employee.id] = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || `Dipendente #${employee.id}`
        return accumulator
      }, {}),
    [employees],
  )

  const registerSignature = () => {
    if (!formData.employeeId || !formData.signer.trim()) return

    const next = [
      {
        id: `${Date.now()}`,
        ...formData,
        signedAt: new Date().toISOString(),
      },
      ...signatures,
    ]

    setSignatures(next)
    saveSignatures(next)
    appendAuditEvent({ module: 'Strumenti', action: 'Firma', detail: `${formData.method} - dipendente ${formData.employeeId}` })
    setFormData((current) => ({ ...current, employeeId: '', signer: '', note: '' }))
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6">Strumenti diagnostici e firma digitale</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Operatività diagnostica, acquisizione firma e stato accesso offline.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mt: 2 }}>
          <MetricCard title="Lavoratori" value={diagnostics.employees} />
          <MetricCard title="Tipi esame" value={diagnostics.examTypes} />
          <MetricCard title="Scadenze 30gg" value={diagnostics.expiringVisits} />
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">Stato rete</Typography>
            <Typography variant="h6">{online ? 'Online' : 'Offline'}</Typography>
            <Chip size="small" color={online ? 'success' : 'warning'} label={online ? 'Sincronizzato' : 'Cache locale attiva'} />
          </Paper>
        </Box>

        {!!error && <Alert severity="warning" sx={{ mt: 1.5 }}>{error}</Alert>}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="subtitle1">Acquisizione firma</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.2, mt: 1.2 }}>
          <TextField
            select
            size="small"
            label="Lavoratore"
            value={formData.employeeId}
            onChange={(event) => setFormData((current) => ({ ...current, employeeId: event.target.value }))}
          >
            <MenuItem value="">Seleziona</MenuItem>
            {employees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>{`${employee.firstName || ''} ${employee.lastName || ''}`.trim()}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Firmatario"
            value={formData.signer}
            onChange={(event) => setFormData((current) => ({ ...current, signer: event.target.value }))}
          />
          <TextField
            select
            size="small"
            label="Metodo"
            value={formData.method}
            onChange={(event) => setFormData((current) => ({ ...current, method: event.target.value }))}
          >
            <MenuItem value="digitale">Digitale</MenuItem>
            <MenuItem value="grafometrica">Grafometrica</MenuItem>
          </TextField>
          <Button variant="contained" onClick={registerSignature}>Registra firma</Button>
        </Box>
        <TextField
          size="small"
          fullWidth
          sx={{ mt: 1.2 }}
          label="Note"
          value={formData.note}
          onChange={(event) => setFormData((current) => ({ ...current, note: event.target.value }))}
        />
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data/Ora</TableCell>
              <TableCell>Lavoratore</TableCell>
              <TableCell>Firmatario</TableCell>
              <TableCell>Metodo</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {signatures.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{new Date(item.signedAt).toLocaleString('it-IT')}</TableCell>
                <TableCell>{employeeMap[item.employeeId] || `Dipendente #${item.employeeId}`}</TableCell>
                <TableCell>{item.signer}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{item.method}</TableCell>
                <TableCell>{item.note || '-'}</TableCell>
              </TableRow>
            ))}
            {signatures.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">Nessuna firma registrata.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  )
}

function MetricCard({ title, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="h6">{value}</Typography>
    </Paper>
  )
}

export default ToolsCenter
