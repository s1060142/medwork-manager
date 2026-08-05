import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DownloadIcon from '@mui/icons-material/Download'
import SendIcon from '@mui/icons-material/Send'
import DescriptionIcon from '@mui/icons-material/Description'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AssessmentIcon from '@mui/icons-material/Assessment'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import { apiGet, apiSend } from '../services/apiClient'

const RECORD_TABS = [
  { key: 'generali', label: 'Generali', icon: PersonIcon },
  { key: 'storia-lavorativa', label: 'Storia lavorativa', icon: AssessmentIcon },
  { key: 'incarichi', label: 'Incarichi', icon: LocalHospitalIcon },
  { key: 'protocolli', label: 'Protocolli', icon: DescriptionIcon },
  { key: 'episodi', label: 'Episodi', icon: AssessmentIcon },
  { key: 'episodi-richiesta', label: 'Episodi su richiesta', icon: AssessmentIcon },
  { key: 'dipendenze', label: 'Dipendenze', icon: AssessmentIcon },
  { key: 'vaccinazioni', label: 'Vaccinazioni', icon: MedicalServicesIcon },
  { key: 'infortuni', label: 'Infortuni', icon: AssessmentIcon },
  { key: 'dosp', label: 'DoSP', icon: AssessmentIcon },
  { key: 'allegati', label: 'Allegati', icon: DescriptionOutlinedIcon },
]

const HEALTH_RECORD_TABS = [
  { key: 'visite', label: 'Visite mediche', icon: MedicalServicesIcon },
  { key: 'esami', label: 'Esami strumentali', icon: AssessmentIcon },
  { key: 'audiometria', label: 'Audiometria', icon: DescriptionIcon },
  { key: 'firme', label: 'Firme', icon: DescriptionOutlinedIcon },
  { key: 'esporta', label: 'Esporta cartella', icon: DownloadIcon },
]

