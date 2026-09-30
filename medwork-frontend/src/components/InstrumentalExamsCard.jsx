import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  MenuItem,
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

export default function InstrumentalExamsCard({ values, onChange }) {
  const [expanded, setExpanded] = useState(true)

  // Local state with defaults
  const [visiotest, setVisiotest] = useState(() => values?.visiotest || {
    performed: true,
    visusOD: '10/10',
    visusOS: '10/10',
    colorSense: 'Normale',
    stereopsis: 'Normale',
    foria: 'Ortoria',
    summary: 'Visus naturale/corretto 10/10 bilat., senso cromatico e stereopsi conservati.',
  })

  const [audiometry, setAudiometry] = useState(() => values?.audiometry || {
    performed: true,
    status: 'Normale',
    summary: 'Tracciato audiometrico nei limiti di norma bilat. (0-20 dB).',
  })

  const [spirometry, setSpirometry] = useState(() => values?.spirometry || {
    performed: true,
    fvc: '98',
    fev1: '95',
    tiffeneau: '82',
    pattern: 'Normale',
    summary: 'Curva flusso-volume fisiologica. FVC > 90%, FEV1 > 90%, Tiffeneau 82%.',
  })

  const [drugTest, setDrugTest] = useState(() => values?.drugTest || {
    performed: false,
    result: 'Negativo',
    substances: 'THC, COC, AMP, MET, OPI, BZO, MTD, MDMA',
    summary: 'Test rapido urine 8 sostanze d\'abuso: Tutte Negative.',
  })

  // Propagate updates to parent
  const notifyParent = (newVisio, newAudio, newSpiro, newDrug) => {
    const parts = []
    if (newVisio.performed) parts.push(`[Visiotest/Ergovision]: ${newVisio.summary}`)
    if (newAudio.performed) parts.push(`[Audiometria Tonale]: ${newAudio.summary}`)
    if (newSpiro.performed) parts.push(`[Spirometria]: ${newSpiro.summary}`)
    if (newDrug.performed) parts.push(`[Screening Tossicologico]: ${newDrug.summary}`)

    const fullSummary = parts.join('\n')
    onChange({
      summaryText: fullSummary,
      data: {
        visiotest: newVisio,
        audiometry: newAudio,
        spirometry: newSpiro,
        drugTest: newDrug,
      },
    })
  }

  // 1-Click Fast Presets
  const setAllExamsNormal = () => {
    const v = {
      performed: true,
      visusOD: '10/10',
      visusOS: '10/10',
      colorSense: 'Normale',
      stereopsis: 'Normale',
      foria: 'Ortoria',
      summary: 'Visus 10/10 bilat., stereopsi e senso cromatico conservati.',
    }
    const a = {
      performed: true,
      status: 'Normale',
      summary: 'Soglia audiometrica bilaterale nei limiti fisiologici.',
    }
    const s = {
      performed: true,
      fvc: '98',
      fev1: '95',
      tiffeneau: '82',
      pattern: 'Normale',
      summary: 'Parametri spirometrici nei limiti (FVC 98%, FEV1 95%, Tiffeneau 82%).',
    }
    const d = {
      performed: false,
      result: 'Negativo',
      substances: 'THC, COC, AMP, MET, OPI, BZO, MTD, MDMA',
      summary: 'Test rapido urine 8 sostanze d\'abuso: Tutte Negative.',
    }

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
    let summary = 'Curva flusso-volume fisiologica. FVC > 90%, FEV1 > 90%, Tiffeneau 82%.'
    let pattern = 'Normale'
    let fvc = '98'
    let fev1 = '95'

    if (patternType === 'obstructive') {
      summary = 'Deficit ventilatorio di tipo ostruttivo di grado lieve (FEV1 72%, Tiffeneau 68%).'
      pattern = 'Ostruttivo lieve'
      fvc = '92'
      fev1 = '72'
    }

    const updated = { performed: true, fvc, fev1, tiffeneau: '82', pattern, summary }
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
          <Grid container spacing={2.5}>
            {/* 1. VISIOTEST */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fbfcfd' }}>
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

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      size="small"
                      label="Visus OD"
                      value={visiotest.visusOD}
                      onChange={(e) => {
                        const updated = { ...visiotest, visusOD: e.target.value }
                        setVisiotest(updated)
                        notifyParent(updated, audiometry, spirometry, drugTest)
                      }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      size="small"
                      label="Visus OS"
                      value={visiotest.visusOS}
                      onChange={(e) => {
                        const updated = { ...visiotest, visusOS: e.target.value }
                        setVisiotest(updated)
                        notifyParent(updated, audiometry, spirometry, drugTest)
                      }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                  {visiotest.summary}
                </Typography>
              </Paper>
            </Grid>

            {/* 2. AUDIOMETRIA */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fbfcfd' }}>
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
            </Grid>

            {/* 3. SPIROMETRIA */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fbfcfd' }}>
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

                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <TextField
                      size="small"
                      label="FVC %"
                      value={spirometry.fvc}
                      onChange={(e) => {
                        const updated = { ...spirometry, fvc: e.target.value }
                        setSpirometry(updated)
                        notifyParent(visiotest, audiometry, updated, drugTest)
                      }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      size="small"
                      label="FEV1 %"
                      value={spirometry.fev1}
                      onChange={(e) => {
                        const updated = { ...spirometry, fev1: e.target.value }
                        setSpirometry(updated)
                        notifyParent(visiotest, audiometry, updated, drugTest)
                      }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      size="small"
                      label="Tiffeneau %"
                      value={spirometry.tiffeneau}
                      onChange={(e) => {
                        const updated = { ...spirometry, tiffeneau: e.target.value }
                        setSpirometry(updated)
                        notifyParent(visiotest, audiometry, updated, drugTest)
                      }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                  {spirometry.summary}
                </Typography>
              </Paper>
            </Grid>

            {/* 4. DRUG TEST & ALCOL */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fbfcfd' }}>
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
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  )
}
