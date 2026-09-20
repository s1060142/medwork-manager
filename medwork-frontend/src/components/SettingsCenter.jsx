import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  FormControlLabel,
  TextField,
  Typography,
  Alert,
} from '@mui/material'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SaveIcon from '@mui/icons-material/Save'
import SendIcon from '@mui/icons-material/Send'
import { apiGet, apiSend } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'

const STORAGE_KEY = 'medwork.runtime.settings'

function readSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      activeCompanyId: parsed.activeCompanyId || '',
      activeBranchId: parsed.activeBranchId || '',
      activeDomain: parsed.activeDomain || 'default.medwork.local',
    }
  } catch {
    return {
      activeCompanyId: '',
      activeBranchId: '',
      activeDomain: 'default.medwork.local',
    }
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

function SettingsCenter({ activeCompanyId = '', onSettingsChange, themeMode = 'light', onThemeChange }) {
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [settings, setSettings] = useState(() => ({ ...readSettings(), themeMode }))

  // PEC Configuration State
  const [pecHost, setPecHost] = useState('smtps.pec.aruba.it')
  const [pecPort, setPecPort] = useState(465)
  const [pecUsername, setPecUsername] = useState('')
  const [pecPassword, setPecPassword] = useState('')
  const [pecSender, setPecSender] = useState('')
  const [pecEnabled, setPecEnabled] = useState(true)
  const [pecUseSsl, setPecUseSsl] = useState(true)
  const [pecLoading, setPecLoading] = useState(false)
  const [pecTesting, setPecTesting] = useState(false)
  const [pecFeedback, setPecFeedback] = useState(null)

  useEffect(() => {
    Promise.all([apiGet('/api/master-data/companies'), apiGet('/api/master-data/branches')])
      .then(([companyList, branchList]) => {
        setCompanies(Array.isArray(companyList) ? companyList : (Array.isArray(companyList?.data) ? companyList.data : []))
        setBranches(Array.isArray(branchList) ? branchList : (Array.isArray(branchList?.data) ? branchList.data : []))
      })
      .catch(() => {
        setCompanies([])
        setBranches([])
      })

    // Load PEC settings from backend
    apiGet('/api/alerts/pec-settings')
      .then((cfg) => {
        if (cfg) {
          if (cfg.host) setPecHost(cfg.host)
          if (cfg.port) setPecPort(cfg.port)
          if (cfg.username) setPecUsername(cfg.username)
          if (cfg.senderAddress) setPecSender(cfg.senderAddress)
          setPecEnabled(cfg.enabled ?? true)
          setPecUseSsl(cfg.useSsl ?? true)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setSettings((current) => ({
      ...current,
      activeCompanyId: activeCompanyId || '',
      activeBranchId:
        current.activeBranchId && activeCompanyId && Number(current.activeCompanyId) === Number(activeCompanyId)
          ? current.activeBranchId
          : '',
    }))
  }, [activeCompanyId])

  const filteredBranches = useMemo(() => {
    if (!settings.activeCompanyId) return branches
    return branches.filter((item) => Number(item.companyId) === Number(settings.activeCompanyId))
  }, [branches, settings.activeCompanyId])

  const applySettings = (next) => {
    if (next.themeMode !== settings.themeMode && typeof onThemeChange === 'function') {
      onThemeChange(next.themeMode)
    }
    setSettings(next)
    saveSettings(next)
    if (typeof onSettingsChange === 'function') {
      onSettingsChange(next)
    }
    appendAuditEvent({ module: 'Impostazioni', action: 'Update', detail: `${next.activeDomain}` })
  }

  const handleSavePecSettings = async () => {
    setPecLoading(true)
    setPecFeedback(null)
    try {
      await apiSend('POST', '/api/alerts/pec-settings', {
        host: pecHost,
        port: Number(pecPort),
        username: pecUsername,
        password: pecPassword,
        senderAddress: pecSender,
        enabled: pecEnabled,
        useSsl: pecUseSsl,
      })
      setPecFeedback({ type: 'success', message: 'Parametri PEC salvati e crittografati con successo.' })
    } catch (err) {
      setPecFeedback({ type: 'error', message: err.message || 'Errore nel salvataggio dei parametri PEC.' })
    } finally {
      setPecLoading(false)
    }
  }

  const handleTestPecConnection = async () => {
    setPecTesting(true)
    setPecFeedback(null)
    try {
      const res = await apiSend('POST', '/api/alerts/test-pec-connection', {
        host: pecHost,
        port: Number(pecPort),
        username: pecUsername,
        password: pecPassword,
        senderAddress: pecSender,
        enabled: pecEnabled,
        useSsl: pecUseSsl,
      })
      if (res.success) {
        setPecFeedback({ type: 'success', message: res.message || 'Handshake PEC completato con successo!' })
      } else {
        setPecFeedback({ type: 'error', message: res.message || 'Handshake PEC fallito.' })
      }
    } catch (err) {
      setPecFeedback({ type: 'error', message: err.message || 'Errore durante il test di connessione.' })
    } finally {
      setPecTesting(false)
    }
  }

  return (
    <Stack spacing={3}>
      {/* CONTESTO MULTI-TENANT */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6">Gestione multitenente e multidominio</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Contesto runtime per tenant aziendale, sede operativa e dominio applicativo.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.2, mt: 2 }}>
          <TextField
            select
            size="small"
            label="Tenant (Azienda)"
            value={settings.activeCompanyId}
            onChange={(event) =>
              applySettings({
                ...settings,
                activeCompanyId: event.target.value,
                activeBranchId: '',
              })
            }
          >
            <MenuItem value="">Globale</MenuItem>
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Sede (Dominio operativo)"
            value={settings.activeBranchId}
            onChange={(event) => applySettings({ ...settings, activeBranchId: event.target.value })}
          >
            <MenuItem value="">Tutte</MenuItem>
            {filteredBranches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                {branch.address}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="Hostname dominio"
            value={settings.activeDomain}
            onChange={(event) => applySettings({ ...settings, activeDomain: event.target.value })}
          />
        </Box>

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">Modalità tema:</Typography>
          <Chip
            label="Chiaro"
            color={settings.themeMode === 'light' ? 'primary' : 'default'}
            onClick={() => applySettings({ ...settings, themeMode: 'light' })}
          />
          <Chip
            label="Scuro"
            color={settings.themeMode === 'dark' ? 'primary' : 'default'}
            onClick={() => applySettings({ ...settings, themeMode: 'dark' })}
          />
        </Box>
      </Paper>

      {/* CONFIGURAZIONE PEC DELIVERY HUB */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <MarkEmailReadIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6">Configurazione PEC & Delivery Hub Notifiche</Typography>
            <Typography variant="body2" color="text.secondary">
              Parametri server per la trasmissione legale automatica dei Giudizi di Idoneità a norma D.Lgs. 81/08.
            </Typography>
          </Box>
        </Stack>

        {pecFeedback && (
          <Alert severity={pecFeedback.type} sx={{ my: 2 }} onClose={() => setPecFeedback(null)}>
            {pecFeedback.message}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Server SMTP / PEC Host"
              placeholder="es. smtps.pec.aruba.it"
              value={pecHost}
              onChange={(e) => setPecHost(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Porta (SSL/TLS)"
              value={pecPort}
              onChange={(e) => setPecPort(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={<Switch checked={pecUseSsl} onChange={(e) => setPecUseSsl(e.target.checked)} color="primary" />}
              label="Abilita SSL/TLS"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Indirizzo PEC Mittente"
              placeholder="medico.competente@pec.it"
              value={pecSender}
              onChange={(e) => setPecSender(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Username PEC"
              value={pecUsername}
              onChange={(e) => setPecUsername(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              type="password"
              label="Password PEC (crittografata AES-256)"
              placeholder="Inserisci password per aggiornarla"
              value={pecPassword}
              onChange={(e) => setPecPassword(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={<Switch checked={pecEnabled} onChange={(e) => setPecEnabled(e.target.checked)} color="success" />}
              label="Attiva Invio Automatico PEC"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={pecTesting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            disabled={pecTesting || !pecHost || !pecSender}
            onClick={handleTestPecConnection}
          >
            {pecTesting ? 'Verifica in corso...' : 'Test Connessione PEC'}
          </Button>
          <Button
            variant="contained"
            startIcon={pecLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={pecLoading}
            onClick={handleSavePecSettings}
          >
            {pecLoading ? 'Salvataggio...' : 'Salva Parametri PEC'}
          </Button>
        </Stack>
      </Paper>

      {/* CONTESTO ATTIVO */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Contesto attivo
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={`Tenant: ${settings.activeCompanyId || 'Globale'}`} />
          <Chip label={`Sede: ${settings.activeBranchId || 'Tutte'}`} />
          <Chip label={`Dominio: ${settings.activeDomain || 'n/d'}`} color="primary" variant="outlined" />
        </Stack>
      </Paper>
    </Stack>
  )
}

export default SettingsCenter
