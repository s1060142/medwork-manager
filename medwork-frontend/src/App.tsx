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
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
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
import AgendaPlanningCenter from './components/AgendaPlanningCenter'
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

function readActiveBranchFromSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}')
    return parsed.activeBranchId || ''
  } catch {
    return ''
  }
}

const ENTITY_BY_KEY = Object.fromEntries(ENTITY_CONFIGS.map((item) => [item.key, item]))

const SIDE_NAV_ITEMS = [
  { key: 'health-surveillance', label: 'Sorveglianza Sanitaria', icon: HealthAndSafetyIcon },
  { key: 'company-management', label: 'Gestione Aziende', icon: BusinessIcon },
  { key: 'workers-management', label: 'Gestione Lavoratori', icon: BadgeIcon },
  { key: 'analysis', label: 'Analisi & Relazioni', icon: AssessmentIcon },
  { key: 'employer-portal', label: 'Portale RSPP/DdL', icon: LocalHospitalIcon },
  { key: 'administration', label: 'Amministrazione', icon: SettingsApplicationsIcon },
]

// Azioni storiche del cockpit e vecchi collegamenti risolti in modo trasparente
const LEGACY_MODULE_ALIASES = {
  'batch-signature': 'giudizio-idoneita',
  'firma-massiva': 'giudizio-idoneita',
  'visit-planning': 'agenda-planning',
  'home': 'agenda-planning',
  'schedule': 'agenda-planning',
  'schedules': 'agenda-planning',
  'agenda': 'agenda-planning',
  'appointments': 'agenda-planning',
  'appointments-calendar': 'agenda-planning',
  'doctor-dashboard': 'dashboard',
  'medical-dashboard': 'dashboard',
  'employees-crud': 'employees',
  'medical-records': 'cartella-sanitaria',
  'medical-visits': 'cartella-sanitaria',
  'anamneses': 'medical-visit-stepper',
  'scheduled-exams': 'agenda-planning',
  'visit-exams': 'medical-visit-stepper',
  'vaccinations': 'vaccination-deadlines',
}

const MODULE_ITEMS = [
  // --- Macro-Area: Sorveglianza Sanitaria & Visite (Accorpamento Flusso Clinico Unico) ---
  { key: 'dashboard', label: 'Il Mio Giorno' },
  { key: 'agenda-planning', label: 'Agenda & Pianificazione' },
  { key: 'medical-visit-stepper', label: 'Nuova Visita (Step)' },
  { key: 'cartella-sanitaria', label: 'Cartella Sanitaria 3A' },
  { key: 'giudizio-idoneita', label: 'Centro Giudizi & Firma' },
  { key: 'recall-campaigns', label: 'Convocazioni & Recall' },
  { key: 'vaccination-deadlines', label: 'Vaccinazioni' },
  { key: 'site-visits', label: 'Sopralluoghi Ambienti' },
  { key: 'firma-grafometrica', label: 'Firma su Tablet' },

  // --- Macro-Area: Gestione Aziende ---
  { key: 'companies', label: 'Aziende', entityKey: 'companies' },
  { key: 'company-groups-workspace', label: 'Gruppi Aziendali' },
  { key: 'company-contacts', label: 'Figure Aziendali', entityKey: 'company-contacts' },
  { key: 'protocols', label: 'Protocolli Sanitari' },
  { key: 'branches', label: 'Sedi', entityKey: 'branches' },
  { key: 'departments', label: 'Reparti', entityKey: 'departments' },
  { key: 'work-locations', label: 'Luoghi di Lavoro', entityKey: 'work-locations' },

  // --- Macro-Area: Gestione Lavoratori ---
  { key: 'employees', label: 'Lavoratori' },
  { key: 'employee-risks', label: 'Rischi Lavoratori', entityKey: 'employee-risks' },

  // --- Macro-Area: Analisi & Relazioni ---
  { key: 'reporting', label: 'Reportistica & All. 3B' },
  { key: 'compliance', label: 'Compliance Radar' },
  { key: 'allegato-3b', label: 'Allegato 3B INAIL' },
  { key: 'analytics', label: 'Analytics & Predizioni' },
  { key: 'audit', label: 'Audit Trail' },

  // --- Macro-Area: Portale RSPP/DdL ---
  { key: 'employer-portal', label: 'Portale RSPP/DdL' },

  // --- Macro-Area: Amministrazione ---
  { key: 'medical-staff', label: 'Personale Sanitario' },
  { key: 'billing', label: 'Fatturazione' },
  { key: 'migration', label: 'Migrazione & Import' },
  { key: 'questionnaires', label: 'Questionari' },
  { key: 'exam-types', label: 'Cataloghi Esami', entityKey: 'exam-types' },
  { key: 'job-roles', label: 'Mansioni', entityKey: 'job-roles' },
  { key: 'risk-factors', label: 'Fattori di Rischio', entityKey: 'risk-factors' },
  { key: 'tools', label: 'Strumenti' },
  { key: 'settings', label: 'Impostazioni' },
]

