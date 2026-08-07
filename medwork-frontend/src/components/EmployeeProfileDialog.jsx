import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import BiotechIcon from '@mui/icons-material/Biotech'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import jsPDF from 'jspdf'
import { apiGet } from '../services/apiClient'

function toDate(value) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function daysFromNow(dateValue) {
  const date = toDate(dateValue)
  if (!date) return null
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.ceil((target - start) / (1000 * 60 * 60 * 24))
}

function formatDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleDateString('it-IT') : '-'
}

function EmployeeProfileDialog({ open, onClose, employee, onEditEmployee }) {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [visits, setVisits] = useState([])
  const [visitExams, setVisitExams] = useState([])
  const [employeeRisks, setEmployeeRisks] = useState([])
  const [riskFactors, setRiskFactors] = useState([])

  useEffect(() => {
    if (!open || !employee?.id) return

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [allVisits, allExams, allEmployeeRisks, allRiskFactors] = await Promise.all([
          apiGet('/api/master-data/medical-visits'),
          apiGet('/api/master-data/visit-exams'),
          apiGet('/api/master-data/employee-risks'),
          apiGet('/api/master-data/risk-factors'),
        ])

        setVisits((Array.isArray(allVisits) ? allVisits : []).filter((item) => Number(item.employeeId) === Number(employee.id)))
        setEmployeeRisks((Array.isArray(allEmployeeRisks) ? allEmployeeRisks : []).filter((item) => Number(item.employeeId) === Number(employee.id)))
        setRiskFactors(Array.isArray(allRiskFactors) ? allRiskFactors : [])

        const employeeVisitIds = new Set(
          (Array.isArray(allVisits) ? allVisits : [])
            .filter((item) => Number(item.employeeId) === Number(employee.id))
            .map((item) => Number(item.id)),
        )

        setVisitExams(
          (Array.isArray(allExams) ? allExams : []).filter((item) => employeeVisitIds.has(Number(item.medicalVisitId))),
        )
      } catch (requestError) {
        setError(requestError.message || 'Errore nel caricamento del profilo dipendente.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [open, employee])

  const sortedVisits = useMemo(() => {
    return visits
      .slice()
      .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
  }, [visits])

  const latestVisit = sortedVisits[0]
  const daysToDeadline = daysFromNow(latestVisit?.nextDeadlineDate)

  const healthStatus = useMemo(() => {
    if (!latestVisit) return { label: 'Nessuna visita', color: 'default' }
    if (daysToDeadline !== null && daysToDeadline < 0) return { label: 'Scaduta', color: 'error' }
    if (daysToDeadline !== null && daysToDeadline <= 15) return { label: 'In Scadenza', color: 'warning' }
    return { label: 'Fit for Duty', color: 'success' }
  }, [latestVisit, daysToDeadline])

  const risksWithSeverity = useMemo(() => {
    const severityById = riskFactors.reduce((accumulator, item) => {
      accumulator[Number(item.id)] = Number(item.severityLevel) || 1
      return accumulator
    }, {})

    return employeeRisks
      .map((risk) => ({
        ...risk,
        severityLevel: severityById[Number(risk.riskFactorId)] || 1,
      }))
      .sort((a, b) => b.severityLevel - a.severityLevel)
  }, [employeeRisks, riskFactors])

  const complianceRate = useMemo(() => {
    if (!latestVisit) return 0
    if (daysToDeadline === null) return 0
    if (daysToDeadline < 0) return 45
    if (daysToDeadline <= 15) return 72
    return 96
  }, [latestVisit, daysToDeadline])

  const initials = `${employee?.firstName?.[0] || ''}${employee?.lastName?.[0] || ''}`.toUpperCase()

  const handleExportHealthRecord = () => {
    if (!employee) return

    const doc = new jsPDF()
    const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
    const latestVisitDate = latestVisit?.visitDate ? formatDate(latestVisit.visitDate) : '-'
    const nextDeadline = latestVisit?.nextDeadlineDate ? formatDate(latestVisit.nextDeadlineDate) : '-'

    doc.setFontSize(16)
    doc.text('Health Record - Employee Profile', 14, 18)

    doc.setFontSize(11)
    doc.text(`Employee: ${fullName || '-'}`, 14, 30)
    doc.text(`Tax Code: ${employee.taxCode || '-'}`, 14, 37)
    doc.text(`Company: ${employee.companyName || '-'}`, 14, 44)
    doc.text(`Role: ${employee.jobRole || '-'}`, 14, 51)
    doc.text(`Health Status: ${healthStatus.label}`, 14, 58)

    doc.setFontSize(12)
    doc.text('Medical Summary', 14, 71)
    doc.setFontSize(10)
    doc.text(`Latest Visit: ${latestVisitDate}`, 14, 79)
    doc.text(`Next Checkup: ${nextDeadline}`, 14, 85)
    doc.text(`Visits Count: ${visits.length}`, 14, 91)
    doc.text(`Exams Count: ${visitExams.length}`, 14, 97)
    doc.text(`Compliance Rate: ${complianceRate}%`, 14, 103)

    doc.setFontSize(12)
    doc.text('Risk Exposure', 14, 116)
    doc.setFontSize(10)
    if (!risksWithSeverity.length) {
      doc.text('No active risks.', 14, 124)
    } else {
      risksWithSeverity.slice(0, 8).forEach((risk, index) => {
        doc.text(`- ${risk.riskFactorName} (L${risk.severityLevel}/5)`, 14, 124 + index * 6)
      })
    }

    const safeName = (fullName || 'employee').replace(/\s+/g, '-').toLowerCase()
    doc.save(`health-record-${safeName}.pdf`)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 62, height: 62 }}>{initials || 'DP'}</Avatar>
              <Box>
                <Typography variant="h6">{employee?.firstName} {employee?.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{employee?.jobRole || '-'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {employee?.companyName || '-'} • {employee?.branchAddress || '-'}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => onEditEmployee?.(employee)}
              >
                Edit Profile
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportHealthRecord}
              >
                Export Health Record
              </Button>
              <Chip icon={<HealthAndSafetyIcon />} label={healthStatus.label} color={healthStatus.color} />
              <Chip label={`CF: ${employee?.taxCode || '-'}`} variant="outlined" />
            </Stack>
          </Stack>

          <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.2 }}>
            <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Ultima Visita</Typography>
              <Typography variant="body2" fontWeight={700}>{formatDate(latestVisit?.visitDate)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Prossimo Checkup</Typography>
              <Typography variant="body2" fontWeight={700}>
                {daysToDeadline === null ? '-' : `${Math.max(daysToDeadline, 0)} giorni`}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Compliance</Typography>
              <Typography variant="body2" fontWeight={700}>{complianceRate}%</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Rischi Attivi</Typography>
              <Typography variant="body2" fontWeight={700}>{risksWithSeverity.length}</Typography>
            </Paper>
          </Box>
        </Box>

        <Box sx={{ px: 2.5, pt: 1.5 }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab label="Overview" />
            <Tab label={`Visite (${visits.length})`} />
            <Tab label={`Esami (${visitExams.length})`} />
            <Tab label={`Rischi (${risksWithSeverity.length})`} />
          </Tabs>
        </Box>

        <Divider />

        <Box sx={{ p: 2.5 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!!error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && tab === 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <CalendarMonthIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2">Attività Recenti</Typography>
                </Stack>
                {sortedVisits.slice(0, 4).map((visit) => (
                  <Box key={visit.id} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight={700}>{visit.visitType || 'Visita Medica'} • {formatDate(visit.visitDate)}</Typography>
                    <Typography variant="caption" color="text.secondary">Esito: {visit.outcome || '-'}</Typography>
                  </Box>
                ))}
                {!sortedVisits.length && <Typography variant="body2" color="text.secondary">Nessuna attività disponibile.</Typography>}
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <WarningAmberIcon color="warning" fontSize="small" />
                  <Typography variant="subtitle2">Rischi (esposizione)</Typography>
                </Stack>
                <Stack spacing={1.2}>
                  {risksWithSeverity.map((risk) => (
                    <Box key={`${risk.employeeId}-${risk.riskFactorId}`}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{risk.riskFactorName}</Typography>
                        <Typography variant="caption" color="text.secondary">L{risk.severityLevel}</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={Math.min(100, risk.severityLevel * 20)} sx={{ mt: 0.5, borderRadius: 999 }} />
                    </Box>
                  ))}
                  {!risksWithSeverity.length && <Typography variant="body2" color="text.secondary">Nessun rischio assegnato.</Typography>}
                </Stack>
              </Paper>
            </Box>
          )}

          {!loading && !error && tab === 1 && (
            <Stack spacing={1}>
              {sortedVisits.map((visit) => (
                <Paper key={visit.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={700}>{visit.visitType || 'Visita'} • {formatDate(visit.visitDate)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Scadenza: {formatDate(visit.nextDeadlineDate)} • Esito: {visit.outcome || '-'}
                  </Typography>
                </Paper>
              ))}
              {!sortedVisits.length && <Alert severity="info">Nessuna visita registrata.</Alert>}
            </Stack>
          )}

          {!loading && !error && tab === 2 && (
            <Stack spacing={1}>
              {visitExams.map((exam) => (
                <Paper key={exam.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BiotechIcon fontSize="small" color="primary" />
                    <Typography variant="body2" fontWeight={700}>{exam.examTypeName || 'Esame'}</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">Risultato: {exam.result || '-'}</Typography>
                </Paper>
              ))}
              {!visitExams.length && <Alert severity="info">Nessun esame associato.</Alert>}
            </Stack>
          )}

          {!loading && !error && tab === 3 && (
            <Stack spacing={1}>
              {risksWithSeverity.map((risk) => (
                <Paper key={`${risk.employeeId}-${risk.riskFactorId}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={700}>{risk.riskFactorName}</Typography>
                  <Typography variant="caption" color="text.secondary">Livello severità: {risk.severityLevel}/5</Typography>
                </Paper>
              ))}
              {!risksWithSeverity.length && <Alert severity="success">Nessun rischio attivo.</Alert>}
            </Stack>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default EmployeeProfileDialog
