import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Tabs,
  Tab,
  Divider,
  Switch,
  FormGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import SecurityIcon from '@mui/icons-material/Security'
import PersonIcon from '@mui/icons-material/Person'
import { apiGet, apiSend } from '../services/apiClient'

const SETTINGS_TABS = [
  { key: 'utenti', label: 'Utenti', icon: PersonIcon },
  { key: 'sedi', label: 'Sedi', icon: VisibilityIcon },
  { key: 'generali', label: 'Generali', icon: SecurityIcon },
  { key: 'programmazione', label: 'Programmazione', icon: SecurityIcon },
  { key: 'notifiche', label: 'Notifiche', icon: SecurityIcon },
  { key: 'spazi-ftp', label: 'Spazi FTP', icon: SecurityIcon },
  { key: 'abbonamento', label: 'Abbonamento', icon: SecurityIcon },
  { key: 'fatture', label: 'Fatture', icon: SecurityIcon },
]

const USER_TABS = [
  { key: 'dati-utente', label: 'Dati utente', icon: PersonIcon },
  { key: 'visibilita', label: 'Visibilità', icon: VisibilityIcon },
  { key: 'permessi', label: 'Permessi', icon: SecurityIcon },
]

const ROLES = [
  { value: 'Admin', label: 'Amministratore' },
  { value: 'Doctor', label: 'Medico competente' },
  { value: 'Secretary', label: 'Segreteria' },
  { value: 'HealthOperator', label: 'Operatore sanitario' },
  { value: 'Worker', label: 'Lavoratore' },
  { value: 'Employer', label: 'Datore di lavoro' },
  { value: 'Rspp', label: 'RSPP' },
]

const MODULES = [
  { key: 'sorveglianza', label: 'Sorveglianza sanitaria', icon: '🏥' },
  { key: 'sicurezza', label: 'Sicurezza luoghi di lavoro', icon: '🏭' },
  { key: 'formazione', label: 'Formazione aziendale', icon: '📚' },
  { key: 'fatturazione', label: 'Fatturazione', icon: '💰' },
  { key: 'scadenzario', label: 'Scadenzario', icon: '📅' },
  { key: 'protocollo', label: 'Protocolli', icon: '📋' },
  { key: 'audit', label: 'Audit', icon: '🔍' },
]

