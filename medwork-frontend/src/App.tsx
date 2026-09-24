import { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CssBaseline,
  Divider,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import BadgeIcon from '@mui/icons-material/Badge'
import AssessmentIcon from '@mui/icons-material/Assessment'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import EventIcon from '@mui/icons-material/Event'
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import LogoutIcon from '@mui/icons-material/Logout'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import PersonIcon from '@mui/icons-material/Person'
import DashboardIcon from '@mui/icons-material/Dashboard'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import DashboardScadenze from './components/DashboardScadenze'
import DashboardMedico from './components/DashboardMedico'
import CrudEntityView from './components/CrudEntityView'
import LoginCard from './components/LoginCard'
import ReportsCenter from './components/ReportsCenter'
import AppointmentsCalendar from './components/AppointmentsCalendar'
import ProtocolsCenter from './components/ProtocolsCenter'
import BillingCenter from './components/BillingCenter'
import AuditCenter from './components/AuditCenter'
import ToolsCenter from './components/ToolsCenter'
import SettingsCenter from './components/SettingsCenter'
import VisitPlanningCenter from './components/VisitPlanningCenter'
import MedicalVisitStepper from './components/MedicalVisitStepper'
import WorkersCenter from './components/WorkersCenter'
import { ENTITY_CONFIGS } from './constants/entityConfigs'
import { appendAuditEvent } from './utils/auditTrail'
import { apiGet } from './services/apiClient'
import './App.css'

const SETTINGS_STORAGE_KEY = 'medwork.runtime.settings'

function readActiveCompanyFromSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}')
    return parsed.activeCompanyId || ''
  } catch {
    return ''
  }
}

const ENTITY_BY_KEY = Object.fromEntries(ENTITY_CONFIGS.map((item) => [item.key, item]))

const SIDE_NAV_ITEMS = [
  { key: 'health-surveillance', label: 'Sorveglianza Sanitaria', icon: HealthAndSafetyIcon },
  { key: 'company-management', label: 'Gestione Aziende', icon: BusinessIcon },
  { key: 'workers-management', label: 'Gestione Lavoratori', icon: BadgeIcon },
  { key: 'schedule', label: 'Scadenzario & Visite', icon: EventIcon },
  { key: 'analysis', label: 'Analisi & Relazioni', icon: AssessmentIcon },
  { key: 'administration', label: 'Amministrazione', icon: SettingsApplicationsIcon },
]

const COMPANY_TABS = [
  { key: 'groups', label: 'Gruppi Aziendali' },
  { key: 'registry', label: 'Anagrafica Lavoratori' },
  { key: 'checklist', label: 'Protocolli Sanitari' },
  { key: 'activities', label: 'Pianificazione Visite' },
]

const COMPANY_TAB_TO_MODULE = {
  groups: 'companies',
  registry: 'employees',
  checklist: 'protocols',
  activities: 'schedules',
}

