import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  Alert as MuiAlert,
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import BadgeIcon from '@mui/icons-material/Badge'
import AssessmentIcon from '@mui/icons-material/Assessment'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import EventIcon from '@mui/icons-material/Event'
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import SearchIcon from '@mui/icons-material/Search'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import LogoutIcon from '@mui/icons-material/Logout'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import PersonIcon from '@mui/icons-material/Person'
import DashboardIcon from '@mui/icons-material/Dashboard'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import DashboardScadenze from './components/DashboardScadenze'
import DashboardMedico from './components/DashboardMedico'
import Dashboard from './components/Dashboard'
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
// Centri reintegrati caricati in modo lazy: non appesantiscono il first paint della shell.
const GiudizioIdoneitaCenter = lazy(() => import('./components/GiudizioIdoneitaCenter'))
const CartellaSanitariaCenter = lazy(() => import('./components/CartellaSanitariaCenter'))
const FirmaGrafometricaCenter = lazy(() => import('./components/FirmaGrafometricaCenter'))
const ComplianceCenter = lazy(() => import('./components/ComplianceCenter'))
const Allegato3BCenter = lazy(() => import('./components/Allegato3BCenter'))
const AnalyticsCenter = lazy(() => import('./components/AnalyticsCenter'))
const AgendaCenter = lazy(() => import('./components/AgendaCenter'))
const AppointmentsCenter = lazy(() => import('./components/AppointmentsCenter'))
const RecallCampaignsCenter = lazy(() => import('./components/RecallCampaignsCenter'))
const ActivityDeadlinesCenter = lazy(() => import('./components/ActivityDeadlinesCenter'))
const NominationsDeadlinesCenter = lazy(() => import('./components/NominationsDeadlinesCenter'))
const VaccinationDeadlinesCenter = lazy(() => import('./components/VaccinationDeadlinesCenter'))
const AlertMulticanaleCenter = lazy(() => import('./components/AlertMulticanaleCenter'))
const CompanyGroupsCenter = lazy(() => import('./components/CompanyGroupsCenter'))
const MedicalStaffCenter = lazy(() => import('./components/MedicalStaffCenter'))
const MigrationCenter = lazy(() => import('./components/MigrationCenter'))
const PhraseTemplatesCenter = lazy(() => import('./components/PhraseTemplatesCenter'))
const QuestionnairesCenter = lazy(() => import('./components/QuestionnairesCenter'))
const EmployerPortalView = lazy(() => import('./components/EmployerPortalView'))
const GlobalSearchModal = lazy(() => import('./components/GlobalSearchModal'))
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
  { key: 'employer-portal', label: 'Portale RSPP/DdL', icon: LocalHospitalIcon },
  { key: 'administration', label: 'Amministrazione', icon: SettingsApplicationsIcon },
]

// Azioni storiche del cockpit che puntavano a centri non più presenti come moduli dedicati:
// vengono risolte su un modulo vivo per non lasciare mai un vicolo cieco.
const LEGACY_MODULE_ALIASES = {
  'batch-signature': 'giudizio-idoneita',
  'firma-massiva': 'giudizio-idoneita',
  'visit-planning': 'schedules',
  'doctor-dashboard': 'medical-dashboard',
}

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
  { key: 'dashboard', label: 'Il Mio Giorno' },
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

  // --- Moduli reintegrati: centri precedentemente orfani (vedi FRONTEND_UX_AUDIT.md) ---
  { key: 'giudizio-idoneita', label: 'Centro Giudizi & Firma' },
  { key: 'cartella-sanitaria', label: 'Cartella Sanitaria 3A' },
  { key: 'firma-grafometrica', label: 'Firma Grafometrica' },
  { key: 'compliance', label: 'Compliance Radar' },
  { key: 'allegato-3b', label: 'Allegato 3B INAIL' },
  { key: 'analytics', label: 'Analytics & Predizioni' },
  { key: 'agenda', label: 'Agenda Giornaliera' },
  { key: 'appointments', label: 'Prenotazioni' },
  { key: 'recall-campaigns', label: 'Convocazioni & Recall' },
  { key: 'activity-deadlines', label: 'Scadenzario Attività' },
  { key: 'nominations', label: 'Scadenzario Nomine' },
  { key: 'vaccination-deadlines', label: 'Scadenzario Vaccinazioni' },
  { key: 'alert-multicanale', label: 'Alert Multi-canale' },
  { key: 'company-groups-workspace', label: 'Workspace Gruppi' },
  { key: 'medical-staff', label: 'Personale Sanitario' },
  { key: 'migration', label: 'Migrazione & Import' },
  { key: 'phrase-templates', label: 'Frasi Tipo' },
  { key: 'questionnaires', label: 'Questionari' },
  { key: 'employer-portal', label: 'Portale RSPP/DdL' },
]

