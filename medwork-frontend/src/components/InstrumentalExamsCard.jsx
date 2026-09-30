import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import HearingIcon from '@mui/icons-material/Hearing'
import AirIcon from '@mui/icons-material/Air'
import ScienceIcon from '@mui/icons-material/Science'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import TuneIcon from '@mui/icons-material/Tune'

export const DEFAULT_NORMAL_EXAMS = {
  visiotest: {
    performed: true,
    visusOD: '10/10',
    visusOS: '10/10',
    colorSense: 'Normale',
    stereopsis: 'Normale',
    foria: 'Ortoria',
    summary: 'Visus naturale/corretto 10/10 bilat., senso cromatico e stereopsi conservati.',
  },
  audiometry: {
    performed: true,
    status: 'Normale',
    summary: 'Soglia audiometrica bilaterale nei limiti fisiologici (0-20 dB).',
  },
  spirometry: {
    performed: true,
    fvc: '98',
    fev1: '95',
    tiffeneau: '82',
    pattern: 'Normale',
    summary: 'Parametri spirometrici nei limiti (FVC 98%, FEV1 95%, Tiffeneau 82%).',
  },
  drugTest: {
    performed: false,
    result: 'Negativo',
    substances: 'THC, COC, AMP, MET, OPI, BZO, MTD, MDMA',
    summary: 'Test rapido urine 8 sostanze d\'abuso: Tutte Negative.',
  },
}

export const buildInstrumentalSummary = (data) => {
  if (!data) return ''
  const parts = []
  if (data.visiotest?.performed) parts.push(`[Visiotest/Ergovision]: ${data.visiotest.summary}`)
  if (data.audiometry?.performed) parts.push(`[Audiometria Tonale]: ${data.audiometry.summary}`)
  if (data.spirometry?.performed) parts.push(`[Spirometria]: ${data.spirometry.summary}`)
  if (data.drugTest?.performed) parts.push(`[Screening Tossicologico]: ${data.drugTest.summary}`)
  return parts.join('\n')
}

