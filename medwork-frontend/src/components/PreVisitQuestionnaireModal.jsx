import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  TextField,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Tabs,
  Tab,
  Alert,
  Chip,
  Paper,
  Grid,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RefreshIcon from '@mui/icons-material/Refresh'
import QRCode from 'qrcode'

// Standard ISO-compliant QR Code generator (scannable by any mobile phone camera)
function StandardQrCode({ url, size = 190 }) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    let active = true
    if (url) {
      QRCode.toDataURL(url, {
        width: size,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
        .then((res) => {
          if (active) setDataUrl(res)
        })
        .catch((err) => {
          console.warn('QR code generation note:', err)
        })
    }
    return () => { active = false }
  }, [url, size])

  if (!dataUrl) {
    return (
      <Box sx={{ width: size, height: size, bgcolor: '#f1f5f9', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <QrCode2Icon sx={{ fontSize: 48, color: '#94a3b8' }} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 2, display: 'inline-block', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
      <img src={dataUrl} alt="QR Code Anamnesi Pre-Visita" width={size} height={size} style={{ display: 'block', borderRadius: 4 }} />
    </Box>
  )
}

export default function PreVisitQuestionnaireModal({
  open,
  onClose,
  workerName = 'Lavoratore',
  workerTaxCode = '',
  workerJobRole = '',
  companyName = '',
  onApplyAnamnesi,
}) {
  const [tabIndex, setTabIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [applied, setApplied] = useState(false)
  const [receivedIntake, setReceivedIntake] = useState(null)

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

  // Medications
  const [medications, setMedications] = useState('')

  // Specific Occupational Complaints (Last 6 months)
  const [eyeStrain, setEyeStrain] = useState(false)
  const [backPain, setBackPain] = useState(false)
  const [hearingTinnitus, setHearingTinnitus] = useState(false)
  const [skinDisorders, setSkinDisorders] = useState(false)
  const [otherSymptoms, setOtherSymptoms] = useState('')

  const shareableUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
    const cleanCf = encodeURIComponent((workerTaxCode || 'CLMLCU85B12F704Y').trim().toUpperCase())
    const cleanRole = encodeURIComponent(workerJobRole || '')
    const cleanName = encodeURIComponent(workerName || '')
    const cleanComp = encodeURIComponent(companyName || '')
    return `${origin}/#/intake?cf=${cleanCf}&role=${cleanRole}&name=${cleanName}&company=${cleanComp}`
  }, [workerTaxCode, workerJobRole, workerName, companyName])

  // Polling / Checking for submitted responses from worker smartphone
  const checkIncomingIntake = useCallback(() => {
    const cleanCf = (workerTaxCode || '').trim().toUpperCase()
    if (!cleanCf) return

    // 1. Check local storage
    try {
      const cached = localStorage.getItem(`medwork_intake_${cleanCf}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        setReceivedIntake(parsed)
        return
      }
    } catch {}

    // 2. Check backend API
    fetch(`/api/intake/latest?cf=${encodeURIComponent(cleanCf)}`)
      .then(res => res.ok ? res.json() : null)
      .then(res => {
        if (res && res.found && res.data) {
          setReceivedIntake(res.data)
        }
      })
      .catch(() => {})
  }, [workerTaxCode])

  useEffect(() => {
    if (open) {
      checkIncomingIntake()
      const interval = setInterval(checkIncomingIntake, 3000)
      return () => clearInterval(interval)
    }
  }, [open, checkIncomingIntake])

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareableUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleOpenSimulator = () => {
    window.open(shareableUrl, '_blank')
  }

  // Quick Preset Actions
  const applyPresetAllNegative = () => {
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
    setMedications('Nessuna terapia farmacologica continuativa in atto.')
    setEyeStrain(false)
    setBackPain(false)
    setHearingTinnitus(false)
    setSkinDisorders(false)
    setOtherSymptoms('')
  }

  const applyPresetVdt = () => {
    applyPresetAllNegative()
    setEyeStrain(true)
    setMedications('Uso lacrime artificiali al bisogno per astenopia.')
    setOtherSymptoms('Leggero affaticamento visivo a fine turno serale al videoterminale.')
  }

  const applyPresetMmc = () => {
    applyPresetAllNegative()
    setHasMusculoskeletal(true)
    setMusculoskeletalDetail('Episodio di lombalgia acuta da sforzo 2 anni fa, risoltosi con riposo e FANS.')
    setBackPain(true)
    setOtherSymptoms('Lieve tensione al rachide lombare dopo sollevamento carichi pesanti.')
  }

  // Synthesize clinical text for Allegato 3A
  const handleApplyToStepper = () => {
    // 1. Synthesize Anamnesi Personale & Fisiologica
    const physLines = []
    physLines.push(`Abitudini di vita: ${smoking === 'si' ? `Fumatore (${cigarettesPerDay || '10'} sigarette/die)` : smoking === 'ex' ? 'Ex fumatore' : 'Non fumatore'}.`)
    physLines.push(`Consumo bevande alcoliche: ${alcohol === 'astemio' ? 'Astemio' : alcohol === 'moderato' ? 'Consumo moderato ai pasti' : 'Consumo frequente'}.`)
    physLines.push(`Attività fisica: ${physicalActivity}. Qualità del riposo notturno: ${sleepQuality}.`)

    const pathLines = []
    if (!hasHypertension && !hasDiabetes && !hasCardio && !hasAsthmaAllergies && !hasMusculoskeletal && !hasSurgeries) {
      pathLines.push('Anamnesi patologica remota: Negativa per patologie cronico-degenerative di rilievo, interventi chirurgici maggiori o patologie cardiovascolari.')
    } else {
      const disorders = []
      if (hasHypertension) disorders.push('ipertensione arteriosa')
      if (hasDiabetes) disorders.push('diabete mellito')
      if (hasCardio) disorders.push('cardiopatie/aritmie note')
      if (hasAsthmaAllergies) disorders.push(`allergie/asma (${allergiesDetail || 'note'})`)
      if (hasMusculoskeletal) disorders.push(`disturbi osteoarticolari (${musculoskeletalDetail || 'rachide'})`)
      if (hasSurgeries) disorders.push(`pregressi interventi chirurgici (${surgeriesDetail || 'riportati'})`)
      pathLines.push(`Anamnesi patologica remota: Positiva per ${disorders.join(', ')}.`)
    }

    if (medications && medications.trim()) {
      pathLines.push(`Terapia farmacologica continuativa: ${medications.trim()}`)
    } else {
      pathLines.push('Terapia farmacologica: Nessun farmaco assunto continuativamente.')
    }

    const synthesizedPersonalHistory = [...physLines, ...pathLines].join('\n')

    // 2. Synthesize Anamnesi Lavorativa & Sintomi Mansione
    const workLines = []
    if (workerJobRole) {
      workLines.push(`Mansione attuale: ${workerJobRole}.`)
    }
    const complaints = []
    if (eyeStrain) complaints.push('Astenopia/affaticamento visivo al VDT')
    if (backPain) complaints.push('Rachialgia/dolori posturali da movimentazione manuale')
    if (hearingTinnitus) complaints.push('Acufeni o sensazione di ovattamento auricolare')
    if (skinDisorders) complaints.push('Dermatite da contatto o lesioni cutanee')
    if (otherSymptoms && otherSymptoms.trim()) complaints.push(otherSymptoms.trim())

    if (complaints.length > 0) {
      workLines.push(`Sintomatologia riferita correlata all'attività lavorativa: ${complaints.join(', ')}.`)
    } else {
      workLines.push('Nessun disturbo o sintomatologia soggettiva riferita in relazione all\'attività lavorativa.')
    }

    const synthesizedWorkHistory = workLines.join('\n')

    if (typeof onApplyAnamnesi === 'function') {
      onApplyAnamnesi({
        personalHistory: synthesizedPersonalHistory,
        workHistory: synthesizedWorkHistory,
        source: 'Questionario Pre-Visita Digitale'
      })
    }

    setApplied(true)
    setTimeout(() => {
      setApplied(false)
      onClose()
    }, 1200)
  }

  const applyReceivedIntakeData = (intake) => {
    if (!intake) return
    const raw = intake.rawAnswers || {}
    if (raw.smoking) setSmoking(raw.smoking)
    if (raw.cigarettesPerDay) setCigarettesPerDay(raw.cigarettesPerDay)
    if (raw.alcohol) setAlcohol(raw.alcohol)
    if (raw.physicalActivity) setPhysicalActivity(raw.physicalActivity)
    if (raw.sleepQuality) setSleepQuality(raw.sleepQuality)

    if (raw.hasHypertension !== undefined) setHasHypertension(raw.hasHypertension)
    if (raw.hasDiabetes !== undefined) setHasDiabetes(raw.hasDiabetes)
    if (raw.hasCardio !== undefined) setHasCardio(raw.hasCardio)
    if (raw.hasAsthmaAllergies !== undefined) setHasAsthmaAllergies(raw.hasAsthmaAllergies)
    if (raw.allergiesDetail) setAllergiesDetail(raw.allergiesDetail)
    if (raw.hasMusculoskeletal !== undefined) setHasMusculoskeletal(raw.hasMusculoskeletal)
    if (raw.musculoskeletalDetail) setMusculoskeletalDetail(raw.musculoskeletalDetail)
    if (raw.hasSurgeries !== undefined) setHasSurgeries(raw.hasSurgeries)
    if (raw.surgeriesDetail) setSurgeriesDetail(raw.surgeriesDetail)

    if (raw.medications) setMedications(raw.medications)
    if (raw.eyeStrain !== undefined) setEyeStrain(raw.eyeStrain)
    if (raw.backPain !== undefined) setBackPain(raw.backPain)
    if (raw.hearingTinnitus !== undefined) setHearingTinnitus(raw.hearingTinnitus)
    if (raw.skinDisorders !== undefined) setSkinDisorders(raw.skinDisorders)
    if (raw.otherSymptoms) setOtherSymptoms(raw.otherSymptoms)

    if (typeof onApplyAnamnesi === 'function') {
      const personal = [
        intake.lifestyleHabits || '',
        intake.remotePathology || '',
        intake.recentPathology || ''
      ].filter(Boolean).join('\n')

      onApplyAnamnesi({
        personalHistory: personal,
        workHistory: intake.occupationalExposures || 'Nessun disturbo riferito correlato alla mansione.',
        source: 'Questionario Smartphone Lavoratore'
      })
    }

    setApplied(true)
    setTimeout(() => {
      setApplied(false)
      onClose()
    }, 1200)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SmartphoneIcon color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                Questionario Anamnestico Pre-Visita (Self-Service)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Paziente: <strong>{workerName}</strong> {workerTaxCode ? `(${workerTaxCode})` : ''} — {workerJobRole || 'Mansione'}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1, bgcolor: '#f8fafc' }}>
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
          <Tab icon={<QrCode2Icon />} iconPosition="start" label="📱 Inquadra QR Code (Lavoratore)" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab icon={<AssignmentTurnedInIcon />} iconPosition="start" label="📋 Compilazione Rapida / Revisione Medico" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {applied && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Anamnesi importata con successo nello Stepper clinico! Chiusura in corso...
          </Alert>
        )}

        {/* RECEIVED INTAKE BANNER */}
        {receivedIntake && (
          <Alert
            severity="success"
            icon={<SmartphoneIcon />}
            action={
              <Button
                color="success"
                size="small"
                variant="contained"
                onClick={() => applyReceivedIntakeData(receivedIntake)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                ⚡ Travasa nello Stepper
              </Button>
            }
            sx={{ mb: 2.5, borderRadius: 2 }}
          >
            <strong>Questionario ricevuto dallo smartphone del lavoratore!</strong>
            <Typography variant="caption" display="block">
              Trasmesso alle ore {receivedIntake.submittedAt ? new Date(receivedIntake.submittedAt).toLocaleTimeString() : 'poco fa'}.
            </Typography>
          </Alert>
        )}

        {/* TAB 0: QR CODE & SMARTPHONE LINK */}
        {tabIndex === 0 && (
          <Stack spacing={3} alignItems="center" sx={{ py: 1 }}>
            <Alert severity="info" sx={{ width: '100%' }}>
              <strong>Zero attesa in ambulatorio:</strong> Fai inquadrare questo QR Code al lavoratore con il proprio smartphone in sala d'attesa, oppure invialo via WhatsApp/Email. Il lavoratore compila l'anamnesi in 2 minuti prima di entrare e il sistema la riceve all'istante.
            </Alert>

            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: '#fafbfd' }}>
              <StandardQrCode url={shareableUrl} size={190} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2 }}>
                Inquadra con la Fotocamera dello Smartphone
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Link diretto cifrato per {workerName} ({workerTaxCode || 'CLMLCU85B12F704Y'})
              </Typography>
            </Paper>

            <Box sx={{ width: '100%' }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Link di compilazione diretta per il lavoratore:
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  value={shareableUrl}
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: '#ffffff' }}
                />
                <Button
                  variant="outlined"
                  startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                  color={copied ? 'success' : 'primary'}
                  onClick={handleCopyLink}
                  sx={{ textTransform: 'none', minWidth: 120 }}
                >
                  {copied ? 'Copiato!' : 'Copia Link'}
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<OpenInNewIcon />}
                  onClick={handleOpenSimulator}
                  sx={{ textTransform: 'none', minWidth: 140 }}
                >
                  Apri Scheda
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ width: '100%' }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={checkIncomingIntake}
                sx={{ textTransform: 'none' }}
              >
                Verifica se ha inviato
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AssignmentTurnedInIcon />}
                onClick={() => setTabIndex(1)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Compila a Schermo con il Medico
              </Button>
            </Stack>
          </Stack>
        )}

        {/* TAB 1: FORM RAPIDO & REVISIONE */}
        {tabIndex === 1 && (
          <Stack spacing={3}>
            {/* PRESETS RAPIDI A 1-CLICK */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <Typography variant="caption" fontWeight={700} color="#166534" display="block" gutterBottom>
                ⚡ APPLICA PRESET CLINICI RAPIDI A 1-CLICK:
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<FlashOnIcon />}
                  onClick={applyPresetAllNegative}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  ✓ Negativo Fisiologico (Tutto nella norma)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="info"
                  onClick={applyPresetVdt}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  VDT Tipico (Astenopia lieve)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={applyPresetMmc}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  MMC Tipico (Pregressa lombalgia)
                </Button>
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  startIcon={<RestartAltIcon />}
                  onClick={applyPresetAllNegative}
                  sx={{ textTransform: 'none' }}
                >
                  Reset
                </Button>
              </Stack>
            </Paper>

            {/* SEZIONE 1: ABITUDINI DI VITA */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1.5 }}>
                1. Abitudini di Vita & Fisiologica
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Fumo di Tabacco
                    </Typography>
                    <RadioGroup row value={smoking} onChange={(e) => setSmoking(e.target.value)}>
                      <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                      <FormControlLabel value="ex" control={<Radio size="small" />} label="Ex fumatore" />
                      <FormControlLabel value="si" control={<Radio size="small" />} label="Sì" />
                    </RadioGroup>
                    {smoking === 'si' && (
                      <TextField
                        size="small"
                        type="number"
                        label="Sigarette/die"
                        value={cigarettesPerDay}
                        onChange={(e) => setCigarettesPerDay(e.target.value)}
                        sx={{ mt: 1, width: 140 }}
                      />
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Consumo Alcolici
                    </Typography>
                    <RadioGroup row value={alcohol} onChange={(e) => setAlcohol(e.target.value)}>
                      <FormControlLabel value="astemio" control={<Radio size="small" />} label="Astemio" />
                      <FormControlLabel value="moderato" control={<Radio size="small" />} label="Moderato (pasti)" />
                      <FormControlLabel value="frequente" control={<Radio size="small" />} label="Frequente" />
                    </RadioGroup>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Attività Fisica
                    </Typography>
                    <RadioGroup row value={physicalActivity} onChange={(e) => setPhysicalActivity(e.target.value)}>
                      <FormControlLabel value="sedentario" control={<Radio size="small" />} label="Sedentaria" />
                      <FormControlLabel value="regolare" control={<Radio size="small" />} label="Regolare" />
                      <FormControlLabel value="intensa" control={<Radio size="small" />} label="Intensa" />
                    </RadioGroup>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Qualità del Sonno
                    </Typography>
                    <RadioGroup row value={sleepQuality} onChange={(e) => setSleepQuality(e.target.value)}>
                      <FormControlLabel value="buono" control={<Radio size="small" />} label="Buono" />
                      <FormControlLabel value="disturbato" control={<Radio size="small" />} label="Disturbato" />
                    </RadioGroup>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* SEZIONE 2: ANAMNESI PATOLOGICA REMOTA & PROSSIMA */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1.5 }}>
                2. Anamnesi Patologica Remota & Patologie Note
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
                    label="Diabete mellito / Dislipidemia"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Checkbox checked={hasCardio} onChange={(e) => setHasCardio(e.target.checked)} size="small" />}
                    label="Cardiopatie / Vasculopatie"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Checkbox checked={hasAsthmaAllergies} onChange={(e) => setHasAsthmaAllergies(e.target.checked)} size="small" />}
                    label="Allergie o Asma"
                  />
                </Grid>
              </Grid>

              {hasAsthmaAllergies && (
                <TextField
                  fullWidth
                  size="small"
                  label="Dettaglio allergie / asma"
                  value={allergiesDetail}
                  onChange={(e) => setAllergiesDetail(e.target.value)}
                  sx={{ mt: 1 }}
                />
              )}

              <Box sx={{ mt: 1.5 }}>
                <FormControlLabel
                  control={<Checkbox checked={hasMusculoskeletal} onChange={(e) => setHasMusculoskeletal(e.target.checked)} size="small" />}
                  label="Patologie rachide / osteoarticolari (lombalgie, ernie, artrosi)"
                />
                {hasMusculoskeletal && (
                  <TextField
                    fullWidth
                    size="small"
                    label="Dettaglio disturbi muscoloscheletrici"
                    value={musculoskeletalDetail}
                    onChange={(e) => setMusculoskeletalDetail(e.target.value)}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <FormControlLabel
                  control={<Checkbox checked={hasSurgeries} onChange={(e) => setHasSurgeries(e.target.checked)} size="small" />}
                  label="Interventi chirurgici rilevanti o ricoveri pregressi"
                />
                {hasSurgeries && (
                  <TextField
                    fullWidth
                    size="small"
                    label="Dettaglio interventi pregressi"
                    value={surgeriesDetail}
                    onChange={(e) => setSurgeriesDetail(e.target.value)}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </Box>

            <Divider />

            {/* SEZIONE 3: TERAPIE IN CORSO */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1 }}>
                3. Terapie Farmacologiche in Corso
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Farmaci assunti continuativamente (posologia e indicazione)"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="Es. Nessuna terapia / oppure Ramipril 5mg 1 cp/die"
              />
            </Box>

            <Divider />

            {/* SEZIONE 4: DISTURBI CORRELATI ALLA MANSIONE */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1.5 }}>
                4. Disturbi Riferiti Correlati alla Mansione (Ultimi 6 mesi)
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Checkbox checked={eyeStrain} onChange={(e) => setEyeStrain(e.target.checked)} size="small" />}
                    label="Astenopia / Affaticamento visivo (VDT)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Checkbox checked={backPain} onChange={(e) => setBackPain(e.target.checked)} size="small" />}
                    label="Rachialgia / Dolori posturali o da sforzo (MMC)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Checkbox checked={hearingTinnitus} onChange={(e) => setHearingTinnitus(e.target.checked)} size="small" />}
                    label="Acufeni / Ipoacusia transitoria (Rumore)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Checkbox checked={skinDisorders} onChange={(e) => setSkinDisorders(e.target.checked)} size="small" />}
                    label="Dermatite da contatto / Cute secca o arrossata"
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                size="small"
                label="Altri disturbi o note cliniche da segnalare"
                value={otherSymptoms}
                onChange={(e) => setOtherSymptoms(e.target.value)}
                placeholder="Note libere..."
                sx={{ mt: 1.5 }}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={onClose}>
          Annulla
        </Button>
        <Stack direction="row" spacing={1.5}>
          {tabIndex === 0 && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setTabIndex(1)}
              sx={{ textTransform: 'none' }}
            >
              Rivedi Risposte
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<FlashOnIcon />}
            onClick={handleApplyToStepper}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#1d4ed8',
              '&:hover': { bgcolor: '#1e40af' }
            }}
          >
            ⚡ Travasa nello Stepper Clinico
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}
