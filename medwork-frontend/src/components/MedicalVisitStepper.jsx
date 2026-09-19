import { useEffect, useState, useMemo } from 'react'
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import InfoIcon from '@mui/icons-material/Info'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import HealingIcon from '@mui/icons-material/Healing'
import VerifiedIcon from '@mui/icons-material/Verified'
import HistoryIcon from '@mui/icons-material/History'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import DrawIcon from '@mui/icons-material/Draw'
import SignaturePadModal from './SignaturePadModal'
import { useTextExpander } from '../hooks/useTextExpander'
import { apiGet, apiSend } from '../services/apiClient'
import { currentDateValue, formDateValue, DATE_PICKER_LOCALE } from '../utils/datePicker'

const STEP_LABELS = ['Anamnesi & Dati Clinici', 'Esame Obiettivo & Parametri Vitali', 'Giudizio di Idoneità']

const VISIT_TYPES = [
  { code: 2, label: 'Periodica (Art. 41 c.2 lett. b)' },
  { code: 1, label: 'Preventiva (Art. 41 c.2 lett. a)' },
  { code: 3, label: 'Cambio Mansione (Art. 41 c.2 lett. d)' },
  { code: 4, label: 'Su richiesta lavoratore (Art. 41 c.2 lett. c)' },
  { code: 5, label: 'Rientro da malattia > 60gg (Art. 41 c.2 lett. e-ter)' },
  { code: 6, label: 'Cessazione rapporto di lavoro (Art. 41 c.2 lett. e)' },
]

const OUTCOMES_STEPPER = [
  { code: 'IDONE0', label: 'Idoneo alla mansione specifica' },
  { code: 'IDONE0P', label: 'Idoneo con prescrizioni' },
  { code: 'IDONE0L', label: 'Idoneo con limitazioni' },
  { code: 'NONIDONE0', label: 'Inidoneo temporaneamente o permanentemente' },
  { code: 'INATTESA', label: 'In attesa di accertamenti specialistici' },
]

// Standard textbook formulas for normal physical exam
const NORMAL_EXAM_DEFAULTS = {
  objCardio: 'Toni cardiaci netti e puri, pause libere, attività cardiaca ritmica.',
  objResp: 'Murmure vescicolare fisiologico su tutti i campi polmonari, assenza di rumori patologici aggiunti.',
  objAddome: 'Addome trattabile, indolente alla palpazione superficiale e profonda, organi ipocondriaci nei limiti.',
  objMusc: 'Rachide in asse, articolarità integra e conservata su tutti i distretti, Lasègue e Wasserman negativi bilat.',
  objNeuro: 'Riflessi osteotendinei presenti e simmetrici, Romberg negativo, deambulazione e coordinazione nella norma.',
  objCute: 'Cute e mucose visibili integre, assenza di lesioni da contatto o dermatosi occupazionali.',
  objVista: 'Visus naturale/corretto 10/10 bilateralmente, motilità oculare conservata, senso cromatico nella norma.',
  objUdito: 'Otoscopia bilaterale negativa, voce di conversazione e bisbigliata udita bilateralmente a distanza canonica.',
}

// Coded Legal Prescriptions & Limitations (D.Lgs. 81/08)
const PRESCRIPTION_PRESETS = [
  { category: 'DPI & Protezione', text: 'Uso obbligatorio DPI uditivi (otoprotettori SNR ≥ 28 dB)', type: 'presc' },
  { category: 'DPI & Protezione', text: 'Uso obbligatorio occhiali di protezione con ripari laterali', type: 'presc' },
  { category: 'DPI & Protezione', text: 'Uso guanti di protezione chimica/meccanica specifici (EN 388/374)', type: 'presc' },
  { category: 'DPI & Protezione', text: 'Uso calzature di sicurezza con suola antiscivolo e puntale (S3)', type: 'presc' },
  { category: 'DPI & Protezione', text: 'Uso maschera respiratoria filtrante FFP2/FFP3/A2P3', type: 'presc' },
  { category: 'VDT & Postura', text: 'Prescrizione uso lenti correttive per lavoro a VDT', type: 'presc' },
  { category: 'VDT & Postura', text: 'Pausa visiva di 15 minuti ogni 120 minuti di lavoro continuativo a VDT', type: 'presc' },
  { category: 'VDT & Postura', text: 'Regolazione ergonomica postazione e supporto lombare', type: 'presc' },
  { category: 'Movimentazione Carichi', text: 'Limitazione MMC: sollevamento massimo consentito 10 kg', type: 'limit' },
  { category: 'Movimentazione Carichi', text: 'Limitazione MMC: sollevamento massimo consentito 15 kg', type: 'limit' },
  { category: 'Movimentazione Carichi', text: 'Divieto di movimentazione carichi con torsione del tronco', type: 'limit' },
  { category: 'Movimentazione Carichi', text: 'Divieto di sollevamento carichi oltre l\'altezza delle spalle', type: 'limit' },
  { category: 'Ambienti & Turni', text: 'Esclusione da mansioni che comportano lavoro in quota (> 2 metri)', type: 'limit' },
  { category: 'Ambienti & Turni', text: 'Esclusione da lavoro in turno notturno (fascia 00:00 - 06:00)', type: 'limit' },
  { category: 'Ambienti & Turni', text: 'Divieto di guida carrelli elevatori e macchine semoventi', type: 'limit' },
  { category: 'Ambienti & Turni', text: 'Esclusione da spazi confinati o a rischio asfissia', type: 'limit' },
  { category: 'Ambienti & Turni', text: 'Esclusione da esposizione a vibrazioni al corpo intero / mano-braccio', type: 'limit' },
]

const initialData = {
  employeeId: '',
  doctorId: '',
  visitDate: new Date().toISOString().split('T')[0],
  nextDeadlineDate: '',
  visitType: 2,
  workHistory: '',
  personalHistory: '',
  familyHistory: '',
  remotePathology: '',
  recentPathology: '',
  targetOrgans: 'Udito, apparato respiratorio, rachide',
  outcomeCode: '',
  outcome: '',
  prescriptions: '',
  limitations: '',
  clinicalNotes: '',
  // Structured objective exam
  objCardio: 'nella norma',
  objResp: 'nella norma',
  objAddome: 'nella norma',
  objMusc: 'nella norma',
  objNeuro: 'nella norma',
  objCute: 'nella norma',
  objVista: 'nella norma',
  objUdito: 'nella norma',
  objectiveExam: '',
  // Vital signs
  systolicBp: '120',
  diastolicBp: '80',
  heartRate: '72',
  spO2: '98',
  weightKg: '',
  heightCm: '',
}

