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
  Menu,
  MenuItem,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import BoltIcon from '@mui/icons-material/Bolt'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import VaccinesIcon from '@mui/icons-material/Vaccines'
import BiotechIcon from '@mui/icons-material/Biotech'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { apiGet } from '../services/apiClient'
import { exportToCsv, exportToExcel, exportToIcs } from '../utils/exportUtils'

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
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  const handleExportOpen = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const buildColumns = () => [
    'employeeFullName',
    'companyName',
    'nextDeadlineDate',
    'outcome',
    'visitType',
  ]

  const exportRows = useMemo(
    () => scopedExpiringVisits.map((visit) => ({
      employeeFullName: visit.employeeFullName || '-',
      companyName: visit.companyName || '-',
      nextDeadlineDate: formatDate(visit.nextDeadlineDate),
      outcome: visit.outcome || '-',
      visitType: visit.visitType || '-',
    })),
    [scopedExpiringVisits],
  )

  const handleExportCsv = () => {
    exportToCsv(exportRows, buildColumns(), `scadenze-${days}gg.csv`)
    handleExportClose()
  }

  const handleExportExcel = () => {
    exportToExcel([{ name: 'Scadenze', rows: exportRows, columns: buildColumns() }], `scadenze-${days}gg.xlsx`)
    handleExportClose()
  }

  const handleExportIcs = () => {
    const events = exportRows.map((row) => ({
      title: `Scadenza visita - ${row.employeeFullName}`,
      start: row.nextDeadlineDate ? new Date(row.nextDeadlineDate) : new Date(),
      description: `Azienda: ${row.companyName} • Esito: ${row.outcome} • Tipo: ${row.visitType}`,
      location: row.companyName,
    }))
    exportToIcs(events, `scadenze-${days}gg.ics`)
    handleExportClose()
  }

  // Dati per i grafici (Cartsan: statistiche con grafici).
  const outcomeChartData = useMemo(() => {
    const counts = scopedMedicalVisits.reduce((accumulator, visit) => {
      const key = visit.outcome || 'Senza esito'
      accumulator[key] = (accumulator[key] || 0) + 1
      return accumulator
    }, {})
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [scopedMedicalVisits])

  const complianceChartData = useMemo(() => [
    { name: 'Vaccini', value: compliance.vaccines },
    { name: 'Visite', value: compliance.visits },
    { name: 'Sicurezza', value: compliance.training },
  ], [compliance])

  const PIE_COLORS = ['#2e7d32', '#1976d2', '#ed6c02']

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
      iconBg: 'primary',
    },
    {
      title: 'Vaccini Scaduti/In Scadenza',
      value: String(vaccineAtRisk).padStart(2, '0'),
      subtitle: 'Critico',
      icon: <VaccinesIcon fontSize="small" color="error" />,
      chipColor: 'error',
      iconBg: 'error',
    },
    {
      title: 'Esami in Scadenza',
      value: String(examCount).padStart(2, '0'),
      subtitle: 'A Presto',
      icon: <BiotechIcon fontSize="small" color="warning" />,
      chipColor: 'warning',
      iconBg: 'warning',
    },
    {
      title: 'Visite in Scadenza',
      value: String(scopedExpiringVisits.length).padStart(2, '0'),
      subtitle: 'Vedi tutti',
      icon: <MedicalServicesIcon fontSize="small" color="info" />,
      chipColor: 'info',
      iconBg: 'info',
    },
  ]

  return (
    <Stack spacing={2}>
      {/* Header with Search and Quick Actions */}
      <Paper className="modern-card" sx={{ p: 2, borderRadius: 3 }}>
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
            className="form-field-modern"
          />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {[15, 30, 60, 90].map((value) => (
              <Button key={value} 
                variant={days === value ? 'contained' : 'outlined'} 
                onClick={() => setDays(value)}
                className={days === value ? 'btn-primary-modern' : 'btn-secondary-modern'}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {value} gg
              </Button>
            ))}
            <Button className="btn-primary-modern" onClick={caricaScadenze} startIcon={<span style={{fontSize: 18}}>⟳</span>}>
              Aggiorna
            </Button>
            <Button
              className="btn-secondary-modern"
              onClick={handleExportOpen}
              startIcon={<FileDownloadIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Esporta
            </Button>
            <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={handleExportClose}>
              <MenuItem onClick={handleExportCsv}>Esporta CSV</MenuItem>
              <MenuItem onClick={handleExportExcel}>Esporta Excel (.xlsx)</MenuItem>
              <MenuItem onClick={handleExportIcs}>Esporta Calendario (.ics)</MenuItem>
            </Menu>
          </Stack>
        </Stack>
      </Paper>

      {caricamento && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!!errore && <Alert severity="error" className="animate-fade-in">{errore}</Alert>}

      {!caricamento && !errore && scopedExpiringVisits.length === 0 && (
        <div className="empty-state animate-fade-in" sx={{ py: 6 }}>
          <div className="empty-state-icon">✅</div>
          <Typography className="empty-state-title">Nessuna scadenza imminente</Typography>
          <Typography className="empty-state-text">Nessuna visita in scadenza nei prossimi {days} giorni.</Typography>
        </div>
      )}

      {!caricamento && !errore && (
        <>
          {/* KPI Cards Grid */}
          <div className="dashboard-grid" sx={{ mb: 2 }}>
            {kpiCards.map((card) => (
              <Paper key={card.title} className={`kpi-card kpi-card-${card.iconBg}`} sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: 'action.hover' }}>{card.icon}</Box>
                  <Chip label={card.subtitle} size="small" color={card.chipColor} variant="outlined" sx={{ height: 24, fontSize: 11 }} />
                </Stack>
                <Typography variant="caption" color="text.secondary">{card.title}</Typography>
                <Typography variant="h4" sx={{ lineHeight: 1.1, fontWeight: 700 }}>{card.value}</Typography>
              </Paper>
            ))}
          </div>

          {/* Grafici statistici (parità Cartsan: statistiche con grafici) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Paper className="modern-card" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Esiti Visite Mediche</Typography>
              {outcomeChartData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nessun dato disponibile.</Typography>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={outcomeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {outcomeChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Paper>

            <Paper className="modern-card" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Compliance (%)</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={complianceChartData}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>

          {/* Main Content Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2 }}>
            {/* Critical Alerts */}
            <Paper className="modern-card-elevated" sx={{ p: 2, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <WarningAmberIcon color="error" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Alert Critici & Scadenze</Typography>
                </Stack>
                <Button className="btn-secondary-modern" size="small" onClick={handleExportCsv}>Esporta Report</Button>
              </Stack>

              {criticalAlerts.length === 0 ? (
                <div className="empty-state" sx={{ py: 4 }}>
                  <div className="empty-state-icon">✅</div>
                  <Typography className="empty-state-title">Nessun alert critico</Typography>
                  <Typography className="empty-state-text">Tutto sotto controllo per il periodo selezionato.</Typography>
                </div>
              ) : (
                <List disablePadding>
                  {criticalAlerts.map((item) => (
                    <ListItem key={item.medicalVisitId} divider sx={{ px: 0, py: 1 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ fontWeight: 600 }}>{`${item.employeeFullName} (${item.companyName})`}</Typography>}
                        secondary={<Typography variant="body2" color="text.secondary">Scadenza: {formatDate(item.nextDeadlineDate)} • {item.outcome || 'Nessun esito'}</Typography>}
                      />
                      <Chip size="small" className={`status-chip status-chip-${item.severity.color}`} label={item.severity.label} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>

            {/* Quick Actions & Compliance */}
            <Stack spacing={2}>
              <Paper className="modern-card" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <BoltIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Quick Actions</Typography>
                </Stack>
                <Stack spacing={1}>
                  <Button className="btn-primary-modern" fullWidth onClick={onOpenMedicalVisitCreate} startIcon={<span style={{fontSize: 18}}>+</span>}>
                    Nuova Visita Medica
                  </Button>
                  <Button className="btn-secondary-modern" fullWidth onClick={onOpenEmployeeCreate} startIcon={<span style={{fontSize: 18}}>👤</span>}>
                    Aggiungi Dipendente
                  </Button>
                  <Button className="btn-secondary-modern" fullWidth onClick={caricaScadenze} startIcon={<span style={{fontSize: 18}}>💾</span>}>
                    Backup Dati Now
                  </Button>
                </Stack>
              </Paper>

              <Paper className="modern-card" sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Compliance Globale</Typography>
                <div className="progress-modern" sx={{ mb: 1.5 }}>
                  <div className="progress-modern-bar" style={{ width: `${compliance.global}%` }}></div>
                </div>
                <Typography variant="caption" color="text.secondary">Il {compliance.global}% dei dipendenti è in regola con le visite.</Typography>
                <Stack sx={{ mt: 1.5 }} spacing={0.6}>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Vaccini</Typography><Typography variant="body2" fontWeight={700} color={compliance.vaccines >= 80 ? 'success.main' : compliance.vaccines >= 60 ? 'warning.main' : 'error.main'}>{compliance.vaccines}%</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Visite Mediche</Typography><Typography variant="body2" fontWeight={700} color={compliance.visits >= 80 ? 'success.main' : compliance.visits >= 60 ? 'warning.main' : 'error.main'}>{compliance.visits}%</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Corsi Sicurezza</Typography><Typography variant="body2" fontWeight={700} color={compliance.training >= 80 ? 'success.main' : compliance.training >= 60 ? 'warning.main' : 'error.main'}>{compliance.training}%</Typography></Stack>
                </Stack>
              </Paper>
            </Stack>
          </Box>

          {/* Recent Appointments & Upcoming */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2 }}>
            <Paper className="modern-card-elevated" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Appuntamenti Recenti</Typography>
              <TableContainer className="modern-table-sticky">
                <Table className="modern-table" size="small" stickyHeader>
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
                          <Chip size="small" className={`status-chip status-chip-${appointment.status.color === 'success.main' ? 'success' : appointment.status.color === 'primary.main' ? 'info' : 'default'}`} label={appointment.status.label} variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper className="modern-card-gradient" sx={{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Prossimi 30 Giorni</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Pianificati {upcoming7 + scopedExpiringVisits.length} interventi medici tra visite ed esami.
                </Typography>
              </Box>
              <Button className="btn-secondary-modern" sx={{ mt: 1.5, alignSelf: 'flex-start' }} variant="text" onClick={onOpenReports}>Vedi Calendario Completo</Button>
            </Paper>
          </Box>
        </>
      )}
    </Stack>
  )
}

export default DashboardScadenze