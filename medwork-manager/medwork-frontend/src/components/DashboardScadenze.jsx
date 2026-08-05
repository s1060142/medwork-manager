import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import VaccinesIcon from '@mui/icons-material/Vaccines'
import BiotechIcon from '@mui/icons-material/Biotech'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import BusinessIcon from '@mui/icons-material/Business'
import GroupIcon from '@mui/icons-material/Group'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
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
  if (diffDays < 0) return { label: 'SCADUTO', color: 'error' }
  if (diffDays === 0) return { label: 'SCADUTO OGGI', color: 'error' }
  if (diffDays <= 5) return { label: 'IN SCADENZA', color: 'warning' }
  return { label: 'PROGRAMMATO', color: 'info' }
}

function safeList(data) {
  return Array.isArray(data) ? data : (data.items || [])
}

const PIE_COLORS = ['#2e7d32', '#1976d2', '#ed6c02', '#c62828']

export default function DashboardScadenze({ activeCompanyId = '', activeBranchId = '', onOpenMedicalVisitCreate, onOpenEmployeeCreate, onOpenReports }) {
  const [viewMode, setViewMode] = useState('aziende') // 'aziende' | 'lavoratori'
  const [expiringVisits, setExpiringVisits] = useState([])
  const [medicalVisits, setMedicalVisits] = useState([])
  const [employees, setEmployees] = useState([])
  const [visitExams, setVisitExams] = useState([])
  const [employeeRisks, setEmployeeRisks] = useState([])
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState('')
  const [days, setDays] = useState(90)
  const [search, setSearch] = useState('')
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'scaduto' | 'in_scadenza' | 'programmato'
  const exportOpen = Boolean(exportAnchorEl)

  const handleExportOpen = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const caricaScadenze = async () => {
    try {
      setCaricamento(true)
      setErrore('')

      const [expiring, visits, employeeList, exams, risks] = await Promise.all([
        apiGet(`/api/scadenzario?horizonDays=${days}`),
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
    return expiringVisits.filter((visit) => scopedVisitIds.has(Number(visit.medicalVisitId || visit.id)))
  }, [expiringVisits, scopedVisitIds])

  const scopedVisitExams = useMemo(() => {
    return visitExams.filter((exam) => scopedVisitIds.has(Number(exam.medicalVisitId)))
  }, [visitExams, scopedVisitIds])

  const scopedEmployeeRisks = useMemo(() => {
    return employeeRisks.filter((risk) => scopedEmployeeIds.has(Number(risk.employeeId)))
  }, [employeeRisks, scopedEmployeeIds])

  // For Aziende view - group by company
  const companyGroups = useMemo(() => {
    const groups = {}
    scopedExpiringVisits.forEach((visit) => {
      const companyName = visit.companyName || 'Sconosciuta'
      if (!groups[companyName]) {
        groups[companyName] = { items: [], totalAssessments: 0, totalEmployees: new Set() }
      }
      groups[companyName].items.push(visit)
      groups[companyName].totalAssessments++
      if (visit.employeeId) groups[companyName].totalEmployees.add(visit.employeeId)
    })
    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        assessments: data.totalAssessments,
        employees: data.totalEmployees.size,
        items: data.items,
        expanded: expandedRows.has(name),
      }))
      .sort((a, b) => b.assessments - a.assessments)
  }, [scopedExpiringVisits, expandedRows])

  // For Lavoratori view - individual worker rows
  const workerRows = useMemo(() => {
    const rows = scopedExpiringVisits.map((visit) => {
      const employee = employeeMap[Number(visit.employeeId)]
      return {
        id: visit.medicalVisitId || visit.id,
        employeeName: visit.employeeFullName || (employee ? `${employee.firstName} ${employee.lastName}` : 'Sconosciuto'),
        companyName: visit.companyName || 'Sconosciuta',
        nextDeadlineDate: visit.nextDeadlineDate || visit.DueDate,
        outcome: visit.outcome || visit.Severity,
        kind: visit.Kind || 'Visita',
        daysRemaining: visit.DaysRemaining ?? daysDiffFromToday(visit.nextDeadlineDate || visit.DueDate),
        severity: alertSeverityLabel(visit.DaysRemaining ?? daysDiffFromToday(visit.nextDeadlineDate || visit.DueDate)),
      }
    })
    
    if (filterStatus !== 'all') {
      const statusMap = {
        'scaduto': 'error',
        'in_scadenza': 'warning', 
        'programmato': 'info'
      }
      return rows.filter(r => r.severity.color === statusMap[filterStatus])
    }
    return rows.sort((a, b) => a.daysRemaining - b.daysRemaining)
  }, [scopedExpiringVisits, employeeMap, filterStatus])

  const outcomeChartData = useMemo(() => {
    const counts = scopedMedicalVisits.reduce((accumulator, visit) => {
      const key = visit.outcome || 'Senza esito'
      accumulator[key] = (accumulator[key] || 0) + 1
      return accumulator
    }, {})
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [scopedMedicalVisits])

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
    const vaccinePercent = Math.max(0, Math.min(100, medicalPercent))
    const safetyPercent = Math.max(0, Math.min(100, 70 + Math.round((scopedEmployeeRisks.length / totalEmployees) * 5)))

    return {
      vaccines: vaccinePercent,
      visits: medicalPercent,
      training: safetyPercent,
      global: Math.round((vaccinePercent + medicalPercent + safetyPercent) / 3),
    }
  }, [scopedEmployees, scopedMedicalVisits, scopedEmployeeRisks])

  const exportRows = useMemo(() => {
    const rows = viewMode === 'aziende' 
      ? companyGroups.flatMap(g => g.items.map(item => ({ ...item, companyGroup: g.name })))
      : workerRows
    return rows.map((visit) => ({
      employeeName: visit.employeeName || visit.employeeFullName || '-',
      companyName: visit.companyName || '-',
      nextDeadlineDate: formatDate(visit.nextDeadlineDate || visit.DueDate),
      outcome: visit.outcome || visit.Severity || '-',
      kind: visit.Kind || visit.kind || 'Visita',
      daysRemaining: visit.daysRemaining ?? visit.DaysRemaining ?? daysDiffFromToday(visit.nextDeadlineDate || visit.DueDate),
      severity: visit.severity?.label || alertSeverityLabel(visit.daysRemaining ?? visit.DaysRemaining ?? daysDiffFromToday(visit.nextDeadlineDate || visit.DueDate)).label,
    }))
  }, [companyGroups, workerRows, viewMode])

  const handleExportCsv = () => {
    exportToCsv(exportRows, ['employeeName', 'companyName', 'nextDeadlineDate', 'outcome', 'kind', 'daysRemaining', 'severity'], `scadenze-${viewMode}-${days}gg.csv`)
    handleExportClose()
  }

  const handleExportExcel = () => {
    exportToExcel([{ name: 'Scadenze', rows: exportRows, columns: ['employeeName', 'companyName', 'nextDeadlineDate', 'outcome', 'kind', 'daysRemaining', 'severity'] }], `scadenze-${viewMode}-${days}gg.xlsx`)
    handleExportClose()
  }

  const handleExportIcs = () => {
    const events = exportRows.map((row) => ({
      title: `Scadenza ${row.kind} - ${row.employeeName}`,
      start: row.nextDeadlineDate ? new Date(row.nextDeadlineDate) : new Date(),
      description: `Azienda: ${row.companyName} • Esito: ${row.outcome} • Tipo: ${row.kind} • ${row.severity}`,
      location: row.companyName,
    }))
    exportToIcs(events, `scadenze-${viewMode}-${days}gg.ics`)
    handleExportClose()
  }

  const toggleRowExpand = (name) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const kpiCards = [
    { title: 'Totale Aziende', value: companyGroups.length, subtitle: viewMode === 'aziende' ? 'con scadenze' : '', icon: <BusinessIcon color="primary" />, chipColor: 'primary', iconBg: 'primary' },
    { title: 'Totale Lavoratori', value: workerRows.length, subtitle: 'con scadenze', icon: <GroupIcon color="secondary" />, chipColor: 'secondary', iconBg: 'secondary' },
    { title: 'Scaduti', value: workerRows.filter(r => r.severity.color === 'error').length, subtitle: 'Critico', icon: <WarningAmberIcon color="error" />, chipColor: 'error', iconBg: 'error' },
    { title: 'In Scadenza (≤5gg)', value: workerRows.filter(r => r.severity.color === 'warning').length, subtitle: 'Urgente', icon: <MedicalServicesIcon color="warning" />, chipColor: 'warning', iconBg: 'warning' },
    { title: 'Programmati', value: workerRows.filter(r => r.severity.color === 'info').length, subtitle: 'In regola', icon: <CalendarMonthIcon color="info" />, chipColor: 'info', iconBg: 'info' },
  ]

  return (
    <Stack spacing={2}>
      {/* Header with View Toggle, Search and Quick Actions */}
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(event, newMode) => setViewMode(newMode)}
              size="small"
              aria-label="View mode"
            >
              <ToggleButton value="aziende" aria-label="Aziende">
                <BusinessIcon fontSize="small" sx={{ mr: 0.5 }} /> Aziende
              </ToggleButton>
              <ToggleButton value="lavoratori" aria-label="Lavoratori">
                <GroupIcon fontSize="small" sx={{ mr: 0.5 }} /> Lavoratori
              </ToggleButton>
            </ToggleButtonGroup>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="status-filter">Stato</InputLabel>
              <Select
                labelId="status-filter"
                value={filterStatus}
                label="Stato"
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <MenuItem value="all">Tutti</MenuItem>
                <MenuItem value="scaduto">Scaduto</MenuItem>
                <MenuItem value="in_scadenza">In scadenza</MenuItem>
                <MenuItem value="programmato">Programmato</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {[15, 30, 60, 90].map((value) => (
              <Button
                key={value}
                variant={days === value ? 'contained' : 'outlined'}
                onClick={() => setDays(value)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {value} gg
              </Button>
            ))}
            <Button variant="contained" onClick={caricaScadenze} startIcon={<span style={{fontSize: 18}}>⟳</span>}>
              Aggiorna
            </Button>
            <Button
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

        {/* Search */}
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca per Codice Fiscale o Nome Dipendente..."
          size="small"
          sx={{ width: '100%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {caricamento && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!!errore && <Alert severity="error">{errore}</Alert>}

      {!caricamento && !errore && workerRows.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="success.main">✅</Typography>
          <Typography variant="h6" gutterBottom>Nessuna scadenza imminente</Typography>
          <Typography variant="body2" color="text.secondary">
            Nessuna visita in scadenza nei prossimi {days} giorni per la vista {viewMode === 'aziende' ? 'Aziende' : 'Lavoratori'}.
          </Typography>
        </Paper>
      )}

      {!caricamento && !errore && (
        <>
          {/* KPI Cards Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 2 }}>
            {kpiCards.map((card) => (
              <Paper key={card.title} sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'action.hover' }}>{card.icon}</Box>
                </Box>
                <Typography variant="h4" sx={{ lineHeight: 1.1, fontWeight: 700 }}>{card.value}</Typography>
                <Typography variant="caption" color="text.secondary">{card.title}</Typography>
                {card.subtitle && <Typography variant="caption" color={card.chipColor + '.main'}>{card.subtitle}</Typography>}
              </Paper>
            ))}
          </Box>

          {/* Charts Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Esiti Visite Mediche</Typography>
              {outcomeChartData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nessun dato disponibile.</Typography>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={outcomeChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                    >
                      {outcomeChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                                        <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Compliance (%)</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { name: 'Vaccini', value: compliance.vaccines },
                  { name: 'Visite', value: compliance.visits },
                  { name: 'Sicurezza', value: compliance.training },
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                                    <Bar dataKey="value" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>

          {/* Main Data Table */}
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {viewMode === 'aziende' ? (
                    <>
                      <TableCell style={{ width: 40 }} />
                      <TableCell><strong>Azienda</strong></TableCell>
                      <TableCell align="right"><strong>Accertamenti</strong></TableCell>
                      <TableCell align="right"><strong>Dipendenti</strong></TableCell>
                      <TableCell><strong>Stato prevalente</strong></TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell><strong>Lavoratore</strong></TableCell>
                      <TableCell><strong>Azienda</strong></TableCell>
                      <TableCell><strong>Scadenza</strong></TableCell>
                      <TableCell><strong>Tipo</strong></TableCell>
                      <TableCell><strong>Esito</strong></TableCell>
                      <TableCell align="center"><strong>Stato</strong></TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {viewMode === 'aziende' ? (
                  companyGroups.map((group) => (
                    <>
                      <TableRow key={group.name} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleRowExpand(group.name)}
                            aria-expanded={group.expanded}
                            aria-controls={`panel-${group.name}`}
                          >
                            <ExpandMoreIcon style={{ transform: group.expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{group.name}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{group.assessments}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{group.employees}</Typography>
                        </TableCell>
                        <TableCell>
                          {group.items.length > 0 && (
                            <Chip
                              size="small"
                              color={alertSeverityLabel(Math.min(...group.items.map(i => i.DaysRemaining ?? daysDiffFromToday(i.nextDeadlineDate || i.DueDate)))).color}
                              label={group.items.some(i => (i.DaysRemaining ?? daysDiffFromToday(i.nextDeadlineDate || i.DueDate)) < 0) ? 'Scaduto' : 
                                    group.items.some(i => (i.DaysRemaining ?? daysDiffFromToday(i.nextDeadlineDate || i.DueDate)) <= 5) ? 'In scadenza' : 'Programmato'}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ padding: 0 }} colSpan={5}>
                          <TableRow key={`panel-${group.name}`} sx={{ display: group.expanded ? 'table-row' : 'none' }}>
                            <TableCell colSpan={5} style={{ padding: 0 }}>
                              <Box sx={{ bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0', p: 1 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell><strong>Lavoratore</strong></TableCell>
                                      <TableCell><strong>Scadenza</strong></TableCell>
                                      <TableCell><strong>Tipo</strong></TableCell>
                                      <TableCell><strong>Esito</strong></TableCell>
                                      <TableCell align="center"><strong>Stato</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {group.items.map((item) => (
                                      <TableRow key={item.medicalVisitId || item.id} hover>
                                        <TableCell>{item.employeeFullName || 'Sconosciuto'}</TableCell>
                                        <TableCell>{formatDate(item.nextDeadlineDate || item.DueDate)}</TableCell>
                                        <TableCell>{item.Kind || item.kind || 'Visita'}</TableCell>
                                        <TableCell>{item.outcome || item.Severity || '-'}</TableCell>
                                        <TableCell align="center">
                                          <Chip
                                            size="small"
                                            color={alertSeverityLabel(item.DaysRemaining ?? daysDiffFromToday(item.nextDeadlineDate || item.DueDate)).color}
                                            label={alertSeverityLabel(item.DaysRemaining ?? daysDiffFromToday(item.nextDeadlineDate || item.DueDate)).label}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            </TableCell>
                          </TableRow>
                        </TableCell>
                      </TableRow>
                    </>
                  ))
                ) : (
                  workerRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{row.companyName}</TableCell>
                      <TableCell>{formatDate(row.nextDeadlineDate)}</TableCell>
                      <TableCell>{row.kind}</TableCell>
                      <TableCell>{row.outcome || '-'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          color={row.severity.color}
                          label={row.severity.label}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {(viewMode === 'aziende' ? companyGroups.length : workerRows.length) === 0 && (
                  <TableRow>
                    <TableCell colSpan={viewMode === 'aziende' ? 5 : 6} align="center">
                      <Typography variant="body2" color="text.secondary">Nessun risultato per i filtri selezionati</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={viewMode === 'aziende' ? companyGroups.length : workerRows.length}
              rowsPerPage={15}
              page={0}
              onPageChange={() => {}}
            />
          </Paper>

          {/* Compliance Summary */}
          <Paper sx={{ p: 2, borderRadius: 3, mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Compliance Globale</Typography>
            <LinearProgress variant="determinate" value={compliance.global} sx={{ height: 12, borderRadius: 6, mb: 1.5 }} />
            <Typography variant="caption" color="text.secondary">Il {compliance.global}% dei dipendenti è in regola con le visite.</Typography>
            <Grid container spacing={2} sx={{ mt: 1.5 }}>
              <Grid item xs={4}>
                <Typography variant="body2">Vaccini</Typography>
                <Typography variant="h6" color={compliance.vaccines >= 80 ? 'success.main' : compliance.vaccines >= 60 ? 'warning.main' : 'error.main'}>{compliance.vaccines}%</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">Visite Mediche</Typography>
                <Typography variant="h6" color={compliance.visits >= 80 ? 'success.main' : compliance.visits >= 60 ? 'warning.main' : 'error.main'}>{compliance.visits}%</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">Corsi Sicurezza</Typography>
                <Typography variant="h6" color={compliance.training >= 80 ? 'success.main' : compliance.training >= 60 ? 'warning.main' : 'error.main'}>{compliance.training}%</Typography>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Stack>
  )
}