export default function SettingsCenter() {
  const [activeSettingsTab, setActiveSettingsTab] = useState('utenti')
  const [activeUserTab, setActiveUserTab] = useState('dati-utente')
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // User form state
  const [userForm, setUserForm] = useState({
    active: true,
    fullName: '',
    username: '',
    password: '',
    role: '',
    doctorId: '',
    smartCardEnabled: false,
    yousignEnabled: false,
    yousignOtpType: 'Email',
    email: '',
    mobile: '',
    landline: '',
    moduleAccess: {
      sorveglianza: false,
      sicurezza: false,
      formazione: false,
      fatturazione: false,
      scadenzario: false,
      protocollo: false,
      audit: false,
    },
    visibility: {
      companies: [],
      branches: [],
    },
  })

  // Load data
  useEffect(() => {
    Promise.all([
      apiGet('/api/master-data/companies'),
      apiGet('/api/master-data/branches'),
    ]).then(([companyData, branchData]) => {
      setCompanies(Array.isArray(companyData) ? companyData : [])
      setBranches(Array.isArray(branchData) ? branchData : [])
    })
  }, [])

  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const openUserDialog = (user = null) => {
    if (user) {
      setSelectedUser(user)
      setUserForm({
        active: user.active ?? true,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        username: user.username || '',
        password: '',
        role: user.role || '',
        doctorId: user.doctorId || '',
        smartCardEnabled: user.smartCardEnabled ?? false,
        yousignEnabled: user.yousignEnabled ?? false,
        yousignOtpType: user.yousignOtpType || 'Email',
        email: user.email || '',
        mobile: user.mobile || '',
        landline: user.landline || '',
        moduleAccess: user.moduleAccess || {},
        visibility: user.visibility || { companies: [], branches: [] },
      })
    } else {
      setSelectedUser(null)
      setUserForm({
        active: true,
        fullName: '',
        username: '',
        password: '',
        role: '',
        doctorId: '',
        smartCardEnabled: false,
        yousignEnabled: false,
        yousignOtpType: 'Email',
        email: '',
        mobile: '',
        landline: '',
        moduleAccess: {
          sorveglianza: false,
          sicurezza: false,
          formazione: false,
          fatturazione: false,
          scadenzario: false,
          protocollo: false,
          audit: false,
        },
        visibility: { companies: [], branches: [] },
      })
    }
    setActiveUserTab('dati-utente')
  }

  const handleUserChange = (field, value) => {
    if (field.startsWith('moduleAccess.')) {
      const module = field.split('.')[1]
      setUserForm(prev => ({
        ...prev,
        moduleAccess: { ...prev.moduleAccess, [module]: value }
      }))
    } else if (field.startsWith('visibility.')) {
      const vis = field.split('.')[1]
      setUserForm(prev => ({
        ...prev,
        visibility: { ...prev.visibility, [vis]: value }
      }))
    } else {
      setUserForm(prev => ({ ...prev, [field]: value }))
    }
  }

  const saveUser = async () => {
    if (!userForm.fullName || !userForm.username || !userForm.role) return
    setSaving(true)
    try {
      const payload = {
        ...userForm,
        firstName: userForm.fullName.split(' ')[0],
        lastName: userForm.fullName.split(' ').slice(1).join(' '),
      }
      if (selectedUser) {
        await apiSend('PUT', `/api/admin-data/users/${selectedUser.id}`, payload)
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...payload } : u))
      } else {
        await apiSend('POST', '/api/admin-data/users', payload)
      }
    } finally {
      setSaving(false)
      setSelectedUser(null)
    }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Eliminare questo utente?')) return
    try {
      await apiSend('DELETE', `/api/admin-data/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (error) {
      alert('Errore durante l\'eliminazione')
    }
  }

  const renderUserList = () => (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <TextField
          size="small"
          placeholder="Cerca utente..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          sx={{ minWidth: 250 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openUserDialog()}>
          Nuovo utente
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Nominativo</strong></TableCell>
              <TableCell><strong>Username</strong></TableCell>
              <TableCell><strong>Ruolo</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Stato</strong></TableCell>
              <TableCell align="right" style={{ width: 100 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Chip size="small" label={user.role} color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={user.active ? 'Attivo' : 'Inattivo'} color={user.active ? 'success' : 'default'} variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openUserDialog(user)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteUser(user.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {paginatedUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">Nessun utente trovato</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />
    </Stack>
  )

  const renderUserDetails = () => (
    <Dialog open={!!selectedUser || userForm.fullName} onClose={() => { setSelectedUser(null); setUserForm({ ...userForm, fullName: '', username: '', role: '' }); }} maxWidth="xl" fullWidth>
      <DialogTitle>{selectedUser ? 'Modifica utente' : 'Nuovo utente'}</DialogTitle>
      <DialogContent>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          {/* Left Column - Dati Utente */}
          <Box sx={{ flexGrow: 1 }}>
            <Paper sx={{ p: 3 }}>
              <FormControlLabel
                control={<Switch checked={userForm.active} onChange={(e) => handleUserChange('active', e.target.checked)} color="primary" />}
                label="Attivo"
                labelPlacement="start"
              />

              <Divider sx={{ my: 2 }} />

              <TextField
                label="Nominativo *"
                size="small"
                fullWidth
                value={userForm.fullName}
                onChange={(e) => handleUserChange('fullName', e.target.value)}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                label="Nome utente *"
                size="small"
                fullWidth
                value={userForm.username}
                onChange={(e) => handleUserChange('username', e.target.value)}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                label={selectedUser ? 'Nuova password (lascia vuoto per non cambiare)' : 'Password *'}
                type="password"
                size="small"
                fullWidth
                value={userForm.password}
                onChange={(e) => handleUserChange('password', e.target.value)}
                required={!selectedUser}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end"><VisibilityIcon /></InputAdornment>
                }}
              />

              <FormControl fullWidth size="small" variant="outlined" sx={{ mb: 2 }}>
                <InputLabel id="role-label">Ruolo *</InputLabel>
                <Select labelId="role-label" label="Ruolo" value={userForm.role} onChange={(e) => handleUserChange('role', e.target.value)} required>
                  {ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" variant="outlined" sx={{ mb: 2 }}>
                <InputLabel id="doctor-label">Operatore sanitario</InputLabel>
                <Select labelId="doctor-label" value={userForm.doctorId} onChange={(e) => handleUserChange('doctorId', e.target.value)} displayEmpty>
                  <MenuItem value="">Nessuno</MenuItem>
                  {users.filter(u => u.role === 'Doctor').map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Firme digitali</Typography>
              <FormControlLabel
                control={<Switch checked={userForm.smartCardEnabled} onChange={(e) => handleUserChange('smartCardEnabled', e.target.checked)} color="primary" />}
                label="Abilita firma con smart card"
              />
              <FormControlLabel
                control={<Switch checked={userForm.yousignEnabled} onChange={(e) => handleUserChange('yousignEnabled', e.target.checked)} color="primary" />}
                label="Abilita firma con Yousign"
              />

              <FormControl fullWidth size="small" variant="outlined" sx={{ mb: 2 }}>
                <InputLabel id="otp-label">Tipo OTP Yousign *</InputLabel>
                <Select labelId="otp-label" value={userForm.yousignOtpType} onChange={(e) => handleUserChange('yousignOtpType', e.target.value)}>
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Contatti</Typography>
              <TextField
                label="Email *"
                type="email"
                size="small"
                fullWidth
                value={userForm.email}
                onChange={(e) => handleUserChange('email', e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Cellulare"
                    type="tel"
                    size="small"
                    fullWidth
                    value={userForm.mobile}
                    onChange={(e) => handleUserChange('mobile', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Telefono fisso"
                    type="tel"
                    size="small"
                    fullWidth
                    value={userForm.landline}
                    onChange={(e) => handleUserChange('landline', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Right Column - Abilitazioni & Permessi */}
          <Box sx={{ width: { lg: 380 }, flexShrink: 0 }}>
            <Tabs value={activeUserTab} onChange={(e, v) => setActiveUserTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
              {USER_TABS.map((tab) => (
                <Tab key={tab.key} label={tab.label} icon={<tab.icon fontSize="small" />} />
              ))}
            </Tabs>

            {activeUserTab === 'dati-utente' && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Abilitazioni moduli</Typography>
                <FormGroup>
                  {MODULES.map((mod) => (
                    <FormControlLabel
                      key={mod.key}
                      control={<Switch checked={userForm.moduleAccess[mod.key]} onChange={(e) => handleUserChange(`moduleAccess.${mod.key}`, e.target.checked)} color="primary" />}
                      label={mod.label}
                    />
                  ))}
                </FormGroup>
              </Paper>
            )}

            {activeUserTab === 'visibilita' && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Visibilità aziende/sedi</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Seleziona le aziende e le sedi che l'utente può visualizzare.
                </Typography>
                <FormControl fullWidth size="small" variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel id="vis-companies">Aziende visibili</InputLabel>
                  <Select labelId="vis-companies" multiple value={userForm.visibility.companies} onChange={(e) => handleUserChange('visibility.companies', e.target.value)} renderValue={(selected) => selected.join(', ') || 'Tutte'}>
                    {companies.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" variant="outlined">
                  <InputLabel id="vis-branches">Sedi visibili</InputLabel>
                  <Select labelId="vis-branches" multiple value={userForm.visibility.branches} onChange={(e) => handleUserChange('visibility.branches', e.target.value)} renderValue={(selected) => selected.join(', ') || 'Tutte'}>
                    {branches.map((b) => (
                      <MenuItem key={b.id} value={b.id}>{b.address} - {b.city}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>
            )}

            {activeUserTab === 'permessi' && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Matrice permessi</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configura permessi granulari (Visualizza/Modifica) per modulo.
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Modulo</TableCell>
                        <TableCell align="center">Visualizza</TableCell>
                        <TableCell align="center">Modifica</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {MODULES.map((mod) => (
                        <TableRow key={mod.key}>
                          <TableCell>{mod.label}</TableCell>
                          <TableCell align="center">
                            <Checkbox checked={true} disabled />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox checked={userForm.moduleAccess[mod.key]} onChange={(e) => handleUserChange(`moduleAccess.${mod.key}`, e.target.checked)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setSelectedUser(null); setUserForm({ ...userForm, fullName: '', username: '', role: '' }); }}>Annulla</Button>
        <Button variant="contained" onClick={saveUser} disabled={saving}>
          {saving ? 'Salvataggio...' : (selectedUser ? 'Salva modifiche' : 'Crea utente')}
        </Button>
      </DialogActions>
    </Dialog>
  )

  const renderSediTab = () => (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Gestione Sedi</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Nuova sede</Button>
      </Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">Elenco sedi aziendali con indirizzi, contatti e configurazioni.</Typography>
        {/* Table with branches would go here */}
      </Paper>
    </Stack>
  )

  const renderGeneraliTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Impostazioni generali</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configurazioni globali dell'applicazione.
      </Typography>
      {/* General settings form */}
    </Paper>
  )

  const renderSettingsContent = () => {
    switch (activeSettingsTab) {
      case 'utenti':
        return (
          <>
            {renderUserList()}
            {renderUserDetails()}
          </>
        )
      case 'sedi':
        return renderSediTab()
      case 'generali':
        return renderGeneraliTab()
      default:
        return (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>{SETTINGS_TABS.find(t => t.key === activeSettingsTab)?.label}</Typography>
            <Typography variant="body2" color="text.secondary">Sezione in sviluppo</Typography>
          </Paper>
        )
    }
  }

  return (
    <Box>
      {/* Settings Tabs */}
      <Paper sx={{ p: 1 }}>
        <Tabs
          value={activeSettingsTab}
          onChange={(event, newTab) => { setActiveSettingsTab(newTab); setSelectedUser(null); }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ width: '100%' }}
        >
          {SETTINGS_TABS.map((tab) => (
            <Tab key={tab.key} label={tab.label} icon={<tab.icon fontSize="small" />} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {renderSettingsContent()}
    </Box>
  )
}