import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { apiGet, authLogin, getTenantSlug } from '../services/apiClient'

function LoginCard({ onLoginSuccess, onForgotPassword }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [tenant, setTenant] = useState(getTenantSlug() || 'default')
  const [tenants, setTenants] = useState([
    { id: 1, name: 'Default Tenant', slug: 'default' },
  ])
  const [rememberMe, setRememberMe] = useState(false)
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')

  useEffect(() => {
    apiGet('/api/auth/tenants')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTenants(data)
          if (!tenant || !data.some((t) => t.slug === tenant)) {
            const match = data.find((t) => t.slug === 'default') || data[0]
            setTenant(match.slug)
          }
        }
      })
      .catch(() => {
        // Fallback already in place with 'default'
      })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrore('')
    setCaricamento(true)

    if (!tenant) {
      setErrore('Seleziona un tenant')
      setCaricamento(false)
      return
    }

    try {
      const data = await authLogin(username, password, tenant, rememberMe)
      onLoginSuccess(data.accessToken, data.role)
    } catch (error) {
      setErrore(error.message || 'Errore durante il login.')
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 420 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Accesso piattaforma
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Inserisci le credenziali fornite dal tuo studio medico.
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, textAlign: 'right' }}>
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault()
            if (typeof onForgotPassword === 'function') {
              onForgotPassword()
            } else {
              setForgotMessage("Contatta l'amministratore per reimpostare la password")
            }
          }}
        >
          Password dimenticata?
        </Link>
      </Typography>

      {!!forgotMessage && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setForgotMessage('')}>
          {forgotMessage}
        </Alert>
      )}

      {!!errore && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errore}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <FormControl fullWidth required>
            <InputLabel id="tenant-select-label">Tenant (Organizzazione)</InputLabel>
            <Select
              labelId="tenant-select-label"
              value={tenant}
              label="Tenant (Organizzazione)"
              onChange={(event) => setTenant(event.target.value)}
            >
              {tenants.map((t) => (
                <MenuItem key={t.slug || t.id} value={t.slug}>
                  {t.name} ({t.slug})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            required
          />
          <FormControlLabel
            control={<Checkbox checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />}
            label="Ricordami (30 giorni)"
          />
          <Button type="submit" variant="contained" disabled={caricamento}>
            {caricamento ? 'Accesso in corso...' : 'Accedi'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  )
}

export default LoginCard