export default function HealthRecordCenter() {
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [activeTab, setActiveTab] = useState('visite')
  const [loading, setLoading] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    mode: 'all',
    startDate: '',
    endDate: '',
    includeAttachments: true,
    includeServices: true,
    includePrivacy: false,
  })

  // Medical Visits
  const [visits, setVisits] = useState([])
  const [visitDialog, setVisitDialog] = useState({ open: false, edit: null })
  const [visitForm, setVisitForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'Periodica',
    doctorId: '',
    outcome: '',
    clinicalNotes: '',
    objectiveExam: '',
    targetOrgans: '',
    weight: '',
  })

  // Instrumental Exams
  const [exams, setExams] = useState([])
  const [examDialog, setExamDialog] = useState({ open: false, edit: null })
  const [examForm, setExamForm] = useState({
    examTypeId: '',
    examDate: new Date().toISOString().split('T')[0],
    result: '',
    notes: '',
    referenceRange: '',
  })

  // Audiometry
  const [audiometries, setAudiometries] = useState([])
  const [audiometryDialog, setAudiometryDialog] = useState({ open: false, edit: null })
  const [audiometryForm, setAudiometryForm] = useState({
    examDate: new Date().toISOString().split('T')[0],
    leftEar: { 125: '', 250: '', 500: '', 1000: '', 2000: '', 4000: '', 8000: '' },
    rightEar: { 125: '', 250: '', 500: '', 1000: '', 2000: '', 4000: '', 8000: '' },
    interpretation: '',
  })

  // Signatures
  const [signatures, setSignatures] = useState([])
  const [signatureDialog, setSignatureDialog] = useState({ open: false, edit: null })
  const [signatureForm, setSignatureForm] = useState({
    type: 'digitale',
    documentType: '',
    documentId: '',
    signedAt: new Date().toISOString(),
    signer: '',
    notes: '',
  })

  // Load data
  useEffect(() => {
    apiGet('/api/master-data/employees')
      .then(setEmployees)
      .catch(() => setEmployees([]))
  }, [])

  // Load employee health record when selection changes
  useEffect(() => {
    if (!selectedEmployeeId) return
    setLoading(true)
    Promise.all([
      apiGet(`/api/medical-records/employee/${selectedEmployeeId}`),
      apiGet(`/api/medical-visits/employee/${selectedEmployeeId}`),
    ]).then(([recordData, visitsData]) => {
      if (recordData) {
        // Load visits, exams, audiometries, signatures from record
      }
      if (visitsData) {
        const arr = Array.isArray(visitsData) ? visitsData : (visitsData.items || [])
        setVisits(arr)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selectedEmployeeId])

  const handleExport = async () => {
    setLoading(true)
    try {
      await apiSend('POST', `/api/health-record/export/${selectedEmployeeId}`, exportOptions)
      setExportDialogOpen(false)
      alert('Esportazione cartella sanitaria avviata')
    } catch (error) {
      alert('Errore durante l\'esportazione')
    } finally {
      setLoading(false)
    }
  }

  const renderVisiteTab = () => (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Visite mediche</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setVisitDialog({ open: true, edit: null })}>
          Nuova visita
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Medico</TableCell>
              <TableCell>Esito</TableCell>
              <TableCell>Note cliniche</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visits.map((visit) => (
              <TableRow key={visit.id} hover>
                <TableCell>{visit.visitDate ? new Date(visit.visitDate).toLocaleDateString('it-IT') : '-'}</TableCell>
                <TableCell>{visit.visitType}</TableCell>
                <TableCell>{visit.doctorName || '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={visit.outcome} color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{visit.clinicalNotes || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setVisitDialog({ open: true, edit: visit })}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setVisits(prev => prev.filter(v => v.id !== visit.id))}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {visits.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">Nessuna visita registrata</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )

  const renderEsamiTab = () => (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Esami strumentali</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setExamsDialog({ open: true, edit: null })}>
          Nuovo esame
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Tipo esame</TableCell>
              <TableCell>Risultato</TableCell>
              <TableCell>Valori di riferimento</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exams.map((exam) => (
              <TableRow key={exam.id} hover>
                <TableCell>{exam.examDate ? new Date(exam.examDate).toLocaleDateString('it-IT') : '-'}</TableCell>
                <TableCell>{exam.examTypeName || '-'}</TableCell>
                <TableCell>{exam.result}</TableCell>
                <TableCell>{exam.referenceRange || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setExamsDialog({ open: true, edit: exam })}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setExams(prev => prev.filter(e => e.id !== exam.id))}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )

  const renderAudiometriaTab = () => (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Audiometria tonale</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAudiometryDialog({ open: true, edit: null })}>
          Nuovo esame
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Orecchio SX (dB)</TableCell>
              <TableCell>Orecchio DX (dB)</TableCell>
              <TableCell>Interpretazione</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {audiometries.map((audio) => (
              <TableRow key={audio.id} hover>
                <TableCell>{audio.examDate ? new Date(audio.examDate).toLocaleDateString('it-IT') : '-'}</TableCell>
                <TableCell>
                  {Object.entries(audio.leftEar || {}).map(([freq, val]) => (
                    <Chip key={freq} label={`${freq}Hz: ${val}`} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>
                  {Object.entries(audio.rightEar || {}).map(([freq, val]) => (
                    <Chip key={freq} label={`${freq}Hz: ${val}`} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>{audio.interpretation || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setAudiometryDialog({ open: true, edit: audio })}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setAudiometries(prev => prev.filter(a => a.id !== audio.id))}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )

  const renderFirmeTab = () => (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Firme digitali / grafometriche</Typography>
        <Button variant="contained" startIcon={<SendIcon />} onClick={() => setSignatureDialog({ open: true, edit: null })}>
          Aggiungi firma
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell>Firmatario</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {signatures.map((sig) => (
              <TableRow key={sig.id} hover>
                <TableCell>{sig.signedAt ? new Date(sig.signedAt).toLocaleString('it-IT') : '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={sig.type} color={sig.type === 'digitale' ? 'primary' : 'secondary'} variant="outlined" />
                </TableCell>
                <TableCell>{sig.documentType} #{sig.documentId}</TableCell>
                <TableCell>{sig.signer}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setSignatureDialog({ open: true, edit: sig })}><EditIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )

  const renderExportTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Esporta cartella sanitaria
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Puoi generare la cartella sanitaria con tutti i referti oppure solo per un periodo specifico.
        La cartella verrà firmata digitalmente al termine del processo.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <RadioGroup value={exportOptions.mode} onChange={(e) => setExportOptions({ ...exportOptions, mode: e.target.value })}>
        <FormControlLabel value="all" control={<Radio color="primary" />} label="Tutti i referti" />
        <FormControlLabel value="period" control={<Radio color="primary" />} label="Scegli il periodo" />
      </RadioGroup>

      {exportOptions.mode === 'period' && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Referti dal"
              type="date"
              size="small"
              fullWidth
              value={exportOptions.startDate}
              onChange={(e) => setExportOptions({ ...exportOptions, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Referti fino al"
              type="date"
              size="small"
              fullWidth
              value={exportOptions.endDate}
              onChange={(e) => setExportOptions({ ...exportOptions, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" gutterBottom>
        Opzioni di inclusione
      </Typography>
      <FormControlLabel
        control={<Checkbox checked={exportOptions.includeAttachments} onChange={(e) => setExportOptions({ ...exportOptions, includeAttachments: e.target.checked })} color="primary" />}
        label="Includi allegati dei referti"
      />
      <FormControlLabel
        control={<Checkbox checked={exportOptions.includeServices} onChange={(e) => setExportOptions({ ...exportOptions, includeServices: e.target.checked })} color="primary" />}
        label="Includi prestazioni erogate e refertate"
      />
      <FormControlLabel
        control={<Checkbox checked={exportOptions.includePrivacy} onChange={(e) => setExportOptions({ ...exportOptions, includePrivacy: e.target.checked })} color="primary" />}
        label="Includi informativa privacy firmata"
      />

      <Divider sx={{ my: 3 }} />

      <Button
        variant="contained"
        size="large"
        startIcon={<DownloadIcon />}
        onClick={handleExport}
        disabled={loading || !selectedEmployeeId}
      >
        {loading ? 'Generazione...' : 'Procedi con esportazione'}
      </Button>
    </Paper>
  )

  return (
    <Box>
      {/* Employee Selector */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="employee-label">Lavoratore</InputLabel>
          <Select
            labelId="employee-label"
            label="Lavoratore"
            value={selectedEmployeeId}
            onChange={(e) => { setSelectedEmployeeId(e.target.value); setActiveTab('visite'); }}
            displayEmpty
          >
            <MenuItem value="">Seleziona un lavoratore</MenuItem>
            {employees.map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.lastName} {e.firstName} ({e.taxCode})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedEmployeeId && (
        <>
          {/* Health Record Tabs */}
          <Paper sx={{ p: 1, mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(event, newTab) => setActiveTab(newTab)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ width: '100%' }}
            >
              {HEALTH_RECORD_TABS.map((tab) => (
                <Tab key={tab.key} label={tab.label} icon={<tab.icon fontSize="small" />} />
              ))}
            </Tabs>
          </Paper>

          {/* Tab Content */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            activeTab === 'visite' && renderVisiteTab()
            || activeTab === 'esami' && renderEsamiTab()
            || activeTab === 'audiometria' && renderAudiometriaTab()
            || activeTab === 'firme' && renderFirmeTab()
            || activeTab === 'esporta' && renderExportTab()
          )}
        </>
      )}
    </Box>
  )
}