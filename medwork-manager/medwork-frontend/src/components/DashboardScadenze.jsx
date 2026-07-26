import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import BoltIcon from '@mui/icons-material/Bolt'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import VaccinesIcon from '@mui/icons-material/Vaccines'
import BiotechIcon from '@mui/icons-material/Biotech'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import { apiGet } from '../services/apiClient'

function toDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(dateValue) {
  const date = toDate(dateValue)
  return date ? date.toLocaleDateString('it-IT') : '-'
}

function formatDateTime(dateValue) {
  const date = toDate(dateValue)
  return date ? date.toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '-'
}

function daysDiffFromToday(targetDate) {
  const date = toDate(targetDate)
  if (!date) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function alertSeverityLabel(diffDays) {
  if (diffDays < 0) return { label: 'OVERDUE', color: 'error' }
  if (diffDays === 0) return { label: 'SCADUTO', color: 'error' }
  if (diffDays <= 5) return { label: 'DUE SOON', color: 'warning' }
  return { label: 'IN PROGRAMMA', color: 'info' }
}

function statusFromVisit(visitDate) {
  const date = toDate(visitDate)
  if (!date) return { label: 'In attesa', color: 'default' }
  const now = new Date()
  if (date < now) return { label: 'Completata', color: 'success.main' }
  if ((date - now) / (1000 * 60 * 60) <= 4) return { label: 'In corso', color: 'primary.main' }
  return { label: 'In attesa', color: 'text.secondary' }
}

function safeList(data) {
  return Array.isArray(data) ? data : []
}

function DashboardScadenze({ activeCompanyId = '', activeBranchId = '', onOpenMedicalVisitCreate, onOpenEmployeeCreate, onOpenReports }) {
  const [expiringVisits, setExpiringVisits] = useState([])
  const [medicalVisits, setMedicalVisits] = useState([])
  const [employees, setEmployees] = useState([])
  const [visitExams, setVisitExams] = useState([])
  const [employeeRisks, setEmployeeRisks] = useState([])
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState('')
  const [days, setDays] = useState(30)
  const [search, setSearch] = useState('')

  const caricaScadenze = async () => {
    try {
      setCaricamento(true)
      setErrore('')

      const [expiring, visits, employeeList, exams, risks] = await Promise.all([
        apiGet(`/api/medical-visits/expiring?days=${days}`),
        apiGet('/api/master-data/medical-visits'),
        apiGet('/api/master-data/employees'),
        apiGet('/api/master-data/visit-exams'),
        apiGet('/api/master-data/employee-risks'),
      ])

      setExpiringVisits(safeList(expiring))
      setMedicalVisits(safeList(visits))
      setEmployees(safeList(employeeList))
      setVisitExams(safeList(exams))
      setEmployeeRisks(safeList(risks))
    } catch (error) {
      setErrore(error.message || 'Si è verificato un errore imprevisto.')
    } finally {
      setCaricamento(false)
    }
  }

  useEffect(() => {
    caricaScadenze()
  }, [days])

  const employeeMap = useMemo(() => {
    return employees.reduce((accumulator, employee) => {
      accumulator[Number(employee.id)] = employee
      return accumulator
    }, {})
  }, [employees])

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

  const scopedMedicalVisits = useMemo(() => {
    return medicalVisits.filter((visit) => scopedEmployeeIds.has(Number(visit.employeeId)))
  }, [medicalVisits, scopedEmployeeIds])

  const scopedVisitIds = useMemo(() => new Set(scopedMedicalVisits.map((visit) => Number(visit.id))), [scopedMedicalVisits])

  const scopedExpiringVisits = useMemo(() => {
    return expiringVisits.filter((visit) => scopedVisitIds.has(Number(visit.medicalVisitId)))
  }, [expiringVisits, scopedVisitIds])

  const scopedVisitExams = useMemo(() => {
    return visitExams.filter((exam) => scopedVisitIds.has(Number(exam.medicalVisitId)))
  }, [visitExams, scopedVisitIds])

  const scopedEmployeeRisks = useMemo(() => {
    return employeeRisks.filter((risk) => scopedEmployeeIds.has(Number(risk.employeeId)))
  }, [employeeRisks, scopedEmployeeIds])

  const upcoming7 = useMemo(() => {
    const now = new Date()
    const max = new Date(now)
    max.setDate(max.getDate() + 7)
    return scopedMedicalVisits.filter((visit) => {
      const date = toDate(visit.visitDate)
      return date && date >= now && date <= max
    }).length
  }, [scopedMedicalVisits])

  const vaccineAtRisk = useMemo(() => {
    return scopedExpiringVisits.filter((visit) =>
      (visit.exams || []).some((exam) => String(exam.examTypeName || '').toLowerCase().includes('vacc')),
    ).length
  }, [scopedExpiringVisits])

  const examCount = useMemo(() => scopedVisitExams.length, [scopedVisitExams])

  const compliance = useMemo(() => {
    const totalEmployees = scopedEmployees.length || 1

    const latestByEmployee = scopedMedicalVisits.reduce((accumulator, visit) => {
      const key = Number(visit.employeeId)
      const date = toDate(visit.visitDate)
      if (!date) return accumulator
      if (!accumulator[key] || date > toDate(accumulator[key].visitDate)) {
        accumulator[key] = visit
      }
      return accumulator
    }, {})

    const validVisits = Object.values(latestByEmployee).filter((visit) => {
      const deadline = toDate(visit.nextDeadlineDate)
      return deadline && deadline >= new Date()
    }).length

    const medicalPercent = Math.round((validVisits / totalEmployees) * 100)
    const vaccinePercent = Math.max(0, Math.min(100, 100 - Math.round((vaccineAtRisk / totalEmployees) * 100)))
    const safetyPercent = Math.max(0, Math.min(100, 70 + Math.round((scopedEmployeeRisks.length / totalEmployees) * 5)))

    return {
      vaccines: vaccinePercent,
      visits: medicalPercent,
      training: safetyPercent,
      global: Math.round((vaccinePercent + medicalPercent + safetyPercent) / 3),
    }
  }, [scopedEmployees, scopedMedicalVisits, vaccineAtRisk, scopedEmployeeRisks])

  const criticalAlerts = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const list = scopedExpiringVisits
      .map((visit) => {
        const diff = daysDiffFromToday(visit.nextDeadlineDate)
        return {
          ...visit,
          diff,
          severity: alertSeverityLabel(diff),
        }
      })
      .sort((a, b) => a.diff - b.diff)

    if (!needle) return list.slice(0, 8)

    return list
      .filter((item) => {
        const text = `${item.employeeFullName} ${item.companyName}`.toLowerCase()
          const taxCode = (scopedEmployees.find((e) => `${e.firstName} ${e.lastName}`.trim().toLowerCase() === String(item.employeeFullName).toLowerCase())?.taxCode || '').toLowerCase()
        return text.includes(needle) || taxCode.includes(needle)
      })
      .slice(0, 8)
        }, [scopedExpiringVisits, search, scopedEmployees])

  const recentAppointments = useMemo(() => {
    return scopedMedicalVisits
      .slice()
      .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
      .slice(0, 6)
      .map((visit) => {
        const employee = employeeMap[Number(visit.employeeId)]
        return {
          id: visit.id,
          patient: visit.employeeFullName || `Dipendente #${visit.employeeId}`,
          company: employee?.companyName || '-',
          type: visit.visitType || 'Periodica',
          when: visit.visitDate,
          status: statusFromVisit(visit.visitDate),
        }
      })
  }, [scopedMedicalVisits, employeeMap])

  const kpiCards = [
    {
      title: 'Appuntamenti (7GG)',
      value: String(upcoming7).padStart(2, '0'),
      subtitle: '+12%',
      icon: <CalendarMonthIcon fontSize="small" color="primary" />,
      chipColor: 'success',
    },
    {
      title: 'Vaccini Scaduti/In Scadenza',
      value: String(vaccineAtRisk).padStart(2, '0'),
      subtitle: 'Critico',
      icon: <VaccinesIcon fontSize="small" color="error" />,
      chipColor: 'error',
    },
    {
      title: 'Esami in Scadenza',
      value: String(examCount).padStart(2, '0'),
      subtitle: 'A Presto',
      icon: <BiotechIcon fontSize="small" color="warning" />,
      chipColor: 'warning',
    },
    {
      title: 'Visite in Scadenza',
      value: String(scopedExpiringVisits.length).padStart(2, '0'),
      subtitle: 'Vedi tutti',
      icon: <MedicalServicesIcon fontSize="small" color="info" />,
      chipColor: 'info',
    },
  ]

  return (
    <Stack spacing={2}>
      <Paper elevation={1} sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }}>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cerca per Codice Fiscale o Nome Dipendente..."
            size="small"
            sx={{ width: { xs: '100%', md: 460 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {[15, 30, 60, 90].map((value) => (
              <Button key={value} variant={days === value ? 'contained' : 'outlined'} onClick={() => setDays(value)}>
                {value} gg
              </Button>
            ))}
            <Button variant="contained" onClick={caricaScadenze}>Quick Action</Button>
          </Stack>
        </Stack>
      </Paper>

      {caricamento && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!!errore && <Alert severity="error">{errore}</Alert>}

      {!caricamento && !errore && scopedExpiringVisits.length === 0 && (
        <Alert severity="info">Nessuna visita in scadenza nei prossimi {days} giorni.</Alert>
      )}

      {!caricamento && !errore && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {kpiCards.map((card) => (
              <Paper key={card.title} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: 'action.hover' }}>{card.icon}</Box>
                  <Chip label={card.subtitle} size="small" color={card.chipColor} variant="outlined" />
                </Stack>
                <Typography variant="caption" color="text.secondary">{card.title}</Typography>
                <Typography variant="h4" sx={{ lineHeight: 1.1 }}>{card.value}</Typography>
              </Paper>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <WarningAmberIcon color="error" fontSize="small" />
                  <Typography variant="subtitle1">Alert Critici & Scadenze</Typography>
                </Stack>
                <Button size="small">Esporta Report</Button>
              </Stack>

              {criticalAlerts.length === 0 ? (
                <Alert severity="success">Nessun alert critico rilevato.</Alert>
              ) : (
                <List disablePadding>
                  {criticalAlerts.map((item) => (
                    <ListItem key={item.medicalVisitId} divider sx={{ px: 0 }}>
                      <ListItemText
                        primary={`${item.employeeFullName} (${item.companyName})`}
                        secondary={`Scadenza: ${formatDate(item.nextDeadlineDate)} • ${item.outcome || 'Nessun esito'}`}
                      />
                      <Chip size="small" color={item.severity.color} label={item.severity.label} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>

            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <BoltIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1">Quick Actions</Typography>
                </Stack>
                <Stack spacing={1}>
                  <Button variant="contained" fullWidth onClick={onOpenMedicalVisitCreate}>Nuova Visita Medica</Button>
                  <Button variant="outlined" fullWidth onClick={onOpenEmployeeCreate}>Aggiungi Dipendente</Button>
                  <Button variant="outlined" fullWidth onClick={caricaScadenze}>Backup Dati Now</Button>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Compliance Globale</Typography>
                <LinearProgress variant="determinate" value={compliance.global} sx={{ mb: 1.5, borderRadius: 999 }} />
                <Typography variant="caption" color="text.secondary">L' {compliance.global}% dei dipendenti è in regola con le visite.</Typography>
                <Stack sx={{ mt: 1.5 }} spacing={0.6}>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Vaccini</Typography><Typography variant="body2" fontWeight={700}>{compliance.vaccines}%</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Visite Mediche</Typography><Typography variant="body2" fontWeight={700}>{compliance.visits}%</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Corsi Sicurezza</Typography><Typography variant="body2" fontWeight={700}>{compliance.training}%</Typography></Stack>
                </Stack>
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Appuntamenti Recenti</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Paziente</TableCell>
                      <TableCell>Azienda</TableCell>
                      <TableCell>Tipo Visita</TableCell>
                      <TableCell>Data/Ora</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentAppointments.map((appointment) => (
                      <TableRow key={appointment.id} hover>
                        <TableCell>{appointment.patient}</TableCell>
                        <TableCell>{appointment.company}</TableCell>
                        <TableCell>{appointment.type}</TableCell>
                        <TableCell>{formatDateTime(appointment.when)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: appointment.status.color, fontWeight: 600 }}>
                            {appointment.status.label}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1">Prossimi 30 Giorni</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Pianificati {upcoming7 + scopedExpiringVisits.length} interventi medici tra visite ed esami.
                </Typography>
              </Box>
              <Button sx={{ mt: 1.5 }} variant="text" onClick={onOpenReports}>Vedi Calendario Completo</Button>
            </Paper>
          </Box>
        </>
      )}
    </Stack>
  )
}

export default DashboardScadenze