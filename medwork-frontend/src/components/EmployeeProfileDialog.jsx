import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
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
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import DatePicker from './DatePicker'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import BiotechIcon from '@mui/icons-material/Biotech'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import ShieldIcon from '@mui/icons-material/Shield'
import SaveIcon from '@mui/icons-material/Save'
import { apiGet, apiSend } from '../services/apiClient'
import CloseIcon from '@mui/icons-material/Close'
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
          // New fields loaded from employee object
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
        setDirty(false)
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

  const daysToDeadline = useMemo(() => {
    return daysDiffFromToday(latestVisit?.nextDeadlineDate)
  }, [latestVisit?.nextDeadlineDate])

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
      // For required integer FK fields, preserve the existing value if the form has no value
      // (e.g. when the seeder left them null). This prevents sending null for non-nullable ints.
      if (payload.companyId == null || payload.companyId === '') {
        payload.companyId = employee.companyId ?? 0
      }
      if (payload.branchId == null || payload.branchId === '') {
        payload.branchId = employee.branchId ?? 0
      }
      // Sanitize: convert empty strings to null for all fields EXCEPT numeric/date/bool fields
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
      // Notify WorkersCenter and any other listener to refresh this employee's row
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
        <Box sx={{ p: 2.5, background: '#0f1f3d', color: '#ffffff' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 62, height: 62 }}>{initials || 'DP'}</Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>{employee?.firstName} {employee?.lastName}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>{employee?.jobRole || '-'}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  {employee?.companyName || '-'} • {employee?.branchAddress || '-'} • <strong>Medico Competente: {employee?.companyDoctorName || 'Non assegnato'}</strong>
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end" alignItems="center">
              <Chip icon={<HealthAndSafetyIcon />} label={healthStatus.label} color={healthStatus.color} />
              <Chip label={`CF: ${employee?.taxCode || '-'}`} variant="outlined" sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.35)' }} />
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ px: 2.5, pt: 1.5, background: '#ffffff' }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab label="Scheda lavoratore" />
            <Tab label={`Elenco attività (${visits.length})`} />
          </Tabs>
        </Box>

        <Divider />

        <DialogContent sx={{ p: 2.5, background: '#f8f9fa' }}>
          {tab === 0 && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Anagrafica di base</Typography>
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
                    slotProps={{
                      textField: {
                        size: 'small',
                        InputLabelProps: { shrink: true },
                      },
                    }}
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
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Riferimenti medici</Typography>
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
                  <TextField size="small" label="Telefono medico" value={formData.telefonoMedico} onChange={handleFieldChange('telefonoMedico')} />
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
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Sorveglianza</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Mansione aziendale" value={formData.jobRole} onChange={handleFieldChange('jobRole')} />
                  <TextField size="small" label="Ruoli" value={formData.jobRole} onChange={handleFieldChange('jobRole')} helperText="Mansione principale" />
                  <TextField size="small" label="Reparto" value={formData.reparto} onChange={handleFieldChange('reparto')} />
                  <TextField size="small" label="Luogo di lavoro" value={formData.luogoDiLavoro} onChange={handleFieldChange('luogoDiLavoro')} />
                  <DatePicker
                    size="small"
                    label="Data ultima visita"
                    value={currentDateValue(formData.dataUltimaVisita)}
                    onChange={(date) => handleFieldChange('dataUltimaVisita')({ target: { value: formDateValue(date) } })}
                    inputFormat="dd/MM/yyyy"
                    locale={DATE_PICKER_LOCALE}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField size="small" label="Periodicità" select value={formData.periodicita} onChange={handleFieldChange('periodicita')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Annuale">Annuale</MenuItem>
                    <MenuItem value="Biennale">Biennale</MenuItem>
                    <MenuItem value="Triennale">Triennale</MenuItem>
                  </TextField>
                  <DatePicker
                    size="small"
                    label="Data prossima visita"
                    value={currentDateValue(formData.dataProssimaVisita)}
                    onChange={(date) => handleFieldChange('dataProssimaVisita')({ target: { value: formDateValue(date) } })}
                    inputFormat="dd/MM/yyyy"
                    locale={DATE_PICKER_LOCALE}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField size="small" label="Tipo prossima visita" select value={formData.tipoProssimaVisita} onChange={handleFieldChange('tipoProssimaVisita')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Periodica">Periodica</MenuItem>
                    <MenuItem value="Preventiva">Preventiva</MenuItem>
                  </TextField>
                  <DatePicker
                    size="small"
                    label="Data ultima visita RI"
                    value={currentDateValue(formData.dataUltimaVisitaRI)}
                    onChange={(date) => handleFieldChange('dataUltimaVisitaRI')({ target: { value: formDateValue(date) } })}
                    inputFormat="dd/MM/yyyy"
                    locale={DATE_PICKER_LOCALE}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField size="small" label="Periodicità visita RI" select value={formData.periodicitaVisitaRI} onChange={handleFieldChange('periodicitaVisitaRI')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Annuale">Annuale</MenuItem>
                    <MenuItem value="Biennale">Biennale</MenuItem>
                  </TextField>
                  <DatePicker
                    size="small"
                    label="Data prossima visita RI"
                    value={currentDateValue(formData.dataProssimaVisitaRI)}
                    onChange={(date) => handleFieldChange('dataProssimaVisitaRI')({ target: { value: formDateValue(date) } })}
                    inputFormat="dd/MM/yyyy"
                    locale={DATE_PICKER_LOCALE}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Dati aziendali</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <DatePicker
                    size="small"
                    label="Data assunzione"
                    value={currentDateValue(formData.dataAssunzione)}
                    onChange={(date) => handleFieldChange('dataAssunzione')({ target: { value: formDateValue(date) } })}
                    inputFormat="dd/MM/yyyy"
                    locale={DATE_PICKER_LOCALE}
                    InputLabelProps={{ shrink: true }}
                  />
                  <DatePicker
                    size="small"
                    label="Data attuale mansione"
                    value={currentDateValue(formData.dataAttualeMansione)}
                    onChange={(date) => handleFieldChange('dataAttualeMansione')({ target: { value: formDateValue(date) } })}
                    inputFormat="dd/MM/yyyy"
                    locale={DATE_PICKER_LOCALE}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField size="small" label="Referente aziendale" value={formData.referenteAziendale} onChange={handleFieldChange('referenteAziendale')} />
                  <TextField size="small" label="Identificativo MPI" value={formData.identificativoMPI} onChange={handleFieldChange('identificativoMPI')} />
                  <TextField size="small" label="Stato risorsa" select value={formData.statoRisorsa} onChange={handleFieldChange('statoRisorsa')}>
                    <MenuItem value="Attivo">Attivo</MenuItem>
                    <MenuItem value="Cessato">Cessato</MenuItem>
                    <MenuItem value="Sospeso">Sospeso</MenuItem>
                  </TextField>
                  <TextField size="small" label="Motivazione" value={formData.motivazione} onChange={handleFieldChange('motivazione')} />
                  <DatePicker
                    size="small"
                    label="Data cessazione/assenza"
                    value={currentDateValue(formData.dataCessazione)}
                    onChange={(date) => handleFieldChange('dataCessazione')({ target: { value: formDateValue(date) } })}
                    inputFormat="dd/MM/yyyy"
                    locale={DATE_PICKER_LOCALE}
                    InputLabelProps={{ shrink: true }}
                  />
                  <DatePicker
                    size="small"
                    label="Data riattivazione"
                    value={currentDateValue(formData.dataRiattivazione)}
                    onChange={(date) => handleFieldChange('dataRiattivazione')({ target: { value: formDateValue(date) } })}
                    inputFormat="dd/MM/yyyy"
                    locale={DATE_PICKER_LOCALE}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={<Switch size="small" checked={formData.categoriaProtetta} onChange={handleFieldChange('categoriaProtetta')} />}
                      label="Categoria protetta"
                    />
                    <FormControlLabel
                      control={<Switch size="small" checked={formData.documentiPrivacy} onChange={handleFieldChange('documentiPrivacy')} />}
                      label="Documenti privacy raccolti"
                    />
                  </Box>
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Note</Typography>
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
                    label="Note riservate"
                    multiline
                    minRows={3}
                    value={formData.noteRiservate}
                    onChange={handleFieldChange('noteRiservate')}
                  />
                  <TextField
                    size="small"
                    label="Note per l'azienda"
                    multiline
                    minRows={3}
                    value={formData.notePerAzienda}
                    onChange={handleFieldChange('notePerAzienda')}
                  />
                </Stack>
              </Paper>
            </Stack>
          )}

          {tab === 1 && (
            <Stack spacing={1}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Elenco attività</Typography>
                <Typography variant="caption" color="text.secondary">Attività sanitarie registrate per il lavoratore.</Typography>
              </Box>
              {sortedVisits.map((visit) => (
                <Paper key={visit.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{visit.visitType || 'Visita'} • {formatDate(visit.visitDate)}</Typography>
                      <Typography variant="caption" color="text.secondary">Esito: {visit.outcome || '-'}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">Scadenza: {formatDate(visit.nextDeadlineDate)}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
              {sortedVisits.length === 0 && <Alert severity="info">Nessuna attività registrata.</Alert>}
            </Stack>
          )}
        </DialogContent>

        {!!error && (
          <Box sx={{ px: 2.5, pb: 1 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <DialogActions sx={{ px: 2.5, py: 2, borderTop: '1px solid #eaeef5' }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
              onClick={handleSave}
              sx={{ bgcolor: '#1976d2', color: '#ffffff', '&:hover': { bgcolor: '#115293' }, fontWeight: 600 }}
            >
              {saving ? 'Salvataggio...' : 'Salva'}
            </Button>
            <Button
              variant="contained"
              startIcon={<MedicalServicesIcon />}
              disabled={!onOpenMedicalVisitCreate}
              onClick={() => {
                if (onOpenMedicalVisitCreate) {
                  onClose()
                  onOpenMedicalVisitCreate(employee?.id)
                }
              }}
            >
              Nuova visita
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

