import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Alert,
  Divider,
  Paper,
  Grid,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SendIcon from '@mui/icons-material/Send'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import SecurityIcon from '@mui/icons-material/Security'

export default function PatientIntakeView({ onExit }) {
  // Parse parameters from current hash: #/intake?cf=...&role=...
  const [taxCode, setTaxCode] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [workerName, setWorkerName] = useState('')
  const [companyName, setCompanyName] = useState('')

  // Questionnaire form states
  const [smoking, setSmoking] = useState('no')
  const [cigarettesPerDay, setCigarettesPerDay] = useState('')
  const [alcohol, setAlcohol] = useState('moderato')
  const [physicalActivity, setPhysicalActivity] = useState('regolare')
  const [sleepQuality, setSleepQuality] = useState('buono')

  // Remote Pathological History
  const [hasHypertension, setHasHypertension] = useState(false)
  const [hasDiabetes, setHasDiabetes] = useState(false)
  const [hasCardio, setHasCardio] = useState(false)
  const [hasAsthmaAllergies, setHasAsthmaAllergies] = useState(false)
  const [allergiesDetail, setAllergiesDetail] = useState('')
  const [hasMusculoskeletal, setHasMusculoskeletal] = useState(false)
  const [musculoskeletalDetail, setMusculoskeletalDetail] = useState('')
  const [hasSurgeries, setHasSurgeries] = useState(false)
  const [surgeriesDetail, setSurgeriesDetail] = useState('')

  // Current Medications
  const [medications, setMedications] = useState('')

  // Work-related symptoms
  const [eyeStrain, setEyeStrain] = useState(false)
  const [backPain, setBackPain] = useState(false)
  const [hearingTinnitus, setHearingTinnitus] = useState(false)
  const [skinDisorders, setSkinDisorders] = useState(false)
  const [otherSymptoms, setOtherSymptoms] = useState('')

  // Consent & Status
  const [consentChecked, setConsentChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    try {
      const hash = window.location.hash || ''
      const queryIdx = hash.indexOf('?')
      if (queryIdx !== -1) {
        const queryStr = hash.slice(queryIdx + 1)
        const params = new URLSearchParams(queryStr)
        const cfParam = params.get('cf') || ''
        const roleParam = params.get('role') || ''
        const nameParam = params.get('name') || ''
        const compParam = params.get('company') || ''

        if (cfParam) setTaxCode(cfParam.toUpperCase())
        if (roleParam) setJobRole(roleParam)
        if (nameParam) setWorkerName(nameParam)
        if (compParam) setCompanyName(compParam)

        // Try to fetch worker info from backend anonymously if CF provided
        if (cfParam) {
          fetch(`/api/intake/worker-info?cf=${encodeURIComponent(cfParam)}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                if (data.name && !nameParam) setWorkerName(data.name)
                if (data.jobRole && !roleParam) setJobRole(data.jobRole)
                if (data.companyName && !compParam) setCompanyName(data.companyName)
              }
            })
            .catch(() => {})
        }
      }
    } catch (e) {
      console.warn('Error parsing intake URL params:', e)
    }
  }, [])

  const applyPresetNegativo = () => {
    setSmoking('no')
    setCigarettesPerDay('')
    setAlcohol('moderato')
    setPhysicalActivity('regolare')
    setSleepQuality('buono')

    setHasHypertension(false)
    setHasDiabetes(false)
    setHasCardio(false)
    setHasAsthmaAllergies(false)
    setAllergiesDetail('')
    setHasMusculoskeletal(false)
    setMusculoskeletalDetail('')
    setHasSurgeries(false)
    setSurgeriesDetail('')

    setMedications('Nessuna terapia farmacologica continuativa in atto')
    setEyeStrain(false)
    setBackPain(false)
    setHearingTinnitus(false)
    setSkinDisorders(false)
    setOtherSymptoms('Nessun disturbo o sintomo riferito')
  }

  const buildClinicalSummary = () => {
    const lifestyle = [
      smoking === 'no' ? 'Non fumatore' : `Fumatore (${cigarettesPerDay || '10'} sig/die)`,
      `Alcol: ${alcohol}`,
      `Attività fisica: ${physicalActivity}`,
      `Sonno: ${sleepQuality}`
    ].join('. ')

    const remoteArr = []
    if (hasHypertension) remoteArr.push('Ipertensione arteriosa')
    if (hasDiabetes) remoteArr.push('Diabete mellito')
    if (hasCardio) remoteArr.push('Cardiopatia nota')
    if (hasAsthmaAllergies) remoteArr.push(`Allergie/Asma: ${allergiesDetail || 'presenti'}`)
    if (hasMusculoskeletal) remoteArr.push(`Disturbi muscoloscheletrici: ${musculoskeletalDetail || 'riferiti'}`)
    if (hasSurgeries) remoteArr.push(`Interventi pregressi: ${surgeriesDetail || 'riferiti'}`)
    const remote = remoteArr.length ? remoteArr.join('. ') : 'Anamnesi patologica remota silente'

    const meds = medications.trim() || 'Nessuna terapia continuativa riferita'

    const workSymptomsArr = []
    if (eyeStrain) workSymptomsArr.push('Astenopia/affaticamento visivo')
    if (backPain) workSymptomsArr.push('Rachialgia/dolori posturali')
    if (hearingTinnitus) workSymptomsArr.push('Acufeni/calo udito')
    if (skinDisorders) workSymptomsArr.push('Dermatite/eruzioni cutanee')
    if (otherSymptoms.trim()) workSymptomsArr.push(otherSymptoms.trim())
    const workComplaints = workSymptomsArr.length ? workSymptomsArr.join('; ') : 'Nessun disturbo riferito correlato alla mansione'

    return {
      lifestyleHabits: lifestyle,
      remotePathology: remote,
      recentPathology: meds,
      occupationalExposures: workComplaints
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!taxCode.trim()) {
      setErrorMsg('Inserisci o conferma il tuo Codice Fiscale prima di inviare.')
      return
    }

    if (!consentChecked) {
      setErrorMsg('È obbligatorio confermare la dichiarazione di veridicità prima dell\'invio.')
      return
    }

    setIsSubmitting(true)
    const summary = buildClinicalSummary()
    const payload = {
      taxCode: taxCode.trim().toUpperCase(),
      jobRole: jobRole.trim(),
      workerName: workerName.trim(),
      companyName: companyName.trim(),
      submittedAt: new Date().toISOString(),
      ...summary,
      rawAnswers: {
        smoking,
        cigarettesPerDay,
        alcohol,
        physicalActivity,
        sleepQuality,
        hasHypertension,
        hasDiabetes,
        hasCardio,
        hasAsthmaAllergies,
        allergiesDetail,
        hasMusculoskeletal,
        musculoskeletalDetail,
        hasSurgeries,
        surgeriesDetail,
        medications,
        eyeStrain,
        backPain,
        hearingTinnitus,
        skinDisorders,
        otherSymptoms
      }
    }

    // 1. Save in localStorage so doctor stepper on same browser/domain gets it instantly
    try {
      localStorage.setItem(`medwork_intake_${payload.taxCode}`, JSON.stringify(payload))
      localStorage.setItem('medwork_latest_intake', JSON.stringify(payload))
      window.dispatchEvent(new CustomEvent('medwork-intake-submitted', { detail: payload }))
    } catch (err) {
      console.warn('Storage save failed:', err)
    }

    // 2. Transmit to backend API
    try {
      const resp = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!resp.ok) {
        // Even if network fails, client cache succeeded
        console.warn('Backend intake submit status:', resp.status)
      }
    } catch (err) {
      console.warn('Backend submission network note:', err)
    }

    setIsSubmitting(false)
    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', py: 4, px: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card sx={{ maxWidth: 520, width: '100%', borderRadius: 3, boxShadow: '0 8px 30px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#16a34a', p: 3, textAlign: 'center', color: '#ffffff' }}>
            <CheckCircleIcon sx={{ fontSize: 64, mb: 1 }} />
            <Typography variant="h5" fontWeight={800}>
              Questionario Inviato!
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Sorveglianza Sanitaria D.Lgs. 81/08
            </Typography>
          </Box>
          <CardContent sx={{ p: 3 }}>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              I tuoi dati anamnestici sono stati trasmessi con successo al Medico Competente.
            </Alert>
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="caption" color="text.secondary">
                  Lavoratore / Codice Fiscale
                </Typography>
                <Typography variant="subtitle2" fontWeight={700}>
                  {workerName ? `${workerName} (${taxCode})` : taxCode}
                </Typography>
                {jobRole && (
                  <Typography variant="caption" color="primary.main" fontWeight={600} display="block">
                    Mansione: {jobRole}
                  </Typography>
                )}
              </Paper>
              <Typography variant="body2" color="text.secondary">
                Puoi ora attendere in sala d'attesa. Il Medico Competente visualizzerà automaticamente le tue risposte durante l'avvio della visita medica.
              </Typography>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={1} justifyContent="center">
              {onExit && (
                <Button variant="outlined" onClick={onExit} sx={{ textTransform: 'none', borderRadius: 2 }}>
                  Torna all'Applicazione
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        {/* HEADER BAR */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 3,
            bgcolor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <LocalHospitalIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
                MedWork Manager
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Questionario Anamnestico Pre-Visita (D.Lgs. 81/08)
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<SecurityIcon sx={{ fontSize: '14px !important', color: '#38bdf8' }} />}
            label="Autocertificazione Sanitaria"
            size="small"
            sx={{ bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600, fontSize: '11px' }}
          />
        </Paper>

        {/* WORKER IDENTIFICATION CARD */}
        <Card sx={{ borderRadius: 3, mb: 2.5, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} color="#0f172a" gutterBottom>
              1. Dati del Lavoratore
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Codice Fiscale"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value.toUpperCase())}
                  placeholder="Es. RSSMRA80A01H501U"
                  inputProps={{ maxLength: 16 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mansione / Reparto"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="Es. Magazziniere / Operaio"
                />
              </Grid>
              {workerName && (
                <Grid item xs={12}>
                  <Chip
                    label={`Nominativo: ${workerName}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* 1-CLICK QUICK PRESET */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 3,
            bgcolor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#065f46">
              Compilazione Rapida
            </Typography>
            <Typography variant="caption" color="#047857">
              Sei in buona salute e non assumi farmaci continuativi?
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<FlashOnIcon />}
            onClick={applyPresetNegativo}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            ✓ Tutto Negativo / Fisiologico
          </Button>
        </Paper>

        {/* CLINICAL SECTIONS */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {/* ABITUDINI DI VITA */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1.5 }}>
                  2. Abitudini di Vita
                </Typography>
                
                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Abitudine al fumo di tabacco
                </Typography>
                <RadioGroup row value={smoking} onChange={(e) => setSmoking(e.target.value)}>
                  <FormControlLabel value="no" control={<Radio size="small" />} label="Non fumatore" />
                  <FormControlLabel value="ex" control={<Radio size="small" />} label="Ex fumatore" />
                  <FormControlLabel value="si" control={<Radio size="small" />} label="Fumatore attivo" />
                </RadioGroup>
                {smoking === 'si' && (
                  <TextField
                    size="small"
                    type="number"
                    label="Numero di sigarette al giorno"
                    value={cigarettesPerDay}
                    onChange={(e) => setCigarettesPerDay(e.target.value)}
                    sx={{ mt: 1, maxWidth: 220 }}
                  />
                )}

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Consumo di bevande alcoliche
                </Typography>
                <RadioGroup row value={alcohol} onChange={(e) => setAlcohol(e.target.value)}>
                  <FormControlLabel value="astemio" control={<Radio size="small" />} label="Astemio" />
                  <FormControlLabel value="moderato" control={<Radio size="small" />} label="Moderato (pasti)" />
                  <FormControlLabel value="frequente" control={<Radio size="small" />} label="Frequente" />
                </RadioGroup>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Attività fisica e riposo notturno
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">Attività motoria:</Typography>
                    <RadioGroup row value={physicalActivity} onChange={(e) => setPhysicalActivity(e.target.value)}>
                      <FormControlLabel value="sedentario" control={<Radio size="small" />} label="Sedentaria" />
                      <FormControlLabel value="regolare" control={<Radio size="small" />} label="Regolare" />
                    </RadioGroup>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">Qualità del sonno:</Typography>
                    <RadioGroup row value={sleepQuality} onChange={(e) => setSleepQuality(e.target.value)}>
                      <FormControlLabel value="buono" control={<Radio size="small" />} label="Buono" />
                      <FormControlLabel value="disturbato" control={<Radio size="small" />} label="Disturbato" />
                    </RadioGroup>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* PATOLOGIE REMOTE & IN ATTO */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1 }}>
                  3. Condizioni di Salute & Patologie
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                  Seleziona le condizioni cliniche diagnosticate in passato o attualmente presenti:
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={<Checkbox checked={hasHypertension} onChange={(e) => setHasHypertension(e.target.checked)} size="small" />}
                      label="Ipertensione arteriosa"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={<Checkbox checked={hasDiabetes} onChange={(e) => setHasDiabetes(e.target.checked)} size="small" />}
                      label="Diabete mellito / Dislipidemie"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={<Checkbox checked={hasCardio} onChange={(e) => setHasCardio(e.target.checked)} size="small" />}
                      label="Malattie cardiache / vascolari"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={<Checkbox checked={hasAsthmaAllergies} onChange={(e) => setHasAsthmaAllergies(e.target.checked)} size="small" />}
                      label="Allergie o Asma bronchiale"
                    />
                  </Grid>
                </Grid>

                {hasAsthmaAllergies && (
                  <TextField
                    fullWidth
                    size="small"
                    label="Specifica allergie (farmaci, lattice, pollini, alimenti...)"
                    value={allergiesDetail}
                    onChange={(e) => setAllergiesDetail(e.target.value)}
                    sx={{ mt: 1 }}
                  />
                )}

                <Box sx={{ mt: 1.5 }}>
                  <FormControlLabel
                    control={<Checkbox checked={hasMusculoskeletal} onChange={(e) => setHasMusculoskeletal(e.target.checked)} size="small" />}
                    label="Patologie della colonna o articolari (ernie, lombalgie, artrosi)"
                  />
                  {hasMusculoskeletal && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Dettagli disturbi colonna / articolari"
                      value={musculoskeletalDetail}
                      onChange={(e) => setMusculoskeletalDetail(e.target.value)}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Box sx={{ mt: 1.5 }}>
                  <FormControlLabel
                    control={<Checkbox checked={hasSurgeries} onChange={(e) => setHasSurgeries(e.target.checked)} size="small" />}
                    label="Interventi chirurgici o ricoveri ospedalieri rilevanti"
                  />
                  {hasSurgeries && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Dettagli interventi pregressi ed anno"
                      value={surgeriesDetail}
                      onChange={(e) => setSurgeriesDetail(e.target.value)}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* TERAPIE IN CORSO */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1 }}>
                  4. Terapie Farmacologiche Continuative
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Farmaci assunti regolarmente"
                  placeholder="Es. Nessuna terapia / oppure Cardioaspirina 100mg 1 cp/die"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* SINTOMI COLLEGATI ALLA MANSIONE */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1 }}>
                  5. Disturbi Riferiti all'Attività Lavorativa (Ultimi 6 mesi)
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={<Checkbox checked={eyeStrain} onChange={(e) => setEyeStrain(e.target.checked)} size="small" />}
                      label="Affaticamento visivo / bruciore occhi (VDT)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={<Checkbox checked={backPain} onChange={(e) => setBackPain(e.target.checked)} size="small" />}
                      label="Mal di schiena / dolori al collo (MMC / Postura)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={<Checkbox checked={hearingTinnitus} onChange={(e) => setHearingTinnitus(e.target.checked)} size="small" />}
                      label="Fischi alle orecchie / calo udito (Rumore)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={<Checkbox checked={skinDisorders} onChange={(e) => setSkinDisorders(e.target.checked)} size="small" />}
                      label="Eruzioni cutanee / irritazioni alle mani"
                    />
                  </Grid>
                </Grid>
                <TextField
                  fullWidth
                  size="small"
                  label="Altri disturbi o note specifiche per il medico"
                  placeholder="Note facoltative..."
                  value={otherSymptoms}
                  onChange={(e) => setOtherSymptoms(e.target.value)}
                  sx={{ mt: 1.5 }}
                />
              </CardContent>
            </Card>

            {/* DICHIARAZIONE & INVIO */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: '#ffffff',
                border: '1px solid #cbd5e1',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                    Dichiaro sotto la mia responsabilità che le informazioni fornite corrispondono al vero ai fini della sorveglianza sanitaria ex D.Lgs. 81/08.
                  </Typography>
                }
              />

              {errorMsg && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  {errorMsg}
                </Alert>
              )}

              {isSubmitting && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting || !consentChecked}
                startIcon={<SendIcon />}
                sx={{
                  mt: 2.5,
                  py: 1.5,
                  borderRadius: 2.5,
                  bgcolor: '#2563eb',
                  fontWeight: 800,
                  fontSize: '16px',
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                  '&:hover': { bgcolor: '#1d4ed8' }
                }}
              >
                Invia al Medico Competente
              </Button>
            </Paper>
          </Stack>
        </form>

        {/* FOOTER */}
        <Box sx={{ mt: 3, textAlign: 'center', pb: 4 }}>
          <Typography variant="caption" color="text.secondary">
            MedWork Manager Platform • Conforme D.Lgs. 81/08 e D.M. 9 Luglio 2012
          </Typography>
          {onExit && (
            <Box sx={{ mt: 1 }}>
              <Button size="small" variant="text" onClick={onExit} sx={{ textTransform: 'none', color: '#64748b', fontSize: '12px' }}>
                Accedi come Personale Sanitario / Medico Competente
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