export default function InstrumentalExamsCard({ values, onChange }) {
  const [expanded, setExpanded] = useState(true)

  // Local state initialized with provided values or textbook defaults
  const [visiotest, setVisiotest] = useState(() => values?.visiotest || DEFAULT_NORMAL_EXAMS.visiotest)
  const [audiometry, setAudiometry] = useState(() => values?.audiometry || DEFAULT_NORMAL_EXAMS.audiometry)
  const [spirometry, setSpirometry] = useState(() => values?.spirometry || DEFAULT_NORMAL_EXAMS.spirometry)
  const [drugTest, setDrugTest] = useState(() => values?.drugTest || DEFAULT_NORMAL_EXAMS.drugTest)

  // Synchronize when values change from outside (e.g. "Tutto N.D.P." or reset)
  useEffect(() => {
    if (values) {
      if (values.visiotest) setVisiotest(values.visiotest)
      if (values.audiometry) setAudiometry(values.audiometry)
      if (values.spirometry) setSpirometry(values.spirometry)
      if (values.drugTest) setDrugTest(values.drugTest)
    }
  }, [values])

  // Propagate updates to parent
  const notifyParent = (newVisio, newAudio, newSpiro, newDrug) => {
    if (typeof onChange !== 'function') return
    const data = {
      visiotest: newVisio,
      audiometry: newAudio,
      spirometry: newSpiro,
      drugTest: newDrug,
    }
    const fullSummary = buildInstrumentalSummary(data)
    onChange({
      summaryText: fullSummary,
      data,
    })
  }

  // Initial mount notification if values was empty
  useEffect(() => {
    if (!values && typeof onChange === 'function') {
      notifyParent(visiotest, audiometry, spirometry, drugTest)
    }
  }, [])

  // 1-Click Fast Presets
  const setAllExamsNormal = () => {
    const v = { ...DEFAULT_NORMAL_EXAMS.visiotest }
    const a = { ...DEFAULT_NORMAL_EXAMS.audiometry }
    const s = { ...DEFAULT_NORMAL_EXAMS.spirometry }
    const d = { ...DEFAULT_NORMAL_EXAMS.drugTest }

    setVisiotest(v)
    setAudiometry(a)
    setSpirometry(s)
    setDrugTest(d)
    notifyParent(v, a, s, d)
  }

  const applyVisiotestPreset = (isNormal) => {
    const updated = {
      performed: true,
      visusOD: isNormal ? '10/10' : '8/10',
      visusOS: isNormal ? '10/10' : '8/10',
      colorSense: 'Normale',
      stereopsis: 'Normale',
      foria: 'Ortoria',
      summary: isNormal
        ? 'Visus 10/10 bilat., senso cromatico e stereopsi conservati.'
        : 'Lieve deficit visus (8/10 bilat.) con uso lenti correttive prescritte.',
    }
    setVisiotest(updated)
    notifyParent(updated, audiometry, spirometry, drugTest)
  }

  const applyAudiometryPreset = (presetType) => {
    let summary = 'Soglia audiometrica bilaterale nei limiti fisiologici.'
    let status = 'Normale'
    if (presetType === 'notch4k') {
      summary = 'Deficit selettivo neurosensoriale sulle alte frequenze (notch a 4000 Hz bilateralmente).'
      status = 'Ipoacusia 4kHz (Rumore)'
    } else if (presetType === 'presbiacusia') {
      summary = 'Ipoacusia neurosensoriale simmetrica sulle alte frequenze compatibile con presbiacusia.'
      status = 'Presbiacusia'
    }

    const updated = { performed: true, status, summary }
    setAudiometry(updated)
    notifyParent(visiotest, updated, spirometry, drugTest)
  }

  const applySpirometryPreset = (patternType) => {
    let summary = 'Parametri spirometrici nei limiti (FVC 98%, FEV1 95%, Tiffeneau 82%).'
    let pattern = 'Normale'
    let fvc = '98'
    let fev1 = '95'
    let tiffeneau = '82'

    if (patternType === 'obstructive') {
      summary = 'Deficit ventilatorio di tipo ostruttivo di grado lieve (FEV1 72%, Tiffeneau 68%).'
      pattern = 'Ostruttivo lieve'
      fvc = '92'
      fev1 = '72'
      tiffeneau = '68'
    }

    const updated = { performed: true, fvc, fev1, tiffeneau, pattern, summary }
    setSpirometry(updated)
    notifyParent(visiotest, audiometry, updated, drugTest)
  }

  const applyDrugTestPreset = (performed) => {
    const updated = {
      performed,
      result: 'Negativo',
      substances: 'THC, COC, AMP, MET, OPI, BZO, MTD, MDMA',
      summary: performed
        ? 'Test rapido urine 8 sostanze d\'abuso: Tutte Negative (Assenza metaboliti).'
        : 'Non previsto da protocollo di mansione.',
    }
    setDrugTest(updated)
    notifyParent(visiotest, audiometry, spirometry, updated)
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, borderColor: '#cbd5e1', bgcolor: '#ffffff' }}>
      <Box
        sx={{
          p: 2,
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TuneIcon sx={{ color: '#2563eb' }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
              Accertamenti Strumentali & Diagnostici (D.Lgs. 81/08)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Visiotest, Audiometria, Spirometria e Screening Tossicologico con preset rapidi a 1 clic
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
            onClick={setAllExamsNormal}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '11px',
              bgcolor: '#eff6ff',
              borderColor: '#93c5fd',
              color: '#1d4ed8',
              '&:hover': { bgcolor: '#dbeafe' },
            }}
          >
            ✓ Tutti nella Norma
          </Button>

          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={expanded}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
            {/* 1. VISIOTEST */}
            <Box>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fbfcfd', height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <VisibilityIcon sx={{ fontSize: 18, color: '#0284c7' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Visiotest / Ergovision
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <Chip
                      size="small"
                      label="10/10 Bilat."
                      clickable
                      color={visiotest.visusOD === '10/10' ? 'primary' : 'default'}
                      onClick={() => applyVisiotestPreset(true)}
                      sx={{ height: 22, fontSize: '11px', fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      label="Con Lenti"
                      clickable
                      color={visiotest.visusOD === '8/10' ? 'warning' : 'default'}
                      onClick={() => applyVisiotestPreset(false)}
                      sx={{ height: 22, fontSize: '11px', fontWeight: 600 }}
                    />
                  </Stack>
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <TextField
                    size="small"
                    label="Visus OD"
                    value={visiotest.visusOD}
                    onChange={(e) => {
                      const newOD = e.target.value
                      const updated = {
                        ...visiotest,
                        visusOD: newOD,
                        summary: `Visus OD: ${newOD}, OS: ${visiotest.visusOS}, stereopsi e senso cromatico conservati.`,
                      }
                      setVisiotest(updated)
                      notifyParent(updated, audiometry, spirometry, drugTest)
                    }}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Visus OS"
                    value={visiotest.visusOS}
                    onChange={(e) => {
                      const newOS = e.target.value
                      const updated = {
                        ...visiotest,
                        visusOS: newOS,
                        summary: `Visus OD: ${visiotest.visusOD}, OS: ${newOS}, stereopsi e senso cromatico conservati.`,
                      }
                      setVisiotest(updated)
                      notifyParent(updated, audiometry, spirometry, drugTest)
                    }}
                    fullWidth
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                  {visiotest.summary}
                </Typography>
              </Paper>
            </Box>

            {/* 2. AUDIOMETRIA */}
            <Box>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fbfcfd', height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <HearingIcon sx={{ fontSize: 18, color: '#7c3aed' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Audiometria Tonale
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <Chip
                      size="small"
                      label="Normale"
                      clickable
                      color={audiometry.status === 'Normale' ? 'success' : 'default'}
                      onClick={() => applyAudiometryPreset('normal')}
                      sx={{ height: 22, fontSize: '11px', fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      label="Notch 4kHz"
                      clickable
                      color={audiometry.status.includes('4kHz') ? 'warning' : 'default'}
                      onClick={() => applyAudiometryPreset('notch4k')}
                      sx={{ height: 22, fontSize: '11px', fontWeight: 600 }}
                    />
                  </Stack>
                </Stack>

                <TextField
                  size="small"
                  label="Esito Tracciato"
                  value={audiometry.summary}
                  onChange={(e) => {
                    const updated = { ...audiometry, summary: e.target.value }
                    setAudiometry(updated)
                    notifyParent(visiotest, updated, spirometry, drugTest)
                  }}
                  fullWidth
                />
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                  Stato: <strong>{audiometry.status}</strong>
                </Typography>
              </Paper>
            </Box>

            {/* 3. SPIROMETRIA */}
            <Box>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fbfcfd', height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AirIcon sx={{ fontSize: 18, color: '#16a34a' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Spirometria (Curva Flusso-Volume)
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <Chip
                      size="small"
                      label="Normale"
                      clickable
                      color={spirometry.pattern === 'Normale' ? 'success' : 'default'}
                      onClick={() => applySpirometryPreset('normal')}
                      sx={{ height: 22, fontSize: '11px', fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      label="Ostruttivo"
                      clickable
                      color={spirometry.pattern.includes('Ostruttivo') ? 'warning' : 'default'}
                      onClick={() => applySpirometryPreset('obstructive')}
                      sx={{ height: 22, fontSize: '11px', fontWeight: 600 }}
                    />
                  </Stack>
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  <TextField
                    size="small"
                    label="FVC %"
                    value={spirometry.fvc}
                    onChange={(e) => {
                      const newFvc = e.target.value
                      const updated = {
                        ...spirometry,
                        fvc: newFvc,
                        summary: `Parametri spirometrici: FVC ${newFvc}%, FEV1 ${spirometry.fev1}%, Tiffeneau ${spirometry.tiffeneau}% (${spirometry.pattern}).`,
                      }
                      setSpirometry(updated)
                      notifyParent(visiotest, audiometry, updated, drugTest)
                    }}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="FEV1 %"
                    value={spirometry.fev1}
                    onChange={(e) => {
                      const newFev1 = e.target.value
                      const updated = {
                        ...spirometry,
                        fev1: newFev1,
                        summary: `Parametri spirometrici: FVC ${spirometry.fvc}%, FEV1 ${newFev1}%, Tiffeneau ${spirometry.tiffeneau}% (${spirometry.pattern}).`,
                      }
                      setSpirometry(updated)
                      notifyParent(visiotest, audiometry, updated, drugTest)
                    }}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Tiffeneau %"
                    value={spirometry.tiffeneau}
                    onChange={(e) => {
                      const newTiff = e.target.value
                      const updated = {
                        ...spirometry,
                        tiffeneau: newTiff,
                        summary: `Parametri spirometrici: FVC ${spirometry.fvc}%, FEV1 ${spirometry.fev1}%, Tiffeneau ${newTiff}% (${spirometry.pattern}).`,
                      }
                      setSpirometry(updated)
                      notifyParent(visiotest, audiometry, updated, drugTest)
                    }}
                    fullWidth
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                  {spirometry.summary}
                </Typography>
              </Paper>
            </Box>

            {/* 4. DRUG TEST & ALCOL */}
            <Box>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fbfcfd', height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ScienceIcon sx={{ fontSize: 18, color: '#ea580c' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Drug Test & Alcol (Mansioni Rischio Terzi)
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <Chip
                      size="small"
                      label="Non previsto"
                      clickable
                      color={!drugTest.performed ? 'default' : 'default'}
                      onClick={() => applyDrugTestPreset(false)}
                      sx={{ height: 22, fontSize: '11px', fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      label="Negativo (8 Sostanze)"
                      clickable
                      color={drugTest.performed && drugTest.result === 'Negativo' ? 'success' : 'default'}
                      onClick={() => applyDrugTestPreset(true)}
                      sx={{ height: 22, fontSize: '11px', fontWeight: 600 }}
                    />
                  </Stack>
                </Stack>

                <TextField
                  size="small"
                  label="Esito Screening Tossicologico"
                  value={drugTest.summary}
                  onChange={(e) => {
                    const updated = { ...drugTest, summary: e.target.value, performed: true }
                    setDrugTest(updated)
                    notifyParent(visiotest, audiometry, spirometry, updated)
                  }}
                  fullWidth
                />
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                  Sostanze: <em>THC, COC, AMP, MET, OPI, BZO, MTD, MDMA</em>
                </Typography>
              </Paper>
            </Box>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  )
}
