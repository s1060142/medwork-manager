import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  CircularProgress,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MedicalServices as MedicalServicesIcon,
  EventBusy as EventBusyIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  VpnKey as VpnKeyIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarMonthIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  PersonOff as PersonOffIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  AutoMode as AutoModeIcon,
  Insights as InsightsIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material'
import { apiGet, apiSend } from '../services/apiClient'

const STAFF_ROLES = [
  { value: 'MedicoCompetente', label: 'Medico Competente (Art. 38)' },
  { value: 'MedicoCoordinato', label: 'Medico Coordinato' },
  { value: 'MedicoSostituto', label: 'Medico Sostituto' },
  { value: 'Infermiere', label: 'Infermiere Sanitario' },
  { value: 'TecnicoPrevenzione', label: 'Tecnico della Prevenzione' },
  { value: 'SegreteriaSanitaria', label: 'Segreteria Sanitaria' }
]

const ROLE_COLORS = {
  MedicoCompetente: 'primary',
  MedicoCoordinato: 'secondary',
  MedicoSostituto: 'warning',
  Infermiere: 'info',
  TecnicoPrevenzione: 'dark',
  SegreteriaSanitaria: 'success'
}

export default function MedicalStaffCenter() {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [staffList, setStaffList] = useState([])
  const [companies, setCompanies] = useState([])

  // V2 Intelligence State
  const [workloadData, setWorkloadData] = useState([])
  const [productivityData, setProductivityData] = useState([])
  const [capacityData, setCapacityData] = useState(null)
  const [coverageGaps, setCoverageGaps] = useState([])
  const [vacationImpact, setVacationImpact] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [onlyActive, setOnlyActive] = useState(true)

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [absencesList, setAbsencesList] = useState([])

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    professionalRole: 'MedicoCompetente',
    taxCode: '',
    medicalLicenseNumber: '',
    specialty: 'Medicina del Lavoro',
    licenseAuthority: 'Ordine dei Medici',
    licenseProvince: 'Milano',
    email: '',
    pec: '',
    phone: '',
    digitalCertificateThumbprint: '',
    createUserAccount: true
  })

  // Absence Form State
  const [absenceForm, setAbsenceForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: 'Ferie',
    notes: '',
    substituteDoctorId: ''
  })

  // Assignment Form State
  const [assignmentForm, setAssignmentForm] = useState({
    companyId: '',
    branchId: '',
    isCoordinator: false
  })

  useEffect(() => {
    fetchData()
  }, [search, selectedRole, onlyActive])

  const fetchData = async () => {
    setLoading(true)
    try {
      let url = `/api/medical-staff?isActive=${onlyActive}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (selectedRole) url += `&role=${selectedRole}`

      const [staffRes, dashRes, compRes, workloadRes, prodRes, capRes, gapsRes] = await Promise.all([
        apiGet(url).catch(() => []),
        apiGet('/api/medical-staff/dashboard').catch(() => null),
        apiGet('/api/master-data/companies').catch(() => []),
        apiGet('/api/medical-staff/workload-balancing').catch(() => []),
        apiGet('/api/medical-staff/productivity-metrics').catch(() => []),
        apiGet('/api/medical-staff/capacity-planning').catch(() => null),
        apiGet('/api/medical-staff/coverage-gaps').catch(() => [])
      ])

      setStaffList(staffRes || [])
      setDashboardData(dashRes)
      setCompanies(compRes || [])
      setWorkloadData(workloadRes || [])
      setProductivityData(prodRes || [])
      setCapacityData(capRes)
      setCoverageGaps(gapsRes || [])
    } catch (err) {
      console.error('Error fetching medical staff data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setSelectedStaff(null)
    setFormData({
      firstName: '',
      lastName: '',
      professionalRole: 'MedicoCompetente',
      taxCode: '',
      medicalLicenseNumber: '',
      specialty: 'Medicina del Lavoro',
      licenseAuthority: 'Ordine dei Medici di Milano',
      licenseProvince: 'Milano',
      email: '',
      pec: '',
      phone: '',
      digitalCertificateThumbprint: '',
      createUserAccount: true
    })
    setEditDialogOpen(true)
  }

  const handleOpenEdit = (staff) => {
    setSelectedStaff(staff)
    setFormData({
      firstName: staff.firstName || '',
      lastName: staff.lastName || '',
      professionalRole: staff.professionalRole || 'MedicoCompetente',
      taxCode: staff.taxCode || '',
      medicalLicenseNumber: staff.medicalLicenseNumber || '',
      specialty: staff.specialty || '',
      licenseAuthority: staff.licenseAuthority || '',
      licenseProvince: staff.licenseProvince || '',
      email: staff.email || '',
      pec: staff.pec || '',
      phone: staff.phone || '',
      digitalCertificateThumbprint: staff.digitalCertificateThumbprint || '',
      createUserAccount: false
    })
    setEditDialogOpen(true)
  }

  const handleSaveStaff = async () => {
    try {
      if (selectedStaff) {
        await apiSend('PUT', `/api/medical-staff/${selectedStaff.id}`, formData)
      } else {
        await apiSend('POST', '/api/medical-staff', formData)
      }
      setEditDialogOpen(false)
      fetchData()
    } catch (err) {
      alert('Errore durante il salvataggio: ' + (err.message || 'Verificare i dati inseriti.'))
    }
  }

  const handleToggleStatus = async (staffId) => {
    try {
      await apiSend('PATCH', `/api/medical-staff/${staffId}/toggle-status`, {})
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenAbsences = async (staff) => {
    setSelectedStaff(staff)
    setVacationImpact(null)
    try {
      const data = await apiGet(`/api/medical-staff/${staff.id}/absences`)
      setAbsencesList(data || [])
    } catch (err) {
      setAbsencesList([])
    }
    setAbsenceDialogOpen(true)
  }

  const handleCheckVacationImpact = async () => {
    if (!selectedStaff) return
    try {
      const res = await apiGet(`/api/medical-staff/vacation-impact?doctorId=${selectedStaff.id}&startDate=${absenceForm.startDate}&endDate=${absenceForm.endDate}`)
      setVacationImpact(res)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddAbsence = async () => {
    if (!selectedStaff) return
    try {
      await apiSend('POST', `/api/medical-staff/${selectedStaff.id}/absences`, {
        startDate: absenceForm.startDate,
        endDate: absenceForm.endDate,
        reason: absenceForm.reason,
        notes: absenceForm.notes,
        substituteDoctorId: absenceForm.substituteDoctorId ? parseInt(absenceForm.substituteDoctorId, 10) : null
      })
      const data = await apiGet(`/api/medical-staff/${selectedStaff.id}/absences`)
      setAbsencesList(data || [])
      setVacationImpact(null)
      fetchData()
    } catch (err) {
      alert('Errore durante il salvataggio dell\'assenza.')
    }
  }

  const handleAutoSubstitute = async (absenceId) => {
    try {
      const res = await apiSend('POST', `/api/medical-staff/absences/${absenceId}/auto-substitute`, {})
      alert(`Medico Sostituto assegnato automaticamente: ${res.substituteDoctorName}`)
      if (selectedStaff) {
        const data = await apiGet(`/api/medical-staff/${selectedStaff.id}/absences`)
        setAbsencesList(data || [])
      }
      fetchData()
    } catch (err) {
      alert('Errore durante l\'auto-sostituzione: ' + (err.message || 'Nessun sostituto disponibile.'))
    }
  }

  const handleDeleteAbsence = async (absenceId) => {
    try {
      await apiSend('DELETE', `/api/medical-staff/absences/${absenceId}`, {})
      if (selectedStaff) {
        const data = await apiGet(`/api/medical-staff/${selectedStaff.id}/absences`)
        setAbsencesList(data || [])
      }
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenAssignments = (staff) => {
    setSelectedStaff(staff)
    setAssignmentForm({ companyId: '', branchId: '', isCoordinator: false })
    setAssignmentDialogOpen(true)
  }

  const handleSaveAssignment = async () => {
    if (!selectedStaff || !assignmentForm.companyId) return
    try {
      await apiSend('POST', '/api/medical-staff/assignments', {
        doctorId: selectedStaff.id,
        companyId: parseInt(assignmentForm.companyId, 10),
        branchId: assignmentForm.branchId ? parseInt(assignmentForm.branchId, 10) : null,
        isCoordinator: assignmentForm.isCoordinator
      })
      setAssignmentDialogOpen(false)
      fetchData()
    } catch (err) {
      alert('Errore durante l\'assegnazione dell\'azienda.')
    }
  }

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      await apiSend('DELETE', `/api/medical-staff/assignments/${assignmentId}`, {})
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* Title Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MedicalServicesIcon fontSize="large" /> Centro Gestione Personale Sanitario v2
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Piattaforma Enterprise per la gestione, pianificazione capacità e bilanciamento carichi di lavoro del team sanitario
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>
            Aggiorna
          </Button>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ fontWeight: 'bold' }}>
            + Nuovo Professionista
          </Button>
        </Box>
      </Box>

      {/* Executive KPI Summary Header */}
      {dashboardData && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '5px solid #1976d2', boxShadow: 2 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">
                    STAFF SANITARIO ATTIVO
                  </Typography>
                  <BadgeIcon color="primary" />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ my: 0.5 }}>
                  {dashboardData.totalActive}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dashboardData.activeDoctors} Medici | {dashboardData.activeNurses} Infermieri | {dashboardData.activeSecretaries} Segreteria
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '5px solid #ed6c02', boxShadow: 2 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">
                    ASSENTI / IN FERIE OGGI
                  </Typography>
                  <EventBusyIcon color="warning" />
                </Box>
                <Typography variant="h4" fontWeight="bold" color={dashboardData.absentToday > 0 ? 'warning.main' : 'text.primary'} sx={{ my: 0.5 }}>
                  {dashboardData.absentToday}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dashboardData.absentToday > 0 ? 'Medici sostituti attivi' : 'Tutti i professionisti disponibili'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '5px solid #d32f2f', boxShadow: 2 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">
                    SCADENZE CREDENZIALI & CERT.
                  </Typography>
                  <WarningIcon color="error" />
                </Box>
                <Typography variant="h4" fontWeight="bold" color={dashboardData.expiringCertificates > 0 ? 'error.main' : 'text.primary'} sx={{ my: 0.5 }}>
                  {dashboardData.expiringCertificates + dashboardData.expiringDocuments}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Firma digitale / Iscrizioni Ordine in scadenza
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '5px solid #2e7d32', boxShadow: 2 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">
                    COPERTURA AZIENDE
                  </Typography>
                  <BusinessIcon color="success" />
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ my: 0.5 }}>
                  {dashboardData.companyCoveragePercent}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dashboardData.companiesWithDoctor} su {dashboardData.totalCompanies} aziende coperte
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs Header */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<BadgeIcon />} label="Anagrafica Team" iconPosition="start" />
          <Tab icon={<SpeedIcon />} label="Bilanciamento Carichi" iconPosition="start" />
          <Tab icon={<InsightsIcon />} label="Produttività & Performance" iconPosition="start" />
          <Tab icon={<AssessmentIcon />} label="Pianificazione Capacità" iconPosition="start" />
          <Tab icon={<BusinessIcon />} label="Matrice Copertura Aziende" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* TAB 0: ANAGRAFICA TEAM */}
      {activeTab === 0 && (
        <Box>
          {/* Search & Filter Toolbar */}
          <Card sx={{ p: 2, mb: 3, boxShadow: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Cerca per Nome, Cognome, Codice Fiscale, N. Iscrizione Ordine..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Ruolo Professionale"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <MenuItem value="">Tutti i Ruoli</MenuItem>
                  {STAFF_ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControlLabel
                  control={<Switch checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} color="primary" />}
                  label="Mostra Solo Attivi"
                />
              </Grid>
              <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary" fontWeight="bold">
                  Risultati: {staffList.length}
                </Typography>
              </Grid>
            </Grid>
          </Card>

          {/* Staff Grid Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2 }}>
              <Table sx={{ minWidth: 950 }}>
                <TableHead sx={{ backgroundColor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Professionista & Ruolo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Codice Fiscale & Ordine</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Specializzazione & Contatti</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Firma Digitale & PEC</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Stato & Presenza</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Aziende Assegnate</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Nessun professionista sanitario trovato con i filtri selezionati.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    staffList.map((staff) => (
                      <TableRow key={staff.id} hover sx={{ opacity: staff.isActive ? 1 : 0.65 }}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {staff.firstName} {staff.lastName}
                          </Typography>
                          <Chip
                            label={STAFF_ROLES.find(r => r.value === staff.professionalRole)?.label || staff.professionalRole}
                            color={ROLE_COLORS[staff.professionalRole] || 'default'}
                            size="small"
                            sx={{ mt: 0.5, fontWeight: 'bold', fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                            {staff.taxCode || 'N/D'}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            N. Ordine: {staff.medicalLicenseNumber} ({staff.licenseProvince || 'MI'})
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {staff.specialty || 'Medicina del Lavoro'}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            📧 {staff.email || 'Non specificata'}
                          </Typography>
                          {staff.phone && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              📞 {staff.phone}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {staff.pec ? (
                            <Typography variant="caption" display="block" color="primary.main" fontWeight="bold">
                              PEC: {staff.pec}
                            </Typography>
                          ) : (
                            <Typography variant="caption" display="block" color="text.secondary">
                              PEC: Non configurata
                            </Typography>
                          )}
                          {staff.digitalCertificateExpiry ? (
                            <Chip
                              label={`Cert. Scad: ${new Date(staff.digitalCertificateExpiry).toLocaleDateString('it-IT')}`}
                              size="small"
                              variant="outlined"
                              color={staff.expiringDocsCount > 0 ? 'error' : 'default'}
                              sx={{ mt: 0.5, fontSize: '0.65rem' }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">Cert. Digitale: N/D</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={staff.isActive ? 'Attivo' : 'Sospeso'}
                            color={staff.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ mb: 0.5, mr: 0.5 }}
                          />
                          {staff.isAbsent ? (
                            <Chip label={staff.availabilityStatus} color="warning" size="small" />
                          ) : (
                            <Chip label="Presente" color="success" variant="outlined" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {staff.assignedCompanies && staff.assignedCompanies.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {staff.assignedCompanies.slice(0, 3).map((c) => (
                                <Chip
                                  key={c.assignmentId}
                                  label={`${c.companyName} ${c.isCoordinator ? '(Coord.)' : ''}`}
                                  size="small"
                                  variant="outlined"
                                  color={c.isCoordinator ? 'primary' : 'default'}
                                  sx={{ fontSize: '0.65rem' }}
                                />
                              ))}
                              {staff.assignedCompanies.length > 3 && (
                                <Chip label={`+${staff.assignedCompanies.length - 3}`} size="small" variant="filled" sx={{ fontSize: '0.65rem' }} />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Nessuna azienda</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Modifica Profilo & Credenziali">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(staff)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Disponibilità & Ferie / Assenze">
                            <IconButton size="small" color="warning" onClick={() => handleOpenAbsences(staff)}>
                              <CalendarMonthIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Assegna ad Aziende / Sedi">
                            <IconButton size="small" color="success" onClick={() => handleOpenAssignments(staff)}>
                              <BusinessIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={staff.isActive ? 'Sospendi Professionista' : 'Attiva Professionista'}>
                            <IconButton size="small" color={staff.isActive ? 'error' : 'success'} onClick={() => handleToggleStatus(staff.id)}>
                              {staff.isActive ? <PersonOffIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* TAB 1: WORKLOAD BALANCING */}
      {activeTab === 1 && (
        <Card sx={{ p: 3, boxShadow: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon /> Bilanciamento Carico di Lavoro Sanitario
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ripartizione dinamica dei lavoratori assegnati, ore di disponibilità settimanale e numero di visite effettuate per professionista
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Professionista</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ruolo</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Aziende Assegnate</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Organico Lavoratori Totale</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ore/Settimana Disponibili</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Visite Mese Corrente</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Indice di Carico (Score)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Stato Carico</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workloadData.map((row) => (
                  <TableRow key={row.doctorId} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{row.doctorName}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell align="center">{row.assignedCompaniesCount}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{row.totalAssignedWorkers}</TableCell>
                    <TableCell align="center">{row.weeklyHoursAvailable}h</TableCell>
                    <TableCell align="center">{row.visitsThisMonth}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{row.workloadScore}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.status}
                        color={row.status === 'Sovraccarico' ? 'error' : (row.status === 'Sotto-utilizzato' ? 'warning' : 'success')}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 2: PRODUCTIVITY METRICS */}
      {activeTab === 2 && (
        <Card sx={{ p: 3, boxShadow: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InsightsIcon /> Produttività & Velocità Operativa Team
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Metriche degli ultimi 30 giorni: visite completate, tasso di firma dei giudizi e media visite/giorno
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Professionista</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ruolo</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Visite 30gg</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Firmate</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>In Attesa Firma</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Media Visite/Giorno</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tasso Firma %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productivityData.map((row) => (
                  <TableRow key={row.doctorId} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{row.doctorName}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{row.totalVisitsLast30}</TableCell>
                    <TableCell align="center" color="success.main">{row.signedVisits}</TableCell>
                    <TableCell align="center">
                      {row.unsignedVisits > 0 ? (
                        <Chip label={row.unsignedVisits} color="warning" size="small" />
                      ) : (
                        0
                      )}
                    </TableCell>
                    <TableCell align="center">{row.avgVisitsPerActiveDay}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                        <Typography variant="body2" fontWeight="bold">{row.signatureComplianceRate}%</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={row.signatureComplianceRate}
                          color={row.signatureComplianceRate > 80 ? 'success' : 'warning'}
                          sx={{ width: 60, height: 8, borderRadius: 1 }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 3: CAPACITY PLANNING */}
      {activeTab === 3 && capacityData && (
        <Card sx={{ p: 3, boxShadow: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon /> Pianificazione Capacità & Previsione Scadenze
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Confronto della capacità totale di slot disponibili con le scadenze obbligatorie D.Lgs. 81/08 nei prossimi 30/60 giorni
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">ORE SETTIMANALI TOTALE TEAM</Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">{capacityData.totalWeeklyHours}h</Typography>
                <Typography variant="caption">~{capacityData.totalMonthlySlotsCapacity} slot visite/mese</Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">SCADENZE ENTRO 30 GIORNI</Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">{capacityData.next30DaysDeadlines}</Typography>
                <Typography variant="caption">Visite periodiche da effettuare</Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">UTILIZZO CAPACITÀ MESILE</Typography>
                <Typography variant="h4" fontWeight="bold" color={capacityData.hasCapacityDeficit ? 'error.main' : 'success.main'}>
                  {capacityData.capacityUtilization30Percent}%
                </Typography>
                <Typography variant="caption">
                  {capacityData.hasCapacityDeficit ? 'Attenzione: Rischio Deficit Capacità' : 'Capacità adeguata'}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {capacityData.hasCapacityDeficit && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>Previsione Deficit Capacità:</strong> Il volume di scadenze periodiche nei prossimi 30 giorni supera il 90% degli slot settimanali pianificati. Si consiglia di aumentare le ore di disponibilità o allocare medici sostituti.
            </Alert>
          )}
        </Card>
      )}

      {/* TAB 4: COVERAGE GAPS */}
      {activeTab === 4 && (
        <Card sx={{ p: 3, boxShadow: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon /> Matrice Copertura Aziende & Analisi Gap
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Verifica in tempo reale delle nomine Medico Competente (Art. 38) e Medico Coordinatore per ogni azienda e sede cliente
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Azienda Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Partita IVA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>N. Sedi</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Medico Nominato</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Medico Coordinatore</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Stato Copertura</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coverageGaps.map((row) => (
                  <TableRow key={row.companyId} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{row.companyName}</TableCell>
                    <TableCell fontFamily="monospace">{row.vatNumber || 'N/D'}</TableCell>
                    <TableCell align="center">{row.branchesCount}</TableCell>
                    <TableCell>{row.nominatedDoctorName || '❌ Non Assegnato'}</TableCell>
                    <TableCell>{row.coordinatorDoctorName || '❌ Non Assegnato'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.gapSeverity}
                        color={row.gapSeverity.includes('Critico') ? 'error' : (row.gapSeverity.includes('Attenzione') ? 'warning' : 'success')}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* CREATE / EDIT STAFF DIALOG */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicalServicesIcon color="primary" /> {selectedStaff ? 'Modifica Professionista Sanitario' : 'Nuovo Professionista Sanitario'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                size="small"
                label="Nome"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                size="small"
                label="Cognome"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                required
                size="small"
                label="Ruolo Professionale"
                value={formData.professionalRole}
                onChange={(e) => setFormData({ ...formData, professionalRole: e.target.value })}
              >
                {STAFF_ROLES.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Codice Fiscale"
                value={formData.taxCode}
                onChange={(e) => setFormData({ ...formData, taxCode: e.target.value.toUpperCase() })}
                inputProps={{ maxLength: 16 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                size="small"
                label="N. Iscrizione Ordine / Albo"
                value={formData.medicalLicenseNumber}
                onChange={(e) => setFormData({ ...formData, medicalLicenseNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Provincia Ordine"
                value={formData.licenseProvince}
                onChange={(e) => setFormData({ ...formData, licenseProvince: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Specializzazione"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Ente / Ordine di Riferimento"
                value={formData.licenseAuthority}
                onChange={(e) => setFormData({ ...formData, licenseAuthority: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Email di Contatto"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="PEC (Posta Elettronica Certificata)"
                type="email"
                value={formData.pec}
                onChange={(e) => setFormData({ ...formData, pec: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Telefono / Cellulare"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                Firma Digitale & Account MedWork
              </Typography>
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="Thumbprint Certificato Digitale / SmartCard"
                value={formData.digitalCertificateThumbprint}
                onChange={(e) => setFormData({ ...formData, digitalCertificateThumbprint: e.target.value })}
                placeholder="es. 4A8F91B200C..."
              />
            </Grid>
            {!selectedStaff && (
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.createUserAccount}
                      onChange={(e) => setFormData({ ...formData, createUserAccount: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Crea Account Login MedWork"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" color="primary" onClick={handleSaveStaff} sx={{ fontWeight: 'bold' }}>
            Salva Professionista
          </Button>
        </DialogActions>
      </Dialog>

      {/* ABSENCES & VACATIONS DIALOG WITH V2 INTELLIGENCE */}
      <Dialog open={absenceDialogOpen} onClose={() => setAbsenceDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Pianificazione Ferie & Assenze - {selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Registra Nuova Assenza / Ferie
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="Data Inizio"
                  InputLabelProps={{ shrink: true }}
                  value={absenceForm.startDate}
                  onChange={(e) => setAbsenceForm({ ...absenceForm, startDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="Data Fine"
                  InputLabelProps={{ shrink: true }}
                  value={absenceForm.endDate}
                  onChange={(e) => setAbsenceForm({ ...absenceForm, endDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Causale"
                  value={absenceForm.reason}
                  onChange={(e) => setAbsenceForm({ ...absenceForm, reason: e.target.value })}
                >
                  <MenuItem value="Ferie">Ferie</MenuItem>
                  <MenuItem value="Malattia">Malattia</MenuItem>
                  <MenuItem value="Congresso">Congresso / Formazione</MenuItem>
                  <MenuItem value="Permesso">Permesso Personale</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Medico Sostituto (Opzionale)"
                  value={absenceForm.substituteDoctorId}
                  onChange={(e) => setAbsenceForm({ ...absenceForm, substituteDoctorId: e.target.value })}
                >
                  <MenuItem value="">Nessun Sostituto</MenuItem>
                  {staffList
                    .filter((s) => s.id !== selectedStaff?.id && s.professionalRole !== 'SegreteriaSanitaria')
                    .map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        Dr. {s.firstName} {s.lastName}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
              <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  color="info"
                  size="small"
                  fullWidth
                  startIcon={<InsightsIcon />}
                  onClick={handleCheckVacationImpact}
                >
                  Previsione Impatto Scadenze
                </Button>
              </Grid>

              {vacationImpact && (
                <Grid item xs={12}>
                  <Alert severity={vacationImpact.hasComplianceRisk ? 'warning' : 'info'} sx={{ mt: 1 }}>
                    <strong>Analisi Impatto Ferie:</strong> {vacationImpact.impactedDeadlinesCount} visite periodiche previste nelle aziende assegnate durante questo periodo.{' '}
                    {vacationImpact.suggestedSubstitutes?.length > 0
                      ? `Sostituti disponibili: ${vacationImpact.suggestedSubstitutes.map(s => s.name).join(', ')}.`
                      : 'Nessun sostituto disponibile per questo intervallo.'}
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button variant="contained" color="warning" size="small" fullWidth onClick={handleAddAbsence} sx={{ fontWeight: 'bold', mt: 1 }}>
                  + Registra Periodo Assenza
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Periodi Registrati & Auto-Sostituzione
          </Typography>
          {absencesList.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Nessun periodo di assenza registrato.</Typography>
          ) : (
            <List dense>
              {absencesList.map((a) => (
                <ListItem key={a.id} divider>
                  <ListItemText
                    primary={`${a.reason}: ${new Date(a.startDate).toLocaleDateString('it-IT')} - ${new Date(a.endDate).toLocaleDateString('it-IT')}`}
                    secondary={a.substituteDoctorName ? `Sostituto: ${a.substituteDoctorName}` : 'Nessun sostituto assegnato'}
                  />
                  {!a.substituteDoctorId && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<AutoModeIcon />}
                      onClick={() => handleAutoSubstitute(a.id)}
                      sx={{ mr: 2 }}
                    >
                      1-Click Auto-Sostituto
                    </Button>
                  )}
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" color="error" onClick={() => handleDeleteAbsence(a.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbsenceDialogOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* COMPANY ASSIGNMENTS DIALOG */}
      <Dialog open={assignmentDialogOpen} onClose={() => setAssignmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Assegnazione Azienda - {selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Seleziona Azienda"
                  value={assignmentForm.companyId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, companyId: e.target.value })}
                >
                  <MenuItem value="">Seleziona Un'Azienda...</MenuItem>
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} ({c.vatNumber || 'P.IVA N/D'})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={assignmentForm.isCoordinator}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, isCoordinator: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Designa come Medico Coordinatore per l'Azienda"
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="success" fullWidth onClick={handleSaveAssignment} sx={{ fontWeight: 'bold' }}>
                  Conferma Assegnazione Azienda
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Aziende Attualmente Assegnate
          </Typography>
          {selectedStaff?.assignedCompanies && selectedStaff.assignedCompanies.length > 0 ? (
            <List dense>
              {selectedStaff.assignedCompanies.map((c) => (
                <ListItem key={c.assignmentId} divider>
                  <ListItemText
                    primary={c.companyName}
                    secondary={c.isCoordinator ? 'Medico Coordinatore' : 'Medico Competente Nominato'}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" color="error" onClick={() => handleRemoveAssignment(c.assignmentId)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">Nessuna azienda attualmente assegnata.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
