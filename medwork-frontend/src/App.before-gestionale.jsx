import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  CssBaseline,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
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
import SearchIcon from '@mui/icons-material/Search'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import DashboardScadenze from './components/DashboardScadenze'
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
  { key: 'employees-crud', label: 'Lavoratori (CRUD)', entityKey: 'employees' },
  { key: 'protocols', label: 'Protocolli' },
  { key: 'protocols-registry', label: 'Registro protocolli', entityKey: 'protocols-registry' },
  { key: 'personal-protocols', label: 'Protocolli personali', entityKey: 'personal-protocols' },
  { key: 'schedules', label: 'Scadenze e agende' },
  { key: 'medical-visit-stepper', label: 'Nuova visita (step)' },
  { key: 'appointments-calendar', label: 'Calendario visite' },
  { key: 'billing', label: 'Fatturazione' },
  { key: 'audit', label: 'Audit' },
  { key: 'exam-types', label: 'Cataloghi', entityKey: 'exam-types' },
  { key: 'job-roles', label: 'Mansioni', entityKey: 'job-roles' },
  { key: 'tools', label: 'Strumenti' },
  { key: 'settings', label: 'Impostazioni' },
  { key: 'reporting', label: 'Reportistica' },
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
]

const AREA_MODULE_KEYS = {
  'company-management': ['companies', 'company-groups', 'company-contacts', 'employees', 'protocols', 'schedules', 'branches', 'departments', 'work-locations'],
  'workers-management': ['employees', 'employees-crud', 'employee-risks', 'medical-records', 'medical-visits'],
  analysis: ['reporting', 'audit'],
  'health-surveillance': ['medical-visit-stepper', 'appointments-calendar', 'anamneses', 'scheduled-exams', 'vaccinations', 'visit-exams', 'site-visits'],
  schedule: ['schedules', 'home', 'doctor-availabilities', 'notification-logs'],
  administration: ['billing', 'tools', 'settings', 'exam-types', 'job-roles', 'risk-factors', 'protocols-registry', 'personal-protocols'],
}

const AREA_DEFAULT_MODULE = {
  'company-management': 'companies',
  'workers-management': 'employees',
  analysis: 'reporting',
  'health-surveillance': 'medical-visit-stepper',
  schedule: 'schedules',
  administration: 'settings',
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || '')
  const [role, setRole] = useState(() => localStorage.getItem('role') || '')
  const [selectedArea, setSelectedArea] = useState('company-management')
  const [selectedCompanyTab, setSelectedCompanyTab] = useState('groups')
  const [selectedModuleKey, setSelectedModuleKey] = useState('companies')
  const [quickCreateRequest, setQuickCreateRequest] = useState(null)
  const [activeCompanyId, setActiveCompanyId] = useState(() => readActiveCompanyFromSettings())

  const isAuthenticated = useMemo(() => token && (role === 'Doctor' || role === 'Admin'), [token, role])

  useEffect(() => {
    if (!isAuthenticated) return

    apiGet('/api/master-data/companies').catch((error) => {
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

  const renderModuleContent = (moduleKey) => {
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
          onOpenEmployeeCrud={() => setSelectedArea('workers-management')}
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
                Gestionale Medicina del Lavoro
              </Typography>
              <Typography variant="body2" sx={{ mb: 2.2, color: '#5f6472' }}>
                Accesso alla piattaforma amministrativa e sanitaria.
              </Typography>
              <LoginCard onLoginSuccess={handleLoginSuccess} />
            </Paper>
          </Box>
        ) : (
          <Box className="legacy-layout">
            <header className="legacy-topbar">
              <Box className="legacy-topbar-left">
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
                <button type="button" className="legacy-toolbar-link" onClick={handleLogout}>
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
                <Box className="legacy-context-line">
                  <Typography variant="body2">Ruolo: {role}</Typography>
                  <Typography variant="body2">Contesto azienda: {activeCompanyId || 'Globale'}</Typography>
                </Box>
                {!!areaModuleItems.length && (
                  <Box className="legacy-module-strip">
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
                {renderWorkspaceContent()}
              </main>
            </Box>
          </Box>
        )}
      </Box>
    </>
  )
}

export default App