const AREA_MODULE_KEYS = {
  'health-surveillance': [
    'dashboard',
    'agenda-planning',
    'medical-visit-stepper',
    'cartella-sanitaria',
    'giudizio-idoneita',
    'recall-campaigns',
    'vaccination-deadlines',
    'site-visits',
    'firma-grafometrica',
  ],
  'company-management': [
    'companies',
    'company-groups-workspace',
    'company-contacts',
    'protocols',
    'branches',
    'departments',
    'work-locations',
  ],
  'workers-management': [
    'employees',
    'employee-risks',
  ],
  analysis: [
    'reporting',
    'compliance',
    'allegato-3b',
    'analytics',
    'audit',
  ],
  'employer-portal': ['employer-portal'],
  administration: [
    'medical-staff',
    'billing',
    'migration',
    'questionnaires',
    'exam-types',
    'job-roles',
    'risk-factors',
    'tools',
    'settings',
  ],
}

const AREA_DEFAULT_MODULE = {
  'health-surveillance': 'dashboard',
  'company-management': 'companies',
  'workers-management': 'employees',
  analysis: 'reporting',
  'employer-portal': 'employer-portal',
  administration: 'settings',
}

function parseRoute(hash: string, currentRole: string) {
  const cleanHash = (hash || '').startsWith('#') ? (hash || '').slice(1) : (hash || '')
  if (!cleanHash || cleanHash === '/') {
    return {
      area: currentRole === 'Doctor' ? 'health-surveillance' : 'company-management',
      moduleKey: currentRole === 'Doctor' ? 'dashboard' : 'companies',
      employeeId: null,
      searchOpen: false,
    }
  }

  const [pathPart, queryPart] = cleanHash.split('?')
  const queryParams = new URLSearchParams(queryPart || '')
  const segments = (pathPart || '').split('/').filter(Boolean)

  let area = ''
  let moduleKey = ''

  if (segments.length >= 2) {
    area = segments[0]
    moduleKey = segments[1]
  } else if (segments.length === 1) {
    const single = segments[0]
    if (AREA_MODULE_KEYS[single]) {
      area = single
      moduleKey = AREA_DEFAULT_MODULE[single] || 'companies'
    } else {
      moduleKey = single
      area = Object.entries(AREA_MODULE_KEYS).find(([, keys]) => keys.includes(single))?.[0] || ''
    }
  }

  // Resolve legacy aliases
  if (LEGACY_MODULE_ALIASES[moduleKey]) {
    moduleKey = LEGACY_MODULE_ALIASES[moduleKey]
  }

  // Fallbacks if not resolved
  if (!area || !AREA_MODULE_KEYS[area]) {
    const owning = Object.entries(AREA_MODULE_KEYS).find(([, keys]) => keys.includes(moduleKey))?.[0]
    if (owning) {
      area = owning
    } else {
      area = currentRole === 'Doctor' ? 'health-surveillance' : 'company-management'
    }
  }

  if (!moduleKey || !MODULE_ITEMS.some((m) => m.key === moduleKey)) {
    moduleKey = AREA_DEFAULT_MODULE[area] || (currentRole === 'Doctor' ? 'dashboard' : 'companies')
  }

  const employeeId = queryParams.get('employeeId') || null
  const searchOpen = queryParams.get('search') === 'true' || queryParams.get('search') === '1'

  return { area, moduleKey, employeeId, searchOpen }
}

