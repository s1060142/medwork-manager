import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import HomeIcon from '@mui/icons-material/Home'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import BusinessIcon from '@mui/icons-material/Business'
import BadgeIcon from '@mui/icons-material/Badge'
import AssessmentIcon from '@mui/icons-material/Assessment'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import EventIcon from '@mui/icons-material/Event'
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import LogoutIcon from '@mui/icons-material/Logout'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import SearchIcon from '@mui/icons-material/Search'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import CrudEntityView from './components/CrudEntityView'
import LoginCard from './components/LoginCard'
import ContextSelector from './components/ContextSelector'
import ContextSwitcher from './components/ContextSwitcher'
import HomeDashboard from './components/HomeDashboard'
import { ENTITY_CONFIGS } from './constants/entityConfigs'
import { appendAuditEvent } from './utils/auditTrail'
import { apiGet, apiSend } from './services/apiClient'
import './App.css'

// Code splitting: i moduli pesanti sono caricati on-demand
const DashboardScadenze = lazy(() => import('./components/DashboardScadenze'))
const ReportsCenter = lazy(() => import('./components/ReportsCenter'))
const AppointmentsCalendar = lazy(() => import('./components/AppointmentsCalendar'))
const ProtocolsCenter = lazy(() => import('./components/ProtocolsCenter'))
const AuditCenter = lazy(() => import('./components/AuditCenter'))
const ToolsCenter = lazy(() => import('./components/ToolsCenter'))
const SettingsCenter = lazy(() => import('./components/SettingsCenter'))
const UserManagement = lazy(() => import('./components/UserManagement'))
const VisitPlanningCenter = lazy(() => import('./components/VisitPlanningCenter'))
const MedicalVisitStepper = lazy(() => import('./components/MedicalVisitStepper'))
const WorkersCenter = lazy(() => import('./components/WorkersCenter'))
const WorkerPortal = lazy(() => import('./components/WorkerPortal'))
const CompanyPortal = lazy(() => import('./components/CompanyPortal'))
const Allegato3B = lazy(() => import('./components/Allegato3B'))
const ConvocazioniCenter = lazy(() => import('./components/ConvocazioniCenter'))

const ModuleFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
    <CircularProgress />
  </Box>
)

const SETTINGS_STORAGE_KEY = 'medwork.runtime.settings'

function readWorkContextFromSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}')
    return {
      activeCompanyId: parsed.activeCompanyId || '',
      activeBranchId: parsed.activeBranchId || '',
    }
  } catch {
    return {
      activeCompanyId: '',
      activeBranchId: '',
    }
  }
}

function persistWorkContextToSettings(activeCompanyId, activeBranchId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}')
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        activeCompanyId: activeCompanyId || '',
        activeBranchId: activeBranchId || '',
      }),
    )
  } catch {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        activeCompanyId: activeCompanyId || '',
        activeBranchId: activeBranchId || '',
      }),
    )
  }
}

const ENTITY_BY_KEY = Object.fromEntries(ENTITY_CONFIGS.map((item) => [item.key, item]))

const SIDE_NAV_ITEMS = [
  { key: 'company-management', label: 'Gestione aziende', icon: BusinessIcon },
  { key: 'workers-management', label: 'Gestione lavoratori', icon: BadgeIcon },
  { key: 'analysis', label: 'Analisi e relazioni', icon: AssessmentIcon },
  { key: 'health-surveillance', label: 'Sorveglianza sanitaria', icon: HealthAndSafetyIcon },
  { key: 'schedule', label: 'Scadenzario', icon: EventIcon },
  { key: 'administration', label: 'Amministrazione', icon: SettingsApplicationsIcon },
]

const COMPANY_TABS = [
  { key: 'groups', label: 'Gruppi aziendali' },
  { key: 'registry', label: 'Anagrafica' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'activities', label: 'Attivita' },
]

const COMPANY_TAB_TO_MODULE = {
  groups: 'companies',
  registry: 'employees',
  checklist: 'protocols',
  activities: 'schedules',
}

