import React, { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Paper,
  Divider,
  LinearProgress,
  Badge,
  Checkbox,
  Snackbar,
  Stack,
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import ApartmentIcon from '@mui/icons-material/Apartment'
import GroupIcon from '@mui/icons-material/Group'
import EventIcon from '@mui/icons-material/Event'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ShieldIcon from '@mui/icons-material/Shield'
import AssessmentIcon from '@mui/icons-material/Assessment'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RefreshIcon from '@mui/icons-material/Refresh'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import AddIcon from '@mui/icons-material/Add'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import ScheduleIcon from '@mui/icons-material/Schedule'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import SyncIcon from '@mui/icons-material/Sync'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import FlakyIcon from '@mui/icons-material/Flaky'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import { apiGet, apiSend, getApiBaseUrl, getHeaders } from '../services/apiClient'

export default function CompanyGroupsCenter() {
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  // Active data state
  const [dashboardData, setDashboardData] = useState(null)
  const [deadlines, setDeadlines] = useState([])
  const [deadlineFilter, setDeadlineFilter] = useState({ category: '', urgencyDays: '60', search: '' })
  const [employees, setEmployees] = useState([])
  const [employeeFilter, setEmployeeFilter] = useState({ companyId: '', fitnessStatus: '', search: '' })
  const [complianceData, setComplianceData] = useState(null)
  const [reportsData, setReportsData] = useState(null)
  const [physicianData, setPhysicianData] = useState(null)
  const [groupDetails, setGroupDetails] = useState(null)
  const [availableMasterCompanies, setAvailableMasterCompanies] = useState([])
  const [availableMasterDoctors, setAvailableMasterDoctors] = useState([])

  // Planning state
  const [planningCandidates, setPlanningCandidates] = useState([])
  const [selectedCandidates, setSelectedCandidates] = useState([])
  const [bulkVisitDialog, setBulkVisitDialog] = useState(false)
  const [campaignDialog, setCampaignDialog] = useState(false)
  const [siteVisitDialog, setSiteVisitDialog] = useState(false)
  const [createGroupDialog, setCreateGroupDialog] = useState(false)
  const [addCompanyDialog, setAddCompanyDialog] = useState(false)
  const [addDoctorDialog, setAddDoctorDialog] = useState(false)

  // Forms state
  const [visitPlanForm, setVisitPlanForm] = useState({
    scheduledDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    visitType: 'Periodica',
    doctorId: '',
    ambulatory: 'Ambulatorio Principale',
    notes: 'Pianificazione massiva gruppo aziendale ex Art. 41 D.Lgs 81/08',
  })
  const [campaignForm, setCampaignForm] = useState({
    title: 'Campagna Sorveglianza Sanitaria Gruppo 2026',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    notes: 'Campagna preventiva periodica per lavoratori a rischio gruppo.',
  })
  const [siteVisitForm, setSiteVisitForm] = useState({
    scheduledDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    doctorId: '',
    notes: 'Sopralluogo congiunto ambienti di lavoro ex Art. 25 c. 1 lett. l D.Lgs 81/08',
  })
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    legalName: '',
    vatNumber: '',
    taxCode: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    singleArchive: true,
  })
  const [newCompanySelection, setNewCompanySelection] = useState('')
  const [newDoctorSelection, setNewDoctorSelection] = useState({ doctorId: '', roleInGroup: 'Medico Competente' })

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }

  // Load all groups initially
  const loadGroups = useCallback(async (selectId = null) => {
    try {
      setLoading(true)
      const data = await apiGet('/api/company-groups')
      const loaded = Array.isArray(data) ? data : []
      setGroups(loaded)
      if (loaded.length > 0) {
        const nextId = selectId && loaded.some(g => g.id === selectId) ? selectId : loaded[0].id
        setSelectedGroupId(nextId)
      } else {
        setSelectedGroupId(null)
      }
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Errore nel caricamento dei gruppi aziendali')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  // Load active tab data whenever selectedGroupId or activeTab changes
  const loadActiveTabData = useCallback(async () => {
    if (!selectedGroupId) return
    setTabLoading(true)
    setError('')
    try {
      if (activeTab === 0) {
        // Dashboard
        const d = await apiGet(`/api/company-groups/${selectedGroupId}/dashboard`)
        setDashboardData(d)
      } else if (activeTab === 1) {
        // Deadlines
        const params = new URLSearchParams()
        if (deadlineFilter.category) params.append('category', deadlineFilter.category)
        if (deadlineFilter.urgencyDays) params.append('urgencyDays', deadlineFilter.urgencyDays)
        if (deadlineFilter.search) params.append('search', deadlineFilter.search)
        const d = await apiGet(`/api/company-groups/${selectedGroupId}/deadlines?${params.toString()}`)
        setDeadlines(Array.isArray(d) ? d : [])
      } else if (activeTab === 2) {
        // Workforce
        const params = new URLSearchParams()
        if (employeeFilter.companyId) params.append('companyId', employeeFilter.companyId)
        if (employeeFilter.fitnessStatus) params.append('fitnessStatus', employeeFilter.fitnessStatus)
        if (employeeFilter.search) params.append('search', employeeFilter.search)
        const d = await apiGet(`/api/company-groups/${selectedGroupId}/employees?${params.toString()}`)
        setEmployees(Array.isArray(d) ? d : [])
      } else if (activeTab === 3) {
        // Planning
        const c = await apiGet(`/api/company-groups/${selectedGroupId}/planning-candidates`)
        setPlanningCandidates(Array.isArray(c) ? c : [])
        setSelectedCandidates([])
      } else if (activeTab === 4) {
        // Compliance
        const comp = await apiGet(`/api/company-groups/${selectedGroupId}/compliance`)
        setComplianceData(comp)
      } else if (activeTab === 5) {
        // Reports
        const rep = await apiGet(`/api/company-groups/${selectedGroupId}/reports/aggregated`)
        setReportsData(rep)
      } else if (activeTab === 6) {
        // Physician Perspective
        const phys = await apiGet(`/api/company-groups/${selectedGroupId}/physician-perspective`)
        setPhysicianData(phys)
      } else if (activeTab === 7) {
        // Governance & Settings
        const details = await apiGet(`/api/company-groups/${selectedGroupId}`)
        setGroupDetails(details)
        const [masterCompanies, masterDoctors] = await Promise.all([
          apiGet('/api/master-data/companies').catch(() => []),
          apiGet('/api/master-data/doctors').catch(() => []),
        ])
        setAvailableMasterCompanies(Array.isArray(masterCompanies) ? masterCompanies : [])
        setAvailableMasterDoctors(Array.isArray(masterDoctors) ? masterDoctors : [])
      }
    } catch (err) {
      setError(err.message || 'Errore durante il caricamento dei dati del gruppo.')
    } finally {
      setTabLoading(false)
    }
  }, [selectedGroupId, activeTab, deadlineFilter, employeeFilter])

  useEffect(() => {
    loadActiveTabData()
  }, [loadActiveTabData])

  // Bulk Planning Handlers
  const handleSelectAllCandidates = (e) => {
    if (e.target.checked) {
      setSelectedCandidates(planningCandidates.map(c => c.employeeId))
    } else {
      setSelectedCandidates([])
    }
  }

  const handleToggleCandidate = (id) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleExecuteBulkVisits = async () => {
    if (selectedCandidates.length === 0) {
      showToast('Seleziona almeno un lavoratore', 'warning')
      return
    }
    try {
      setTabLoading(true)
      const res = await apiSend(`/api/company-groups/${selectedGroupId}/bulk-plan-visits`, 'POST', {
        employeeIds: selectedCandidates,
        scheduledDate: visitPlanForm.scheduledDate,
        visitType: visitPlanForm.visitType,
        doctorId: visitPlanForm.doctorId ? parseInt(visitPlanForm.doctorId, 10) : null,
        ambulatory: visitPlanForm.ambulatory,
        notes: visitPlanForm.notes,
      })
      showToast(res?.message || 'Visite pianificate con successo!')
      setBulkVisitDialog(false)
      loadActiveTabData()
    } catch (err) {
      showToast(err.message || 'Errore nella pianificazione massiva', 'error')
    } finally {
      setTabLoading(false)
    }
  }

  const handleExecuteCampaign = async () => {
    try {
      setTabLoading(true)
      const res = await apiSend(`/api/company-groups/${selectedGroupId}/bulk-plan-campaign`, 'POST', campaignForm)
      showToast(res?.message || 'Campagna di sorveglianza avviata!')
      setCampaignDialog(false)
      loadActiveTabData()
    } catch (err) {
      showToast(err.message || 'Errore nel lancio campagna', 'error')
    } finally {
      setTabLoading(false)
    }
  }

  const handleExecuteBulkSiteVisits = async () => {
    try {
      setTabLoading(true)
      const res = await apiSend(`/api/company-groups/${selectedGroupId}/bulk-plan-site-visits`, 'POST', {
        scheduledDate: siteVisitForm.scheduledDate,
        doctorId: siteVisitForm.doctorId ? parseInt(siteVisitForm.doctorId, 10) : null,
        notes: siteVisitForm.notes,
      })
      showToast(res?.message || 'Sopralluoghi programmati per tutte le aziende del gruppo!')
      setSiteVisitDialog(false)
      loadActiveTabData()
    } catch (err) {
      showToast(err.message || 'Errore nella programmazione dei sopralluoghi', 'error')
    } finally {
      setTabLoading(false)
    }
  }

  // Remediation Action
  const handleRemediate = async (actionKey) => {
    try {
      setTabLoading(true)
      const res = await apiSend(`/api/company-groups/${selectedGroupId}/compliance/remediate`, 'POST', { action: actionKey })
      showToast(res?.message || 'Azione correttiva applicata con successo!')
      loadActiveTabData()
    } catch (err) {
      showToast(err.message || 'Errore durante l\'azione correttiva', 'error')
    } finally {
      setTabLoading(false)
    }
  }

  // Propagation Handlers
  const handlePropagateDoctors = async () => {
    try {
      setTabLoading(true)
      const res = await apiSend(`/api/company-groups/${selectedGroupId}/propagate-doctors`, 'POST', {})
      showToast(res?.message || 'Medici propagati con successo a tutte le aziende!')
      loadActiveTabData()
    } catch (err) {
      showToast(err.message || 'Errore nella propagazione medici', 'error')
    } finally {
      setTabLoading(false)
    }
  }

  const handlePropagateProtocols = async () => {
    try {
      setTabLoading(true)
      const res = await apiSend(`/api/company-groups/${selectedGroupId}/propagate-protocols`, 'POST', {})
      showToast(res?.message || 'Protocolli propagati con successo a tutte le aziende!')
      loadActiveTabData()
    } catch (err) {
      showToast(err.message || 'Errore nella propagazione protocolli', 'error')
    } finally {
      setTabLoading(false)
    }
  }

  // Membership Handlers
  const handleAddCompanyToGroup = async () => {
    if (!newCompanySelection) return
    try {
      setTabLoading(true)
      await apiSend(`/api/company-groups/${selectedGroupId}/companies`, 'POST', { companyId: parseInt(newCompanySelection, 10) })
      showToast('Azienda aggiunta al gruppo!')
      setAddCompanyDialog(false)
      setNewCompanySelection('')
      loadActiveTabData()
    } catch (err) {
      showToast(err.message || 'Errore aggiunta azienda', 'error')
    } finally {
      setTabLoading(false)
    }
  }

  const handleRemoveCompanyFromGroup = async (cid) => {
    try {
      setTabLoading(true)
      await apiSend(`/api/company-groups/${selectedGroupId}/companies/${cid}`, 'DELETE')
      showToast('Azienda rimossa dal gruppo')
      loadActiveTabData()
    } catch (err) {
      showToast(err.message || 'Errore rimozione azienda', 'error')
    } finally {
      setTabLoading(false)
    }
  }

  // Doctor Team Handlers
  const handleAddDoctorToGroup = async () => {
    if (!newDoctorSelection.doctorId) return
    try {
      setTabLoading(true)
      await apiSend(`/api/company-groups/${selectedGroupId}/doctors`, 'POST', {
        doctorId: parseInt(newDoctorSelection.doctorId, 10),
        roleInGroup: newDoctorSelection.roleInGroup,
      })
      showToast('Medico associato al gruppo!')
      setAddDoctorDialog(false)
      loadActiveTabData()
    } catch (err) {
      showToast(err.message || 'Errore associazione medico', 'error')
    } finally {
      setTabLoading(false)
    }
  }

  const handleRemoveDoctorFromGroup = async (docId) => {
    try {
      setTabLoading(true)
      await apiSend(`/api/company-groups/${selectedGroupId}/doctors/${docId}`, 'DELETE')
      showToast('Medico rimosso dal team del gruppo')
      loadActiveTabData()
    } catch (err) {
      showToast(err.message || 'Errore rimozione medico', 'error')
    } finally {
      setTabLoading(false)
    }
  }

  // Create New Group
  const handleCreateGroup = async () => {
    if (!newGroupForm.name || !newGroupForm.legalName) {
      showToast('Denominazione e Ragione Sociale sono obbligatorie', 'warning')
      return
    }
    try {
      setTabLoading(true)
      const created = await apiSend('/api/company-groups', 'POST', newGroupForm)
      showToast('Gruppo aziendale creato con successo!')
      setCreateGroupDialog(false)
      setNewGroupForm({
        name: '',
        legalName: '',
        vatNumber: '',
        taxCode: '',
        address: '',
        city: '',
        postalCode: '',
        province: '',
        singleArchive: true,
      })
      await loadGroups(created?.id)
    } catch (err) {
      showToast(err.message || 'Errore creazione gruppo', 'error')
    } finally {
      setTabLoading(false)
    }
  }

  // CSV Export Download
  const handleExportCsv = () => {
    if (!selectedGroupId) return
    const baseUrl = getApiBaseUrl()
    const token = localStorage.getItem('accessToken')
    const url = `${baseUrl}/api/company-groups/${selectedGroupId}/reports/export`
    
    // Trigger download using bearer token fetch
    fetch(url, {
      headers: getHeaders(),
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error('Errore durante il download del report')
        return res.blob()
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `MedWork_Gruppo_${selectedGroupId}_Report_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        showToast('Report CSV scaricato con successo!')
      })
      .catch(err => {
        showToast(err.message || 'Errore durante il download', 'error')
      })
  }

  const activeGroup = groups.find(g => g.id === selectedGroupId)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress size={48} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Caricamento Workspace Gruppi Aziendali...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          boxShadow: '0 8px 24px rgba(13, 71, 161, 0.15)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ApartmentIcon sx={{ fontSize: 44, p: 1, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                {activeGroup ? activeGroup.name : 'Workspace Gruppi Aziendali'}
              </Typography>
              {activeGroup && (
                <>
                  <Chip
                    label="Holding / Gruppo Imprese"
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                  />
                  {activeGroup.singleArchive && (
                    <Chip
                      icon={<ShieldIcon sx={{ '&&': { color: '#81c784' } }} />}
                      label="Archivio Sanitario Unico ex D.Lgs 81/08"
                      size="small"
                      sx={{ bgcolor: 'rgba(46, 125, 50, 0.3)', color: '#e8f5e9', fontWeight: 600 }}
                    />
                  )}
                </>
              )}
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {activeGroup
                ? `${activeGroup.legalName} • P.IVA: ${activeGroup.vatNumber || 'N/D'} • ${activeGroup.companyCount || 0} Aziende Associate • ${activeGroup.employeeCount || 0} Lavoratori Sorvegliati`
                : 'Gestione aggregata e sorveglianza sanitaria multilivello per consorzi e gruppi societari'}
            </Typography>
          </Box>
        </Box>

        {/* Group Selector & Quick Actions */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          {groups.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 240, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 1.5 }}>
              <InputLabel id="select-group-label" sx={{ color: '#0d47a1', fontWeight: 600 }}>Gruppo Attivo</InputLabel>
              <Select
                labelId="select-group-label"
                value={selectedGroupId || ''}
                label="Gruppo Attivo"
                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                sx={{ fontWeight: 600, color: '#0d47a1' }}
              >
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name} ({g.companyCount} aziende)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant="contained"
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => setCreateGroupDialog(true)}
            sx={{
              color: '#0d47a1',
              bgcolor: '#ffffff',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#f0f4f8' },
            }}
          >
            Nuovo Gruppo
          </Button>

          {selectedGroupId && (
            <>
              <Tooltip title="Aggiorna Dati Workspace">
                <IconButton
                  onClick={loadActiveTabData}
                  sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Esporta Report Gruppo (CSV)">
                <IconButton
                  onClick={handleExportCsv}
                  sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                >
                  <FileDownloadIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {groups.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '2px dashed #bbdefb' }}>
          <ApartmentIcon sx={{ fontSize: 64, color: '#1976d2', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Nessun Gruppo Aziendale Configurato
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
            I Gruppi Aziendali consentono al Medico Competente e al servizio di medicina del lavoro di gestire holding,
            consorzi e reti di imprese come una singola unità operativa integrata (D.Lgs 81/08).
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setCreateGroupDialog(true)}
            sx={{ borderRadius: 2, px: 4, py: 1.5, fontWeight: 700 }}
          >
            Crea il Tuo Primo Gruppo Aziendale
          </Button>
        </Card>
      ) : (
        <>
          {/* Navigation Tabs */}
          <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, borderRadius: 2, bgcolor: '#ffffff' }}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              indicatorColor="primary"
              textColor="primary"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  py: 1.8,
                  minHeight: 52,
                },
              }}
            >
              <Tab icon={<AssessmentIcon fontSize="small" />} iconPosition="start" label="Dashboard Gruppo" />
              <Tab icon={<ScheduleIcon fontSize="small" />} iconPosition="start" label="Scadenzario Unificato" />
              <Tab icon={<GroupIcon fontSize="small" />} iconPosition="start" label="Forza Lavoro Unificata" />
              <Tab icon={<PlayArrowIcon fontSize="small" />} iconPosition="start" label="Pianificazione Massiva" />
              <Tab
                icon={
                  <Badge
                    color="error"
                    badgeContent={dashboardData?.kpis?.complianceAlertsCount || 0}
                    invisible={!dashboardData?.kpis?.complianceAlertsCount}
                  >
                    <ShieldIcon fontSize="small" />
                  </Badge>
                }
                iconPosition="start"
                label="Conformità & Alert D.Lgs 81/08"
              />
              <Tab icon={<AssignmentTurnedInIcon fontSize="small" />} iconPosition="start" label="Report & Giudizi" />
              <Tab icon={<MedicalServicesIcon fontSize="small" />} iconPosition="start" label="Prospettiva Medico" />
              <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Governance & Struttura" />
            </Tabs>
          </Paper>

          {tabLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

          {/* TAB 0: DASHBOARD */}
          {activeTab === 0 && dashboardData && (
            <Box>
              {/* 10 KPIs Grid */}
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {[
                  { title: 'Aziende nel Gruppo', value: dashboardData.kpis.companiesCount, icon: BusinessIcon, color: '#1976d2', bg: '#e3f2fd' },
                  { title: 'Sedi & Filiali Operative', value: dashboardData.kpis.branchesCount, icon: ApartmentIcon, color: '#0288d1', bg: '#e1f5fe' },
                  { title: 'Lavoratori in Sorveglianza', value: dashboardData.kpis.employeesCount, icon: GroupIcon, color: '#388e3c', bg: '#e8f5e9' },
                  { title: 'Protocolli Sanitari Attivi', value: dashboardData.kpis.activeProtocolsCount, icon: HealthAndSafetyIcon, color: '#7b1fa2', bg: '#f3e5f5' },
                  { title: 'Visite in Scadenza (60gg)', value: dashboardData.kpis.visitsDueCount, icon: EventIcon, color: '#f57c00', bg: '#fff3e0' },
                  { title: 'Visite Periodiche Scadute', value: dashboardData.kpis.visitsOverdueCount, icon: ErrorOutlineIcon, color: '#d32f2f', bg: '#ffebee', highlight: true },
                  { title: 'Sopralluoghi ex Art. 25', value: dashboardData.kpis.siteVisitsDueCount, icon: VerifiedUserIcon, color: '#00796b', bg: '#e0f2f1' },
                  { title: 'Nomine MC in Scadenza', value: dashboardData.kpis.nominationsDueCount, icon: PersonIcon, color: '#5d4037', bg: '#efebe9' },
                  { title: 'Scadenze Vaccinali', value: dashboardData.kpis.vaccinationsDueCount, icon: LocalHospitalIcon, color: '#c2185b', bg: '#fce4ec' },
                  { title: 'Alert di Conformità Attivi', value: dashboardData.kpis.complianceAlertsCount, icon: WarningIcon, color: '#e64a19', bg: '#fbe9e7', highlight: true },
                ].map((kpi, idx) => {
                  const Icon = kpi.icon
                  return (
                    <Grid item xs={12} sm={6} md={2.4} key={idx}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 2.5,
                          borderColor: kpi.highlight && kpi.value > 0 ? kpi.color : '#e0e0e0',
                          borderLeft: `5px solid ${kpi.color}`,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' },
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                              {kpi.title}
                            </Typography>
                            <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: kpi.bg, color: kpi.color, display: 'flex' }}>
                              <Icon sx={{ fontSize: 20 }} />
                            </Box>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 800, color: kpi.highlight && kpi.value > 0 ? kpi.color : 'text.primary' }}>
                            {kpi.value}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>

              {/* Compliance Gauge Banner */}
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 3,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 3,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <ShieldIcon color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Indice di Conformità Sanitaria D.Lgs 81/08
                    </Typography>
                    <Chip
                      label={`${dashboardData.complianceScore}%`}
                      color={dashboardData.complianceScore >= 90 ? 'success' : dashboardData.complianceScore >= 75 ? 'warning' : 'error'}
                      sx={{ fontWeight: 800, fontSize: '1rem', px: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Valutazione integrata dei 6 vettori di conformità normativa: cartelle sanitarie attive, scadenze visite periodiche,
                    nomine formali MC, assegnazione medici competenti, protocolli sanitari definiti e sopralluoghi ambienti di lavoro.
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.complianceScore}
                    color={dashboardData.complianceScore >= 90 ? 'success' : dashboardData.complianceScore >= 75 ? 'warning' : 'error'}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ShieldIcon />}
                  onClick={() => setActiveTab(4)}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap' }}
                >
                  Analisi & Rimedi Conformità
                </Button>
              </Paper>

              {/* Company Breakdown Matrix */}
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" /> Matrice di Sorveglianza per Azienda Associata
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Azienda Associata</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>P.IVA / Città</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Lavoratori</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Sedi</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Protocolli</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Visite Scadute</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Medico Assegnato</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Stato Conformità</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.companyBreakdown.map((c) => (
                      <TableRow key={c.companyId} hover>
                        <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {c.companyName}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{c.vatNumber || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">{c.city || '-'}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={c.employeeCount} size="small" sx={{ fontWeight: 700, bgcolor: '#e2e8f0' }} />
                        </TableCell>
                        <TableCell align="center">{c.branchesCount}</TableCell>
                        <TableCell align="center">{c.activeProtocolsCount}</TableCell>
                        <TableCell align="center">
                          {c.overdueVisitsCount > 0 ? (
                            <Chip label={c.overdueVisitsCount} size="small" color="error" sx={{ fontWeight: 700 }} />
                          ) : (
                            <Chip label="0" size="small" color="success" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="primary">
                            {c.assignedDoctorName}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={c.complianceStatus}
                            size="small"
                            color={c.complianceStatus === 'In Regola' ? 'success' : 'warning'}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setEmployeeFilter(prev => ({ ...prev, companyId: c.companyId.toString() }))
                              setActiveTab(2)
                            }}
                            sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600 }}
                          >
                            Forza Lavoro
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 1: UNIFIED DEADLINES */}
          {activeTab === 1 && (
            <Box>
              {/* Filters Bar */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2.5, bgcolor: '#f8fafc' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Cerca Lavoratore, Titolo, Azienda"
                      value={deadlineFilter.search}
                      onChange={(e) => setDeadlineFilter(prev => ({ ...prev, search: e.target.value }))}
                      InputProps={{
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Categoria Scadenza</InputLabel>
                      <Select
                        value={deadlineFilter.category}
                        label="Categoria Scadenza"
                        onChange={(e) => setDeadlineFilter(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <MenuItem value="">Tutte le Categorie</MenuItem>
                        <MenuItem value="Visite Mediche">Visite Mediche</MenuItem>
                        <MenuItem value="Attivita">Attività di Sorveglianza</MenuItem>
                        <MenuItem value="Sopralluoghi">Sopralluoghi Ambienti Lavoro (Art. 25)</MenuItem>
                        <MenuItem value="Nomine">Nomine Medico Competente</MenuItem>
                        <MenuItem value="Vaccinazioni">Vaccinazioni Lavoratori</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Orizzonte Temporale</InputLabel>
                      <Select
                        value={deadlineFilter.urgencyDays}
                        label="Orizzonte Temporale"
                        onChange={(e) => setDeadlineFilter(prev => ({ ...prev, urgencyDays: e.target.value }))}
                      >
                        <MenuItem value="30">Entro 30 giorni</MenuItem>
                        <MenuItem value="60">Entro 60 giorni</MenuItem>
                        <MenuItem value="90">Entro 90 giorni</MenuItem>
                        <MenuItem value="365">Tutte (prossimo anno)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={loadActiveTabData}
                      startIcon={<RefreshIcon />}
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                      Filtra Scadenze
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Data Scadenza</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Categoria</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Titolo / Descrizione</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Azienda Associata</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Soggetto Coinvolto</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Medico Assegnato</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Urgenza</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Stato</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deadlines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Nessuna scadenza trovata con i filtri selezionati.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      deadlines.map((d) => (
                        <TableRow key={d.id} hover>
                          <TableCell sx={{ fontWeight: 700, color: d.urgency === 'Critica' ? '#d32f2f' : 'inherit' }}>
                            {d.dueDate}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={d.category}
                              size="small"
                              variant="outlined"
                              color={
                                d.category === 'Visite Mediche'
                                  ? 'primary'
                                  : d.category === 'Sopralluoghi'
                                  ? 'secondary'
                                  : d.category === 'Nomine'
                                  ? 'warning'
                                  : 'default'
                              }
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{d.title}</TableCell>
                          <TableCell>{d.companyName}</TableCell>
                          <TableCell>{d.targetName}</TableCell>
                          <TableCell>{d.assignedDoctor}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={d.urgency}
                              size="small"
                              color={
                                d.urgency === 'Critica'
                                  ? 'error'
                                  : d.urgency === 'Alta'
                                  ? 'warning'
                                  : 'info'
                              }
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={d.status} size="small" variant="filled" sx={{ fontWeight: 600 }} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 2: UNIFIED WORKFORCE */}
          {activeTab === 2 && (
            <Box>
              {/* Workforce Filters */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2.5, bgcolor: '#f8fafc' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Cerca Lavoratore (Nome, Cognome, C.F.)"
                      value={employeeFilter.search}
                      onChange={(e) => setEmployeeFilter(prev => ({ ...prev, search: e.target.value }))}
                      InputProps={{
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Azienda</InputLabel>
                      <Select
                        value={employeeFilter.companyId}
                        label="Azienda"
                        onChange={(e) => setEmployeeFilter(prev => ({ ...prev, companyId: e.target.value }))}
                      >
                        <MenuItem value="">Tutte le Aziende del Gruppo</MenuItem>
                        {dashboardData?.companyBreakdown?.map(c => (
                          <MenuItem key={c.companyId} value={c.companyId.toString()}>
                            {c.companyName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Stato Giudizio di Idoneità</InputLabel>
                      <Select
                        value={employeeFilter.fitnessStatus}
                        label="Stato Giudizio di Idoneità"
                        onChange={(e) => setEmployeeFilter(prev => ({ ...prev, fitnessStatus: e.target.value }))}
                      >
                        <MenuItem value="">Tutti gli Stati</MenuItem>
                        <MenuItem value="Idoneo">Idoneo</MenuItem>
                        <MenuItem value="Idoneo con prescrizioni">Idoneo con Prescrizioni</MenuItem>
                        <MenuItem value="Idoneo con limitazioni">Idoneo con Limitazioni</MenuItem>
                        <MenuItem value="Non idoneo temporaneo">Non Idoneo Temporaneo</MenuItem>
                        <MenuItem value="Non idoneo permanente">Non Idoneo Permanente</MenuItem>
                        <MenuItem value="In attesa">In Attesa di Visita</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Lavoratore</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Codice Fiscale</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Azienda</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reparto / Mansione</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Protocollo Sanitario</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Medico Assegnato</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Giudizio Idoneità</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Prossima Visita</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Cartella</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Nessun lavoratore trovato per i criteri indicati.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((emp) => (
                        <TableRow key={emp.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {emp.lastName} {emp.firstName}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{emp.taxCode}</TableCell>
                          <TableCell>{emp.companyName}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{emp.jobTitle}</Typography>
                            <Typography variant="caption" color="text.secondary">{emp.department || 'Generale'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{emp.healthProtocol}</Typography>
                          </TableCell>
                          <TableCell>{emp.assignedDoctor}</TableCell>
                          <TableCell>
                            <Chip
                              label={emp.fitnessJudgment}
                              size="small"
                              color={
                                emp.fitnessJudgment.includes('prescrizioni') || emp.fitnessJudgment.includes('limitazioni')
                                  ? 'warning'
                                  : emp.fitnessJudgment.includes('Non idoneo')
                                  ? 'error'
                                  : emp.fitnessJudgment === 'Idoneo'
                                  ? 'success'
                                  : 'default'
                              }
                              sx={{ fontWeight: 700 }}
                            />
                            {emp.fitnessNotes && (
                              <Tooltip title={emp.fitnessNotes}>
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                  {emp.fitnessNotes.length > 30 ? `${emp.fitnessNotes.substring(0, 30)}...` : emp.fitnessNotes}
                                </Typography>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{emp.nextVisitDue}</TableCell>
                          <TableCell align="center">
                            {emp.hasActiveFolder ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <ErrorOutlineIcon color="error" fontSize="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 3: PLANNING WORKSPACE */}
          {activeTab === 3 && (
            <Box>
              {/* Actions Header Bar */}
              <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2.5, bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Strumenti di Pianificazione Operativa Gruppo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pianifica sessioni di visite mediche in blocco, lancia campagne di sorveglianza e programma sopralluoghi ambienti di lavoro.
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<MedicalServicesIcon />}
                      disabled={selectedCandidates.length === 0}
                      onClick={() => setBulkVisitDialog(true)}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                      Pianifica Visite ({selectedCandidates.length})
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => setCampaignDialog(true)}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                      Nuova Campagna Gruppo
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<VerifiedUserIcon />}
                      onClick={() => setSiteVisitDialog(true)}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                      Pianifica Sopralluoghi Art. 25
                    </Button>
                  </Stack>
                </Box>
              </Paper>

              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon color="primary" /> Lavoratori con Visite da Pianificare ({planningCandidates.length})
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedCandidates.length > 0 && selectedCandidates.length < planningCandidates.length}
                          checked={planningCandidates.length > 0 && selectedCandidates.length === planningCandidates.length}
                          onChange={handleSelectAllCandidates}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Lavoratore</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Azienda</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mansione / Reparto</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Protocollo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Ultima Visita</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Scadenza Calcolata</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Motivo Pianificazione</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {planningCandidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Tutte le visite dei lavoratori del gruppo risultano regolarmente pianificate o aggiornate!
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      planningCandidates.map((c) => {
                        const isSelected = selectedCandidates.includes(c.employeeId)
                        return (
                          <TableRow key={c.employeeId} hover selected={isSelected} onClick={() => handleToggleCandidate(c.employeeId)} sx={{ cursor: 'pointer' }}>
                            <TableCell padding="checkbox">
                              <Checkbox checked={isSelected} />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{c.fullName}</TableCell>
                            <TableCell>{c.companyName}</TableCell>
                            <TableCell>{c.jobTitle}</TableCell>
                            <TableCell>{c.protocolName}</TableCell>
                            <TableCell>{c.lastVisitDate || 'Nessuna'}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#d32f2f' }}>{c.nextDueDate}</TableCell>
                            <TableCell>
                              <Chip label={c.reason} size="small" color="warning" sx={{ fontWeight: 600 }} />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 4: COMPLIANCE WORKSPACE */}
          {activeTab === 4 && complianceData && (
            <Box>
              {/* Compliance Header Radar */}
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 3,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Radar Conformità D.Lgs 81/08 - Gruppo {complianceData.groupName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verifica automatica dei requisiti obbligatori di medicina del lavoro per holding e gruppi societari.
                    </Typography>
                  </Box>
                  <Chip
                    label={`Punteggio Conformità: ${complianceData.overallComplianceScore}%`}
                    color={complianceData.overallComplianceScore >= 85 ? 'success' : 'error'}
                    sx={{ fontWeight: 800, fontSize: '1rem', px: 1 }}
                  />
                </Box>

                {/* 6 Vectors Row */}
                <Grid container spacing={2}>
                  {[
                    { label: 'Cartelle Sanitarie Mancanti', count: complianceData.vectors.missingHealthRecords, action: 'generate-missing-folders', btn: 'Genera Cartelle' },
                    { label: 'Visite Periodiche Scadute', count: complianceData.vectors.expiredVisits, action: null, btn: null },
                    { label: 'Nomine Medico Mancanti', count: complianceData.vectors.missingNominations, action: 'assign-group-doctor', btn: 'Assegna Medico Gruppo' },
                    { label: 'Aziende Senza Medico Assegnato', count: complianceData.vectors.missingPhysicians, action: 'assign-group-doctor', btn: 'Assegna Medico Gruppo' },
                    { label: 'Lavoratori Senza Protocollo', count: complianceData.vectors.missingProtocols, action: 'align-protocols', btn: 'Allinea Protocolli' },
                    { label: 'Sopralluoghi/Attività Scadute', count: complianceData.vectors.overdueActivities, action: null, btn: null },
                  ].map((v, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Card variant="outlined" sx={{ borderRadius: 2, p: 1.5, bgcolor: v.count > 0 ? '#fff5f5' : '#f8fafc', borderColor: v.count > 0 ? '#ffcdd2' : '#e2e8f0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" fontWeight={600} color={v.count > 0 ? 'error.main' : 'text.primary'}>
                            {v.label}
                          </Typography>
                          <Chip label={v.count} size="small" color={v.count > 0 ? 'error' : 'success'} sx={{ fontWeight: 700 }} />
                        </Box>
                        {v.btn && v.count > 0 && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            fullWidth
                            startIcon={<SyncIcon />}
                            onClick={() => handleRemediate(v.action)}
                            sx={{ mt: 1, textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                          >
                            {v.btn}
                          </Button>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* Remediation Alerts Table */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                Segnalazioni di Conformità e Azioni Correttive Consigliate ({complianceData.alerts.length})
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Gravità</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo Anomalia</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Azienda Coinvolta</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Dettaglio Inosservanza D.Lgs 81/08</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Risoluzione Rapida</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {complianceData.alerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            Nessuna criticità normativa rilevata. Il gruppo è pienamente conforme!
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      complianceData.alerts.map((a, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Chip
                              label={a.severity}
                              size="small"
                              color={a.severity === 'Critico' ? 'error' : a.severity === 'Alto' ? 'warning' : 'info'}
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{a.type}</TableCell>
                          <TableCell>{a.targetCompany}</TableCell>
                          <TableCell>{a.message}</TableCell>
                          <TableCell align="right">
                            {a.remediationAction && (
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => handleRemediate(a.remediationAction)}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                              >
                                Risolvi
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 5: REPORTING & FITNESS JUDGMENTS */}
          {activeTab === 5 && reportsData && (
            <Box>
              {/* Summary Stats Cards */}
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ borderRadius: 2.5, p: 2 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Lavoratori Sorvegliati</Typography>
                    <Typography variant="h3" fontWeight={800} color="primary">{reportsData.totalWorkers}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ borderRadius: 2.5, p: 2 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Visite Eseguite</Typography>
                    <Typography variant="h3" fontWeight={800} color="success.main">{reportsData.totalCompletedVisits}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ borderRadius: 2.5, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<FileDownloadIcon />}
                      onClick={handleExportCsv}
                      sx={{ py: 1.5, fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
                    >
                      Esporta Report Completo Gruppo (CSV)
                    </Button>
                  </Card>
                </Grid>
              </Grid>

              {/* Distribution Grid */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      Ripartizione Giudizi di Idoneità Gruppo
                    </Typography>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Idonei Senza Limitazioni</Typography>
                        <Chip label={reportsData.fitnessJudgmentsSummary.fit} color="success" size="small" sx={{ fontWeight: 700 }} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Idonei con Prescrizioni</Typography>
                        <Chip label={reportsData.fitnessJudgmentsSummary.fitWithPrescriptions} color="warning" size="small" sx={{ fontWeight: 700 }} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Idonei con Limitazioni</Typography>
                        <Chip label={reportsData.fitnessJudgmentsSummary.fitWithLimitations} color="warning" size="small" sx={{ fontWeight: 700 }} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Non Idonei Temporanei</Typography>
                        <Chip label={reportsData.fitnessJudgmentsSummary.unfitTemporary} color="error" size="small" sx={{ fontWeight: 700 }} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Non Idonei Permanenti</Typography>
                        <Chip label={reportsData.fitnessJudgmentsSummary.unfitPermanent} color="error" size="small" sx={{ fontWeight: 700 }} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">In Attesa di Giudizio</Typography>
                        <Chip label={reportsData.fitnessJudgmentsSummary.pending} size="small" sx={{ fontWeight: 700 }} />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      Distribuzione Rischi e Protocolli
                    </Typography>
                    <Stack spacing={1.5}>
                      {reportsData.riskDistribution?.map((r, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">{r.riskName}</Typography>
                          <Chip label={`${r.workerCount} lavoratori`} size="small" sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }} />
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Master Prescriptions and Limitations List */}
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5 }}>
                Registro Prescrizioni e Limitazioni Attive nel Gruppo ({reportsData.prescriptionsAndLimitations.length})
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Lavoratore</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Azienda</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Giudizio Emesso</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Prescrizione / Limitazione Sanitaria</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Data Scadenza Limitazione</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportsData.prescriptionsAndLimitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Nessuna limitazione o prescrizione medica attiva registrata.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportsData.prescriptionsAndLimitations.map((p, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{p.employeeName}</TableCell>
                          <TableCell>{p.companyName}</TableCell>
                          <TableCell>
                            <Chip label={p.judgment} size="small" color="warning" sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#b45309' }}>{p.notes}</TableCell>
                          <TableCell>{p.expirationDate || 'A tempo indeterminato'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 6: PHYSICIAN PERSPECTIVE */}
          {activeTab === 6 && physicianData && (
            <Box>
              {/* Doctor Cards */}
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedicalServicesIcon color="primary" /> Carico di Lavoro Medici del Gruppo ({physicianData.doctors.length})
              </Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {physicianData.doctors.map((doc) => (
                  <Grid item xs={12} md={6} key={doc.doctorId}>
                    <Card variant="outlined" sx={{ borderRadius: 2.5, p: 2.5, borderLeft: '6px solid #1976d2' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">{doc.doctorName}</Typography>
                          <Chip label={doc.groupRole} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600, mt: 0.5 }} />
                        </Box>
                        <PersonIcon sx={{ fontSize: 36, color: '#1976d2', opacity: 0.8 }} />
                      </Box>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Aziende Assegnate</Typography>
                          <Typography variant="h6" fontWeight="bold">{doc.assignedCompaniesCount}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Lavoratori in Carico</Typography>
                          <Typography variant="h6" fontWeight="bold">{doc.assignedWorkersCount}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Visite Prossimi 30gg</Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary">{doc.visitsNext30Days}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Visite Scadute da Recuperare</Typography>
                          <Typography variant="h6" fontWeight="bold" color="error.main">{doc.overdueVisits}</Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Doctor's Upcoming Group Schedule */}
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5 }}>
                Calendario Visite Programmate Gruppo ({physicianData.upcomingVisits.length})
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Data Visita</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Lavoratore</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Azienda</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo Accertamento</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Medico Assegnato</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {physicianData.upcomingVisits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Nessuna visita programmata nei prossimi 60 giorni.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      physicianData.upcomingVisits.map((v) => (
                        <TableRow key={v.visitId} hover>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{v.scheduledDate}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{v.employeeName}</TableCell>
                          <TableCell>{v.companyName}</TableCell>
                          <TableCell>
                            <Chip label={v.visitType} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell>{v.assignedDoctorName}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 7: GOVERNANCE & SETTINGS */}
          {activeTab === 7 && groupDetails && (
            <Box>
              {/* Propagation Triggers Bar */}
              <Paper variant="outlined" sx={{ p: 2.5, mb: 4, borderRadius: 2.5, bgcolor: '#f8fafc' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                  Allineamento Operativo & Propagazione Dati
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Consenti la sincronizzazione rapida delle nomine mediche e dei protocolli di sorveglianza sanitaria tra la holding e tutte le aziende consorziate.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SyncIcon />}
                    onClick={handlePropagateDoctors}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                  >
                    Propaga Medici a Tutte le Aziende
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<HealthAndSafetyIcon />}
                    onClick={handlePropagateProtocols}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                  >
                    Allinea Protocolli Sanitari di Gruppo
                  </Button>
                </Stack>
              </Paper>

              <Grid container spacing={3}>
                {/* Member Companies List */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        Aziende nel Gruppo ({groupDetails.companies?.length || 0})
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAddCompanyDialog(true)}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                      >
                        Aggiungi Azienda
                      </Button>
                    </Box>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Azienda</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>P.IVA</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Rimuovi</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupDetails.companies?.map((c) => (
                          <TableRow key={c.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                            <TableCell>{c.vatNumber || '-'}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" color="error" onClick={() => handleRemoveCompanyFromGroup(c.id)}>
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                </Grid>

                {/* Medical Team List */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        Team Medico del Gruppo ({groupDetails.doctors?.length || 0})
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAddDoctorDialog(true)}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                      >
                        Associa Medico
                      </Button>
                    </Box>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Medico</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Ruolo nel Gruppo</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Rimuovi</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupDetails.doctors?.map((d) => (
                          <TableRow key={d.doctorId} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{d.doctorName}</TableCell>
                            <TableCell>
                              <Chip label={d.roleInGroup} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" color="error" onClick={() => handleRemoveDoctorFromGroup(d.doctorId)}>
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* DIALOG: PIANIFICAZIONE MASSIVA VISITE */}
      <Dialog open={bulkVisitDialog} onClose={() => setBulkVisitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Pianificazione Massiva Visite Mediche</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pianifica le visite per i {selectedCandidates.length} lavoratori selezionati appartenenti alle diverse aziende del gruppo.
          </Typography>
          <Stack spacing={2}>
            <TextField
              type="date"
              label="Data Prevista Visita"
              fullWidth
              value={visitPlanForm.scheduledDate}
              onChange={(e) => setVisitPlanForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Tipologia Visita</InputLabel>
              <Select
                value={visitPlanForm.visitType}
                label="Tipologia Visita"
                onChange={(e) => setVisitPlanForm(prev => ({ ...prev, visitType: e.target.value }))}
              >
                <MenuItem value="Periodica">Periodica (Art. 41 c. 2 lett. b)</MenuItem>
                <MenuItem value="Preventiva">Preventiva / Preassuntiva</MenuItem>
                <MenuItem value="Cambiamento Mansione">Su Cambio Mansione</MenuItem>
                <MenuItem value="Rientro da Malattia">Rientro da Malattia (&gt; 60 gg)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Ambulatorio / Sede Esecuzione"
              fullWidth
              value={visitPlanForm.ambulatory}
              onChange={(e) => setVisitPlanForm(prev => ({ ...prev, ambulatory: e.target.value }))}
            />
            <TextField
              label="Note Operative"
              fullWidth
              multiline
              rows={2}
              value={visitPlanForm.notes}
              onChange={(e) => setVisitPlanForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkVisitDialog(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleExecuteBulkVisits} sx={{ fontWeight: 700 }}>
            Conferma e Pianifica ({selectedCandidates.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: NUOVA CAMPAGNA GRUPPO */}
      <Dialog open={campaignDialog} onClose={() => setCampaignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Lancia Campagna Sorveglianza Sanitaria Gruppo</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Avvia una campagna trasversale di visite periodiche che coinvolge tutte le aziende appartenenti alla holding.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Titolo Campagna"
              fullWidth
              value={campaignForm.title}
              onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Data Inizio"
                  fullWidth
                  value={campaignForm.startDate}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Data Conclusione"
                  fullWidth
                  value={campaignForm.endDate}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, endDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Note e Istruzioni Operative"
              fullWidth
              multiline
              rows={3}
              value={campaignForm.notes}
              onChange={(e) => setCampaignForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCampaignDialog(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleExecuteCampaign} sx={{ fontWeight: 700 }}>
            Avvia Campagna Gruppo
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: PIANIFICAZIONE SOPRALLUOGHI ART. 25 */}
      <Dialog open={siteVisitDialog} onClose={() => setSiteVisitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Pianifica Sopralluoghi Ambienti di Lavoro (Art. 25)</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Programma il sopralluogo congiunto obbligatorio ex Art. 25 c. 1 lett. l D.Lgs 81/08 per tutte le aziende operative del gruppo.
          </Typography>
          <Stack spacing={2}>
            <TextField
              type="date"
              label="Data Sopralluogo"
              fullWidth
              value={siteVisitForm.scheduledDate}
              onChange={(e) => setSiteVisitForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Note e Punti di Ispezione"
              fullWidth
              multiline
              rows={3}
              value={siteVisitForm.notes}
              onChange={(e) => setSiteVisitForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSiteVisitDialog(false)}>Annulla</Button>
          <Button variant="contained" color="secondary" onClick={handleExecuteBulkSiteVisits} sx={{ fontWeight: 700 }}>
            Programma per Tutte le Aziende
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: CREA NUOVO GRUPPO */}
      <Dialog open={createGroupDialog} onClose={() => setCreateGroupDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Crea Nuovo Gruppo Aziendale / Holding</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Denominazione Gruppo *"
                fullWidth
                value={newGroupForm.name}
                onChange={(e) => setNewGroupForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Ragione Sociale Capogruppo *"
                fullWidth
                value={newGroupForm.legalName}
                onChange={(e) => setNewGroupForm(prev => ({ ...prev, legalName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Partita IVA"
                fullWidth
                value={newGroupForm.vatNumber}
                onChange={(e) => setNewGroupForm(prev => ({ ...prev, vatNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Codice Fiscale"
                fullWidth
                value={newGroupForm.taxCode}
                onChange={(e) => setNewGroupForm(prev => ({ ...prev, taxCode: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Indirizzo Sede Legale"
                fullWidth
                value={newGroupForm.address}
                onChange={(e) => setNewGroupForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Città"
                fullWidth
                value={newGroupForm.city}
                onChange={(e) => setNewGroupForm(prev => ({ ...prev, city: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateGroupDialog(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleCreateGroup} sx={{ fontWeight: 700 }}>
            Salva Gruppo
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: AGGIUNGI AZIENDA AL GRUPPO */}
      <Dialog open={addCompanyDialog} onClose={() => setAddCompanyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Aggiungi Azienda al Gruppo</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Seleziona Azienda</InputLabel>
            <Select
              value={newCompanySelection}
              label="Seleziona Azienda"
              onChange={(e) => setNewCompanySelection(e.target.value)}
            >
              {availableMasterCompanies
                .filter(mc => !groupDetails?.companies?.some(c => c.id === mc.id))
                .map((mc) => (
                  <MenuItem key={mc.id} value={mc.id.toString()}>
                    {mc.name} (P.IVA: {mc.vatNumber || mc.taxCode || 'N/D'})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddCompanyDialog(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleAddCompanyToGroup} disabled={!newCompanySelection} sx={{ fontWeight: 700 }}>
            Aggiungi
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: ASSOCIA MEDICO AL GRUPPO */}
      <Dialog open={addDoctorDialog} onClose={() => setAddDoctorDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Associa Medico al Team di Gruppo</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Seleziona Medico</InputLabel>
              <Select
                value={newDoctorSelection.doctorId}
                label="Seleziona Medico"
                onChange={(e) => setNewDoctorSelection(prev => ({ ...prev, doctorId: e.target.value }))}
              >
                {availableMasterDoctors.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id.toString()}>
                    {doc.name || doc.fullName || `Dr. ${doc.lastName} ${doc.firstName}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Ruolo nel Gruppo</InputLabel>
              <Select
                value={newDoctorSelection.roleInGroup}
                label="Ruolo nel Gruppo"
                onChange={(e) => setNewDoctorSelection(prev => ({ ...prev, roleInGroup: e.target.value }))}
              >
                <MenuItem value="Medico Coordinatore">Medico Coordinatore (Art. 39 c. 6 D.Lgs 81/08)</MenuItem>
                <MenuItem value="Medico Competente">Medico Competente Principale</MenuItem>
                <MenuItem value="Medico Collaboratore">Medico Collaboratore</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddDoctorDialog(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleAddDoctorToGroup} disabled={!newDoctorSelection.doctorId} sx={{ fontWeight: 700 }}>
            Associa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}