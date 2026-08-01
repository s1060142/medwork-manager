import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'
import SignatureCapture from './SignatureCapture'

const STEP_LABELS = ['Anamnesi', 'Esame Obiettivo', 'Giudizio di Idoneità', 'Firma Grafometrica']

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
  objectiveExam: '',
  targetOrgans: '',
  outcome: '',
  clinicalNotes: '',
  signatureData: null, // Will store the base64 signature image data
}

function MedicalVisitStepper({ onCreated }) {
  const [activeStep, setActiveStep] = useState(0)
  const [employees, setEmployees] = useState([])
  const [formData, setFormData] = useState(initialData)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiGet('/api/master-data/employees')
      .then((employeeData) => {
        setEmployees(Array.isArray(employeeData) ? employeeData : [])
      })
      .catch((requestError) => {
        setError(requestError.message || 'Errore nel caricamento dei dati per la visita medica.')
      })
  }, [])

  const setField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const validateStep = () => {
    if (activeStep === 0) {
      if (!formData.employeeId || !formData.visitDate) {
        setError('Compila lavoratore e data visita nella sezione anamnesi.')
        return false
      }
    }

    if (activeStep === 1) {
      if (!String(formData.objectiveExam).trim() || !String(formData.targetOrgans).trim()) {
        setError('Compila esame obiettivo e organi bersaglio.')
        return false
      }
    }

    if (activeStep === 2) {
      if (!String(formData.outcome).trim() || !formData.nextDeadlineDate) {
        setError('Compila giudizio di idoneità e prossima scadenza.')
        return false
      }
    }

    // Step 3 (signature) is optional, no validation needed

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

  const handleSave = async () => {
    if (!validateStep()) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const createdVisit = await apiSend('POST', '/api/doctor-data/medical-visits', {
        employeeId: Number(formData.employeeId),
        doctorId: Number(formData.doctorId),
        visitDate: new Date(formData.visitDate).toISOString(),
        nextDeadlineDate: new Date(formData.nextDeadlineDate).toISOString(),
        visitType: formData.visitType,
        targetOrgans: formData.targetOrgans,
        objectiveExam: formData.objectiveExam,
        outcome: formData.outcome,
        clinicalNotes: formData.clinicalNotes,
      })

      await apiSend('POST', '/api/doctor-data/anamneses', {
        medicalVisitId: createdVisit.id,
        workHistory: formData.workHistory,
        personalHistory: formData.personalHistory,
        familyHistory: formData.familyHistory,
        remotePathology: formData.remotePathology,
        recentPathology: formData.recentPathonia,
      })

      // If we have a signature, create a graphic signature record
      if (formData.signatureData) {
        // First, get the employee to get the companyId
        const employeeResp = await apiGet(`/api/master-data/employees/${formData.employeeId}`)
        const companyId = employeeResp.companyId

        await apiSend('POST', '/api/graphic-signatures', {
          MedicalVisitId: createdVisit.id,
          DocumentType: 'FitnessJudgment',
          SignatureData: formData.signatureData,
          CompanyId: companyId,
        })
      }

      setSuccess('Visita medica, anamnesi e firma grafometrica registrate con successo.')
      setFormData(initialData)
      setActiveStep(0)

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
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6">Inserimento Visita Medica (Stepper)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Step 1: Anamnesi • Step 2: Esame Obiettivo/Organi Bersaglio • Step 3: Giudizio di Idoneità • Step 4: Firma Grafometrica.
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
              <TextField
                select
                label="Lavoratore"
                size="small"
                value={formData.employeeId}
                onChange={(event) => setField('employeeId', event.target.value)}
              >
                {employees.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {`${item.firstName} ${item.lastName}`}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                label="Medico competente"
                value="Assegnazione automatica"
                InputProps={{ readOnly: true }}
              />

              <TextField
                type="date"
                size="small"
                label="Data visita"
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
              >
                {VISIT_TYPES.map((value) => (
                  <MenuItem key={value} value={value}>{value}</MenuItem>
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
                value={`${formData.remotePathology}${formData.remotePathology && formData.recentPathologia ? '\n' : ''}${formData.recentPathologia}`}
                onChange={(event) => {
                  const parts = String(event.target.value || '').split('\n')
                  setField('remotePathology', parts[0] || '')
                  setField('recentPathology', parts.slice(1).join(' ') || '')
                }}
              />
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5 }}>
              <TextField
                label="Organi bersaglio"
                value={formData.targetOrgans}
                onChange={(event) => setField('targetOrgans', event.target.value)}
                placeholder="Es. Udito, apparato respiratorio"
              />
              <TextField
                multiline
                minRows={4}
                label="Esame obiettivo"
                value={formData.objectiveExam}
                onChange={(event) => setField('objectiveExam', event.target.value)}
              />
              <TextField
                multiline
                minRows={3}
                label="Note cliniche"
                value={formData.clinicalNotes}
                onChange={(event) => setField('clinicalNotes', event.target.value)}
              />
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
              <TextField
                label="Giudizio di idoneità"
                value={formData.outcome}
                onChange={(event) => setField('outcome', event.target.value)}
                placeholder="Es. Idoneo con prescrizioni"
              />
              <TextField
                type="date"
                size="small"
                label="Prossima scadenza"
                InputLabelProps={{ shrink: true }}
                value={formData.nextDeadlineDate}
                onChange={(event) => setField('nextDeadlineDate', event.target.value)}
              />
            </Box>
          )}

          {activeStep === 3 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
                Firma Grafometrica per il Giudizio di Idoneità
              </Typography>
              <SignatureCapture
                signatureData={formData.signatureData}
                onSignatureChange={(data) => setField('signatureData', data)}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Disegna la tua firma nel riquadro sopra. La firma sarà associata al giudizio di idoneità di questa visita.
              </Typography>
            </Box>
          )}
        </Box>

        <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mt: 2.5 }}>
          <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0 || saving}>
                      Indietro
                    </Button>
          {activeStep < STEP_LABELS.length - 1 ? (
            <Button variant="contained" onClick={handleNext} disabled={saving}>
              Avanti
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              Salva Visita
            </Button>
          )}
        </Stack>
      </Paper>

      {!!error && <Alert severity="error">{error}</Alert>}
      {!!success && <Alert severity="success">{success}</Alert>}
    </Stack>
  )
}

export default MedicalVisitStepper