const MODULE_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'companies', label: 'Aziende', entityKey: 'companies' },
  { key: 'company-groups', label: 'Gruppi Aziendali', entityKey: 'company-groups' },
  { key: 'company-contacts', label: 'Figure Aziendali', entityKey: 'company-contacts' },
  { key: 'employees', label: 'Lavoratori' },
  { key: 'protocols', label: 'Protocolli' },
  { key: 'protocols-registry', label: 'Registro protocolli', entityKey: 'protocols-registry' },
  { key: 'personal-protocols', label: 'Protocolli personali', entityKey: 'personal-protocols' },
  { key: 'schedules', label: 'Scadenze e agende' },
  { key: 'medical-visit-stepper', label: 'Nuova visita (step)' },
  { key: 'appointments-calendar', label: 'Calendario visite' },
  { key: 'billing', label: 'Fatturazione' },
  { key: 'audit', label: 'Audit trail' },
  { key: 'exam-types', label: 'Cataloghi', entityKey: 'exam-types' },
  { key: 'job-roles', label: 'Mansioni', entityKey: 'job-roles' },
  { key: 'tools', label: 'Strumenti' },
  { key: 'settings', label: 'Impostazioni' },
  { key: 'reporting', label: 'Statistiche e report' },
  { key: 'branches', label: 'Sedi', entityKey: 'branches' },
  { key: 'departments', label: 'Reparti', entityKey: 'departments' },
  { key: 'work-locations', label: 'Luoghi di Lavoro', entityKey: 'work-locations' },
  { key: 'risk-factors', label: 'Fattori di rischio', entityKey: 'risk-factors' },
  { key: 'employee-risks', label: 'Rischi dipendente', entityKey: 'employee-risks' },
  { key: 'medical-records', label: 'Cartelle sanitarie', entityKey: 'medical-records' },
  { key: 'medical-visits', label: 'Visite mediche', entityKey: 'medical-visits' },
  { key: 'anamneses', label: 'Anamnesi guidata', entityKey: 'anamneses' },
  { key: 'visit-exams', label: 'Esami visita', entityKey: 'visit-exams' },
  { key: 'scheduled-exams', label: 'Accertamenti', entityKey: 'scheduled-exams' },
  { key: 'site-visits', label: 'Sopralluoghi', entityKey: 'site-visits' },
  { key: 'vaccinations', label: 'Vaccinazioni', entityKey: 'vaccinations' },
  { key: 'doctor-availabilities', label: 'Disponibilita medici', entityKey: 'doctor-availabilities' },
  { key: 'notification-logs', label: 'Log notifiche', entityKey: 'notification-logs' },
  { key: 'convocazioni', label: 'Convocazioni' },
  { key: 'worker-portal', label: 'Portale Lavoratori' },
  { key: 'company-portal', label: 'Portale Aziende' },
  { key: 'allegato-3b', label: 'Allegato 3B' },
  { key: 'user-management', label: 'Gestione utenti' },
]

const AREA_MODULE_KEYS = {
  'company-management': ['companies', 'company-groups', 'company-contacts', 'protocols', 'schedules', 'branches', 'departments', 'work-locations'],
  'workers-management': ['employees', 'employee-risks', 'medical-records', 'medical-visits'],
  analysis: ['reporting', 'audit', 'allegato-3b'],
  'health-surveillance': ['medical-visit-stepper', 'appointments-calendar', 'anamneses', 'scheduled-exams', 'vaccinations', 'visit-exams', 'site-visits'],
  schedule: ['schedules', 'doctor-availabilities', 'notification-logs'],
  'portals': ['worker-portal', 'company-portal'],
  administration: ['billing', 'tools', 'settings', 'exam-types', 'job-roles', 'risk-factors', 'protocols-registry', 'personal-protocols', 'user-management'],
}

const AREA_DEFAULT_MODULE = {
  'company-management': 'companies',
  'workers-management': 'employees',
  analysis: 'reporting',
  'health-surveillance': 'medical-visit-stepper',
  schedule: 'schedules',
  portals: 'worker-portal',
  administration: 'settings',
}