function MedicalVisitStepper({ onCreated, initialEmployeeId, initialEmployee }) {
  const [activeStep, setActiveStep] = useState(0)
  const [employees, setEmployees] = useState([])
  const [doctors, setDoctors] = useState([])
  const [formData, setFormData] = useState(() => ({
    ...initialData,
    employeeId: initialEmployeeId != null
      ? String(initialEmployeeId)
      : (initialEmployee?.id != null ? String(initialEmployee.id) : initialData.employeeId),
  }))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [deadlineSource, setDeadlineSource] = useState('manual')
  const [signatureModalOpen, setSignatureModalOpen] = useState(false)
  const [capturedSignature, setCapturedSignature] = useState(null)
  
  const [employeeContext, setEmployeeContext] = useState(null)
  const [lastVisitPreview, setLastVisitPreview] = useState(null)
  const [selfServiceAnamnesis, setSelfServiceAnamnesis] = useState(null)
  const [copyingVisit, setCopyingVisit] = useState(false)
  const [phraseTemplates, setPhraseTemplates] = useState([])

  const { handleKeyDown: handleMacroKeyDown, handleTextChange: handleMacroTextChange } = useTextExpander((field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }))
  })

  // Global Keyboard Shortcuts (F4 = All Normal)
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key === 'F4') {
        e.preventDefault()
        handleSetAllNormalShort()
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [])

  // BMI Calculation
  const bmiInfo = useMemo(() => {
    const w = parseFloat(formData.weightKg)
    const h = parseFloat(formData.heightCm) / 100
    if (w > 0 && h > 0) {
      const val = (w / (h * h)).toFixed(1)
      const num = parseFloat(val)
      let label = 'Normopeso'
      let color = 'success'
      if (num < 18.5) { label = 'Sottopeso'; color = 'info' }
      else if (num >= 25 && num < 30) { label = 'Sovrappeso'; color = 'warning' }
      else if (num >= 30) { label = 'Obesità'; color = 'error' }
      return { val, label, color }
    }
    return null
  }, [formData.weightKg, formData.heightCm])

  useEffect(() => {
    apiGet('/api/master-data/employees')
      .then((employeeData) => {
        const list = Array.isArray(employeeData) ? employeeData : []
        if (initialEmployee && !list.some((item) => Number(item.id) === Number(initialEmployee.id))) {
          list.push(initialEmployee)
        }
        setEmployees(list)
      })
      .catch((requestError) => {
        setError(requestError.message || 'Errore nel caricamento dei dati lavoratori.')
      })

    apiGet('/api/master-data/doctors')
      .then((doctorData) => {
        setDoctors(Array.isArray(doctorData) ? doctorData : [])
      })
      .catch(() => {})
      
    apiGet('/api/master-data/phrase-templates')
      .then(data => setPhraseTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Auto-fetch context, last visit and self-service responses when employee changes
  useEffect(() => {
    if (!formData.employeeId) {
      setEmployeeContext(null)
      setLastVisitPreview(null)
      setSelfServiceAnamnesis(null)
      return
    }

    const emp = employees.find(e => Number(e.id) === Number(formData.employeeId))
    if (emp?.companyDoctorId) {
      setField('doctorId', emp.companyDoctorId)
    }
    
    apiGet(`/api/doctor-data/employees/${formData.employeeId}/context`)
      .then(data => {
        setEmployeeContext(data)
      })
      .catch(() => setEmployeeContext(null))

    apiGet(`/api/doctor-data/employees/${formData.employeeId}/last-visit`)
      .then(lastVisit => {
        if (lastVisit) {
          setLastVisitPreview(lastVisit)
        } else {
          setLastVisitPreview(null)
        }
      })
      .catch(() => setLastVisitPreview(null))

    apiGet(`/api/questionnaires/responses/employee/${formData.employeeId}`)
      .then(resp => {
        if (Array.isArray(resp) && resp.length > 0) {
          setSelfServiceAnamnesis(resp[0])
        } else {
          setSelfServiceAnamnesis(null)
        }
      })
      .catch(() => setSelfServiceAnamnesis(null))
  }, [formData.employeeId, employees])

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

  // Filter out expired temporary limitations/prescriptions based on visit date and duration keywords
  const filterTemporalSunset = (text, previousVisitDate) => {
    if (!text) return { activeText: '', sunsetItems: [] }
    const lines = text.split('\n')
    const activeLines = []
    const sunsetItems = []
    const now = new Date()
    const prevDate = previousVisitDate ? new Date(previousVisitDate) : new Date(now.getTime() - 365 * 24 * 3600 * 1000)
    const elapsedMonths = Math.max(1, (now.getFullYear() - prevDate.getFullYear()) * 12 + (now.getMonth() - prevDate.getMonth()))

    lines.forEach(line => {
      const lower = line.toLowerCase()
      // Detect temporary indicators
      const isTemporary = lower.includes('temporan') || lower.includes('mesi') || lower.includes('giorni') || lower.includes('settiman') || lower.includes('fino al') || lower.includes('rivedere a')
      
      if (isTemporary) {
        // Extract month numbers if present e.g. "3 mesi", "6 mesi"
        const monthMatch = lower.match(/(\d+)\s*mes/)
        const durationMonths = monthMatch ? parseInt(monthMatch[1], 10) : 6
        if (elapsedMonths >= durationMonths) {
          sunsetItems.push(line.trim())
          return
        }
      }
      if (line.trim()) {
        activeLines.push(line.trim())
      }
    })

    return { activeText: activeLines.join('\n'), sunsetItems }
  }

  // 1. SMART CLONE PREVIOUS VISIT WITH INTELLIGENT TEMPORAL FILTER
  const handleCopyLastVisit = async () => {
    if (!formData.employeeId) return
    setCopyingVisit(true)
    setError('')
    try {
      const data = await apiGet(`/api/doctor-data/employees/${formData.employeeId}/last-visit`)
      if (data) {
        const prescFilter = filterTemporalSunset(data.prescriptions, data.visitDate)
        const limitFilter = filterTemporalSunset(data.limitations, data.visitDate)
        const allSunsets = [...prescFilter.sunsetItems, ...limitFilter.sunsetItems]

        setFormData(prev => ({
          ...prev,
          workHistory: data.workHistory || prev.workHistory,
          personalHistory: data.personalHistory || prev.personalHistory,
          familyHistory: data.familyHistory || prev.familyHistory,
          remotePathology: data.remotePathology || prev.remotePathology,
          recentPathology: data.recentPathology || prev.recentPathology,
          targetOrgans: data.targetOrgans || prev.targetOrgans || 'Udito, apparato respiratorio, rachide',
          objectiveExam: data.objectiveExam || prev.objectiveExam,
          prescriptions: prescFilter.activeText || prev.prescriptions,
          limitations: limitFilter.activeText || prev.limitations,
          clinicalNotes: data.clinicalNotes ? `${prev.clinicalNotes ? prev.clinicalNotes + '\n' : ''}[Da visita prec.]: ${data.clinicalNotes}` : prev.clinicalNotes,
        }))

        if (allSunsets.length > 0) {
          setSuccess(`✓ Dati clonati con successo! Filtro Temporale: ${allSunsets.length} prescrizione/limitazione temporanea scaduta esclusa automaticamente.`)
        } else {
          setSuccess('✓ Dati anamnestici e clinici dell\'ultima visita copiati con successo!')
        }
      } else {
        setError('Nessuna visita precedente trovata per questo lavoratore.')
      }
    } catch (err) {
      if (err.status === 204) {
        setError('Nessuna visita precedente trovata per questo lavoratore.')
      } else {
        setError('Errore durante la copia dei dati.')
      }
    } finally {
      setCopyingVisit(false)
      setTimeout(() => setSuccess(''), 5000)
    }
  }

  // 1B. DELTA VELOCE / QUADRO INVARIATO (ULTRA-FAST TRACK)
  const handleDeltaVeloce = async () => {
    if (!formData.employeeId) return
    setCopyingVisit(true)
    setError('')
    try {
      const data = await apiGet(`/api/doctor-data/employees/${formData.employeeId}/last-visit`)
      const prescFilter = filterTemporalSunset(data?.prescriptions, data?.visitDate)
      const limitFilter = filterTemporalSunset(data?.limitations, data?.visitDate)
      const allSunsets = [...prescFilter.sunsetItems, ...limitFilter.sunsetItems]

      setFormData(prev => ({
        ...prev,
        workHistory: data?.workHistory || prev.workHistory || 'Mansione invariata rispetto alla precedente sorveglianza.',
        personalHistory: data?.personalHistory || prev.personalHistory || 'Condizioni anamnestiche generali invariate.',
        familyHistory: data?.familyHistory || prev.familyHistory,
        remotePathology: data?.remotePathology || prev.remotePathology,
        recentPathology: 'Nessuna patologia insorta nel periodo intercorso.',
        targetOrgans: data?.targetOrgans || prev.targetOrgans || 'Udito, apparato respiratorio, rachide',
        objCardio: 'nella norma',
        objResp: 'nella norma',
        objAddome: 'nella norma',
        objMusc: 'nella norma',
        objNeuro: 'nella norma',
        objCute: 'nella norma',
        objVista: 'nella norma',
        objUdito: 'nella norma',
        outcomeCode: 'IDONE0',
        outcome: 'Idoneo alla mansione specifica',
        prescriptions: prescFilter.activeText || '',
        limitations: limitFilter.activeText || '',
        clinicalNotes: `[Delta Veloce]: Quadro clinico invariato rispetto alla visita del ${data?.visitDate ? new Date(data.visitDate).toLocaleDateString('it-IT') : 'periodo precedente'}.`,
      }))

      setActiveStep(1)
      setSuccess(`⚡ Delta Veloce attivato: anamnesi clonata, apparati nella norma, ${allSunsets.length > 0 ? allSunsets.length + ' prescrizioni scadute depurate, ' : ''}idoneità preimpostata. Inserisci solo PAO e Peso!`)
    } catch {
      setActiveStep(1)
      setFormData(prev => ({
        ...prev,
        objCardio: 'nella norma',
        objResp: 'nella norma',
        objAddome: 'nella norma',
        objMusc: 'nella norma',
        objNeuro: 'nella norma',
        objCute: 'nella norma',
        objVista: 'nella norma',
        objUdito: 'nella norma',
        outcomeCode: 'IDONE0',
        outcome: 'Idoneo alla mansione specifica',
      }))
      setSuccess('⚡ Delta Veloce: parametri di normalità e idoneità preimpostati.')
    } finally {
      setCopyingVisit(false)
      setTimeout(() => setSuccess(''), 6000)
    }
  }

  // IMPORT SELF-SERVICE DIGITAL ANAMNESIS
  const handleImportSelfService = () => {
    if (!selfServiceAnamnesis) return
    try {
      const answers = JSON.parse(selfServiceAnamnesis.answersJson || '{}')
      const answerSummary = Object.entries(answers)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      setFormData(prev => ({
        ...prev,
        personalHistory: prev.personalHistory ? `${prev.personalHistory}\n[Questionario]: ${answerSummary}` : `[Questionario Lavoratore]: ${answerSummary}`,
        clinicalNotes: `${prev.clinicalNotes ? prev.clinicalNotes + '\n' : ''}[Questionario Pre-visita compilato digitalmente il ${new Date(selfServiceAnamnesis.completedAt).toLocaleDateString('it-IT')}${selfServiceAnamnesis.isAnomalous ? ' - REPERTI ANOMALI SEGNALATI' : ' - NDP'}]`
      }))
      setSuccess('✓ Questionario anamnestico digitale del lavoratore importato con successo!')
    } catch {
      setError('Impossibile interpretare il formato del questionario.')
    }
  }

  // 2. PHYSICAL EXAM FAST ACTIONS
  const handleSetAllNormalShort = () => {
    setFormData(prev => ({
      ...prev,
      objCardio: 'nella norma',
      objResp: 'nella norma',
      objAddome: 'nella norma',
      objMusc: 'nella norma',
      objNeuro: 'nella norma',
      objCute: 'nella norma',
      objVista: 'nella norma',
      objUdito: 'nella norma',
    }))
    setSuccess('✓ Tutti gli 8 apparati impostati su "Nella norma (N.D.P.)"')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleSetAllNormalFull = () => {
    setFormData(prev => ({
      ...prev,
      ...NORMAL_EXAM_DEFAULTS,
    }))
    setSuccess('✓ Inserite formule cliniche standard per tutti gli apparati')
    setTimeout(() => setSuccess(''), 3000)
  }

  // 3. PRESCRIPTIONS & LIMITATIONS CHIP TOGGLE
  const handleTogglePreset = (preset) => {
    const isPrescription = preset.type === 'presc'
    const targetField = isPrescription ? 'prescriptions' : 'limitations'
    const currentVal = formData[targetField] || ''
    
    if (currentVal.includes(preset.text)) {
      // Remove it
      const updated = currentVal
        .split(';')
        .map(s => s.trim())
        .filter(s => s && s !== preset.text)
        .join('; ')
      setField(targetField, updated)
    } else {
      // Add it
      const updated = currentVal.trim()
        ? `${currentVal.trim()}; ${preset.text}`
        : preset.text
      setField(targetField, updated)
    }
  }

  const isPresetActive = (preset) => {
    const isPrescription = preset.type === 'presc'
    const targetField = isPrescription ? 'prescriptions' : 'limitations'
    const currentVal = formData[targetField] || ''
    return currentVal.includes(preset.text)
  }

  const validateStep = () => {
    if (activeStep === 0) {
      if (!formData.employeeId || !formData.visitDate) {
        setError('Seleziona il lavoratore e la data della visita per procedere.')
        return false
      }
    }
    if (activeStep === 1) {
      if (!String(formData.targetOrgans).trim()) {
        setError('Compila gli organi bersaglio della sorveglianza.')
        return false
      }
    }
    if (activeStep === 2) {
      if (!formData.outcomeCode || !formData.nextDeadlineDate) {
        setError('Seleziona l\'esito del giudizio di idoneità e la data della prossima scadenza.')
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
      `Cute e Annessi: ${formData.objCute}`,
      `Vista/Oculistico: ${formData.objVista}`,
      `Udito/ORL: ${formData.objUdito}`,
    ]
    
    // Append vitals if entered
    const vitalsParts = []
    if (formData.systolicBp && formData.diastolicBp) vitalsParts.push(`PA: ${formData.systolicBp}/${formData.diastolicBp} mmHg`)
    if (formData.heartRate) vitalsParts.push(`FC: ${formData.heartRate} bpm`)
    if (formData.spO2) vitalsParts.push(`SpO2: ${formData.spO2}%`)
    if (bmiInfo) vitalsParts.push(`BMI: ${bmiInfo.val} (${bmiInfo.label})`)
    
    if (vitalsParts.length > 0) {
      parts.push(`--- Parametri Vitali: ${vitalsParts.join(' | ')} ---`)
    }

    if (formData.objectiveExam) {
      parts.push(`Note aggiuntive: ${formData.objectiveExam}`)
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
      const selectedOutcome = OUTCOMES_STEPPER.find((o) => o.code === formData.outcomeCode)
      const outcomeLabelFinal = selectedOutcome ? selectedOutcome.label : (formData.outcome || 'Idoneo alla mansione')
      const bpFormatted = (formData.systolicBp && formData.diastolicBp) ? `${formData.systolicBp}/${formData.diastolicBp}` : null

      const createdVisit = await apiSend('POST', '/api/doctor-data/medical-visits', {
        employeeId: Number(formData.employeeId),
        doctorId: formData.doctorId ? Number(formData.doctorId) : null,
        visitDate: new Date(formData.visitDate).toISOString(),
        nextDeadlineDate: formData.nextDeadlineDate
          ? new Date(formData.nextDeadlineDate).toISOString()
          : new Date(formData.visitDate).toISOString(),
        visitType: formData.visitType,
        targetOrgans: formData.targetOrgans,
        objectiveExam: finalObjectiveExam,
        outcomeCode: formData.outcomeCode || null,
        outcome: outcomeLabelFinal,
        prescriptions: formData.prescriptions || null,
        limitations: formData.limitations || null,
        clinicalNotes: formData.clinicalNotes,
        bloodPressure: bpFormatted,
        heartRate: formData.heartRate ? `${formData.heartRate} bpm` : null,
      })

      await apiSend('POST', '/api/doctor-data/anamneses', {
        medicalVisitId: createdVisit.id,
        workHistory: formData.workHistory,
        personalHistory: formData.personalHistory,
        familyHistory: formData.familyHistory,
        remotePathology: formData.remotePathology,
        recentPathology: formData.recentPathology,
      })

      setSuccess('✓ Visita medica, parametri vitali e anamnesi registrate con successo nel fascicolo sanitario!')
      setFormData(initialData)
      setActiveStep(0)
      setEmployeeContext(null)
      setLastVisitPreview(null)

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
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems="flex-start" sx={{ maxWidth: 1600, mx: 'auto' }}>
      {/* MAIN CONTENT AREA */}
      <Stack spacing={2} sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#ffffff' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f1f3d">
                Nuova Visita Medica & Sorveglianza Sanitaria
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inserimento rapido conforme D.Lgs. 81/08 (Allegato 3A) con precompilazione intelligente.
              </Typography>
            </Box>
            <Chip 
              icon={<VerifiedIcon />} 
              label="Standard SIML Conforme" 
              color="primary" 
              variant="outlined" 
              size="small" 
            />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* SMART CLONE & DELTA VELOCE BANNER */}
          {lastVisitPreview && activeStep === 0 && (
            <Alert 
              severity="info" 
              icon={<HistoryIcon />}
              action={
                <Stack direction="row" spacing={1}>
                  <Button 
                    color="primary" 
                    size="small" 
                    variant="outlined" 
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyLastVisit}
                    disabled={copyingVisit}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {copyingVisit ? 'Copia...' : 'Copia Anamnesi'}
                  </Button>
                  <Button 
                    color="warning" 
                    size="small" 
                    variant="contained" 
                    startIcon={<FlashOnIcon />}
                    onClick={handleDeltaVeloce}
                    disabled={copyingVisit}
                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#ed6c02', '&:hover': { bgcolor: '#e65100' } }}
                  >
                    ⚡ Delta Veloce (1-Click)
                  </Button>
                </Stack>
              }
              sx={{ mb: 2, borderRadius: 2, alignItems: 'center' }}
            >
              <Typography variant="body2" fontWeight={700}>
                Visita precedente trovata ({new Date(lastVisitPreview.visitDate).toLocaleDateString('it-IT')}) — Filtro Temporale Attivo
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Usa <strong>Delta Veloce</strong> per clonare l'anamnesi, epurare prescrizioni temporanee scadute, impostare normalità clinica e andare dritto ai parametri vitali.
              </Typography>
            </Alert>
          )}

          {/* SELF-SERVICE DIGITAL QUESTIONNAIRE BANNER */}
          {selfServiceAnamnesis && activeStep === 0 && (
            <Alert 
              severity="success" 
              icon={<AssignmentIcon />}
              action={
                <Button 
                  color="success" 
                  size="small" 
                  variant="contained" 
                  startIcon={<FlashOnIcon />}
                  onClick={handleImportSelfService}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  📥 Importa Questionario Pre-Visita
                </Button>
              }
              sx={{ mb: 3, borderRadius: 2, alignItems: 'center', bgcolor: '#f0fdf4', borderColor: '#bbf7d0' }}
            >
              <Typography variant="body2" fontWeight={700} color="#166534">
                Disponibile questionario anamnestico pre-compilato dal lavoratore!
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Compilato il {new Date(selfServiceAnamnesis.completedAt).toLocaleDateString('it-IT')}. Clicca per importare abitudini, anamnesi e sintomi.
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            {/* STEP 0: ANAMNESI */}
            {activeStep === 0 && (
              <Stack spacing={2.5}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <TextField
                    select
                    label="Lavoratore in Visita *"
                    size="small"
                    value={formData.employeeId}
                    onChange={(event) => setField('employeeId', event.target.value)}
                    sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}
                  >
                    {employees.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.firstName} {item.lastName} — CF: {item.taxCode || 'N/D'} ({item.companyName || 'Azienda N/D'})
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyLastVisit}
                    disabled={!formData.employeeId || copyingVisit}
                    sx={{ height: 40, textTransform: 'none', fontWeight: 600 }}
                  >
                    Copia da ultima visita
                  </Button>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <TextField
                    select
                    label="Medico Competente *"
                    size="small"
                    value={formData.doctorId}
                    onChange={(event) => setField('doctorId', event.target.value)}
                  >
                    {doctors.map((item) => (
                      <MenuItem key={item.id} value={item.id}>{`${item.firstName} ${item.lastName}`}</MenuItem>
                    ))}
                  </TextField>

                  <DesktopDatePicker
                    size="small"
                    label="Data Visita *"
                    InputLabelProps={{ shrink: true }}
                    value={currentDateValue(formData.visitDate)}
                    onChange={(date) => setField('visitDate', formDateValue(date))}
                    inputFormat="dd/MM/yyyy"
                    locale={DATE_PICKER_LOCALE}
                  />

                  <TextField
                    select
                    label="Tipo Visita Medica *"
                    size="small"
                    value={formData.visitType}
                    onChange={(event) => setField('visitType', event.target.value)}
                  >
                    {VISIT_TYPES.map((item) => (
                      <MenuItem key={item.code} value={item.code}>{item.label}</MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <FlashOnIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" color="primary" fontWeight={700}>
                      Frasi Rapide & Template Anamnestici
                    </Typography>
                  </Stack>
                  <TextField
                    select
                    size="small"
                    label="Inserisci template anamnestico rapido..."
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return
                      const phrase = phraseTemplates.find(p => p.id === e.target.value)
                      if (phrase) {
                        const targetField = phrase.category === 'AnamnesiLavorativa' ? 'workHistory' : 
                                            phrase.category === 'AnamnesiFamiliare' ? 'familyHistory' : 
                                            'personalHistory'
                        setField(targetField, formData[targetField] ? `${formData[targetField]}\n${phrase.text}` : phrase.text)
                      }
                    }}
                    sx={{ minWidth: 320 }}
                  >
                    <MenuItem value=""><em>Seleziona formula clinica...</em></MenuItem>
                    {phraseTemplates.map(p => (
                      <MenuItem key={p.id} value={p.id}>[{p.category}] {p.text.substring(0, 50)}...</MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Anamnesi Lavorativa (Esposizioni pregresse, mansioni, anzianità)"
                      value={formData.workHistory}
                      onChange={(event) => handleMacroTextChange('workHistory', event.target.value)}
                      onKeyDown={(e) => handleMacroKeyDown(e, formData.workHistory, 'workHistory')}
                      placeholder="Es. Addetto alla produzione da 10 anni. (Scrivi .norm, .vdt, .mmc, .rum e premi spazio per macro)"
                      helperText="Macro: .norm, .vdt, .mmc, .rum, .guida, .notte + Spazio"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Anamnesi Personale (Abitudini di vita, fumo, alcol, attività fisica)"
                      value={formData.personalHistory}
                      onChange={(event) => handleMacroTextChange('personalHistory', event.target.value)}
                      onKeyDown={(e) => handleMacroKeyDown(e, formData.personalHistory, 'personalHistory')}
                      placeholder="Es. Non fumatore, consumo moderato alcolici ai pasti. Non assume farmaci cronici..."
                      helperText="Macro: .norm, .vdt + Spazio"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Anamnesi Familiare (Ereditarietà patologie cardiovascolari, metaboliche, oncologiche)"
                      value={formData.familyHistory}
                      onChange={(event) => handleMacroTextChange('familyHistory', event.target.value)}
                      onKeyDown={(e) => handleMacroKeyDown(e, formData.familyHistory, 'familyHistory')}
                      placeholder="Es. Anamnesi familiare negativa per patologie cardiovascolari precoci. Madre ipertesa..."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Patologie Remote & Recenti (Interventi, ricoveri, allergie)"
                      value={`${formData.remotePathology}${formData.remotePathology && formData.recentPathology ? '\n' : ''}${formData.recentPathology}`}
                      onChange={(event) => {
                        const parts = String(event.target.value || '').split('\n')
                        setField('remotePathology', parts[0] || '')
                        setField('recentPathology', parts.slice(1).join('\n') || '')
                      }}
                      onKeyDown={(e) => handleMacroKeyDown(e, formData.remotePathology, 'remotePathology')}
                      placeholder="Es. Remota: Appendicectomia in età pediatrica. Recente: Nessuna patologia degna di nota."
                    />
                  </Grid>
                </Grid>
              </Stack>
            )}

            {/* STEP 1: ESAME OBIETTIVO STRUTTURATO & PARAMETRI VITALI */}
            {activeStep === 1 && (
              <Stack spacing={2.5}>
                {/* FAST NORMAL BUTTONS */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f4f8fc', borderColor: '#b6d7f7' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="#115293">
                        ⚡ Compilazione Rapida Esame Obiettivo
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        I pazienti sani possono essere impostati su &quot;Nella norma&quot; in 1 clic. Modifica solo i reperti con anomalie.
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleSetAllNormalShort}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Tutto N.D.P. (Nella Norma)
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AutoFixHighIcon />}
                        onClick={handleSetAllNormalFull}
                        sx={{ textTransform: 'none' }}
                      >
                        Formule Standard Complete
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>

                {/* PARAMETRI VITALI */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <MonitorHeartIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Parametri Vitali & Biometria
                    </Typography>
                    {bmiInfo && (
                      <Chip 
                        size="small" 
                        color={bmiInfo.color} 
                        label={`BMI ${bmiInfo.val} — ${bmiInfo.label}`} 
                        sx={{ ml: 'auto', fontWeight: 600 }}
                      />
                    )}
                  </Stack>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.5 }}>
                    <TextField
                      size="small"
                      label="PA Sistolica"
                      placeholder="120"
                      value={formData.systolicBp}
                      onChange={(e) => setField('systolicBp', e.target.value)}
                      InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary">mmHg</Typography> }}
                    />
                    <TextField
                      size="small"
                      label="PA Diastolica"
                      placeholder="80"
                      value={formData.diastolicBp}
                      onChange={(e) => setField('diastolicBp', e.target.value)}
                      InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary">mmHg</Typography> }}
                    />
                    <TextField
                      size="small"
                      label="Freq. Cardiaca"
                      placeholder="72"
                      value={formData.heartRate}
                      onChange={(e) => setField('heartRate', e.target.value)}
                      InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary">bpm</Typography> }}
                    />
                    <TextField
                      size="small"
                      label="SpO2"
                      placeholder="98"
                      value={formData.spO2}
                      onChange={(e) => setField('spO2', e.target.value)}
                      InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary">%</Typography> }}
                    />
                    <TextField
                      size="small"
                      label="Peso"
                      placeholder="75"
                      value={formData.weightKg}
                      onChange={(e) => setField('weightKg', e.target.value)}
                      InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary">kg</Typography> }}
                    />
                    <TextField
                      size="small"
                      label="Altezza"
                      placeholder="175"
                      value={formData.heightCm}
                      onChange={(e) => setField('heightCm', e.target.value)}
                      InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary">cm</Typography> }}
                    />
                  </Box>
                </Paper>

                <TextField
                  label="Organi Bersaglio della Sorveglianza *"
                  value={formData.targetOrgans}
                  onChange={(event) => setField('targetOrgans', event.target.value)}
                  placeholder="Es. Udito, apparato respiratorio, rachide, vista"
                  fullWidth
                  size="small"
                  helperText="Organi/apparati critici in relazione ai rischi specifici della mansione"
                />

                {/* 8 APPARATI STRUTTURATI - RISK DRIVEN */}
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                      ESAME OBIETTIVO PER APPARATI (ALLEGATO 3A)
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        icon={<FlashOnIcon />}
                        label="🎯 Focus Rachide / MMC"
                        clickable
                        color={formData.targetOrgans?.toLowerCase().includes('rachid') || formData.targetOrgans?.toLowerCase().includes('carich') ? 'primary' : 'default'}
                        variant="outlined"
                        onClick={() => {
                          setField('objMusc', 'Rachide in asse, articolarità integra e conservata su tutti i distretti, Lasègue e Wasserman negativi bilat., assenza di contratture paravertebrali, punti di Valleix non dolenti.')
                          setSuccess('✓ Focus Rachide/MMC applicato')
                          setTimeout(() => setSuccess(''), 3000)
                        }}
                      />
                      <Chip
                        size="small"
                        icon={<FlashOnIcon />}
                        label="🎯 Focus Udito / Rumore"
                        clickable
                        color={formData.targetOrgans?.toLowerCase().includes('udit') || formData.targetOrgans?.toLowerCase().includes('rumor') ? 'primary' : 'default'}
                        variant="outlined"
                        onClick={() => {
                          setField('objUdito', 'Otoscopia bilat. negativa, membrane timpaniche integre, normoriflettenti e perlacee. Acufenometria negativa, soglia uditiva di conversazione conservata.')
                          setSuccess('✓ Focus Udito/Rumore applicato')
                          setTimeout(() => setSuccess(''), 3000)
                        }}
                      />
                      <Chip
                        size="small"
                        icon={<FlashOnIcon />}
                        label="🎯 Focus Respiratorio"
                        clickable
                        color={formData.targetOrgans?.toLowerCase().includes('respirat') || formData.targetOrgans?.toLowerCase().includes('chimic') ? 'primary' : 'default'}
                        variant="outlined"
                        onClick={() => {
                          setField('objResp', 'Murmure vescicolare fisiologico su tutti i campi polmonari, basi polmonari mobili e pervie, assenza di rumori patologici aggiunti (rantoli, fischi o ronchi).')
                          setSuccess('✓ Focus Respiratorio applicato')
                          setTimeout(() => setSuccess(''), 3000)
                        }}
                      />
                      <Chip
                        size="small"
                        icon={<FlashOnIcon />}
                        label="🎯 Focus VDT & Vista"
                        clickable
                        color={formData.targetOrgans?.toLowerCase().includes('vist') || formData.targetOrgans?.toLowerCase().includes('vdt') ? 'primary' : 'default'}
                        variant="outlined"
                        onClick={() => {
                          setField('objVista', 'Visus naturale/corretto 10/10 bilat., convergenza e motilità oculare integre, senso cromatico nella norma (Tavole di Ishihara), assenza astenopia.')
                          setSuccess('✓ Focus VDT/Vista applicato')
                          setTimeout(() => setSuccess(''), 3000)
                        }}
                      />
                      <Chip
                        size="small"
                        icon={<FlashOnIcon />}
                        label="🎯 Focus Cute & Chimico"
                        clickable
                        color={formData.targetOrgans?.toLowerCase().includes('cut') || formData.targetOrgans?.toLowerCase().includes('derm') ? 'primary' : 'default'}
                        variant="outlined"
                        onClick={() => {
                          setField('objCute', 'Cute e mucose integre, assenza di dermatiti da contatto irritative o allergiche, assenza di lesioni eczematose, ipercheratosiche o discromiche.')
                          setSuccess('✓ Focus Cute/Chimico applicato')
                          setTimeout(() => setSuccess(''), 3000)
                        }}
                      />
                    </Stack>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                    <TextField
                      label="1. Cardiovascolare"
                      size="small"
                      value={formData.objCardio}
                      onChange={(e) => setField('objCardio', e.target.value)}
                    />
                    <TextField
                      label="2. Respiratorio"
                      size="small"
                      value={formData.objResp}
                      onChange={(e) => setField('objResp', e.target.value)}
                      sx={formData.targetOrgans?.toLowerCase().includes('respirat') || formData.targetOrgans?.toLowerCase().includes('chimic') ? { bgcolor: '#e3f2fd', borderRadius: 1 } : {}}
                    />
                    <TextField
                      label="3. Addome & Visceri"
                      size="small"
                      value={formData.objAddome}
                      onChange={(e) => setField('objAddome', e.target.value)}
                    />
                    <TextField
                      label="4. Muscoloscheletrico & Rachide (MMC)"
                      size="small"
                      value={formData.objMusc}
                      onChange={(e) => setField('objMusc', e.target.value)}
                      sx={formData.targetOrgans?.toLowerCase().includes('rachid') || formData.targetOrgans?.toLowerCase().includes('carich') || formData.targetOrgans?.toLowerCase().includes('mmc') ? { bgcolor: '#e3f2fd', borderRadius: 1 } : {}}
                    />
                    <TextField
                      label="5. Sistema Nervoso"
                      size="small"
                      value={formData.objNeuro}
                      onChange={(e) => setField('objNeuro', e.target.value)}
                    />
                    <TextField
                      label="6. Cute & Annessi (Chimico)"
                      size="small"
                      value={formData.objCute}
                      onChange={(e) => setField('objCute', e.target.value)}
                      sx={formData.targetOrgans?.toLowerCase().includes('cut') || formData.targetOrgans?.toLowerCase().includes('derm') ? { bgcolor: '#e3f2fd', borderRadius: 1 } : {}}
                    />
                    <TextField
                      label="7. Vista & Oculistico (VDT)"
                      size="small"
                      value={formData.objVista}
                      onChange={(e) => setField('objVista', e.target.value)}
                      sx={formData.targetOrgans?.toLowerCase().includes('vist') || formData.targetOrgans?.toLowerCase().includes('vdt') ? { bgcolor: '#e3f2fd', borderRadius: 1 } : {}}
                    />
                    <TextField
                      label="8. Udito & ORL (Rumore)"
                      size="small"
                      value={formData.objUdito}
                      onChange={(e) => setField('objUdito', e.target.value)}
                      sx={formData.targetOrgans?.toLowerCase().includes('udit') || formData.targetOrgans?.toLowerCase().includes('rumor') ? { bgcolor: '#e3f2fd', borderRadius: 1 } : {}}
                    />
                  </Box>
                </Box>

                <TextField
                  multiline
                  minRows={2}
                  label="Note aggiuntive esame obiettivo / Reperti specialistici"
                  value={formData.objectiveExam}
                  onChange={(event) => setField('objectiveExam', event.target.value)}
                  placeholder="Eventuali note libere o esiti di test complementari..."
                />

                <TextField
                  multiline
                  minRows={2}
                  label="Note cliniche riservate del Medico Competente"
                  value={formData.clinicalNotes}
                  onChange={(event) => setField('clinicalNotes', event.target.value)}
                  placeholder="Note confidenziali visibili solo al medico competente..."
                />
              </Stack>
            )}

            {/* STEP 2: GIUDIZIO DI IDONEITÀ & PRESCRIZIONI */}
            {activeStep === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    select
                    label="Esito Giudizio di Idoneità (Art. 41 c.6) *"
                    value={formData.outcomeCode}
                    onChange={(event) => {
                      const selected = OUTCOMES_STEPPER.find((o) => o.code === event.target.value)
                      setField('outcomeCode', event.target.value)
                      if (selected) setField('outcome', selected.label)
                    }}
                  >
                    {OUTCOMES_STEPPER.map((o) => (
                      <MenuItem key={o.code} value={o.code}>{o.label}</MenuItem>
                    ))}
                  </TextField>

                  <DesktopDatePicker
                    size="small"
                    label="Prossima Scadenza Sorveglianza Sanitaria *"
                    InputLabelProps={{ shrink: true }}
                    value={currentDateValue(formData.nextDeadlineDate)}
                    onChange={(date) => {
                      setField('nextDeadlineDate', formDateValue(date))
                      setDeadlineSource('manual')
                    }}
                    inputFormat="dd/MM/yyyy"
                    locale={DATE_PICKER_LOCALE}
                    slotProps={{
                      textField: {
                        helperText:
                          deadlineSource === 'auto'
                            ? '✓ Calcolata automaticamente dal protocollo sanitario'
                            : 'Inserita manualmente dal medico',
                        FormHelperTextProps: {
                          sx: { color: deadlineSource === 'auto' ? 'success.main' : 'text.secondary', fontWeight: 500 },
                        },
                      },
                    }}
                  />
                </Box>

                {/* PRESCRIZIONI & LIMITAZIONI LIBRARY */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fcfdfe' }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <HealingIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700} color="#0f1f3d">
                      Libreria Normativa Prescrizioni & Limitazioni (D.Lgs. 81/08)
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    Clicca sui tag per includere o rimuovere le prescrizioni/limitazioni codificate:
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {PRESCRIPTION_PRESETS.map((p, idx) => {
                      const active = isPresetActive(p)
                      return (
                        <Chip
                          key={idx}
                          label={p.text}
                          onClick={() => handleTogglePreset(p)}
                          color={active ? (p.type === 'presc' ? 'primary' : 'warning') : 'default'}
                          variant={active ? 'filled' : 'outlined'}
                          size="small"
                          sx={{ 
                            cursor: 'pointer',
                            fontWeight: active ? 600 : 400,
                            borderColor: p.type === 'presc' ? '#1976d2' : '#ed6c02',
                          }}
                        />
                      )
                    })}
                  </Box>
                </Paper>

                <TextField
                  label="Prescrizioni specifiche (Misure e DPI obbligatori)"
                  multiline
                  rows={2}
                  fullWidth
                  value={formData.prescriptions}
                  onChange={(e) => setField('prescriptions', e.target.value)}
                  placeholder="Es. Obbligo DPI uditivi SNR ≥ 28 dB, occhiali di sicurezza..."
                  helperText="Dispositivi di protezione individuale o comportamenti obbligatori per il lavoratore (art. 41 D.Lgs. 81/08)"
                />

                <TextField
                  label="Limitazioni operative (Divieti o esclusioni mansione)"
                  multiline
                  rows={2}
                  fullWidth
                  value={formData.limitations}
                  onChange={(e) => setField('limitations', e.target.value)}
                  placeholder="Es. Escluso da movimentazione manuale carichi > 10 kg, non idoneo lavoro notturno..."
                  helperText="Divieti di esposizione o esclusioni da specifiche attività operative"
                />

                {/* FIRMA FEA SU TABLET */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <DrawIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Firma Elettronica Avanzata (FEA) su Tablet
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {capturedSignature ? '✓ Firma del lavoratore e del medico acquisite con successo' : 'Sottoscrizione digitale del lavoratore su tablet per copia conforme'}
                      </Typography>
                    </Box>
                    <Button
                      variant={capturedSignature ? 'outlined' : 'contained'}
                      color={capturedSignature ? 'success' : 'primary'}
                      size="small"
                      startIcon={<DrawIcon />}
                      onClick={() => setSignatureModalOpen(true)}
                      sx={{ textTransform: 'none' }}
                    >
                      {capturedSignature ? 'Firma Acquisita (Rifai)' : 'Firma su Tablet'}
                    </Button>
                  </Stack>
                </Paper>
              </Box>
            )}
          </Box>

          {signatureModalOpen && (
            <SignaturePadModal
              open={signatureModalOpen}
              onClose={() => setSignatureModalOpen(false)}
              onSignatureCaptured={(sig) => {
                setCapturedSignature(sig)
                setSuccess('✓ Firma grafometrica FEA acquisita con successo!')
                setTimeout(() => setSuccess(''), 4000)
              }}
            />
          )}

          <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mt: 3, pt: 2, borderTop: '1px solid #eaeef5' }}>
            <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0 || saving}>
              Indietro
            </Button>
            {activeStep < STEP_LABELS.length - 1 ? (
              <Button variant="contained" onClick={handleNext} disabled={saving}>
                Avanti
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSave} 
                disabled={saving}
                sx={{ px: 4, fontWeight: 700 }}
              >
                {saving ? 'Salvataggio in corso...' : 'Salva & Rilascia Giudizio'}
              </Button>
            )}
          </Stack>
        </Paper>

        {!!error && <Alert severity="error">{error}</Alert>}
        {!!success && <Alert severity="success">{success}</Alert>}
      </Stack>

      {/* CONTEXTUAL SIDEBAR: CLINICAL TIMELINE & VITALS TRENDS */}
      <Box sx={{ width: { xs: '100%', lg: '340px' }, flexShrink: 0 }}>
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, bgcolor: '#f8f9fa' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <InfoIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700} color="#0f1f3d">
              Dossier Clinico Lavoratore
            </Typography>
          </Stack>
          
          {!formData.employeeId ? (
            <Typography variant="body2" color="text.secondary">
              Seleziona un lavoratore dal menu a tendina per visualizzare il profilo di rischio e lo storico clinico.
            </Typography>
          ) : !employeeContext ? (
            <Typography variant="body2" color="text.secondary">
              Caricamento contesto clinico...
            </Typography>
          ) : (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>MANSIONE ATTUALE</Typography>
                <Typography variant="body2" fontWeight={700} color="#0f1f3d">
                  {employeeContext.jobRole || 'Non specificata'}
                </Typography>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>LIVELLO DI RISCHIO</Typography>
                <Typography variant="body2" fontWeight={700} color={employeeContext.riskLevelName ? 'error.main' : 'text.primary'}>
                  {employeeContext.riskLevelName || 'Nessun livello assegnato'}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    TIMELINE VISITE PRECEDENTI
                  </Typography>
                  <HistoryIcon fontSize="inherit" color="action" />
                </Stack>

                {(!employeeContext.recentVisits || employeeContext.recentVisits.length === 0) ? (
                  <Typography variant="body2" color="text.secondary">
                    Nessuna visita precedente registrata.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {employeeContext.recentVisits.map((v, idx) => (
                      <Card key={idx} variant="outlined" sx={{ bgcolor: '#ffffff', borderRadius: 2 }}>
                        <CardContent sx={{ p: '10px !important' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={700}>
                              {new Date(v.visitDate).toLocaleDateString('it-IT')}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={v.outcome?.includes('Idoneo') ? 'Idoneo' : (v.outcome || 'Eseguita')}
                              color={v.outcome?.includes('Idoneo con') ? 'warning' : v.outcome?.includes('Non') ? 'error' : 'success'}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Stack>
                          {(v.bloodPressure || v.heartRate) && (
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                              ❤️ PA: <strong>{v.bloodPressure || '-'}</strong> | FC: <strong>{v.heartRate || '-'}</strong>
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
