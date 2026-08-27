import { useEffect, useMemo, useState } from 'react'
import { Box, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { apiGet } from '../services/apiClient'
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

  useEffect(() => {
    Promise.all([apiGet('/api/master-data/companies'), apiGet('/api/master-data/branches')])
      .then(([companyList, branchList]) => {
        setCompanies(Array.isArray(companyList) ? companyList : [])
        setBranches(Array.isArray(branchList) ? branchList : [])
      })
      .catch(() => {
        setCompanies([])
        setBranches([])
      })
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
      onThemeChange(next.themeMode);
    }
    setSettings(next)
    saveSettings(next)
    if (typeof onSettingsChange === 'function') {
      onSettingsChange(next)
    }
    appendAuditEvent({ module: 'Impostazioni', action: 'Update', detail: `${next.activeDomain}` })
  }

  return (
    <Stack spacing={2}>
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
              <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
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
              <MenuItem key={branch.id} value={branch.id}>{branch.address}</MenuItem>
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

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Contesto attivo</Typography>
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