// Hierarchical nav structure for sidebar
const HIERARCHICAL_SIDE_NAV = [
  {
    key: 'company-management',
    label: 'Gestione aziende',
    icon: BusinessIcon,
    children: ['companies', 'company-groups', 'company-contacts', 'protocols', 'schedules', 'branches', 'departments', 'work-locations'],
  },
  {
    key: 'workers-management',
    label: 'Gestione lavoratori',
    icon: BadgeIcon,
    children: ['employees', 'employee-risks', 'medical-records', 'medical-visits'],
  },
  {
    key: 'analysis',
    label: 'Analisi e relazioni',
    icon: AssessmentIcon,
    children: ['reporting', 'audit'],
  },
  {
    key: 'health-surveillance',
    label: 'Sorveglianza sanitaria',
    icon: HealthAndSafetyIcon,
    children: ['medical-visit-stepper', 'appointments-calendar', 'anamneses', 'scheduled-exams', 'vaccinations', 'visit-exams', 'site-visits'],
  },
  {
    key: 'schedule',
    label: 'Scadenzario e convocazioni',
    icon: EventIcon,
    children: ['schedules', 'convocazioni', 'doctor-availabilities', 'notification-logs'],
  },
  {
    key: 'portals',
    label: 'Portali (Lavoratori/Aziende)',
    icon: BadgeIcon,
    children: ['worker-portal', 'company-portal'],
  },
  {
    key: 'administration',
    label: 'Amministrazione',
    icon: SettingsApplicationsIcon,
    children: ['billing', 'tools', 'settings', 'exam-types', 'job-roles', 'risk-factors', 'protocols-registry', 'personal-protocols', 'user-management'],
  },
]

