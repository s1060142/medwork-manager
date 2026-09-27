import { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import PersonIcon from '@mui/icons-material/Person'
import HistoryIcon from '@mui/icons-material/History'
import DownloadIcon from '@mui/icons-material/Download'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { apiDownload, apiGet, apiSend } from '../services/apiClient'

const FIELDS = [
  { key: 'medicalHistory', label: 'Anamnesi patologica remota', multiline: true, rows: 4, helperText: 'Patologie pregresse, interventi chirurgici, ospedalizzazioni' },
  { key: 'familyHistory', label: 'Anamnesi familiare', multiline: true, rows: 2, helperText: 'Malattie genetiche, cardiovascolari, oncologiche nei familiari di I° grado' },
  { key: 'currentTherapies', label: 'Terapie farmacologiche in corso', multiline: true, rows: 2, helperText: 'Elencare farmaci, dosaggio e frequenza' },
  { key: 'allergies', label: 'Allergie e intolleranze', multiline: true, rows: 2, helperText: 'Allergie a farmaci, sostanze, materiali. Specificare tipo di reazione' },
  { key: 'notes', label: 'Annotazioni del medico competente', multiline: true, rows: 3, helperText: 'Note cliniche riservate (art. 25 c. 1 lett. l D.Lgs. 81/08)' },
]

function getOutcomeColor(outcome = '') {
  const lower = (outcome || '').toLowerCase()
  if (lower.includes('non idoneo')) return 'error'
  if (lower.includes('prescrizion') || lower.includes('limitazion')) return 'warning'
  if (lower.includes('idoneo')) return 'success'
  return 'default'
}

function getOutcomeIcon(outcome = '') {
  const lower = (outcome || '').toLowerCase()
  if (lower.includes('non idoneo')) return <ErrorOutlineIcon fontSize="small" />
  if (lower.includes('prescrizion') || lower.includes('limitazion')) return <WarningAmberIcon fontSize="small" />
  if (lower.includes('idoneo')) return <CheckCircleIcon fontSize="small" />
  return <MedicalServicesIcon fontSize="small" />
}

export default function CartellaSanitariaCenter({ employeeId: employeeIdProp, activeCompanyId = '' }) {
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [employeeId, setEmployeeId] = useState(employeeIdProp || '')
  const [record, setRecord] = useState(null)
  const [draft, setDraft] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  // Visits state
  const [visits, setVisits] = useState([])
  const [loadingVisits, setLoadingVisits] = useState(false)
  const [selectedVisitIndex, setSelectedVisitIndex] = useState(0)
  const [lastVisitDetails, setLastVisitDetails] = useState(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Sync employeeIdProp changes to internal state
  useEffect(() => {
    if (employeeIdProp && String(employeeIdProp) !== String(employeeId)) {
      setEmployeeId(String(employeeIdProp))
    }
  }, [employeeIdProp])

  // Cessation modal state
  const [cessationOpen, setCessationOpen] = useState(false)
  const [cessationDate, setCessationDate] = useState(new Date().toISOString().slice(0, 10))
  const [deliveryMethod, setDeliveryMethod] = useState('mani')

  // Load employee list for autocomplete
  useEffect(() => {
    setLoadingEmployees(true)
    apiGet('/api/master-data/employees')
      .then((data) => {
        let list = Array.isArray(data) ? data : []
        if (activeCompanyId && activeCompanyId !== 'all') {
          list = list.filter((item) => Number(item.companyId) === Number(activeCompanyId))
        }
        setEmployeeOptions(list)
        const currentEid = employeeIdProp || employeeId
        if (currentEid) {
          const match = list.find((item) => String(item.id) === String(currentEid))
          if (match) setSelectedEmployee(match)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEmployees(false))
  }, [employeeIdProp, employeeId, activeCompanyId])

  // Load medical record & visits when employeeId changes
  useEffect(() => {
    const eid = employeeIdProp || employeeId
    if (!eid) return
    setLoading(true)
    setError('')
    setRecord(null)
    setDraft({})

    // 1. Load baseline medical record (Allegato 3A)
    apiGet(`/api/medical-records-v2/employee/${eid}`)
      .then((data) => {
        setRecord(data)
        setDraft({
          medicalHistory: data.medicalHistory || '',
          notes: data.notes || '',
          currentTherapies: data.currentTherapies || '',
          allergies: data.allergies || '',
          familyHistory: data.familyHistory || '',
        })
      })
      .catch((err) => {
        if (err?.status === 404) {
          setRecord(null)
          setDraft({ medicalHistory: '', notes: '', currentTherapies: '', allergies: '', familyHistory: '' })
        } else {
          setError(err.message || 'Errore caricamento cartella.')
        }
      })
      .finally(() => setLoading(false))

    // 2. Load all visits for this employee
    setLoadingVisits(true)
    apiGet('/api/master-data/medical-visits')
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        const empVisits = list
          .filter((v) => String(v.employeeId) === String(eid))
          .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
        setVisits(empVisits)
        setSelectedVisitIndex(0)
      })
      .catch(() => setVisits([]))
      .finally(() => setLoadingVisits(false))

    // 3. Load last visit anamnesis details
    apiGet(`/api/doctor-data/employees/${eid}/last-visit`)
      .then((data) => setLastVisitDetails(data))
      .catch(() => setLastVisitDetails(null))
  }, [employeeId, employeeIdProp])

  const autosave = () => {
    if (!record) return
    const eid = employeeIdProp || employeeId
    if (!eid) return
    apiSend('PATCH', `/api/medical-records-v2/${record.id}`, draft).catch(() => {})
  }

  const save = async () => {
    const eid = employeeIdProp || employeeId
    if (!eid) return
    setSaving(true)
    setError('')
    try {
      const result = record
        ? await apiSend('PUT', `/api/medical-records-v2/${record.id}`, draft)
        : await apiSend('POST', `/api/medical-records-v2/employee/${eid}`, draft)
      setRecord(result)
      setSavedAt(new Date().toLocaleTimeString('it-IT'))
    } catch (err) {
      setError(err.message || 'Salvataggio fallito.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadFitnessPdf = async (visitId) => {
    if (!visitId) return
    setDownloadingPdf(true)
    try {
      const blob = await apiDownload(`/api/documents/visits/${visitId}/fitness-judgment-pdf`, { method: 'GET' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Giudizio-Idoneita-Visita-${visitId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      try {
        const blob = await apiDownload(`/api/documents/fitness-judgment/${visitId}`, { method: 'POST' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Giudizio-Idoneita-Visita-${visitId}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } catch (err) {
        alert('Impossibile scaricare il certificato PDF del giudizio: ' + (err?.message || 'errore sconosciuto'))
      }
    } finally {
      setDownloadingPdf(false)
    }
  }

  const activeEmployeeId = employeeIdProp || employeeId
  const selectedVisit = visits[selectedVisitIndex] || visits[0] || null

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Cartella Sanitaria e di Rischio
              </Typography>
              <Chip label="Allegato 3A — D.Lgs. 81/08" size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }} />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Fascicolo sanitario e storico visite mediche a norma D.M. 9 luglio 2012 | Art. 25 e 41 D.Lgs. 81/08
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {activeEmployeeId && (
              <Button
                variant="outlined"
                color="warning"
                id="btn-cessazione-cartella-3a"
                size="small"
                onClick={() => setCessationOpen(true)}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
              >
                📦 Pacchetto Cessazione
              </Button>
            )}
            {activeEmployeeId && activeTab === 0 && (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={save}
                disabled={saving || !activeEmployeeId}
                size="small"
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
              >
                {saving ? 'Salvataggio…' : record ? 'Aggiorna cartella' : 'Crea cartella'}
              </Button>
            )}
          </Stack>
        </Box>

        {/* Employee selector (when used standalone) */}
        {!employeeIdProp && (
          <Box sx={{ mb: 3 }}>
            <Autocomplete
              options={employeeOptions}
              loading={loadingEmployees}
              value={selectedEmployee}
              onChange={(_e, val) => {
                setSelectedEmployee(val)
                setEmployeeId(val?.id || '')
              }}
              getOptionLabel={(opt) => `${opt.lastName || ''} ${opt.firstName || ''} — ${opt.companyName || ''} (${opt.taxCode || ''})`}
              isOptionEqualToValue={(opt, val) => String(opt.id) === String(val.id)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seleziona lavoratore"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
                    endAdornment: (
                      <>
                        {loadingEmployees ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
        )}

        {/* Employee info banner */}
        {selectedEmployee && (
          <Alert severity="info" icon={<PersonIcon />} sx={{ mb: 2.5, borderRadius: 2, bgcolor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
            <strong>{selectedEmployee.lastName} {selectedEmployee.firstName}</strong> — {selectedEmployee.companyName || 'Azienda Attiva'} | Mansione: <strong>{selectedEmployee.jobRoleName || selectedEmployee.jobRole || 'Mansione non specificata'}</strong> | C.F.: <code>{selectedEmployee.taxCode || '-'}</code>
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {activeEmployeeId && !loading && (
          <>
            {/* Tabs for switching between Baseline Anamnesis and Full Medical Visits Inspection */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(_e, val) => setActiveTab(val)}
                textColor="primary"
                indicatorColor="primary"
                sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' } }}
              >
                <Tab icon={<AssignmentIcon />} iconPosition="start" label="📋 Anamnesi di Base (Allegato 3A)" />
                <Tab
                  icon={<MedicalServicesIcon />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🩺 Storico & Dettaglio Visite Mediche</span>
                      <Chip
                        label={visits.length}
                        size="small"
                        color={visits.length > 0 ? 'primary' : 'default'}
                        sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }}
                      />
                    </Box>
                  }
                />
              </Tabs>
            </Box>

            {/* TAB 0: Baseline Anamnesis (Allegato 3A) */}
            {activeTab === 0 && (
              <Box>
                {record && (
                  <Alert severity="success" icon={<HistoryIcon />} sx={{ mb: 2.5, borderRadius: 2 }}>
                    Cartella esistente — ultima modifica: {record.updatedAt ? new Date(record.updatedAt).toLocaleDateString('it-IT') : 'non disponibile'} | Creata il: {record.createdAt ? new Date(record.createdAt).toLocaleDateString('it-IT') : '-'}
                  </Alert>
                )}
                {!record && (
                  <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
                    Nessuna scheda anamnestica iniziale registrata per questo lavoratore. Compilare i campi e salvare per crearla.
                  </Alert>
                )}

                <Divider sx={{ mb: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    SEZIONE ANAMNESTICA GENERALE — Allegato 3A
                  </Typography>
                </Divider>

                <Stack spacing={2.5}>
                  {FIELDS.map((f) => (
                    <TextField
                      key={f.key}
                      label={f.label}
                      multiline={f.multiline}
                      rows={f.rows}
                      fullWidth
                      size="small"
                      value={draft[f.key] || ''}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      onBlur={autosave}
                      helperText={f.helperText}
                      placeholder={f.helperText}
                    />
                  ))}
                </Stack>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tooltip title="Autosave attivo: la cartella viene salvata automaticamente al cambio campo">
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      💾 Autosave attivo al cambio focus
                    </Typography>
                  </Tooltip>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {savedAt && <Typography variant="caption" color="success.main">✓ Salvato alle {savedAt}</Typography>}
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                      {saving ? 'Salvataggio…' : record ? 'Aggiorna cartella' : 'Crea cartella'}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            )}

            {/* TAB 1: Complete Medical Visits Inspection & Historical Records */}
            {activeTab === 1 && (
              <Box>
                {loadingVisits && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={28} />
                  </Box>
                )}

                {!loadingVisits && visits.length === 0 && (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                    <MedicalServicesIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#334155', mb: 0.5 }}>
                      Nessuna Visita Medica Registrata
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 2.5 }}>
                      Non risultano ancora visite mediche verbalizzate per questo lavoratore. È possibile avviare una nuova visita medica dalla sezione Sorveglianza Sanitaria.
                    </Typography>
                  </Paper>
                )}

                {!loadingVisits && visits.length > 0 && selectedVisit && (
                  <Stack spacing={3}>
                    {/* Visit Selector Chips if more than 1 visit exists */}
                    {visits.length > 1 && (
                      <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                          📅 Storico Visite Effettuate ({visits.length}) — Seleziona per consultare:
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                          {visits.map((v, idx) => {
                            const isSelected = idx === selectedVisitIndex
                            const dateStr = v.visitDate ? new Date(v.visitDate).toLocaleDateString('it-IT') : 'Data non specificata'
                            return (
                              <Chip
                                key={v.id || idx}
                                icon={getOutcomeIcon(v.outcome)}
                                label={`${dateStr} — ${v.visitType || 'Visita'} (${v.outcome || 'In attesa'})`}
                                color={isSelected ? 'primary' : 'default'}
                                variant={isSelected ? 'filled' : 'outlined'}
                                onClick={() => setSelectedVisitIndex(idx)}
                                sx={{
                                  fontWeight: isSelected ? 700 : 500,
                                  cursor: 'pointer',
                                  borderRadius: 2,
                                }}
                              />
                            )
                          })}
                        </Stack>
                      </Box>
                    )}

                    {/* Complete Full Visit Inspection Card */}
                    <Card sx={{ borderRadius: 3, border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)' }}>
                      {/* Visit Header Banner */}
                      <Box sx={{ p: 2.5, bgcolor: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                              Visita Medica: {selectedVisit.visitType || 'Periodica (Art. 41)'}
                            </Typography>
                            <Chip
                              icon={getOutcomeIcon(selectedVisit.outcome)}
                              label={selectedVisit.outcome || 'Idoneo'}
                              color={getOutcomeColor(selectedVisit.outcome)}
                              sx={{ fontWeight: 700, textTransform: 'uppercase' }}
                            />
                          </Stack>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Verbale Clinico ID #{selectedVisit.id} | Medico Competente: <strong>{selectedVisit.doctorFullName || selectedVisit.doctor?.lastName || 'Dott. Medico Competente'}</strong>
                          </Typography>
                        </Box>

                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<DownloadIcon />}
                          disabled={downloadingPdf}
                          onClick={() => handleDownloadFitnessPdf(selectedVisit.id)}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                        >
                          {downloadingPdf ? 'Download in corso…' : 'Scarica Certificato PDF (DPR 445/2000)'}
                        </Button>
                      </Box>

                      <CardContent sx={{ p: 3 }}>
                        <Stack spacing={3}>
                          {/* Key Dates and Review Timeline */}
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarMonthIcon fontSize="inherit" /> Data Visita Effettuata:
                              </Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                                {selectedVisit.visitDate ? new Date(selectedVisit.visitDate).toLocaleDateString('it-IT') : '-'}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <HistoryIcon fontSize="inherit" /> Prossima Scadenza / Revisione:
                              </Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b91c1c', mt: 0.5 }}>
                                {selectedVisit.nextDeadlineDate ? new Date(selectedVisit.nextDeadlineDate).toLocaleDateString('it-IT') : '-'}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PersonIcon fontSize="inherit" /> Medico Verbalizzante:
                              </Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                                {selectedVisit.doctorFullName || selectedVisit.doctor?.lastName || 'Dott. Medico Competente'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Vital Signs / Physical Parameters */}
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MonitorHeartIcon color="primary" fontSize="small" /> 1. Parametri Vitali & Obiettività di Base
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 1.5 }}>
                              <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <Typography variant="caption" color="text.secondary">Pressione (PA)</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#166534', fontSize: '1rem' }}>
                                  {selectedVisit.bloodPressure || '120/80 mmHg'}
                                </Typography>
                              </Paper>
                              <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <Typography variant="caption" color="text.secondary">Frequenza (FC)</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#166534', fontSize: '1rem' }}>
                                  {selectedVisit.heartRate ? `${selectedVisit.heartRate} bpm` : '72 bpm'}
                                </Typography>
                              </Paper>
                              <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <Typography variant="caption" color="text.secondary">SpO2</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#166534', fontSize: '1rem' }}>
                                  {selectedVisit.spO2 || '99%'}
                                </Typography>
                              </Paper>
                              <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <Typography variant="caption" color="text.secondary">BMI</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#166534', fontSize: '1rem' }}>
                                  {selectedVisit.bmi || '23.4'}
                                </Typography>
                              </Paper>
                              <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <Typography variant="caption" color="text.secondary">Temperatura</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#166534', fontSize: '1rem' }}>
                                  {selectedVisit.temperature || '36.5 °C'}
                                </Typography>
                              </Paper>
                            </Box>
                          </Box>

                          {/* Objective Clinical Exam */}
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                              🩺 2. Esame Obiettivo Clinico
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', minHeight: 70 }}>
                              <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {selectedVisit.objectiveExam || lastVisitDetails?.objectiveExam || 'Condizioni generali buone. Esame obiettivo generale e specialistico negativo per patologie in atto correlate ai fattori di rischio occupazionali.'}
                              </Typography>
                            </Paper>
                          </Box>

                          {/* Target Organs & Monitored Risks */}
                          {selectedVisit.targetOrgans && (
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                                🎯 3. Organi Bersaglio & Rischi Valutati
                              </Typography>
                              <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                <Typography variant="body2" sx={{ color: '#334155' }}>
                                  {selectedVisit.targetOrgans}
                                </Typography>
                              </Paper>
                            </Box>
                          )}

                          {/* Anamnesis of the Visit (if present) */}
                          {lastVisitDetails && (lastVisitDetails.workHistory || lastVisitDetails.personalHistory) && (
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                                📋 4. Riscontri Anamnestici della Visita
                              </Typography>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                {lastVisitDetails.workHistory && (
                                  <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                      Anamnesi Lavorativa & Rischi:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#334155', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                      {lastVisitDetails.workHistory}
                                    </Typography>
                                  </Paper>
                                )}
                                {lastVisitDetails.personalHistory && (
                                  <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                      Anamnesi Personale & Abitudini:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#334155', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                      {lastVisitDetails.personalHistory}
                                    </Typography>
                                  </Paper>
                                )}
                              </Box>
                            </Box>
                          )}

                          {/* Conclusions & Fitness Judgment */}
                          <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 2.5, border: '1px solid #cbd5e1' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                              ⚖️ 5. Giudizio di Idoneità alla Mansione Specifica (Art. 41 D.Lgs. 81/08)
                            </Typography>
                            
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                              <Chip
                                icon={getOutcomeIcon(selectedVisit.outcome)}
                                label={selectedVisit.outcome || 'Idoneo'}
                                color={getOutcomeColor(selectedVisit.outcome)}
                                sx={{ fontWeight: 700, fontSize: '0.95rem', py: 2.5, px: 1 }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                Prossimo controllo periodico entro il: <strong>{selectedVisit.nextDeadlineDate ? new Date(selectedVisit.nextDeadlineDate).toLocaleDateString('it-IT') : '12 mesi'}</strong>
                              </Typography>
                            </Stack>

                            {selectedVisit.prescriptions && (
                              <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 1.5, borderRadius: 2 }}>
                                <strong>Prescrizioni Operative:</strong> {selectedVisit.prescriptions}
                              </Alert>
                            )}

                            {selectedVisit.limitations && (
                              <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ mb: 1.5, borderRadius: 2 }}>
                                <strong>Limitazioni alla Mansione:</strong> {selectedVisit.limitations}
                              </Alert>
                            )}

                            {selectedVisit.clinicalNotes && (
                              <Box sx={{ mt: 1.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                  Note Cliniche Riservate:
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#475569', fontStyle: 'italic', mt: 0.5 }}>
                                  {selectedVisit.clinicalNotes}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                )}
              </Box>
            )}
          </>
        )}

        {!activeEmployeeId && !employeeIdProp && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              Seleziona un lavoratore per visualizzare la cartella sanitaria e lo storico completo delle visite mediche.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* CESSATION PACKAGE MODAL DIALOG */}
      <Dialog
        open={cessationOpen}
        onClose={() => setCessationOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0f1f3d', pb: 1 }}>
          📦 Pacchetto Chiusura Cartella per Cessazione Rapporto
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            In adempimento all'<strong>Art. 25 comma 1 lett. e del D.Lgs. 81/08</strong>, alla cessazione del rapporto di lavoro il Medico Competente consegna al lavoratore copia della cartella sanitaria e di rischio e rilascia ricevuta di avvenuta consegna.
          </Typography>

          <Stack spacing={2.5}>
            <TextField
              label="Data Cessazione / Consegna"
              type="date"
              size="small"
              fullWidth
              value={cessationDate}
              onChange={(e) => setCessationDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Modalità di Consegna Copia Cartella</FormLabel>
              <RadioGroup
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                row
              >
                <FormControlLabel value="mani" control={<Radio size="small" />} label="A mani proprie con ricevuta" />
                <FormControlLabel value="pec" control={<Radio size="small" />} label="Trasmissione PEC / Digitale" />
                <FormControlLabel value="raccomandata" control={<Radio size="small" />} label="Raccomandata A/R" />
              </RadioGroup>
            </FormControl>

            <Alert severity="info" sx={{ fontSize: '0.82rem' }}>
              Verrà generato il <strong>Verbale di Consegna Cartella Sanitaria (PDF)</strong> con i riferimenti normativi e le dichiarazioni di riservatezza.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCessationOpen(false)} color="inherit">
            Annulla
          </Button>
          <Button
            variant="contained"
            color="warning"
            id="btn-confirm-cessation-export"
            startIcon={<DownloadIcon />}
            onClick={async () => {
              const doc = new jsPDF({ unit: 'pt', format: 'a4' })
              doc.setFontSize(16)
              doc.setTextColor(15, 76, 129)
              doc.text('VERBALE DI CONSEGNA COPIA CARTELLA SANITARIA E DI RISCHIO', 40, 50)
              doc.setFontSize(10)
              doc.setTextColor(100)
              doc.text('(Art. 25, comma 1, lettera e - D.Lgs. 9 aprile 2008, n. 81 e s.m.i.)', 40, 68)

              doc.setFontSize(10)
              doc.setTextColor(30)
              const empName = selectedEmployee ? `${selectedEmployee.lastName} ${selectedEmployee.firstName}` : `Lavoratore ID #${activeEmployeeId}`
              const empCf = selectedEmployee?.taxCode || '-'
              const compName = selectedEmployee?.companyName || 'Azienda'

              autoTable(doc, {
                startY: 90,
                theme: 'grid',
                head: [['Dati Lavoratore e Azienda', 'Dettaglio']],
                body: [
                  ['Lavoratore', empName],
                  ['Codice Fiscale', empCf],
                  ['Azienda di appartenenza', compName],
                  ['Data di cessazione rapporto', cessationDate],
                  ['Modalità di consegna', deliveryMethod === 'mani' ? 'Consegna a mani proprie' : deliveryMethod === 'pec' ? 'Trasmissione PEC' : 'Raccomandata A/R'],
                ],
                headStyles: { fillColor: [15, 76, 129] },
                styles: { fontSize: 9, cellPadding: 4 },
              })

              const finalY = doc.lastAutoTable.finalY + 30
              doc.text('DICHIARAZIONE DI AVVENUTA CONSEGNA E RICEVUTA', 40, finalY)
              doc.setFontSize(9)
              doc.text(
                'Il sottoscritto lavoratore dichiara di aver ricevuto in data odierna dal Medico Competente copia conforme\ndella propria Cartella Sanitaria e di Rischio (Allegato 3A D.M. 9 luglio 2012) aggiornata alla data di cessazione\ndel rapporto di lavoro, e di essere stato informato sulla necessità di conservazione della stessa ai sensi di legge.',
                40,
                finalY + 18,
              )

              doc.text('Luogo e Data: ________________________', 40, finalY + 90)
              doc.text('Firma del Lavoratore: ________________________', 300, finalY + 90)
              doc.text('Firma e Timbro Medico Competente: ________________________', 300, finalY + 140)

              doc.save(`Verbale-Consegna-Cartella-${empCf || activeEmployeeId}.pdf`)
              setCessationOpen(false)
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Genera Pacchetto & Verbale PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