const AREA_MODULE_KEYS = {
  'health-surveillance': ['dashboard', 'medical-dashboard', 'medical-visit-stepper', 'appointments-calendar', 'giudizio-idoneita', 'cartella-sanitaria', 'medical-records', 'medical-visits', 'anamneses', 'scheduled-exams', 'vaccinations', 'visit-exams', 'site-visits', 'firma-grafometrica'],
  'company-management': ['companies', 'company-groups-workspace', 'company-groups', 'company-contacts', 'employees', 'protocols', 'schedules', 'branches', 'departments', 'work-locations'],
  'workers-management': ['employees', 'employees-crud', 'employee-risks', 'medical-records', 'medical-visits'],
  schedule: ['home', 'agenda', 'appointments', 'schedules', 'appointments-calendar', 'recall-campaigns', 'activity-deadlines', 'nominations', 'vaccination-deadlines', 'doctor-availabilities', 'alert-multicanale', 'notification-logs'],
  analysis: ['reporting', 'compliance', 'allegato-3b', 'analytics', 'audit'],
  'employer-portal': ['employer-portal'],
  administration: ['billing', 'medical-staff', 'migration', 'phrase-templates', 'questionnaires', 'tools', 'settings', 'exam-types', 'job-roles', 'risk-factors', 'protocols-registry', 'personal-protocols'],
}