function App() {
  const storedWorkContext = useMemo(() => readWorkContextFromSettings(), [])
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || '')
  const [role, setRole] = useState(() => localStorage.getItem('role') || '')
  const [selectedArea, setSelectedArea] = useState('company-management')
  const [selectedCompanyTab, setSelectedCompanyTab] = useState('groups')
  const [selectedModuleKey, setSelectedModuleKey] = useState('companies')
  const [quickCreateRequest, setQuickCreateRequest] = useState(null)
  const [activeCompanyId, setActiveCompanyId] = useState(storedWorkContext.activeCompanyId)
  const [activeBranchId, setActiveBranchId] = useState(storedWorkContext.activeBranchId)
  const [workCompanies, setWorkCompanies] = useState([])
  const [workBranches, setWorkBranches] = useState([])
  const [expandedAreas, setExpandedAreas] = useState(new Set(['company-management']))
  const [needsContext, setNeedsContext] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [username, setUsername] = useState('')

  const toggleAreaExpanded = (areaKey) => {
    const newExpanded = new Set(expandedAreas)
    if (newExpanded.has(areaKey)) {
      newExpanded.delete(areaKey)
    } else {
      newExpanded.add(areaKey)
    }
    setExpandedAreas(newExpanded)
  }

  const isAuthenticated = useMemo(
    () => token && ['Doctor', 'Admin', 'Worker', 'Employer', 'Rspp', 'Secretary'].includes(role),
    [token, role],
  )

  useEffect(() => {
    if (!isAuthenticated) return

    Promise.all([
      apiGet('/api/master-data/companies'),
      apiGet('/api/master-data/branches'),
    ])
      .then(([companiesData, branchesData]) => {
        setWorkCompanies(Array.isArray(companiesData) ? companiesData : [])
        setWorkBranches(Array.isArray(branchesData) ? branchesData : [])
      })
      .catch((error) => {
        if (error?.status === 401) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('role')
          setToken('')
          setRole('')
          setSelectedArea('company-management')
          setSelectedModuleKey('companies')
          return
        }

        setWorkCompanies([])
        setWorkBranches([])
      })
  }, [isAuthenticated])

  const roleAwareSideMenu = useMemo(() => {
    if (role === 'Admin') return HIERARCHICAL_SIDE_NAV
    if (role === 'Worker') {
      // Il lavoratore vede solo il proprio fascicolo (Portale Lavoratori)
      return [{ key: 'portals', label: 'Il mio fascicolo', icon: BadgeIcon, children: ['worker-portal'] }]
    }
    if (role === 'Employer' || role === 'Rspp') {
      // Datore/RSPP: portale aziendale + report aggregati
      return [
        { key: 'portals', label: 'Portale Aziende', icon: BadgeIcon, children: ['company-portal'] },
        { key: 'analysis', label: 'Analisi e relazioni', icon: AssessmentIcon, children: ['allegato-3b', 'reporting'] },
      ]
    }
    return HIERARCHICAL_SIDE_NAV.filter((item) => item.key !== 'administration')
  }, [role])

  const roleAwareModules = useMemo(() => {
    if (role === 'Admin') return MODULE_ITEMS

    const doctorAllowed = new Set([
      'home',
      'employees',
      'protocols',
      'protocols-registry',
      'personal-protocols',
      'schedules',
      'medical-visit-stepper',
      'appointments-calendar',
      'anamneses',
      'scheduled-exams',
      'vaccinations',
      'doctor-availabilities',
      'notification-logs',
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
    appendAuditEvent({ module: 'Auth', action: 'Login', detail: userRole })

    // Fetch username from token payload or use the username from localStorage
    // The token already has the username in the 'sub' claim
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      setUsername(payload.sub || payload.name || 'Utente');
    } catch {
      setUsername('Utente');
    }

    // Se non c'è un contesto salvato, mostra il selettore post-login.
    const savedCompany = localStorage.getItem('activeCompanyId')
    const savedSite = localStorage.getItem('activeBranchId')
    if (!savedCompany) {
      setNeedsContext(true)
    } else {
      setActiveCompanyId(savedCompany)
      setActiveBranchId(savedSite || '')
      // Aggiorna eventuale token con il contesto salvato.
      apiSend('POST', '/api/auth/select-context', savedSite
        ? { contextId: Number(savedSite), contextType: 'Branch' }
        : { contextId: Number(savedCompany), contextType: 'Company' })
        .then((data) => { if (data?.accessToken) localStorage.setItem('accessToken', data.accessToken) })
        .catch(() => {})
    }
  }

  const handleContextChanged = (context, newToken) => {
    try {
      const companyId = context?.type === 'Company'
        ? String(context.id)
        : String(context?.parentId || '')
      const branchId = context?.type === 'Branch' ? String(context.id) : ''
      setActiveCompanyId(companyId)
      setActiveBranchId(branchId)
      if (newToken) setToken(newToken)
      // Ricarica le anagrafiche e resetta la vista sul nuovo contesto.
      Promise.all([
        apiGet('/api/master-data/companies'),
        apiGet('/api/master-data/branches'),
      ])
        .then(([companiesData, branchesData]) => {
          setWorkCompanies(Array.isArray(companiesData) ? companiesData : [])
          setWorkBranches(Array.isArray(branchesData) ? branchesData : [])
        })
        .catch(() => {})
      setSelectedArea('schedule')
      setSelectedModuleKey('home')
      setExpandedAreas(new Set(['schedule']))
      appendAuditEvent({ module: 'Context', action: 'Switch', detail: `${companyId}/${branchId}` })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('handleContextChanged error:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('role')
    localStorage.removeItem('activeCompanyId')
    localStorage.removeItem('activeBranchId')
    setToken('')
    setRole('')
    setNeedsContext(false)
    setSelectedArea('company-management')
    setSelectedCompanyTab('groups')
    setSelectedModuleKey('companies')
    setQuickCreateRequest(null)
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
    const nextCompanyId = nextSettings?.activeCompanyId || ''
    const nextBranchId = nextSettings?.activeBranchId || ''
    setActiveCompanyId(nextCompanyId)
    setActiveBranchId(nextBranchId)
    persistWorkContextToSettings(nextCompanyId, nextBranchId)
  }

  const hasWorkingContext = Boolean(activeCompanyId || activeBranchId)

  const displayedCompanyName = useMemo(() => {
    if (!activeCompanyId) return '-'
    const selected = workCompanies.find((item) => Number(item.id) === Number(activeCompanyId))
    return selected?.name || `Azienda #${activeCompanyId}`
  }, [activeCompanyId, workCompanies])

  const displayedBranchName = useMemo(() => {
    if (!activeBranchId) return '-'
    const selected = workBranches.find((item) => Number(item.id) === Number(activeBranchId))
    if (!selected) return `Sede #${activeBranchId}`
    return `${selected.city || ''} ${selected.address || ''}`.trim()
  }, [activeBranchId, workBranches])

  const selectableBranches = useMemo(() => {
    if (!activeCompanyId) return workBranches
    return workBranches.filter((item) => Number(item.companyId) === Number(activeCompanyId))
  }, [workBranches, activeCompanyId])

  const companiesWithBranches = useMemo(() => {
    return workCompanies
      .map((company) => ({
        ...company,
        branches: workBranches
          .filter((branch) => Number(branch.companyId) === Number(company.id))
          .sort((left, right) => String(left.city || '').localeCompare(String(right.city || ''))),
      }))
      .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
  }, [workCompanies, workBranches])

  const onWorkCompanyChange = (nextCompanyId) => {
    setActiveCompanyId(nextCompanyId)

    if (!nextCompanyId) {
      setActiveBranchId('')
      persistWorkContextToSettings('', '')
      return
    }

    const branchStillValid = workBranches.some(
      (item) => Number(item.id) === Number(activeBranchId) && Number(item.companyId) === Number(nextCompanyId),
    )

    const nextBranchId = branchStillValid ? activeBranchId : ''
    setActiveBranchId(nextBranchId)
    persistWorkContextToSettings(nextCompanyId, nextBranchId)
  }

  const onWorkBranchChange = (nextBranchId) => {
    setActiveBranchId(nextBranchId)

    if (!nextBranchId) {
      persistWorkContextToSettings(activeCompanyId, '')
      return
    }

    const selectedBranch = workBranches.find((item) => Number(item.id) === Number(nextBranchId))
    const nextCompanyId = selectedBranch ? String(selectedBranch.companyId) : activeCompanyId
    setActiveCompanyId(nextCompanyId)
    persistWorkContextToSettings(nextCompanyId, nextBranchId)
  }

  const clearWorkContext = () => {
    setActiveCompanyId('')
    setActiveBranchId('')
    persistWorkContextToSettings('', '')
  }

  const renderModuleContent = (moduleKey) => {
    if (moduleKey === 'home') {
      return (
        <HomeDashboard
          onNavigate={(target) => setSelectedModuleKey(target)}
          activeCompanyId={activeCompanyId}
          activeBranchId={activeBranchId}
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

    if (moduleKey === 'employees') {
      return (
        <WorkersCenter
          activeCompanyId={activeCompanyId}
          activeBranchId={activeBranchId}
          onOpenEmployeeCreate={() => setQuickCreateRequest({ entityKey: 'employees', token: Date.now() })}
          onOpenEmployeeCrud={() => {
            setSelectedArea('workers-management')
            setSelectedModuleKey('employees-crud')
          }}
        />
      )
    }

    if (moduleKey === 'employees-crud') {
      return (
        <CrudEntityView
          config={ENTITY_BY_KEY.employees}
          currentRole={role}
          activeCompanyId={activeCompanyId}
          activeBranchId={activeBranchId}
          externalCreateToken={quickCreateRequest?.entityKey === 'employees' ? quickCreateRequest.token : 0}
          onExternalCreateConsumed={handleQuickCreateConsumed}
        />
      )
    }

    if (moduleKey === 'protocols') {
      return <ProtocolsCenter />
    }

    if (moduleKey === 'schedules') {
      return <VisitPlanningCenter activeCompanyId={activeCompanyId} activeBranchId={activeBranchId} onOpenMedicalVisitCreate={() => setSelectedModuleKey('medical-visit-stepper')} />
    }

    if (moduleKey === 'medical-visit-stepper') {
      return <MedicalVisitStepper onCreated={() => setSelectedModuleKey('medical-visits')} />
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

    if (moduleKey === 'user-management') {
      return <UserManagement />
    }

    if (moduleKey === 'reporting') {
      return <ReportsCenter />
    }

    if (moduleKey === 'worker-portal') {
      return <WorkerPortal />
    }

    if (moduleKey === 'company-portal') {
      return <CompanyPortal />
    }

    if (moduleKey === 'allegato-3b') {
      return <Allegato3B />
    }

    if (moduleKey === 'convocazioni') {
      return <ConvocazioniCenter />
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

          <Box className="legacy-toolbar">
            <TextField size="small" label="Nominativo" variant="outlined" />
            <TextField size="small" label="Medico" variant="outlined" />
            <TextField size="small" label="Gruppo aziendale" variant="outlined" />
            <TextField size="small" label="Provincia" variant="outlined" />
            <TextField size="small" label="Comune" variant="outlined" />
            <TextField size="small" label="Riferimento" variant="outlined" />
            <TextField size="small" label="Status" variant="outlined" />
            <Box className="legacy-toolbar-actions">
              <Button className="legacy-btn" startIcon={<RestartAltIcon />}>Reset</Button>
              <Button className="legacy-btn" startIcon={<SearchIcon />}>Ricerca</Button>
            </Box>
          </Box>

          <Box className="legacy-content-area">{renderModuleContent(selectedModuleKey)}</Box>
        </Box>
      )
    }

    return renderModuleContent(selectedModuleKey)
  }

  return (
    <>
      <CssBaseline />
      <Box className="legacy-shell">
        {!isAuthenticated ? (
          <Box className="legacy-login-wrap">
            <Paper className="legacy-login-card" elevation={0}>
              <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
                Suite MedWork
              </Typography>
              <Typography variant="body2" sx={{ mb: 2.2, color: '#5f6472' }}>
                Piattaforma di Medicina del Lavoro e Sorveglianza Sanitaria.
              </Typography>
              <LoginCard onLoginSuccess={handleLoginSuccess} />
            </Paper>
          </Box>
        ) : needsContext ? (
          <ContextSelector
            role={role}
            username={username}
            onContextSelected={(selectedContext, newToken) => {
              if (newToken) {
                localStorage.setItem('accessToken', newToken)
              }
              setActiveCompanyId(selectedContext.type === 'Company' ? String(selectedContext.id) : String(selectedContext.parentId || ''))
              setActiveBranchId(selectedContext.type === 'Branch' ? String(selectedContext.id) : '')
              persistWorkContextToSettings(
                selectedContext.type === 'Company' ? String(selectedContext.id) : String(selectedContext.parentId || ''),
                selectedContext.type === 'Branch' ? String(selectedContext.id) : ''
              )
              setNeedsContext(false)
              setSelectedModuleKey('home')
              setSelectedArea('schedule')
              setExpandedAreas(new Set(['schedule']))
            }}
          />
        ) : (
          <Box className="legacy-layout">
            <header className="legacy-topbar">
              <Box className="legacy-topbar-left" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  component="img"
                  src="/favicon.svg"
                  alt="Suite MedWork"
                  sx={{ width: 28, height: 28 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 0.5 }}>
                  SUITE MEDWORK
                </Typography>
                <button type="button" className="legacy-icon-btn" aria-label="Menu">
                  <MenuIcon fontSize="small" />
                </button>
              </Box>
              <Box className="legacy-topbar-right">
                <button type="button" className="legacy-toolbar-link" aria-label="Notifiche">
                  <NotificationsNoneIcon fontSize="small" />
                </button>
                <span className="legacy-divider" />
                <span className="legacy-language">(it)</span>
                <span className="legacy-divider" />
                <button type="button" className="legacy-toolbar-link">ChangeLog</button>
                <button type="button" className="legacy-toolbar-link">
                  <MenuBookIcon fontSize="small" />
                  Manuale
                </button>
                <button type="button" className="legacy-toolbar-link">
                  <ManageAccountsIcon fontSize="small" />
                  Profilo
                </button>
                <span className="legacy-divider" />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    backgroundColor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                    maxWidth: 360,
                  }}
                  title="Contesto operativo attivo"
                >
                  <BusinessIcon fontSize="small" color="primary" />
                  <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    <Typography variant="caption" sx={{ lineHeight: 1, display: 'block', fontWeight: 600 }}>
                      {displayedCompanyName}
                    </Typography>
                    {displayedBranchName && displayedBranchName !== '-' && (
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>
                        {displayedBranchName}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <button type="button" className="legacy-toolbar-link" onClick={() => setSwitcherOpen(true)}>
                  <SwapHorizIcon fontSize="small" />
                  Cambia contesto
                </button>
                <span className="legacy-divider" />
                <button type="button" className="legacy-toolbar-link" onClick={handleLogout}>
                  <LogoutIcon fontSize="small" />
                  Logout
                </button>
              </Box>
            </header>

            <Box className="legacy-body">
              <aside className="legacy-sidebar">
                <button
                  type="button"
                  className={`legacy-side-item legacy-home-shortcut ${selectedModuleKey === 'home' ? 'is-active' : ''}`}
                  onClick={() => {
                    setSelectedArea('schedule')
                    setSelectedModuleKey('home')
                    setExpandedAreas((previous) => {
                      const next = new Set(previous)
                      next.add('schedule')
                      return next
                    })
                    appendAuditEvent({ module: 'Navigation', action: 'Open', detail: 'home-shortcut' })
                  }}
                >
                  <HomeIcon fontSize="small" />
                  <span>Home</span>
                </button>

                {roleAwareSideMenu.map((areaItem) => {
                  const Icon = areaItem.icon
                  const isExpanded = expandedAreas.has(areaItem.key)
                  const visibleChildren = areaItem.children
                    .map(childKey => roleAwareModules.find(m => m.key === childKey))
                    .filter(m => m !== undefined)

                  return (
                    <div key={areaItem.key}>
                      <button
                        type="button"
                        className="legacy-side-item legacy-area-header"
                        onClick={() => toggleAreaExpanded(areaItem.key)}
                      >
                        <Icon fontSize="small" />
                        <span>{areaItem.label}</span>
                        <span style={{ marginLeft: 'auto', display: 'flex' }}>
                          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="legacy-area-children">
                          {visibleChildren.map((moduleItem) => (
                            <button
                              key={moduleItem.key}
                              type="button"
                              className={`legacy-side-item legacy-module-item ${selectedModuleKey === moduleItem.key ? 'is-active' : ''}`}
                              onClick={() => {
                                setSelectedModuleKey(moduleItem.key)
                                appendAuditEvent({ module: 'Navigation', action: 'Open', detail: moduleItem.key })
                              }}
                            >
                              <span style={{ marginLeft: '24px' }}>{moduleItem.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </aside>

              <main className="legacy-main-content">
                {!!areaModuleItems.length && (
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
                <Box key={`ctx-${activeCompanyId || 'all'}-${activeBranchId || 'all'}`} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Suspense fallback={<ModuleFallback />}>
                {selectedModuleKey === 'home' ? (
                  renderModuleContent('home')
                ) : hasWorkingContext ? (
                  renderWorkspaceContent()
                ) : (
                  <Paper variant="outlined" sx={{ p: 2.5 }}>
                    <Typography variant="h6">Seleziona il contesto per continuare</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.8 }}>
                      Il flusso resta contestuale: scegli azienda o sede dal pannello sopra e vedrai solo i dati pertinenti.
                    </Typography>
                  </Paper>
                )}
                </Suspense>
                </Box>
              </main>
            </Box>

            <ContextSwitcher
              open={switcherOpen}
              onClose={() => setSwitcherOpen(false)}
              onContextChanged={handleContextChanged}
            />
          </Box>
        )}
      </Box>
    </>
  )
}

export default App

