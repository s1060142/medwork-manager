import { lazy, Suspense, useState, useMemo, useEffect } from 'react'
import {
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  CssBaseline,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import HomeIcon from '@mui/icons-material/Home'
import BusinessIcon from '@mui/icons-material/Business'
import AssessmentIcon from '@mui/icons-material/Assessment'
import GroupIcon from '@mui/icons-material/Group'
import EventIcon from '@mui/icons-material/Event'
import DescriptionIcon from '@mui/icons-material/Description'
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import InsertChartIcon from '@mui/icons-material/InsertChart'
import SearchIcon from '@mui/icons-material/Search'
import HelpIcon from '@mui/icons-material/Help'
import FeedbackIcon from '@mui/icons-material/Feedback'
import IconButton from '@mui/material/IconButton'
import LogoutIcon from '@mui/icons-material/Logout'
import { apiGet, apiSend } from './services/apiClient'
import './App.css'

// Lazy-loaded components (solo ciò che serve a app-spec.md)
const HomeDashboard = lazy(() => import('./components/HomeDashboard'))
const WorkersCenter = lazy(() => import('./components/WorkersCenter'))
const CompanyPortal = lazy(() => import('./components/CompanyPortal'))
const WorkerPortal = lazy(() => import('./components/WorkerPortal'))
const BillingCenter = lazy(() => import('./components/BillingCenter'))
const PriceListCenter = lazy(() => import('./components/PriceListCenter'))
const QuoteCenter = lazy(() => import('./components/QuoteCenter'))
const ReportsCenter = lazy(() => import('./components/ReportsCenter'))
const DashboardScadenze = lazy(() => import('./components/DashboardScadenze'))
const ProtocolsCenter = lazy(() => import('./components/ProtocolsCenter'))
const ToolsCenter = lazy(() => import('./components/ToolsCenter'))
const SettingsCenter = lazy(() => import('./components/SettingsCenter'))
const AuditCenter = lazy(() => import('./components/AuditCenter'))
const LoginCard = lazy(() => import('./components/LoginCard'))

// Menu laterale
const SIDEBAR_ITEMS = [
  { key: 'home', label: 'Home', icon: HomeIcon },
  { key: 'companies', label: 'Aziende', icon: BusinessIcon },
  { key: 'employees', label: 'Lavoratori', icon: GroupIcon },
  { key: 'protocols', label: 'Protocolli', icon: DescriptionIcon },
  { key: 'schedules', label: 'Scadenze e agende', icon: EventIcon },
  { key: 'billing', label: 'Fatturazione', icon: MonetizationOnIcon },
  { key: 'reports', label: 'Reportistica', icon: InsertChartIcon },
  { key: 'tools', label: 'Strumenti', icon: SettingsApplicationsIcon },
  { key: 'settings', label: 'Impostazioni', icon: SettingsApplicationsIcon },
  { key: 'audit', label: 'Audit', icon: AssessmentIcon },
  { key: 'search', label: 'Ricerca', icon: SearchIcon },
  { key: 'help', label: 'Guida', icon: HelpIcon },
  { key: 'feedback', label: 'Feedback', icon: FeedbackIcon },
]

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || '')
  const [role, setRole] = useState(() => localStorage.getItem('role') || '')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState('home')
  const [activeCompanyId, setActiveCompanyId] = useState('')
  const [activeBranchId, setActiveBranchId] = useState('')
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [currentUserName, setCurrentUserName] = useState('Utente')

  const isAuthenticated = !!token && !!role

  useEffect(() => {
    if (isAuthenticated) {
      apiGet('/api/master-data/companies')
        .then(setCompanies)
        .catch(() => setCompanies([]))
      apiGet('/api/master-data/branches')
        .then(setBranches)
        .catch(() => setBranches([]))
    }
  }, [isAuthenticated])

  const handleLoginSuccess = (accessToken, userRole) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('role', userRole)
    setToken(accessToken)
    setRole(userRole)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      setCurrentUserName(payload.sub || 'Utente')
    } catch {
      setCurrentUserName('Utente')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('role')
    setToken('')
    setRole('')
    setSelectedModule('home')
  }

  const renderContent = () => {
    switch (selectedModule) {
      case 'home':
        return <HomeDashboard userName={currentUserName} />
      case 'companies':
        return <WorkersCenter />
      case 'employees':
        return <WorkersCenter />
      case 'protocols':
        return <ProtocolsCenter />
      case 'schedules':
        return <DashboardScadenze />
      case 'billing':
        return <BillingCenter />
      case 'reports':
        return <ReportsCenter />
      case 'tools':
        return <ToolsCenter />
      case 'settings':
        return <SettingsCenter />
      case 'audit':
        return <AuditCenter />
      default:
        return <Typography>Sezione in costruzione</Typography>
    }
  }

  return (
    <>
      <CssBaseline />
      {!isAuthenticated ? (
        <Box className="login-container">
          <Paper className="login-paper">
            <Typography variant="h4" gutterBottom>Suite MedWork</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Piattaforma di Medicina del Lavoro
            </Typography>
            <Suspense fallback={<CircularProgress />}>
              <LoginCard onLoginSuccess={handleLoginSuccess} />
            </Suspense>
          </Paper>
        </Box>
      ) : (
        <>
          <AppBar position="static">
            <Toolbar>
              <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setMobileOpen(true)}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                MedWork Manager
              </Typography>
              <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={role} size="small" />
                <Tooltip title="Logout">
                  <IconButton color="inherit" onClick={handleLogout}>
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </AppBar>
          <Box sx={{ display: 'flex' }}>
            <Drawer
              open={mobileOpen}
              onClose={() => setMobileOpen(false)}
              sx={{
                width: 280,
                flexShrink: 0,
                '& .MuiDrawer-paper': { boxSizing: 'border-box', p: 2 },
              }}
            >
              <Typography variant="h6" gutterBottom>
                Navigazione
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {SIDEBAR_ITEMS.map((item) => (
                  <Button
                    key={item.key}
                    startIcon={<item.icon />}
                    onClick={() => {
                      setSelectedModule(item.key)
                      setMobileOpen(false)
                    }}
                    variant={selectedModule === item.key ? 'contained' : 'text'}
                    className="sidebar-btn"
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            </Drawer>
            <Box sx={{ flexGrow: 1, p: 3, backgroundColor: '#f5f5f5' }}>
              <Suspense fallback={<CircularProgress />}>
                {renderContent()}
              </Suspense>
            </Box>
          </Box>
        </>
      )}
    </>
  )
}

export default App