function buildRouteHash(area: string, moduleKey: string, params: Record<string, string | null | undefined> = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      searchParams.set(key, String(val))
    }
  })
  const qs = searchParams.toString()
  return `#/${area}/${moduleKey}${qs ? '?' + qs : ''}`
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || '')
  const [role, setRole] = useState(() => localStorage.getItem('role') || '')

  const initialRoute = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return parseRoute(window.location.hash, role)
    }
    return null
  }, [role])

  const [selectedArea, setSelectedArea] = useState(() => initialRoute?.area || (role === 'Doctor' ? 'health-surveillance' : 'company-management'))
  const [selectedModuleKey, setSelectedModuleKey] = useState(() => initialRoute?.moduleKey || (role === 'Doctor' ? 'dashboard' : 'companies'))
  const [quickCreateRequest, setQuickCreateRequest] = useState(null)
  const [selectedEmployeeIdForVisit, setSelectedEmployeeIdForVisit] = useState<string | null>(() => initialRoute?.employeeId || null)
  const [activeCompanyId, setActiveCompanyId] = useState(() => readActiveCompanyFromSettings())
  const [activeBranchId, setActiveBranchId] = useState(() => readActiveBranchFromSettings())
  const [companiesList, setCompaniesList] = useState<any[]>([])
  const [branchesList, setBranchesList] = useState<any[]>([])

  const isAuthenticated = useMemo(() => token && (role === 'Doctor' || role === 'Admin'), [token, role])

  const updateRouteHash = (nextArea: string, nextModuleKey: string, params: Record<string, string | null | undefined> = {}, replace = false) => {
    if (typeof window === 'undefined') return
    const targetHash = buildRouteHash(nextArea, nextModuleKey, params)
    if (window.location.hash !== targetHash) {
      if (replace) {
        window.history.replaceState(null, '', targetHash)
      } else {
        window.location.hash = targetHash
      }
    }
  }

  // Sincronizzazione automatica della cronologia del browser (Tasti Indietro / Avanti, Popstate, Deep links)
  useEffect(() => {
    if (!isAuthenticated) return

    const syncFromHash = () => {
      const route = parseRoute(window.location.hash, role)
      setSelectedArea(route.area)
      setSelectedModuleKey(route.moduleKey)
      setSelectedEmployeeIdForVisit(route.employeeId)
      if (route.searchOpen) setSearchOpen(true)
    }

    if (window.location.hash) {
      syncFromHash()
    } else {
      const initialArea = role === 'Doctor' ? 'health-surveillance' : 'company-management'
      const initialModule = role === 'Doctor' ? 'dashboard' : 'companies'
      updateRouteHash(initialArea, initialModule, {}, true)
    }

    window.addEventListener('hashchange', syncFromHash)
    window.addEventListener('popstate', syncFromHash)

    return () => {
      window.removeEventListener('hashchange', syncFromHash)
      window.removeEventListener('popstate', syncFromHash)
    }
  }, [isAuthenticated, role])

  useEffect(() => {
    if (!isAuthenticated) return

    apiGet('/api/master-data/companies')
      .then((data) => {
        if (Array.isArray(data)) {
          setCompaniesList(data)
          if (data.length > 0) {
            setActiveCompanyId((current) => {
              if (current && data.some((c) => String(c.id) === String(current))) {
                return current
              }
              const defaultCompanyId = String(data[0].id)
              try {
                const existing = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}')
                localStorage.setItem(
                  SETTINGS_STORAGE_KEY,
                  JSON.stringify({ ...existing, activeCompanyId: defaultCompanyId })
                )
              } catch {}
              return defaultCompanyId
            })
          }
        }
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

    apiGet('/api/master-data/branches')
      .then((data) => {
        if (Array.isArray(data)) setBranchesList(data)
      })
      .catch(() => setBranchesList([]))
  }, [isAuthenticated])

  const companyBranches = useMemo(() => {
    if (!activeCompanyId) return []
    return branchesList.filter((b) => Number(b.companyId) === Number(activeCompanyId))
  }, [branchesList, activeCompanyId])

  const activeCompanyName = useMemo(() => {
    if (!activeCompanyId) return ''
    const c = companiesList.find((item) => String(item.id) === String(activeCompanyId))
    return c?.name || c?.ragioneSociale || `Azienda #${activeCompanyId}`
  }, [companiesList, activeCompanyId])

  const activeBranchName = useMemo(() => {
    if (!activeBranchId) return ''
    const b = branchesList.find((item) => String(item.id) === String(activeBranchId))
    return b?.name || b?.address || `Sede #${activeBranchId}`
  }, [branchesList, activeBranchId])

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

  // Global auth expiration listener — reset invalid session on 401
  useEffect(() => {
    const handleAuthExpired = () => {
      setToken('')
      setRole('')
      setSearchOpen(false)
    }
    window.addEventListener('medwork:auth-expired', handleAuthExpired)
    return () => window.removeEventListener('medwork:auth-expired', handleAuthExpired)
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
      'medical-visit-stepper',
      'cartella-sanitaria',
      'giudizio-idoneita',
      'agenda-planning',
      'appointments-calendar',
      'schedules',
      'recall-campaigns',
      'vaccination-deadlines',
      'site-visits',
      'firma-grafometrica',
      'companies',
      'company-groups-workspace',
      'company-contacts',
      'protocols',
      'branches',
      'departments',
      'work-locations',
      'employees',
      'employee-risks',
      'reporting',
      'compliance',
      'allegato-3b',
      'analytics',
      'audit',
      'tools',
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
    const initialArea = userRole === 'Doctor' ? 'health-surveillance' : 'company-management'
    const initialModule = userRole === 'Doctor' ? 'dashboard' : 'companies'
    setSelectedArea(initialArea)
    setSelectedModuleKey(initialModule)
    setSelectedEmployeeIdForVisit(null)
    updateRouteHash(initialArea, initialModule, {}, true)

    apiGet('/api/master-data/companies')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const defaultCompanyId = String(data[0].id)
          setActiveCompanyId(defaultCompanyId)
          try {
            const existing = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}')
            localStorage.setItem(
              SETTINGS_STORAGE_KEY,
              JSON.stringify({ ...existing, activeCompanyId: defaultCompanyId })
            )
          } catch {}
        }
      })
      .catch(() => {})
    appendAuditEvent({ module: 'Auth', action: 'Login', detail: userRole })
  }

  const handleLogout = () => {
    setSearchOpen(false)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('role')
    setToken('')
    setRole('')
    setSelectedArea('company-management')
    setSelectedModuleKey('companies')
    setQuickCreateRequest(null)
    setSelectedEmployeeIdForVisit(null)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname)
    }
    appendAuditEvent({ module: 'Auth', action: 'Logout', detail: role || '-' })
  }

  const handleQuickCreateConsumed = () => {
    setQuickCreateRequest(null)
  }

  const handleAreaNavigation = (nextArea) => {
    const nextModule = AREA_DEFAULT_MODULE[nextArea] || 'companies'
    setSelectedArea(nextArea)
    setSelectedModuleKey(nextModule)
    setSelectedEmployeeIdForVisit(null)
    updateRouteHash(nextArea, nextModule, { employeeId: null })
    appendAuditEvent({ module: 'Navigation', action: 'Open', detail: nextArea })
  }

  const handleModuleNavigation = (targetKey, extraParams = {}) => {
    const resolvedKey = MODULE_ITEMS.some((item) => item.key === targetKey)
      ? targetKey
      : LEGACY_MODULE_ALIASES[targetKey]
    if (!resolvedKey || !MODULE_ITEMS.some((item) => item.key === resolvedKey)) return

    const owningArea = Object.entries(AREA_MODULE_KEYS).find(([, keys]) => keys.includes(resolvedKey))?.[0] || selectedArea
    setSelectedArea(owningArea)
    setSelectedModuleKey(resolvedKey)
    const empId = extraParams.employeeId !== undefined ? extraParams.employeeId : null
    setSelectedEmployeeIdForVisit(empId)
    updateRouteHash(owningArea, resolvedKey, { employeeId: empId })
    appendAuditEvent({ module: 'Navigation', action: 'Open', detail: resolvedKey })
  }

  const handleSettingsChange = (nextSettings) => {
    setActiveCompanyId(nextSettings?.activeCompanyId || '')
    setActiveBranchId(nextSettings?.activeBranchId || '')
  }

  const handleCompanyContextSwitch = (newCompanyId) => {
    setActiveCompanyId(newCompanyId)
    setActiveBranchId('')
    try {
      const existing = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}')
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ ...existing, activeCompanyId: newCompanyId, activeBranchId: '' })
      )
    } catch {}
    appendAuditEvent({ module: 'Context', action: 'SwitchCompany', detail: newCompanyId || 'Global' })
  }

  const handleBranchContextSwitch = (newBranchId) => {
    setActiveBranchId(newBranchId)
    try {
      const existing = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}')
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ ...existing, activeBranchId: newBranchId })
      )
    } catch {}
    appendAuditEvent({ module: 'Context', action: 'SwitchBranch', detail: newBranchId || 'AllBranches' })
  }

  // Centri reintegrati: moduli standalone con propagazione contesto attivo
  const REINTEGRATED_MODULES = {
    'giudizio-idoneita': () => <GiudizioIdoneitaCenter activeCompanyId={activeCompanyId} activeBranchId={activeBranchId} />,
    'cartella-sanitaria': () => <CartellaSanitariaCenter activeCompanyId={activeCompanyId} employeeId={selectedEmployeeIdForVisit} />,
    'firma-grafometrica': () => <FirmaGrafometricaCenter />,
    compliance: () => <ComplianceCenter activeCompanyId={activeCompanyId} onNavigateModule={handleModuleNavigation} />,
    'allegato-3b': () => <Allegato3BCenter activeCompanyId={activeCompanyId} />,
    analytics: () => <AnalyticsCenter activeCompanyId={activeCompanyId} />,
    agenda: () => <AgendaCenter activeCompanyId={activeCompanyId} />,
    appointments: () => <AppointmentsCenter activeCompanyId={activeCompanyId} />,
    'recall-campaigns': () => <RecallCampaignsCenter activeCompanyId={activeCompanyId} />,
    'activity-deadlines': () => <ActivityDeadlinesCenter activeCompanyId={activeCompanyId} />,
    nominations: () => <NominationsDeadlinesCenter activeCompanyId={activeCompanyId} />,
    'vaccination-deadlines': () => <VaccinationDeadlinesCenter activeCompanyId={activeCompanyId} />,
    'alert-multicanale': () => <AlertMulticanaleCenter />,
    'company-groups-workspace': () => <CompanyGroupsCenter />,
    'medical-staff': () => <MedicalStaffCenter />,
    migration: () => <MigrationCenter />,
    questionnaires: () => <QuestionnairesCenter />,
    'employer-portal': () => <EmployerPortalView companyId={activeCompanyId} />,
  }

  const renderModuleContent = (moduleKey) => {
    if (REINTEGRATED_MODULES[moduleKey]) return REINTEGRATED_MODULES[moduleKey]()

    if (moduleKey === 'dashboard') {
      return (
        <Dashboard
          activeCompanyId={activeCompanyId}
          onNavigateModule={handleModuleNavigation}
          onOpenMedicalVisitCreate={(employeeId) => {
            handleModuleNavigation('medical-visit-stepper', { employeeId: employeeId ? String(employeeId) : null })
          }}
        />
      )
    }

    if (moduleKey === 'medical-dashboard') {
      return (
        <DashboardMedico
          activeCompanyId={activeCompanyId}
          activeBranchId={activeBranchId}
          onNewVisit={(employeeId) => {
            handleModuleNavigation('medical-visit-stepper', { employeeId: employeeId ? String(employeeId) : null })
          }}
        />
      )
    }

    if (moduleKey === 'home') {
      return (
        <DashboardScadenze
          activeCompanyId={activeCompanyId}
          activeBranchId={activeBranchId}
          onOpenMedicalVisitCreate={() => handleModuleNavigation('medical-visit-stepper')}
          onOpenEmployeeCreate={() => {
            handleAreaNavigation('workers-management')
          }}
          onOpenReports={() => handleModuleNavigation('reporting')}
        />
      )
    }

    if (moduleKey === 'companies') {
      return (
        <CrudEntityView
          config={ENTITY_BY_KEY.companies}
          currentRole={role}
          activeCompanyId={activeCompanyId}
          activeBranchId={activeBranchId}
          externalCreateToken={0}
          onExternalCreateConsumed={handleQuickCreateConsumed}
        />
      )
    }

    if (moduleKey === 'employees' || moduleKey === 'employees-crud') {
      return (
        <WorkersCenter
          activeCompanyId={activeCompanyId}
          activeBranchId={activeBranchId}
          onOpenMedicalVisitCreate={(employeeId) => {
            handleModuleNavigation('medical-visit-stepper', { employeeId: employeeId ? String(employeeId) : null })
          }}
          onOpenEmployeeProfile={(emp) => {
            handleModuleNavigation('cartella-sanitaria', { employeeId: emp?.id ? String(emp.id) : null })
          }}
        />
      )
    }

    if (moduleKey === 'protocols') {
      return <ProtocolsCenter activeCompanyId={activeCompanyId} />
    }

    if (moduleKey === 'agenda-planning' || moduleKey === 'appointments-calendar' || moduleKey === 'schedules') {
      return (
        <AgendaPlanningCenter
          activeCompanyId={activeCompanyId}
          activeBranchId={activeBranchId}
          initialTab={moduleKey === 'schedules' ? 'planning' : 'calendar'}
          onOpenMedicalVisitCreate={(employeeId) => {
            handleModuleNavigation('medical-visit-stepper', { employeeId: employeeId ? String(employeeId) : null })
          }}
        />
      )
    }

    if (moduleKey === 'medical-visit-stepper') {
      return (
        <MedicalVisitStepper
          activeCompanyId={activeCompanyId}
          activeBranchId={activeBranchId}
          initialEmployeeId={selectedEmployeeIdForVisit}
          onCreated={() => {
            handleModuleNavigation('cartella-sanitaria', { employeeId: selectedEmployeeIdForVisit })
          }}
        />
      )
    }

    if (moduleKey === 'billing') {
      return <BillingCenter activeCompanyId={activeCompanyId} />
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
      return <ReportsCenter activeCompanyId={activeCompanyId} activeBranchId={activeBranchId} />
    }

    const moduleItem = roleAwareModules.find((item) => item.key === moduleKey)
    const currentEntityConfig = moduleItem?.entityKey ? ENTITY_BY_KEY[moduleItem.entityKey] : null

    if (currentEntityConfig) {
      return (
        <CrudEntityView
          config={currentEntityConfig}
          currentRole={role}
          activeCompanyId={activeCompanyId}
          activeBranchId={activeBranchId}
          externalCreateToken={quickCreateRequest?.entityKey === currentEntityConfig?.key ? quickCreateRequest.token : 0}
          onExternalCreateConsumed={handleQuickCreateConsumed}
        />
      )
    }

    return <Typography variant="body2">Modulo non disponibile per il ruolo corrente.</Typography>
  }

  const renderWorkspaceContent = () => {
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  🏢 Azienda:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 210 }}>
                  <Select
                    value={activeCompanyId || ''}
                    onChange={(e) => handleCompanyContextSwitch(e.target.value)}
                    displayEmpty
                    sx={{
                      height: 30,
                      color: '#ffffff',
                      bgcolor: activeCompanyId ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                      fontSize: '12px',
                      borderRadius: 1.5,
                      fontWeight: activeCompanyId ? 600 : 400,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: activeCompanyId ? '#60a5fa' : 'rgba(255, 255, 255, 0.2)' },
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

                {activeCompanyId && companyBranches.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      value={activeBranchId || ''}
                      onChange={(e) => handleBranchContextSwitch(e.target.value)}
                      displayEmpty
                      sx={{
                        height: 30,
                        color: '#ffffff',
                        bgcolor: activeBranchId ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                        fontSize: '12px',
                        borderRadius: 1.5,
                        fontWeight: activeBranchId ? 600 : 400,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: activeBranchId ? '#34d399' : 'rgba(255, 255, 255, 0.2)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6ee7b7' },
                        '& .MuiSvgIcon-root': { color: '#ffffff' },
                      }}
                    >
                      <MenuItem value="">
                        <em>📍 Tutte le Sedi</em>
                      </MenuItem>
                      {companyBranches.map((b) => (
                        <MenuItem key={b.id} value={String(b.id)}>
                          {b.name || b.address || `Sede #${b.id}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
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
                {/* PERSISTENT CLINICAL CONTEXT BANNER */}
                <Box
                  sx={{
                    px: 3,
                    py: 1,
                    bgcolor: activeCompanyId ? '#0f172a' : '#f8fafc',
                    color: activeCompanyId ? '#f8fafc' : '#475569',
                    borderBottom: '1px solid',
                    borderColor: activeCompanyId ? 'rgba(59, 130, 246, 0.3)' : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                    {activeCompanyId ? (
                      <>
                        <Chip
                          icon={<BusinessIcon sx={{ fontSize: 16, color: '#93c5fd !important' }} />}
                          label={`Azienda Attiva: ${activeCompanyName}`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(59, 130, 246, 0.2)',
                            color: '#93c5fd',
                            fontWeight: 700,
                            fontSize: '12px',
                            border: '1px solid rgba(147, 197, 253, 0.3)',
                          }}
                        />
                        {activeBranchName ? (
                          <Chip
                            label={`📍 Sede: ${activeBranchName}`}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(16, 185, 129, 0.2)',
                              color: '#6ee7b7',
                              fontWeight: 600,
                              fontSize: '11px',
                              border: '1px solid rgba(110, 231, 183, 0.3)',
                            }}
                          />
                        ) : (
                          <Chip
                            label="📍 Tutte le Sedi"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                              color: '#cbd5e1',
                              fontSize: '11px',
                            }}
                          />
                        )}
                        <Typography variant="caption" sx={{ color: '#94a3b8', ml: 1, display: { xs: 'none', lg: 'inline' } }}>
                          ⚡ Contesto clinico attivo: viste filtrate su lavoratori, visite, giudizi, cartelle e scadenze.
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Chip
                          label="🌐 Vista Globale (Tutte le Aziende)"
                          size="small"
                          sx={{
                            bgcolor: '#e2e8f0',
                            color: '#334155',
                            fontWeight: 700,
                            fontSize: '11px',
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Seleziona un'azienda nel selettore in alto per isolare il contesto operativo della sessione.
                        </Typography>
                      </>
                    )}
                  </Stack>

                  {activeCompanyId && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => handleCompanyContextSwitch('')}
                      sx={{
                        color: '#94a3b8',
                        textTransform: 'none',
                        fontSize: '11px',
                        py: 0.2,
                        '&:hover': { color: '#f8fafc', bgcolor: 'rgba(255,255,255,0.08)' },
                      }}
                    >
                      ✖ Torna a Vista Globale
                    </Button>
                  )}
                </Box>

                <Box className="legacy-content-wrapper">
                  {/* BREADCRUMB & CONTEXT LINE */}
                  <Box className="legacy-context-line" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, py: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      {/* BROWSER BACK / FORWARD SHORTCUT BUTTONS */}
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mr: 0.5 }}>
                        <Tooltip title="Torna Indietro nella cronologia (Alt + Freccia Sinistra)">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => window.history.back()}
                              aria-label="Torna indietro"
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: 1.5,
                                color: '#475569',
                                '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a', borderColor: '#94a3b8' },
                              }}
                            >
                              <ArrowBackIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Vai Avanti nella cronologia (Alt + Freccia Destra)">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => window.history.forward()}
                              aria-label="Vai avanti"
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: 1.5,
                                color: '#475569',
                                '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a', borderColor: '#94a3b8' },
                              }}
                            >
                              <ArrowForwardIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>

                      {/* CLICKABLE BREADCRUMBS */}
                      <Typography
                        component="span"
                        role="link"
                        tabIndex={0}
                        onClick={() => handleAreaNavigation(selectedArea)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleAreaNavigation(selectedArea)
                          }
                        }}
                        sx={{
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '12px',
                          color: '#475569',
                          borderRadius: 1,
                          p: 0.5,
                          outline: 'none',
                          '&:hover, &:focus-visible': { color: '#1d4ed8', bgcolor: 'rgba(37, 99, 235, 0.08)' },
                        }}
                      >
                        {currentAreaLabel}
                      </Typography>

                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        /
                      </Typography>

                      <Typography
                        component="span"
                        role="link"
                        tabIndex={0}
                        onClick={() => handleModuleNavigation(selectedModuleKey)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleModuleNavigation(selectedModuleKey)
                          }
                        }}
                        sx={{
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '12px',
                          color: '#0f1f3d',
                          borderRadius: 1,
                          p: 0.5,
                          outline: 'none',
                          '&:hover, &:focus-visible': { color: '#1d4ed8', bgcolor: 'rgba(37, 99, 235, 0.08)' },
                        }}
                      >
                        {currentModuleLabel}
                      </Typography>

                      {selectedEmployeeIdForVisit && (
                        <>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            /
                          </Typography>
                          <Chip
                            size="small"
                            label={`Lavoratore #${selectedEmployeeIdForVisit}`}
                            color="primary"
                            variant="outlined"
                            onDelete={() => {
                              setSelectedEmployeeIdForVisit(null)
                              updateRouteHash(selectedArea, selectedModuleKey, { employeeId: null })
                            }}
                            sx={{ height: 22, fontSize: '11px', fontWeight: 600 }}
                          />
                        </>
                      )}
                    </Stack>

                    {/* RIGHT SIDE QUICK ACTIONS & SESSION INFO */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      {selectedEmployeeIdForVisit && (selectedModuleKey === 'cartella-sanitaria' || selectedModuleKey === 'medical-visit-stepper') && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ArrowBackIcon sx={{ fontSize: 13 }} />}
                          onClick={() => {
                            setSelectedEmployeeIdForVisit(null)
                            handleModuleNavigation('employees')
                          }}
                          sx={{
                            height: 24,
                            fontSize: '11px',
                            textTransform: 'none',
                            py: 0,
                            px: 1,
                            borderColor: '#93c5fd',
                            color: '#1d4ed8',
                            bgcolor: '#eff6ff',
                            fontWeight: 600,
                            borderRadius: 1.5,
                            '&:hover': { bgcolor: '#dbeafe', borderColor: '#3b82f6' },
                          }}
                        >
                          Torna a Elenco Lavoratori
                        </Button>
                      )}

                      <Typography variant="caption" color="text.secondary">
                        Sessione: {role}
                      </Typography>
                      {activeCompanyId && (
                        <Chip
                          size="small"
                          label={`ID Azienda: #${activeCompanyId}`}
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
                          onClick={() => handleModuleNavigation(item.key)}
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
            handleModuleNavigation('cartella-sanitaria', { employeeId: worker?.id ? String(worker.id) : null })
          }}
          onSelectCompany={(company) => {
            if (company?.id) handleCompanyContextSwitch(String(company.id))
            handleModuleNavigation('companies')
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

