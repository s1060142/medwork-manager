import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import InfoIcon from '@mui/icons-material/Info'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import { apiGet, apiSend } from '../services/apiClient'

const STEP_LABELS = ['Anamnesi', 'Esame Obiettivo', 'Giudizio di Idoneità']

const VISIT_TYPES = [
  'Preventive',
  'Periodic',
  'RoleChange',
  'EmployeeRequest',
  'EndOfRelationship',
]

const initialData = {
  employeeId: '',
  doctorId: 0,
  visitDate: new Date().toISOString().split('T')[0],
  nextDeadlineDate: '',
  visitType: 'Periodic',
  workHistory: '',
  personalHistory: '',
  familyHistory: '',
  remotePathology: '',
  recentPathology: '',
  targetOrgans: '',
  outcome: '',
  clinicalNotes: '',
  // Structured objective exam
  objCardio: 'nella norma',
  objResp: 'nella norma',
  objAddome: 'nella norma',
  objMusc: 'nella norma',
  objNeuro: 'nella norma',
  objCute: 'nella norma',
  objectiveExam: '', // Used for extra notes or legacy copied text
}

function MedicalVisitStepper({ onCreated }) {
  const [activeStep, setActiveStep] = useState(0)
  const [employees, setEmployees] = useState([])
  const [formData, setFormData] = useState(initialData)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [deadlineSource, setDeadlineSource] = useState('manual')
  
  // Phase 2 context state
  const [employeeContext, setEmployeeContext] = useState(null)
  const [copyingVisit, setCopyingVisit] = useState(false)

  // Phase 3 state
  const [phraseTemplates, setPhraseTemplates] = useState([])
  const [selectedPrescriptions, setSelectedPrescriptions] = useState({
    dpi: false,
    mmc: false,
    lenti: false,
    vdt: false
  })

  useEffect(() => {
    apiGet('/api/master-data/employees')
      .then((employeeData) => {
        setEmployees(Array.isArray(employeeData) ? employeeData : [])
      })
      .catch((requestError) => {
        setError(requestError.message || 'Errore nel caricamento dei dati.')
      })
      
    apiGet('/api/master-data/phrase-templates')
      .then(data => setPhraseTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Auto-fetch context when employee changes
  useEffect(() => {
    if (!formData.employeeId) {
      setEmployeeContext(null)
      return
    }
    
    apiGet(`/api/doctor-data/employees/${formData.employeeId}/context`)
      .then(data => setEmployeeContext(data))
      .catch(() => setEmployeeContext(null))
  }, [formData.employeeId])

  // Auto-fetch deadline preview
  useEffect(() => {
    if (!formData.employeeId || !formData.visitDate) return

    apiGet(
      `/api/doctor-data/deadline-preview?employeeId=${formData.employeeId}&visitDate=${formData.visitDate}`
    )
      .then(data => {
        if (data?.deadline) {
          setField('nextDeadlineDate', data.deadline.slice(0, 10))
          setDeadlineSource(data.hasProtocol ? 'auto' : 'manual')
        } else {
          setDeadlineSource('manual')
        }
      })
      .catch(() => setDeadlineSource('manual'))
  }, [formData.employeeId, formData.visitDate])

  const setField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleCopyLastVisit = async () => {
    if (!formData.employeeId) return
    setCopyingVisit(true)
    setError('')
    try {
      const data = await apiGet(`/api/doctor-data/employees/${formData.employeeId}/last-visit`)
      if (data) {
        setFormData(prev => ({
          ...prev,
          workHistory: data.workHistory || prev.workHistory,
          personalHistory: data.personalHistory || prev.personalHistory,
          familyHistory: data.familyHistory || prev.familyHistory,
          remotePathology: data.remotePathology || prev.remotePathology,
          recentPathology: data.recentPathology || prev.recentPathology,
          // Put old objective exam string into the extra notes to not overwrite structured inputs
          objectiveExam: data.objectiveExam || prev.objectiveExam,
        }))
        setSuccess('Dati copiati con successo dall\'ultima visita.')
      }
    } catch (err) {
      if (err.status === 204) {
        setError('Nessuna visita precedente trovata per questo lavoratore.')
      } else {
        setError('Errore durante la copia dei dati.')
      }
    } finally {
      setCopyingVisit(false)
      // clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const validateStep = () => {
    if (activeStep === 0) {
      if (!formData.employeeId || !formData.visitDate) {
        setError('Compila lavoratore e data visita nella sezione anamnesi.')
        return false
      }
    }
    if (activeStep === 1) {
      if (!String(formData.targetOrgans).trim()) {
        setError('Compila organi bersaglio.')
        return false
      }
    }
    if (activeStep === 2) {
      if (!String(formData.outcome).trim() || !formData.nextDeadlineDate) {
        setError('Compila giudizio di idoneità e prossima scadenza.')
        return false
      }
    }
    setError('')
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    setActiveStep((current) => Math.min(current + 1, STEP_LABELS.length - 1))
  }

  const handleBack = () => {
    setError('')
    setActiveStep((current) => Math.max(current - 1, 0))
  }

  const buildObjectiveExamString = () => {
    const parts = [
      `Cardiovascolare: ${formData.objCardio}`,
      `Respiratorio: ${formData.objResp}`,
      `Addome: ${formData.objAddome}`,
      `Muscoloscheletrico: ${formData.objMusc}`,
      `Neurologico: ${formData.objNeuro}`,
      `Cute e Annessi: ${formData.objCute}`
    ]
    if (formData.objectiveExam) {
      parts.push(`Note aggiuntive/Storico: ${formData.objectiveExam}`)
    }
    return parts.join('\n')
  }

  const handleSave = async () => {
    if (!validateStep()) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const finalObjectiveExam = buildObjectiveExamString()

      const createdVisit = await apiSend('POST', '/api/doctor-data/medical-visits', {
        employeeId: Number(formData.employeeId),
        doctorId: Number(formData.doctorId),
        visitDate: new Date(formData.visitDate).toISOString(),
        nextDeadlineDate: formData.nextDeadlineDate
          ? new Date(formData.nextDeadlineDate).toISOString()
          : new Date(formData.visitDate).toISOString(),
        visitType: formData.visitType,
        targetOrgans: formData.targetOrgans,
        objectiveExam: finalObjectiveExam,
        outcome: formData.outcome,
        clinicalNotes: formData.clinicalNotes,
      })

      await apiSend('POST', '/api/doctor-data/anamneses', {
        medicalVisitId: createdVisit.id,
        workHistory: formData.workHistory,
        personalHistory: formData.personalHistory,
        familyHistory: formData.familyHistory,
        remotePathology: formData.remotePathology,
        recentPathology: formData.recentPathology,
      })

      setSuccess('Visita medica e anamnesi registrate con successo.')
      setFormData(initialData)
      setActiveStep(0)
      setEmployeeContext(null)

      if (typeof onCreated === 'function') {
        onCreated(createdVisit)
      }
    } catch (requestError) {
      setError(requestError.message || 'Errore nel salvataggio della visita medica.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
      {/* MAIN CONTENT AREA */}
      <Stack spacing={2} sx={{ flexGrow: 1, minWidth: 0 }}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6">Inserimento Visita Medica (Stepper)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Step 1: Anamnesi • Step 2: Esame Obiettivo • Step 3: Giudizio di Idoneità.
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 3 }}>
            {activeStep === 0 && (
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    select
                    label="Lavoratore *"
                    size="small"
                    value={formData.employeeId}
                    onChange={(event) => setField('employeeId', event.target.value)}
                    sx={{ flexGrow: 1 }}
                  >
                    {employees.map((item) => (
                      <MenuItem key={item.id} value={item.id}>{`${item.firstName} ${item.lastName}`}</MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyLastVisit}
                    disabled={!formData.employeeId || copyingVisit}
                  >
                    Copia da ultima visita
                  </Button>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                  <TextField
                    size="small"
                    label="Medico competente"
                    value="Assegnazione automatica"
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    type="date"
                    size="small"
                    label="Data visita *"
                    InputLabelProps={{ shrink: true }}
                    value={formData.visitDate}
                    onChange={(event) => setField('visitDate', event.target.value)}
                  />
                  <TextField
                    select
                    label="Tipo visita"
                    size="small"
                    value={formData.visitType}
                    onChange={(event) => setField('visitType', event.target.value)}
                    sx={{ gridColumn: '1 / -1' }}
                  >
                    {VISIT_TYPES.map((value) => (
                      <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                  </TextField>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1, gap: 1 }}>
                    <FlashOnIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" color="primary">Frasi Rapide (Shortcodes)</Typography>
                  </Box>
                  <TextField
                    select
                    size="small"
                    label="Inserisci template clinico..."
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return
                      const phrase = phraseTemplates.find(p => p.id === e.target.value)
                      if (phrase) {
                        // Append to a default field (e.g. personalHistory) based on category
                        const targetField = phrase.category === 'AnamnesiLavorativa' ? 'workHistory' : 
                                            phrase.category === 'AnamnesiFamiliare' ? 'familyHistory' : 
                                            'personalHistory';
                        setField(targetField, formData[targetField] ? `${formData[targetField]}\n${phrase.text}` : phrase.text)
                      }
                    }}
                  >
                    <MenuItem value=""><em>Seleziona...</em></MenuItem>
                    {phraseTemplates.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.category} - {p.text.substring(0, 40)}...</MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    multiline
                    minRows={2}
                    label="Anamnesi lavorativa"
                    value={formData.workHistory}
                    onChange={(event) => setField('workHistory', event.target.value)}
                  />
                  <TextField
                    multiline
                    minRows={2}
                    label="Anamnesi personale"
                    value={formData.personalHistory}
                    onChange={(event) => setField('personalHistory', event.target.value)}
                  />
                  <TextField
                    multiline
                    minRows={2}
                    label="Anamnesi familiare"
                    value={formData.familyHistory}
                    onChange={(event) => setField('familyHistory', event.target.value)}
                  />
                  <TextField
                    multiline
                    minRows={2}
                    label="Patologie remote/recenti"
                    value={`${formData.remotePathology}${formData.remotePathology && formData.recentPathology ? '\n' : ''}${formData.recentPathology}`}
                    onChange={(event) => {
                      const parts = String(event.target.value || '').split('\n')
                      setField('remotePathology', parts[0] || '')
                      setField('recentPathology', parts.slice(1).join('\n') || '')
                    }}
                  />
                </Box>
              </Stack>
            )}

            {activeStep === 1 && (
              <Stack spacing={2}>
                <TextField
                  label="Organi bersaglio *"
                  value={formData.targetOrgans}
                  onChange={(event) => setField('targetOrgans', event.target.value)}
                  placeholder="Es. Udito, apparato respiratorio"
                  fullWidth
                />
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  ESAME OBIETTIVO STRUTTURATO
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                  <TextField
                    label="Cardiovascolare"
                    size="small"
                    value={formData.objCardio}
                    onChange={(e) => setField('objCardio', e.target.value)}
                  />
                  <TextField
                    label="Respiratorio"
                    size="small"
                    value={formData.objResp}
                    onChange={(e) => setField('objResp', e.target.value)}
                  />
                  <TextField
                    label="Addome"
                    size="small"
                    value={formData.objAddome}
                    onChange={(e) => setField('objAddome', e.target.value)}
                  />
                  <TextField
                    label="Muscoloscheletrico"
                    size="small"
                    value={formData.objMusc}
                    onChange={(e) => setField('objMusc', e.target.value)}
                  />
                  <TextField
                    label="Neurologico"
                    size="small"
                    value={formData.objNeuro}
                    onChange={(e) => setField('objNeuro', e.target.value)}
                  />
                  <TextField
                    label="Cute e Annessi"
                    size="small"
                    value={formData.objCute}
                    onChange={(e) => setField('objCute', e.target.value)}
                  />
                </Box>

                <TextField
                  multiline
                  minRows={3}
                  label="Note aggiuntive esame obiettivo / Storico"
                  value={formData.objectiveExam}
                  onChange={(event) => setField('objectiveExam', event.target.value)}
                  placeholder="Eventuali note libere..."
                />

                <TextField
                  multiline
                  minRows={3}
                  label="Note cliniche libere"
                  value={formData.clinicalNotes}
                  onChange={(event) => setField('clinicalNotes', event.target.value)}
                />
              </Stack>
            )}

            {activeStep === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                  <TextField
                    label="Giudizio di idoneità *"
                    value={formData.outcome}
                    onChange={(event) => setField('outcome', event.target.value)}
                    placeholder="Es. Idoneo con prescrizioni"
                  />
                  <TextField
                    type="date"
                    size="small"
                    label="Prossima scadenza *"
                    InputLabelProps={{ shrink: true }}
                    value={formData.nextDeadlineDate}
                    onChange={(event) => {
                      setField('nextDeadlineDate', event.target.value)
                      setDeadlineSource('manual')
                    }}
                    helperText={
                      deadlineSource === 'auto'
                        ? '✓ Calcolata automaticamente dal protocollo'
                        : 'Inserita manualmente'
                    }
                    FormHelperTextProps={{
                      sx: { color: deadlineSource === 'auto' ? 'success.main' : 'text.secondary' }
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>Prescrizioni Standardizzate</Typography>
                  <FormGroup sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                    <FormControlLabel 
                      control={<Checkbox checked={selectedPrescriptions.dpi} onChange={(e) => {
                        setSelectedPrescriptions(p => ({ ...p, dpi: e.target.checked }))
                        if (e.target.checked) setField('outcome', formData.outcome ? formData.outcome + ', uso obbligatorio DPI' : 'Uso obbligatorio DPI')
                      }} />} 
                      label="Uso obbligatorio DPI (udito/vista)" 
                    />
                    <FormControlLabel 
                      control={<Checkbox checked={selectedPrescriptions.mmc} onChange={(e) => {
                        setSelectedPrescriptions(p => ({ ...p, mmc: e.target.checked }))
                        if (e.target.checked) setField('outcome', formData.outcome ? formData.outcome + ', limitazione MMC' : 'Limitazione MMC')
                      }} />} 
                      label="Limitazione MMC" 
                    />
                    <FormControlLabel 
                      control={<Checkbox checked={selectedPrescriptions.lenti} onChange={(e) => {
                        setSelectedPrescriptions(p => ({ ...p, lenti: e.target.checked }))
                        if (e.target.checked) setField('outcome', formData.outcome ? formData.outcome + ', prescrizione lenti' : 'Prescrizione lenti')
                      }} />} 
                      label="Prescrizione lenti" 
                    />
                    <FormControlLabel 
                      control={<Checkbox checked={selectedPrescriptions.vdt} onChange={(e) => {
                        setSelectedPrescriptions(p => ({ ...p, vdt: e.target.checked }))
                        if (e.target.checked) setField('outcome', formData.outcome ? formData.outcome + ', pausa VDT 15 min ogni 2 ore' : 'Pausa VDT 15 min ogni 2 ore')
                      }} />} 
                      label="Pausa VDT 15 min ogni 2 ore" 
                    />
                  </FormGroup>
                </Box>
              </Box>
            )}
          </Box>

          <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0 || saving}>Indietro</Button>
            {activeStep < STEP_LABELS.length - 1 ? (
              <Button variant="contained" onClick={handleNext} disabled={saving}>Avanti</Button>
            ) : (
              <Button variant="contained" onClick={handleSave} disabled={saving}>Salva Visita</Button>
            )}
          </Stack>
        </Paper>

        {!!error && <Alert severity="error">{error}</Alert>}
        {!!success && <Alert severity="success">{success}</Alert>}
      </Stack>

      {/* SIDEBAR CONTESTUALE */}
      <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0 }}>
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, bgcolor: 'background.default' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <InfoIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight="bold">Contesto Lavoratore</Typography>
          </Stack>
          
          {!formData.employeeId ? (
            <Typography variant="body2" color="text.secondary">
              Seleziona un lavoratore per visualizzare lo storico.
            </Typography>
          ) : !employeeContext ? (
            <Typography variant="body2" color="text.secondary">
              Caricamento contesto...
            </Typography>
          ) : (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Mansione</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {employeeContext.jobRole || 'Non specificata'}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">Classe di Rischio</Typography>
                <Typography variant="body2" fontWeight="medium" color={employeeContext.riskLevelName ? 'error.main' : 'text.primary'}>
                  {employeeContext.riskLevelName || 'Nessun rischio assegnato'}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Ultime Visite (Storico)</Typography>
                {(!employeeContext.recentVisits || employeeContext.recentVisits.length === 0) ? (
                  <Typography variant="body2" color="text.secondary">Nessuna visita precedente.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {employeeContext.recentVisits.map((v, idx) => (
                      <Card key={idx} variant="outlined" sx={{ bgcolor: 'white' }}>
                        <CardContent sx={{ p: '8px !important' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {new Date(v.visitDate).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Esito: {v.outcome || 'N/D'}
                          </Typography>
                          {(v.bloodPressure || v.heartRate) && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              PA: {v.bloodPressure || '-'} | FC: {v.heartRate || '-'}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}
        </Paper>
      </Box>
    </Stack>
  )
}

export default MedicalVisitStepper