const MODULE_ITEMS = [
  { key: 'medical-dashboard', label: 'Dashboard Medico' },
  { key: 'home', label: 'Dashboard Scadenze' },
  { key: 'companies', label: 'Aziende', entityKey: 'companies' },
  { key: 'company-groups', label: 'Gruppi Aziendali', entityKey: 'company-groups' },
  { key: 'company-contacts', label: 'Figure Aziendali', entityKey: 'company-contacts' },
  { key: 'employees', label: 'Lavoratori' },
  { key: 'employees-crud', label: 'Lavoratori (CRUD)', entityKey: 'employees' },
  { key: 'protocols', label: 'Protocolli' },
  { key: 'protocols-registry', label: 'Registro Protocolli', entityKey: 'protocols-registry' },
  { key: 'personal-protocols', label: 'Protocolli Personali', entityKey: 'personal-protocols' },
  { key: 'schedules', label: 'Scadenze & Agende' },
  { key: 'medical-visit-stepper', label: 'Nuova Visita (Step)' },
  { key: 'appointments-calendar', label: 'Calendario Visite' },
  { key: 'billing', label: 'Fatturazione' },
  { key: 'audit', label: 'Audit Trail' },
  { key: 'exam-types', label: 'Cataloghi Esami', entityKey: 'exam-types' },
  { key: 'job-roles', label: 'Mansioni', entityKey: 'job-roles' },
  { key: 'tools', label: 'Strumenti' },
  { key: 'settings', label: 'Impostazioni' },
  { key: 'reporting', label: 'Reportistica & All. 3B' },
  { key: 'branches', label: 'Sedi', entityKey: 'branches' },
  { key: 'departments', label: 'Reparti', entityKey: 'departments' },
  { key: 'work-locations', label: 'Luoghi di Lavoro', entityKey: 'work-locations' },
  { key: 'risk-factors', label: 'Fattori di Rischio', entityKey: 'risk-factors' },
  { key: 'employee-risks', label: 'Rischi Dipendente', entityKey: 'employee-risks' },
  { key: 'medical-records', label: 'Cartelle Sanitarie (All. 3A)', entityKey: 'medical-records' },
  { key: 'medical-visits', label: 'Registro Visite Mediche', entityKey: 'medical-visits' },
  { key: 'anamneses', label: 'Anamnesi Guidata', entityKey: 'anamneses' },
  { key: 'visit-exams', label: 'Esami Visita', entityKey: 'visit-exams' },
  { key: 'scheduled-exams', label: 'Accertamenti Strumentali', entityKey: 'scheduled-exams' },
  { key: 'site-visits', label: 'Sopralluoghi Ambienti', entityKey: 'site-visits' },
  { key: 'vaccinations', label: 'Vaccinazioni', entityKey: 'vaccinations' },
  { key: 'doctor-availabilities', label: 'Disponibilità Medici', entityKey: 'doctor-availabilities' },
  { key: 'notification-logs', label: 'Log Notifiche', entityKey: 'notification-logs' },
]

const AREA_MODULE_KEYS = {
  'health-surveillance': ['medical-dashboard', 'medical-visit-stepper', 'appointments-calendar', 'medical-records', 'medical-visits', 'anamneses', 'scheduled-exams', 'vaccinations', 'visit-exams', 'site-visits'],
  'company-management': ['companies', 'company-groups', 'company-contacts', 'employees', 'protocols', 'schedules', 'branches', 'departments', 'work-locations'],
  'workers-management': ['employees', 'employees-crud', 'employee-risks', 'medical-records', 'medical-visits'],
  schedule: ['schedules', 'home', 'appointments-calendar', 'doctor-availabilities', 'notification-logs'],
  analysis: ['reporting', 'audit'],
  administration: ['billing', 'tools', 'settings', 'exam-types', 'job-roles', 'risk-factors', 'protocols-registry', 'personal-protocols'],
}