const AREA_DEFAULT_MODULE = {
  'health-surveillance': 'dashboard',
  'company-management': 'companies',
  'workers-management': 'employees',
  schedule: 'home',
  analysis: 'reporting',
  'employer-portal': 'employer-portal',
  administration: 'settings',
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || '')
  const [role, setRole] = useState(() => localStorage.getItem('role') || '')
  const [selectedArea, setSelectedArea] = useState(() => (role === 'Doctor' ? 'health-surveillance' : 'company-management'))
  const [selectedCompanyTab, setSelectedCompanyTab] = useState('groups')
  const [selectedModuleKey, setSelectedModuleKey] = useState(() => (role === 'Doctor' ? 'dashboard' : 'companies'))
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

  const [searchOpen, setSearchOpen] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'info' })
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} })

  useEffect(() => {
    if (!isAuthenticated) return
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAuthenticated])

  // Global notification listener — receives events from showNotification()
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.message) {
        setToast({ open: true, message: detail.message, severity: detail.severity || 'info' })
      }
    }
    window.addEventListener('medwork:notify', handler)
    return () => window.removeEventListener('medwork:notify', handler)
  }, [])

  const handleToastClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return
    setToast((t) => ({ ...t, open: false }))
  }

  const handleConfirmClose = (result: boolean) => {
    setConfirm((c) => ({ ...c, open: false }))
    if (result) c.onConfirm()
  }

  const roleAwareSideMenu = useMemo(() => {
    if (role === 'Admin') return SIDE_NAV_ITEMS
    return SIDE_NAV_ITEMS.filter((item) => !['administration', 'employer-portal'].includes(item.key))
  }, [role])

  const roleAwareModules = useMemo(() => {
    if (role === 'Admin') return MODULE_ITEMS

    const doctorAllowed = new Set([
      'dashboard',
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
      'giudizio-idoneita',
      'cartella-sanitaria',
      'firma-grafometrica',
      'compliance',
      'allegato-3b',
      'agenda',
      'appointments',
      'recall-campaigns',
      'vaccination-deadlines',
      'site-visits',
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
      setSelectedModuleKey('dashboard')
    } else {
      setSelectedArea('company-management')
      setSelectedModuleKey('companies')
    }
    appendAuditEvent({ module: 'Auth', action: 'Login', detail: userRole })
  }

  const handleLogout = () => {
    setSearchOpen(false)
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

  const handleModuleNavigation = (targetKey) => {
    const resolvedKey = MODULE_ITEMS.some((item) => item.key === targetKey)
      ? targetKey
      : LEGACY_MODULE_ALIASES[targetKey]
    if (!resolvedKey || !MODULE_ITEMS.some((item) => item.key === resolvedKey)) return

    const owningArea = Object.entries(AREA_MODULE_KEYS).find(([, keys]) => keys.includes(resolvedKey))?.[0]
    if (owningArea) setSelectedArea(owningArea)
    setSelectedModuleKey(resolvedKey)
    appendAuditEvent({ module: 'Navigation', action: 'Open', detail: resolvedKey })
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

  // Centri reintegrati: moduli standalone precedentemente orfani (vedi FRONTEND_UX_AUDIT.md).
  const REINTEGRATED_MODULES = {
    'giudizio-idoneita': () => <GiudizioIdoneitaCenter />,
    'cartella-sanitaria': () => <CartellaSanitariaCenter />,
    'firma-grafometrica': () => <FirmaGrafometricaCenter />,
    compliance: () => <ComplianceCenter onNavigateModule={handleModuleNavigation} />,
    'allegato-3b': () => <Allegato3BCenter />,
    analytics: () => <AnalyticsCenter />,
    agenda: () => <AgendaCenter />,
    appointments: () => <AppointmentsCenter />,
    'recall-campaigns': () => <RecallCampaignsCenter />,
    'activity-deadlines': () => <ActivityDeadlinesCenter />,
    nominations: () => <NominationsDeadlinesCenter />,
    'vaccination-deadlines': () => <VaccinationDeadlinesCenter />,
    'alert-multicanale': () => <AlertMulticanaleCenter />,
    'company-groups-workspace': () => <CompanyGroupsCenter />,
    'medical-staff': () => <MedicalStaffCenter />,
    migration: () => <MigrationCenter />,
    'phrase-templates': () => <PhraseTemplatesCenter />,
    questionnaires: () => <QuestionnairesCenter />,
    'employer-portal': () => <EmployerPortalView companyId={activeCompanyId} />,
  }

  const renderModuleContent = (moduleKey) => {
    if (REINTEGRATED_MODULES[moduleKey]) return REINTEGRATED_MODULES[moduleKey]()

    if (moduleKey === 'dashboard') {
      return (
        <Dashboard
          onNavigateModule={handleModuleNavigation}
          onOpenMedicalVisitCreate={(employeeId) => {
            setSelectedEmployeeIdForVisit(employeeId ? String(employeeId) : null)
            setSelectedModuleKey('medical-visit-stepper')
          }}
        />
      )
    }

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
                <button
                  type="button"
                  className="legacy-toolbar-link"
                  onClick={() => setSearchOpen(true)}
                  title="Ricerca globale lavoratori, aziende e moduli (Ctrl+K)"
                >
                  <SearchIcon fontSize="small" />
                  Cerca
                  <span
                    style={{
                      marginLeft: 6,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.15)',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    Ctrl K
                  </span>
                </button>
                <Tooltip title="Notifiche">
                  <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    <NotificationsNoneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <button type="button" className="legacy-toolbar-link" onClick={handleLogout} title="Disconnetti sessione" aria-label="Logout">
                  <LogoutIcon fontSize="small" />
                  Logout
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
                    <Box className="mw-chip-strip has-modules">
                      {areaModuleItems.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          className={`mw-chip ${selectedModuleKey === item.key ? 'is-active' : ''}`}
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
                  <Suspense
                    fallback={
                      <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', gap: 2, px: 4 }}>
                        <Box className="mw-skeleton mw-skeleton-card" />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box className="mw-skeleton mw-skeleton-text" sx={{ flex: 2 }} />
                          <Box className="mw-skeleton mw-skeleton-text-short" sx={{ flex: 1 }} />
                        </Box>
                        <Box className="mw-skeleton mw-skeleton-table" />
                      </Box>
                    }
                  >
                    {renderWorkspaceContent()}
                  </Suspense>
                </Box>
              </main>
            </Box>
          </Box>
        )}
      </Box>

      {isAuthenticated && (
        <GlobalSearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onNavigateModule={(targetKey) => handleModuleNavigation(targetKey)}
          onSelectWorker={(worker) => {
            setSelectedEmployeeIdForVisit(worker?.id ? String(worker.id) : null)
            setSelectedArea('health-surveillance')
            setSelectedModuleKey('medical-visit-stepper')
          }}
          onSelectCompany={(company) => {
            if (company?.id) handleCompanyContextSwitch(String(company.id))
            setSelectedArea('company-management')
            setSelectedModuleKey('companies')
          }}
        />
      )}

      {/* GLOBAL TOAST NOTIFICATION */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={handleToastClose}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {toast.message}
        </MuiAlert>
      </Snackbar>

      {/* CONFIRMATION DIALOG */}
      <Dialog
        open={confirm.open}
        onClose={() => handleConfirmClose(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
      >
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>{confirm.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14, color: '#4b5563', mt: 1 }}>
            {confirm.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => handleConfirmClose(false)}>
            Annulla
          </Button>
          <Button variant="contained" color="error" onClick={() => handleConfirmClose(true)}>
            Conferma
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default App

