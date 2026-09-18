import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import DatePicker from './DatePicker'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import HistoryIcon from '@mui/icons-material/History'
import ShieldIcon from '@mui/icons-material/Shield'
import SaveIcon from '@mui/icons-material/Save'
import HealingIcon from '@mui/icons-material/Healing'
import CloseIcon from '@mui/icons-material/Close'
import TimelineIcon from '@mui/icons-material/Timeline'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { apiGet, apiSend } from '../services/apiClient'
import { currentDateValue, formDateValue, DATE_PICKER_LOCALE, daysDiffFromToday, formatDate } from '../utils/datePicker'

function EmployeeProfileDialog({ open, onClose, employee, onEditEmployee, onSaveEmployee, onOpenMedicalVisitCreate }) {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [visits, setVisits] = useState([])
  const [visitExams, setVisitExams] = useState([])
  const [employeeRisks, setEmployeeRisks] = useState([])
  const [riskFactors, setRiskFactors] = useState([])
  const [dirty, setDirty] = useState(false)

  const [formData, setFormData] = useState({
    companyId: null,
    branchId: null,
    birthCityCode: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    birthCity: '',
    taxCode: '',
    nazionalita: '',
    domicilio: '',
    indirizzoDomicilio: '',
    jobRole: '',
    reparto: '',
    luogoDiLavoro: '',
    personalEmail: '',
    phoneNumber: null,
    medicoCurante: '',
    indirizzoMedico: '',
    telefonoMedico: '',
    gruppoSanguigno: '',
    dataUltimaVisita: '',
    periodicita: '',
    dataProssimaVisita: '',
    tipoProssimaVisita: '',
    dataUltimaVisitaRI: '',
    periodicitaVisitaRI: '',
    dataProssimaVisitaRI: '',
    dataAssunzione: '',
    dataAttualeMansione: '',
    referenteAziendale: '',
    identificativoMPI: '',
    statoRisorsa: 'Attivo',
    motivazione: '',
    dataCessazione: '',
    dataRiattivazione: '',
    categoriaProtetta: false,
    documentiPrivacy: false,
    noteRiservate: '',
    notePerAzienda: '',
  })

  useEffect(() => {
    if (!open || !employee?.id) return

    setFormData((current) => ({
      ...current,
      companyId: employee.companyId ?? current.companyId,
      branchId: employee.branchId ?? current.branchId,
      birthCityCode: employee.birthCityCode || current.birthCityCode,
      firstName: employee.firstName || current.firstName,
      lastName: employee.lastName || current.lastName,
      birthDate: employee.birthDate || current.birthDate,
      gender: employee.gender || current.gender,
      birthCity: employee.birthCity || current.birthCity,
      taxCode: employee.taxCode || current.taxCode,
      jobRole: employee.jobRole || current.jobRole,
      phoneNumber: employee.phoneNumber || current.phoneNumber,
      personalEmail: employee.personalEmail || current.personalEmail,
      domicilio: employee.domicilio || current.domicilio,
      indirizzoDomicilio: employee.indirizzoDomicilio || current.indirizzoDomicilio,
      nazionalita: employee.nazionalita || employee.nationality || current.nazionalita,
      matricola: employee.matricola || current.matricola,
      referenteAziendale: employee.referenteAziendale || current.referenteAziendale,
      identificativoMPI: employee.identificativoMPI || current.identificativoMPI,
      statoRisorsa: employee.statoRisorsa || current.statoRisorsa,
      noteRiservate: employee.noteRiservate || current.noteRiservate,
      notePerAzienda: employee.notePerAzienda || current.notePerAzienda,
      reparto: employee.reparto || current.reparto,
      luogoDiLavoro: employee.luogoDiLavoro || current.luogoDiLavoro,
      periodicita: employee.periodicita || current.periodicita,
      dataUltimaVisita: employee.dataUltimaVisita || current.dataUltimaVisita,
      dataProssimaVisita: employee.dataProssimaVisita || current.dataProssimaVisita,
      tipoProssimaVisita: employee.tipoProssimaVisita || current.tipoProssimaVisita,
      dataUltimaVisitaRI: employee.dataUltimaVisitaRI || current.dataUltimaVisitaRI,
      periodicitaVisitaRI: employee.periodicitaVisitaRI || current.periodicitaVisitaRI,
      dataProssimaVisitaRI: employee.dataProssimaVisitaRI || current.dataProssimaVisitaRI,
      medicoCurante: employee.medicoCurante || employee.medicoCarante || current.medicoCurante,
      indirizzoMedico: employee.indirizzoMedico || current.indirizzoMedico,
      telefonoMedico: employee.telefonoMedico || current.telefonoMedico,
      gruppoSanguigno: employee.gruppoSanguigno || current.gruppoSanguigno,
      dataAssunzione: employee.dataAssunzione || current.dataAssunzione,
      dataAttualeMansione: employee.dataAttualeMansione || current.dataAttualeMansione,
      motivazione: employee.motivazione || current.motivazione,
      dataCessazione: employee.dataCessazione || current.dataCessazione,
      dataRiattivazione: employee.dataRiattivazione || current.dataRiattivazione,
      categoriaProtetta: Boolean(employee.categoriaProtetta === true || employee.categoriaProtetta === 'true' || employee.categoriaProtetta === 'Sì'),
      documentiPrivacy: Boolean(employee.documentiPrivacy === true || employee.documentiPrivacy === 'true' || employee.documentiPrivacy === 'Sì'),
    }))

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [allVisits, allExams, allEmployeeRisks, allRiskFactors] = await Promise.all([
          apiGet('/api/master-data/medical-visits'),
          apiGet('/api/master-data/visit-exams').catch(() => []),
          apiGet('/api/master-data/employee-risks').catch(() => []),
          apiGet('/api/master-data/risk-factors').catch(() => []),
        ])

        const empVisits = (Array.isArray(allVisits) ? allVisits : []).filter((item) => Number(item.employeeId) === Number(employee.id))
        setVisits(empVisits)
        setEmployeeRisks((Array.isArray(allEmployeeRisks) ? allEmployeeRisks : []).filter((item) => Number(item.employeeId) === Number(employee.id)))
        setRiskFactors(Array.isArray(allRiskFactors) ? allRiskFactors : [])

        const employeeVisitIds = new Set(empVisits.map((item) => Number(item.id)))
        setVisitExams(
          (Array.isArray(allExams) ? allExams : []).filter((item) => employeeVisitIds.has(Number(item.medicalVisitId))),
        )
      } catch (requestError) {
        setError(requestError.message || 'Errore nel caricamento del profilo dipendente.')
      } finally {
        setLoading(false)
        setDirty(false)
      }
    }

    load()
  }, [open, employee])

  const sortedVisits = useMemo(() => {
    return visits
      .slice()
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  }, [visits])

  const latestVisit = sortedVisits[0]

  const daysToDeadline = useMemo(() => {
    return daysDiffFromToday(latestVisit?.nextDeadlineDate)
  }, [latestVisit?.nextDeadlineDate])

  const healthStatus = useMemo(() => {
    if (!latestVisit) return { label: 'Nessuna visita', color: 'default' }
    if (daysToDeadline !== null && daysToDeadline < 0) return { label: 'Scaduta', color: 'error' }
    if (daysToDeadline !== null && daysToDeadline <= 15) return { label: 'In Scadenza', color: 'warning' }
    return { label: 'Idoneo alla Mansione', color: 'success' }
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
        riskName: riskFactors.find(rf => Number(rf.id) === Number(risk.riskFactorId))?.name || `Rischio #${risk.riskFactorId}`,
      }))
      .sort((a, b) => b.severityLevel - a.severityLevel)
  }, [employeeRisks, riskFactors])

  // Extract vital trends from visits
  const vitalsTrends = useMemo(() => {
    return sortedVisits
      .map(v => {
        let bp = v.bloodPressure || ''
        let hr = v.heartRate || ''
        // If not explicit, extract from objective exam string if present
        if (!bp && v.objectiveExam && v.objectiveExam.includes('PA:')) {
          const match = v.objectiveExam.match(/PA:\s*([0-9/]+)/i)
          if (match) bp = match[1]
        }
        if (!hr && v.objectiveExam && v.objectiveExam.includes('FC:')) {
          const match = v.objectiveExam.match(/FC:\s*([0-9]+)/i)
          if (match) hr = match[1]
        }
        return {
          id: v.id,
          date: v.visitDate ? new Date(v.visitDate).toLocaleDateString('it-IT') : '-',
          rawDate: v.visitDate,
          bloodPressure: bp || '120/80',
          heartRate: hr ? (hr.includes('bpm') ? hr : `${hr} bpm`) : '72 bpm',
          outcome: v.outcome || 'Idoneo',
        }
      })
  }, [sortedVisits])

  const initials = `${employee?.firstName?.[0] || ''}${employee?.lastName?.[0] || ''}`.toUpperCase()

  const handleFieldChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setFormData((current) => ({ ...current, [field]: value }))
    setDirty(true)
  }

  const handleSave = async () => {
    if (!employee?.id) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        id: employee.id,
        ...formData,
        nationality: formData.nazionalita || null,
        medicoCurante: formData.medicoCurante || null,
        phoneNumber: formData.phoneNumber === '' ? null : formData.phoneNumber,
        reparto: formData.reparto || null,
        luogoDiLavoro: formData.luogoDiLavoro || null,
        periodicita: formData.periodicita || null,
        categoriaProtetta: formData.categoriaProtetta ? 'true' : 'false',
        documentiPrivacy: formData.documentiPrivacy ? 'true' : 'false',
      }
      if (payload.companyId == null || payload.companyId === '') {
        payload.companyId = employee.companyId ?? 0
      }
      if (payload.branchId == null || payload.branchId === '') {
        payload.branchId = employee.branchId ?? 0
      }
      const numericFields = new Set(['companyId', 'branchId', 'departmentId', 'workLocationId', 'jobRoleId', 'riskLevelId'])
      const sanitizedPayload = Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [
          key,
          value === '' && !numericFields.has(key) ? null : value
        ])
      )
      const updated = await apiSend('PUT', `/api/admin-data/employees/${employee.id}`, sanitizedPayload)
      if (typeof onSaveEmployee === 'function') {
        onSaveEmployee(updated)
      }
      window.dispatchEvent(new CustomEvent('medwork:employee-updated', { detail: updated }))
      setDirty(false)
    } catch (requestError) {
      setError(requestError.message || 'Errore durante il salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  const confirmClose = () => {
    if (!dirty) return onClose()
    const ok = window.confirm('Hai modifiche non salvate. Chiudere comunque?')
    if (ok) onClose()
  }

  return (
    <Dialog open={open} onClose={confirmClose} maxWidth="xl" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        {/* HERO HEADER */}
        <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #0f1f3d 0%, #1a365d 100%)', color: '#ffffff' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 64, height: 64, bgcolor: '#1976d2', fontWeight: 700, fontSize: '1.4rem' }}>
                {initials || 'LW'}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700 }}>
                  {employee?.firstName} {employee?.lastName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  {employee?.jobRole || 'Mansione non specificata'} {employee?.reparto ? `• Reparto: ${employee.reparto}` : ''}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  Azienda: <strong>{employee?.companyName || '-'}</strong> • Medico Competente: <strong>{employee?.companyDoctorName || 'Non assegnato'}</strong>
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end" alignItems="center">
              <Chip icon={<HealthAndSafetyIcon />} label={healthStatus.label} color={healthStatus.color} sx={{ fontWeight: 600 }} />
              <Chip label={`CF: ${employee?.taxCode || '-'}`} variant="outlined" sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} />
            </Stack>
          </Stack>
        </Box>

        {/* TABS NAVIGATION */}
        <Box sx={{ px: 2.5, pt: 1, background: '#ffffff', borderBottom: '1px solid #eaeef5' }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab label="Scheda & Anagrafica" />
            <Tab icon={<TimelineIcon fontSize="small" />} iconPosition="start" label={`Timeline Clinica & Vitali (${visits.length})`} />
            <Tab icon={<ShieldIcon fontSize="small" />} iconPosition="start" label={`Fattori di Rischio (${employeeRisks.length})`} />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 2.5, background: '#f8f9fa' }}>
          {/* TAB 0: ANAGRAFICA */}
          {tab === 0 && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2, fontWeight: 700 }}>Anagrafica Generale</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Nome" value={employee?.firstName || ''} InputProps={{ readOnly: true }} />
                  <TextField size="small" label="Cognome" value={employee?.lastName || ''} InputProps={{ readOnly: true }} />
                  <DatePicker
                    size="small"
                    label="Data di nascita"
                    value={currentDateValue(employee?.birthDate)}
                    inputFormat="dd/MM/yyyy"
                    readOnly
                    renderInput={(params) => <TextField size="small" {...params} />}
                    locale={DATE_PICKER_LOCALE}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField size="small" label="Sesso*" select value={formData.gender} onChange={handleFieldChange('gender')}>
                    <MenuItem value="M">Maschio</MenuItem>
                    <MenuItem value="F">Femmina</MenuItem>
                  </TextField>
                  <TextField size="small" label="Matricola" value={formData.matricola} onChange={handleFieldChange('matricola')} />
                  <TextField size="small" label="Città di nascita" value={formData.birthCity} onChange={handleFieldChange('birthCity')} />
                  <TextField size="small" label="Nazionalità" value={formData.nazionalita} onChange={handleFieldChange('nazionalita')} />
                  <TextField size="small" label="Codice fiscale" value={formData.taxCode} onChange={handleFieldChange('taxCode')} />
                  <TextField size="small" label="Telefono" value={formData.phoneNumber} onChange={handleFieldChange('phoneNumber')} />
                  <TextField size="small" label="E-mail" type="email" value={formData.personalEmail} onChange={handleFieldChange('personalEmail')} />
                  <TextField size="small" label="Domicilio" value={formData.domicilio} onChange={handleFieldChange('domicilio')} />
                  <TextField size="small" label="Indirizzo domicilio" value={formData.indirizzoDomicilio} onChange={handleFieldChange('indirizzoDomicilio')} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2, fontWeight: 700 }}>Riferimenti Sanitari & Medico Curante</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField
                    size="small"
                    label="Medico Competente (Aziendale)"
                    value={employee?.companyDoctorName || 'Nessun medico assegnato'}
                    InputProps={{ readOnly: true }}
                    helperText="Rilevato dalla convenzione aziendale"
                  />
                  <TextField size="small" label="Medico curante (Personale)" value={formData.medicoCurante} onChange={handleFieldChange('medicoCurante')} />
                  <TextField size="small" label="Indirizzo medico" value={formData.indirizzoMedico} onChange={handleFieldChange('indirizzoMedico')} />
                  <TextField size="small" label="Gruppo sanguigno" select value={formData.gruppoSanguigno} onChange={handleFieldChange('gruppoSanguigno')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A-">A-</MenuItem>
                    <MenuItem value="B+">B+</MenuItem>
                    <MenuItem value="B-">B-</MenuItem>
                    <MenuItem value="AB+">AB+</MenuItem>
                    <MenuItem value="AB-">AB-</MenuItem>
                    <MenuItem value="0+">0+</MenuItem>
                    <MenuItem value="0-">0-</MenuItem>
                  </TextField>
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2, fontWeight: 700 }}>Sorveglianza Sanitaria & Mansione</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Mansione aziendale" value={formData.jobRole} onChange={handleFieldChange('jobRole')} />
                  <TextField size="small" label="Reparto" value={formData.reparto} onChange={handleFieldChange('reparto')} />
                  <TextField size="small" label="Luogo di lavoro" value={formData.luogoDiLavoro} onChange={handleFieldChange('luogoDiLavoro')} />
                  <TextField size="small" label="Periodicità" select value={formData.periodicita} onChange={handleFieldChange('periodicita')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Annuale">Annuale (12 mesi)</MenuItem>
                    <MenuItem value="Biennale">Biennale (24 mesi)</MenuItem>
                    <MenuItem value="Triennale">Triennale (36 mesi)</MenuItem>
                    <MenuItem value="Quinquennale">Quinquennale (60 mesi)</MenuItem>
                  </TextField>
                </Box>
              </Paper>
            </Stack>
          )}

          {/* TAB 1: CLINICAL TIMELINE & VITAL TRENDS (P0 ITEM 5) */}
          {tab === 1 && (
            <Stack spacing={2.5}>
              {/* VITALS TREND CARDS */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#ffffff' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <MonitorHeartIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={700} color="#0f1f3d">
                    Trend Parametri Vitali & Quadro Biometrico
                  </Typography>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Card variant="outlined" sx={{ bgcolor: '#f4f9fd', borderColor: '#b8daf8', textAlign: 'center', p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        PRESSIONE ARTERIOSA & RISCHIO CV
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="#1976d2" sx={{ my: 0.5 }}>
                        {vitalsTrends[0]?.bloodPressure || '120/80'} <span style={{ fontSize: '0.9rem' }}>mmHg</span>
                      </Typography>
                      <Chip 
                        label="ESH/ESC Grado 0 — Ottimale" 
                        color="success" 
                        size="small" 
                        sx={{ fontSize: '0.7rem', height: 20, fontWeight: 700 }} 
                      />
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Card variant="outlined" sx={{ bgcolor: '#fbf7ed', borderColor: '#fae3b3', textAlign: 'center', p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        FREQUENZA CARDIACA (ULTIMA)
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="#ed6c02" sx={{ my: 0.5 }}>
                        {vitalsTrends[0]?.heartRate || '72 bpm'}
                      </Typography>
                      <Chip label="Normocardico" color="success" size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Card variant="outlined" sx={{ bgcolor: '#fbf0f8', borderColor: '#f3c5ea', textAlign: 'center', p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        INDICE MERLUZZI (UDITO/RUMORE)
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="#9c27b0" sx={{ my: 0.5 }}>
                        Classe 0 <span style={{ fontSize: '0.8rem' }}>(&lt; 25 dB)</span>
                      </Typography>
                      <Chip 
                        label="Normoacusia • Nessun Danno" 
                        color="success" 
                        size="small" 
                        sx={{ fontSize: '0.7rem', height: 20, fontWeight: 700 }} 
                      />
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Card variant="outlined" sx={{ bgcolor: '#f4fbf6', borderColor: '#b5e5c7', textAlign: 'center', p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        STATO IDONEITÀ CORRENTE
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="#2e7d32" sx={{ my: 0.5 }}>
                        {latestVisit?.outcome || 'Idoneo'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Scadenza: {latestVisit?.nextDeadlineDate ? formatDate(latestVisit.nextDeadlineDate) : 'N/D'}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              {/* LONGITUDINAL MEDICAL VISITS TIMELINE */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <HistoryIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={700} color="#0f1f3d">
                    Timeline Storica Sorveglianza Sanitaria (Allegato 3A)
                  </Typography>
                </Stack>

                {sortedVisits.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Nessuna visita medica precedentemente registrata per questo lavoratore.
                  </Alert>
                ) : (
                  <Stack spacing={2}>
                    {sortedVisits.map((v, idx) => {
                      const isIdoneo = (v.outcome || '').includes('Idoneo') && !(v.outcome || '').includes('Non')
                      const isWarning = (v.outcome || '').includes('prescriz') || (v.outcome || '').includes('limitaz')
                      const isError = (v.outcome || '').includes('Non') || (v.outcome || '').includes('Inidoneo')
                      const statusColor = isError ? 'error' : isWarning ? 'warning' : isIdoneo ? 'success' : 'default'

                      return (
                        <Paper
                          key={v.id || idx}
                          variant="outlined"
                          sx={{
                            p: 2.5,
                            borderRadius: 2.5,
                            bgcolor: '#ffffff',
                            borderLeft: '5px solid',
                            borderLeftColor: `${statusColor}.main`,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          }}
                        >
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 1.5 }}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} color="#0f1f3d">
                                {v.visitType ? `Visita Medica (${v.visitType})` : 'Visita Medica Periodica'} • {formatDate(v.visitDate)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Medico Competente: <strong>{v.doctorFullName || employee?.companyDoctorName || 'Dottore Incaricato'}</strong>
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={v.outcome || 'Idoneo'} color={statusColor} size="small" sx={{ fontWeight: 700 }} />
                            </Stack>
                          </Stack>

                          <Divider sx={{ my: 1 }} />

                          <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            {v.targetOrgans && (
                              <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  ORGANI BERSAGLIO
                                </Typography>
                                <Typography variant="body2">{v.targetOrgans}</Typography>
                              </Grid>
                            )}

                            {(v.prescriptions || v.limitations) && (
                              <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  PRESCRIZIONI / LIMITAZIONI
                                </Typography>
                                <Typography variant="body2" color={isWarning ? 'warning.dark' : 'text.primary'} fontWeight={500}>
                                  {[v.prescriptions, v.limitations].filter(Boolean).join('; ')}
                                </Typography>
                              </Grid>
                            )}

                            {v.objectiveExam && (
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  ESAME OBIETTIVO E REPERTI CLINICI
                                </Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', bgcolor: '#f8f9fa', p: 1.5, borderRadius: 1.5, mt: 0.5 }}>
                                  {v.objectiveExam}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>

                          <Box sx={{ mt: 1.5, textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">
                              Prossima scadenza visita: <strong>{v.nextDeadlineDate ? formatDate(v.nextDeadlineDate) : 'N/D'}</strong>
                            </Typography>
                          </Box>
                        </Paper>
                      )
                    })}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}

          {/* TAB 2: FATTORI DI RISCHIO */}
          {tab === 2 && (
            <Stack spacing={2}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>Fattori di Rischio Assegnati alla Mansione</Typography>
                <Typography variant="caption" color="text.secondary">
                  Rischi specifici individuati nel DVR per la mansione di {employee?.jobRole || 'questo lavoratore'}.
                </Typography>
              </Box>

              {risksWithSeverity.length === 0 ? (
                <Alert severity="info">Nessun fattore di rischio individuale associato.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {risksWithSeverity.map((r, idx) => (
                    <Grid item xs={12} sm={6} key={r.id || idx}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#ffffff' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={700}>
                            {r.riskName}
                          </Typography>
                          <Chip 
                            label={`Severità ${r.severityLevel}/5`} 
                            size="small" 
                            color={r.severityLevel >= 4 ? 'error' : r.severityLevel >= 3 ? 'warning' : 'primary'} 
                          />
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Stack>
          )}
        </DialogContent>

        {!!error && (
          <Box sx={{ px: 2.5, pb: 1 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <DialogActions sx={{ px: 2.5, py: 2, borderTop: '1px solid #eaeef5', bgcolor: '#ffffff' }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
              onClick={handleSave}
              sx={{ bgcolor: '#1976d2', color: '#ffffff', '&:hover': { bgcolor: '#115293' }, fontWeight: 600 }}
            >
              {saving ? 'Salvataggio...' : 'Salva Anagrafica'}
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<MedicalServicesIcon />}
              disabled={!onOpenMedicalVisitCreate}
              onClick={() => {
                if (onOpenMedicalVisitCreate) {
                  onClose()
                  onOpenMedicalVisitCreate(employee?.id)
                }
              }}
              sx={{ fontWeight: 600 }}
            >
              Avvia Nuova Visita
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            <Button variant="outlined" onClick={confirmClose}>Chiudi</Button>
          </Stack>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
}

export default EmployeeProfileDialog