const AREA_DEFAULT_MODULE = {
  'health-surveillance': 'medical-dashboard',
  'company-management': 'companies',
  'workers-management': 'employees',
  schedule: 'schedules',
  analysis: 'reporting',
  administration: 'settings',
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || '')
  const [role, setRole] = useState(() => localStorage.getItem('role') || '')
  const [selectedArea, setSelectedArea] = useState(() => (role === 'Doctor' ? 'health-surveillance' : 'company-management'))
  const [selectedCompanyTab, setSelectedCompanyTab] = useState('groups')
  const [selectedModuleKey, setSelectedModuleKey] = useState(() => (role === 'Doctor' ? 'medical-dashboard' : 'companies'))
  const [quickCreateRequest, setQuickCreateRequest] = useState(null)
  const [selectedEmployeeIdForVisit, setSelectedEmployeeIdForVisit] = useState(null)
  const [activeCompanyId, setActiveCompanyId] = useState(() => readActiveCompanyFromSettings())
  const [companiesList, setCompaniesList] = useState([])

  const isAuthenticated = useMemo(() => token && (role === 'Doctor' || role === 'Admin'), [token, role])

  useEffect(() => {
    if (!isAuthenticated) return

    apiGet('/api/master-data/companies')
      .then((data) => {
        if (Array.isArray(data)) setCompaniesList(data)
      })
      .catch((error) => {
        if (error?.status === 401) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('role')
          setToken('')
          setRole('')
          setSelectedArea('company-management')
          setSelectedModuleKey('companies')
        }
      })
  }, [isAuthenticated])

  const roleAwareSideMenu = useMemo(() => {
    if (role === 'Admin') return SIDE_NAV_ITEMS
    return SIDE_NAV_ITEMS.filter((item) => item.key !== 'administration')
  }, [role])

  const roleAwareModules = useMemo(() => {
    if (role === 'Admin') return MODULE_ITEMS

    const doctorAllowed = new Set([
      'medical-dashboard',
      'home',
      'employees',
      'employees-crud',
      'protocols',
      'protocols-registry',
      'personal-protocols',
      'schedules',
      'medical-visit-stepper',
      'appointments-calendar',
      'anamneses',
      'scheduled-exams',
      'vaccinations',
      'tools',
      'reporting',
      'medical-records',
      'medical-visits',
      'visit-exams',
      'exam-types',
    ])

    return MODULE_ITEMS.filter((item) => doctorAllowed.has(item.key))
  }, [role])

  const areaModuleItems = useMemo(() => {
    const keys = AREA_MODULE_KEYS[selectedArea] || []
    const allowed = new Set(keys)
    return roleAwareModules.filter((item) => allowed.has(item.key))
  }, [roleAwareModules, selectedArea])

  const handleLoginSuccess = (accessToken, userRole) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('role', userRole)
    setToken(accessToken)
    setRole(userRole)
    if (userRole === 'Doctor') {
      setSelectedArea('health-surveillance')
      setSelectedModuleKey('medical-dashboard')
    } else {
      setSelectedArea('company-management')
      setSelectedModuleKey('companies')
    }
    appendAuditEvent({ module: 'Auth', action: 'Login', detail: userRole })
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('role')
    setToken('')
    setRole('')
    setSelectedArea('company-management')
    setSelectedCompanyTab('groups')
    setSelectedModuleKey('companies')
    setQuickCreateRequest(null)
    setSelectedEmployeeIdForVisit(null)
    appendAuditEvent({ module: 'Auth', action: 'Logout', detail: role || '-' })
  }

  const handleQuickCreateConsumed = () => {
    setQuickCreateRequest(null)
  }

  const handleAreaNavigation = (nextArea) => {
    setSelectedArea(nextArea)
    setSelectedModuleKey(AREA_DEFAULT_MODULE[nextArea] || 'companies')
    if (nextArea === 'company-management') {
      setSelectedCompanyTab('groups')
    }
    appendAuditEvent({ module: 'Navigation', action: 'Open', detail: nextArea })
  }

  const handleSettingsChange = (nextSettings) => {
    setActiveCompanyId(nextSettings?.activeCompanyId || '')
  }

  const handleCompanyContextSwitch = (newCompanyId) => {
    setActiveCompanyId(newCompanyId)
    try {
      const existing = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}')
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...existing, activeCompanyId: newCompanyId }))
    } catch {}
  }

  const renderModuleContent = (moduleKey) => {
    if (moduleKey === 'medical-dashboard') {
      return (
        <DashboardMedico
          onNewVisit={(employeeId) => {
            setSelectedEmployeeIdForVisit(employeeId ? String(employeeId) : null)
            setSelectedModuleKey('medical-visit-stepper')
          }}
        />
      )
    }

    if (moduleKey === 'home') {
      return (
        <DashboardScadenze
          activeCompanyId={activeCompanyId}
          onOpenMedicalVisitCreate={() => setSelectedModuleKey('medical-visit-stepper')}
          onOpenEmployeeCreate={() => setSelectedModuleKey('employees-crud')}
          onOpenReports={() => setSelectedModuleKey('reporting')}
        />
      )
    }

    if (moduleKey === 'companies') {
      return (
        <CrudEntityView
          config={ENTITY_BY_KEY.companies}
          currentRole={role}
          externalCreateToken={0}
          onExternalCreateConsumed={handleQuickCreateConsumed}
        />
      )
    }

    if (moduleKey === 'employees') {
      return (
        <WorkersCenter
          activeCompanyId={activeCompanyId}
          onOpenEmployeeCreate={() => setQuickCreateRequest({ entityKey: 'employees', token: Date.now() })}
        />
      )
    }

    if (moduleKey === 'employees-crud') {
      return (
        <CrudEntityView
          config={ENTITY_BY_KEY.employees}
          currentRole={role}
          externalCreateToken={quickCreateRequest?.entityKey === 'employees' ? quickCreateRequest.token : 0}
          onExternalCreateConsumed={handleQuickCreateConsumed}
        />
      )
    }

    if (moduleKey === 'protocols') {
      return <ProtocolsCenter />
    }

    if (moduleKey === 'schedules') {
      return <VisitPlanningCenter activeCompanyId={activeCompanyId} onOpenMedicalVisitCreate={() => setSelectedModuleKey('medical-visit-stepper')} />
    }

    if (moduleKey === 'medical-visit-stepper') {
      return (
        <MedicalVisitStepper
          initialEmployeeId={selectedEmployeeIdForVisit}
          onCreated={() => {
            setSelectedEmployeeIdForVisit(null)
            setSelectedModuleKey('medical-visits')
          }}
        />
      )
    }

    if (moduleKey === 'appointments-calendar') {
      return <AppointmentsCalendar onCreateAppointment={() => setQuickCreateRequest({ entityKey: 'medical-visits', token: Date.now() })} />
    }

    if (moduleKey === 'billing') {
      return <BillingCenter />
    }

    if (moduleKey === 'audit') {
      return <AuditCenter />
    }

    if (moduleKey === 'tools') {
      return <ToolsCenter />
    }

    if (moduleKey === 'settings') {
      return <SettingsCenter activeCompanyId={activeCompanyId} onSettingsChange={handleSettingsChange} />
    }

    if (moduleKey === 'reporting') {
      return <ReportsCenter />
    }

    const moduleItem = roleAwareModules.find((item) => item.key === moduleKey)
    const currentEntityConfig = moduleItem?.entityKey ? ENTITY_BY_KEY[moduleItem.entityKey] : null

    if (currentEntityConfig) {
      return (
        <CrudEntityView
          config={currentEntityConfig}
          currentRole={role}
          externalCreateToken={quickCreateRequest?.entityKey === currentEntityConfig?.key ? quickCreateRequest.token : 0}
          onExternalCreateConsumed={handleQuickCreateConsumed}
        />
      )
    }

    return <Typography variant="body2">Modulo non disponibile per il ruolo corrente.</Typography>
  }

  const renderWorkspaceContent = () => {
    const companyMode =
      selectedArea === 'company-management' &&
      Object.values(COMPANY_TAB_TO_MODULE).includes(selectedModuleKey)

    if (companyMode) {
      return (
        <Box className="legacy-workspace-card">
          <Box className="legacy-tab-row">
            {COMPANY_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`legacy-tab ${selectedCompanyTab === tab.key ? 'is-active' : ''}`}
                onClick={() => {
                  const moduleKey = COMPANY_TAB_TO_MODULE[tab.key]
                  setSelectedCompanyTab(tab.key)
                  setSelectedModuleKey(moduleKey)
                  appendAuditEvent({ module: 'Navigation', action: 'Open', detail: `company-tab:${tab.key}` })
                }}
              >
                {tab.label}
              </button>
            ))}
          </Box>
          <Box className="legacy-content-area">{renderModuleContent(selectedModuleKey)}</Box>
        </Box>
      )
    }

    return renderModuleContent(selectedModuleKey)
  }

  const currentAreaLabel = SIDE_NAV_ITEMS.find((i) => i.key === selectedArea)?.label || selectedArea
  const currentModuleLabel = MODULE_ITEMS.find((i) => i.key === selectedModuleKey)?.label || selectedModuleKey

  return (
    <>
      <CssBaseline />
      <Box className="legacy-shell">
        {!isAuthenticated ? (
          <Box className="legacy-login-wrap">
            <Paper className="legacy-login-card" elevation={0}>
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ mb: 1.5 }}>
                <Avatar sx={{ bgcolor: '#113a7b', width: 44, height: 44 }}>
                  <LocalHospitalIcon />
                </Avatar>
                <Typography variant="h5" component="h1" fontWeight={700} color="#0f1f3d">
                  MedWork Manager
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mb: 2.5, color: '#5f6472', textAlign: 'center' }}>
                Piattaforma Professionale di Medicina del Lavoro (D.Lgs. 81/08)
              </Typography>
              <LoginCard onLoginSuccess={handleLoginSuccess} />
            </Paper>
          </Box>
        ) : (
          <Box className="legacy-layout">
            <header className="legacy-topbar">
              <Box className="legacy-topbar-left">
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                    <LocalHospitalIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={700} color="#ffffff" sx={{ letterSpacing: -0.2 }}>
                    MedWork
                  </Typography>
                  <Chip
                    label="D.Lgs. 81/08"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.12)',
                      color: '#93c5fd',
                      fontSize: '11px',
                      fontWeight: 600,
                      height: 20,
                    }}
                  />
                </Stack>
              </Box>

              {/* CENTER CONTEXT SELECTOR */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Azienda Attiva:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={activeCompanyId || ''}
                    onChange={(e) => handleCompanyContextSwitch(e.target.value)}
                    displayEmpty
                    sx={{
                      height: 30,
                      color: '#ffffff',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      fontSize: '12px',
                      borderRadius: 1.5,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93c5fd' },
                      '& .MuiSvgIcon-root': { color: '#ffffff' },
                    }}
                  >
                    <MenuItem value="">
                      <em>🌐 Tutte le Aziende (Globale)</em>
                    </MenuItem>
                    {companiesList.map((c) => (
                      <MenuItem key={c.id} value={String(c.id)}>
                        {c.name || c.ragioneSociale || `Azienda #${c.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box className="legacy-topbar-right">
                <Chip
                  icon={<PersonIcon sx={{ fontSize: 14, color: '#ffffff !important' }} />}
                  label={role === 'Doctor' ? 'Medico Competente' : 'Amministratore / Segreteria'}
                  size="small"
                  sx={{
                    bgcolor: role === 'Doctor' ? '#059669' : '#2563eb',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '11px',
                  }}
                />
                <span className="legacy-divider" />
                <Tooltip title="Notifiche">
                  <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    <NotificationsNoneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <button type="button" className="legacy-toolbar-link" onClick={handleLogout} title="Disconnetti sessione">
                  <LogoutIcon fontSize="small" />
                  Esci
                </button>
              </Box>
            </header>

            <Box className="legacy-body">
              <aside className="legacy-sidebar">
                {roleAwareSideMenu.map((item) => {
                  const Icon = item.icon
                  const isActive = selectedArea === item.key

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`legacy-side-item ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleAreaNavigation(item.key)}
                    >
                      <Icon fontSize="small" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </aside>

              <main className="legacy-main-content">
                <Box className="legacy-content-wrapper">
                  {/* BREADCRUMB & CONTEXT LINE */}
                  <Box className="legacy-context-line">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {currentAreaLabel}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        /
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f1f3d' }}>
                        {currentModuleLabel}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Sessione: {role}
                      </Typography>
                      {activeCompanyId && (
                        <Chip
                          size="small"
                          label={`Azienda: #${activeCompanyId}`}
                          color="info"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '11px' }}
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* MODULE CHIP STRIP */}
                  {!!areaModuleItems.length && areaModuleItems.length > 1 && (
                    <Box className="legacy-module-strip has-modules">
                      {areaModuleItems.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          className={`legacy-module-chip ${selectedModuleKey === item.key ? 'is-active' : ''}`}
                          onClick={() => {
                            setSelectedModuleKey(item.key)
                            const matchingTab = Object.entries(COMPANY_TAB_TO_MODULE).find(([, value]) => value === item.key)?.[0]
                            if (matchingTab) {
                              setSelectedCompanyTab(matchingTab)
                            }
                            appendAuditEvent({ module: 'Navigation', action: 'Open', detail: item.key })
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </Box>
                  )}

                  {/* WORKSPACE AREA */}
                  {renderWorkspaceContent()}
                </Box>
              </main>
            </Box>
          </Box>
        )}
      </Box>
    </>
  )
}

export default App

