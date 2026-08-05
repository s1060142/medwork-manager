import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
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
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Tabs,
  Tab,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import { apiGet, apiSend } from '../services/apiClient'

const PROTOCOL_TYPES = [
  { key: 'mansione', label: 'Protocolli di mansione' },
  { key: 'accessori', label: 'Protocolli accessori' },
  { key: 'dimissione', label: 'Protocolli di dimissione' },
  { key: 'richiesta', label: 'Protocolli su richiesta' },
]

const PERIODICITY_OPTIONS = [
  '1A', '2A', '3A', '4A', '5A', '6A',
  '1M', '2M', '3M', '4M', '6M',
  '1G', '2G', '5G', '10G', '20G', '50G',
]

export default function ProtocolsCenter() {
  const [protocolType, setProtocolType] = useState('mansione')
  const [protocols, setProtocols] = useState([])
  const [selectedProtocol, setSelectedProtocol] = useState(null)
  const [workplaces, setWorkplaces] = useState([])
  const [assessments, setAssessments] = useState([])
  const [companies, setCompanies] = useState([])
  const [examTypes, setExamTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [workplaceSearch, setWorkplaceSearch] = useState('')
  const [assessmentSearch, setAssessmentSearch] = useState('')
  const [workplacePage, setWorkplacePage] = useState(0)
  const [assessmentPage, setAssessmentPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [workplaceDialog, setWorkplaceDialog] = useState({ open: false, edit: null })
  const [assessmentDialog, setAssessmentDialog] = useState({ open: false, edit: null })
  const [workplaceForm, setWorkplaceForm] = useState({ companyId: '', building: '', level: '', room: '' })
  const [assessmentForm, setAssessmentForm] = useState({ examTypeId: '', periodicity: '', isPrimary: false })

  // Load initial data
  useEffect(() => {
    Promise.all([
      apiGet('/api/master-data/protocols'),
      apiGet('/api/master-data/companies'),
      apiGet('/api/master-data/exam-types'),
    ]).then(([protocolData, companyData, examData]) => {
      setProtocols(Array.isArray(protocolData) ? protocolData : [])
      setCompanies(Array.isArray(companyData) ? companyData : [])
      setExamTypes(Array.isArray(examData) ? examData : [])
    }).catch(() => {})
  }, [])

  // Load workplaces and assessments when protocol changes
  useEffect(() => {
    if (selectedProtocol) {
      setLoading(true)
      // In real app, these would be API calls with protocolId
      // Mock data for now
      setWorkplaces([
        { id: 1, companyId: 1, companyName: 'Dilaxia S.p.a.', building: 'Sede principale', level: 'Piano 1', room: 'Amb. 1' },
        { id: 2, companyId: 2, companyName: 'Albox S.r.l.', building: 'Centrale', level: 'Piano 0', room: 'Amb. 2' },
      ])
      setAssessments([
        { id: 1, examTypeId: 1, examTypeName: 'Visio Test', periodicity: '5A 50 2A', isPrimary: false },
        { id: 2, examTypeId: 2, examTypeName: 'Visita Medica', periodicity: '5A 50 2A', isPrimary: true },
      ])
      setLoading(false)
    } else {
      setWorkplaces([])
      setAssessments([])
    }
  }, [selectedProtocol])

  const filteredWorkplaces = useMemo(() => {
    return workplaces.filter(w =>
      w.companyName.toLowerCase().includes(workplaceSearch.toLowerCase()) ||
      w.building.toLowerCase().includes(workplaceSearch.toLowerCase())
    )
  }, [workplaces, workplaceSearch])

  const filteredAssessments = useMemo(() => {
    return assessments.filter(a =>
      a.examTypeName.toLowerCase().includes(assessmentSearch.toLowerCase())
    )
  }, [assessments, assessmentSearch])

  const paginatedWorkplaces = filteredWorkplaces.slice(workplacePage * rowsPerPage, workplacePage * rowsPerPage + rowsPerPage)
  const paginatedAssessments = filteredAssessments.slice(assessmentPage * rowsPerPage, assessmentPage * rowsPerPage + rowsPerPage)

  const handleProtocolSelect = (protocol) => {
    setSelectedProtocol(protocol)
    setWorkplacePage(0)
    setAssessmentPage(0)
  }

  const openWorkplaceDialog = (edit = null) => {
    if (edit) {
      setWorkplaceForm({ companyId: edit.companyId, building: edit.building, level: edit.level, room: edit.room })
    } else {
      setWorkplaceForm({ companyId: '', building: '', level: '', room: '' })
    }
    setWorkplaceDialog({ open: true, edit })
  }

  const openAssessmentDialog = (edit = null) => {
    if (edit) {
      setAssessmentForm({ examTypeId: edit.examTypeId, periodicity: edit.periodicity, isPrimary: edit.isPrimary })
    } else {
      setAssessmentForm({ examTypeId: '', periodicity: '', isPrimary: false })
    }
    setAssessmentDialog({ open: true, edit })
  }

  const saveWorkplace = async () => {
    if (!workplaceForm.companyId) return
    setSaving(true)
    try {
      if (workplaceDialog.edit) {
        // Update
        setWorkplaces(prev => prev.map(w => w.id === workplaceDialog.edit.id ? { ...w, ...workplaceForm, companyName: companies.find(c => c.id === workplaceForm.companyId)?.name } : w))
      } else {
        // Create
        const newId = Date.now()
        const company = companies.find(c => c.id === workplaceForm.companyId)
        setWorkplaces(prev => [...prev, { id: newId, ...workplaceForm, companyName: company?.name }])
      }
      setWorkplaceDialog({ open: false, edit: null })
    } finally {
      setSaving(false)
    }
  }

  const saveAssessment = async () => {
    if (!assessmentForm.examTypeId) return
    setSaving(true)
    try {
      const examType = examTypes.find(e => e.id === assessmentForm.examTypeId)
      if (assessmentDialog.edit) {
        setAssessments(prev => prev.map(a => a.id === assessmentDialog.edit.id ? { ...a, ...assessmentForm, examTypeName: examType?.name } : a))
      } else {
        const newId = Date.now()
        setAssessments(prev => [...prev, { id: newId, ...assessmentForm, examTypeName: examType?.name }])
      }
      setAssessmentDialog({ open: false, edit: null })
    } finally {
      setSaving(false)
    }
  }

  const deleteWorkplace = (id) => {
    setWorkplaces(prev => prev.filter(w => w.id !== id))
  }

  const deleteAssessment = (id) => {
    setAssessments(prev => prev.filter(a => a.id !== id))
  }

  const renderWorkplacesTab = () => (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <TextField
          size="small"
          placeholder="Cerca luogo di lavoro..."
          value={workplaceSearch}
          onChange={(e) => { setWorkplaceSearch(e.target.value); setWorkplacePage(0) }}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
          }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openWorkplaceDialog()}>
          Aggiungi
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 40 }}>
                <Checkbox />
              </TableCell>
              <TableCell><strong>Azienda</strong></TableCell>
              <TableCell><strong>Sede</strong></TableCell>
              <TableCell><strong>Edificio</strong></TableCell>
              <TableCell><strong>Livello</strong></TableCell>
              <TableCell><strong>Locale</strong></TableCell>
              <TableCell align="right" style={{ width: 80 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedWorkplaces.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell><Checkbox /></TableCell>
                <TableCell>{row.companyName}</TableCell>
                <TableCell>{row.building}</TableCell>
                <TableCell>{row.level}</TableCell>
                <TableCell>{row.room}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openWorkplaceDialog(row)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteWorkplace(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {paginatedWorkplaces.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">Nessun luogo di lavoro configurato</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredWorkplaces.length}
        rowsPerPage={rowsPerPage}
        page={workplacePage}
        onPageChange={(e, p) => setWorkplacePage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setWorkplacePage(0); }}
      />
    </Stack>
  )

  const renderAssessmentsTab = () => (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <TextField
          size="small"
          placeholder="Cerca visita e accertamento..."
          value={assessmentSearch}
          onChange={(e) => { setAssessmentSearch(e.target.value); setAssessmentPage(0) }}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
          }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openAssessmentDialog()}>
          Aggiungi
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 40 }}>
                <Checkbox />
              </TableCell>
              <TableCell><strong>Accertamento</strong></TableCell>
              <TableCell><strong>Periodicità</strong></TableCell>
              <TableCell><strong>Principale</strong></TableCell>
              <TableCell align="right" style={{ width: 80 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAssessments.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell><Checkbox /></TableCell>
                <TableCell>{row.examTypeName}</TableCell>
                <TableCell>{row.periodicity}</TableCell>
                <TableCell align="center">
                  {row.isPrimary ? (
                    <StarIcon color="warning" fontSize="large" />
                  ) : (
                    <StarBorderIcon color="action" fontSize="large" onClick={() => {
                      setAssessments(prev => prev.map(a => ({ ...a, isPrimary: a.id === row.id })))
                    }} />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openAssessmentDialog(row)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteAssessment(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {paginatedAssessments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">Nessun accertamento configurato</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredAssessments.length}
        rowsPerPage={rowsPerPage}
        page={assessmentPage}
        onPageChange={(e, p) => setAssessmentPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setAssessmentPage(0); }}
      />
    </Stack>
  )

  return (
    <Stack spacing={2}>
      {/* Protocol Type Tabs */}
      <Paper sx={{ p: 1 }}>
        <Tabs
          value={protocolType}
          onChange={(event, newType) => { setProtocolType(newType); setSelectedProtocol(null); }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ width: '100%' }}
        >
          {PROTOCOL_TYPES.map((tab) => (
            <Tab key={tab.key} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Protocol Selector */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {PROTOCOL_TYPES.find(t => t.key === protocolType)?.label}
        </Typography>
        
        <FormControl fullWidth variant="outlined" size="small" sx={{ maxWidth: 500 }}>
          <InputLabel>Seleziona protocollo</InputLabel>
          <Select
            value={selectedProtocol?.id?.toString() || ''}
            label="Seleziona protocollo"
            onChange={(e) => handleProtocolSelect(protocols.find(p => p.id === parseInt(e.target.value)) || null)}
            displayEmpty
          >
            <MenuItem value="">Crea nuovo protocollo</MenuItem>
            {protocols.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedProtocol ? (
        <Stack spacing={2}>
          <Typography variant="subtitle1" gutterBottom>
            {selectedProtocol.name} - {selectedProtocol.jobRoleName || 'Senza mansione associata'}
          </Typography>

          {/* Workplaces Tab */}
          <Tabs
            value="workplaces"
            onChange={() => {}}
            TabIndicatorProps={{ style: { display: 'none' } }}
            sx={{ '& .MuiTab-root': { minWidth: 120, padding: '8px 16px' } }}
          >
            <Tab label="Luoghi di lavoro" />
            <Tab label="Visite e accertamenti" />
          </Tabs>

          {renderWorkplacesTab()}
          {/* The assessment tab content would go here when the tabs are properly connected */}
          {renderAssessmentsTab()}
        </Stack>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Nessun protocollo selezionato</Typography>
          <Typography variant="body2" color="text.secondary">
            Seleziona un protocollo dall'elenco o creane uno nuovo
          </Typography>
        </Paper>
      )}
    </Stack>
  )
}