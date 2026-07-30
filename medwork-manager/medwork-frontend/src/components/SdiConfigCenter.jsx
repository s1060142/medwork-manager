import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Save as SaveIcon,
  Sync as SyncIcon,
  Cloud as CloudIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  VpnKey as VpnKeyIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { apiGet, apiSend } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'

export default function SdiConfigCenter({ activeCompanyId = '' }) {
  const [config, setConfig] = useState(null)
  const [formData, setFormData] = useState({
    channel: 'SDICoop',
    endpointUrl: 'https://sdi.fatturapa.gov.it/SdiWS/sdi.wsdl',
    certificateThumbprint: '',
    certificatePassword: '',
    pecEmail: '',
    pecPassword: '',
    pecHost: 'smtp.pec.it',
    pecPort: 993,
    testMode: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/api/electronic-invoice/sdi-config')
      if (data) {
        setConfig(data)
        setFormData(prev => ({ ...prev, ...data }))
      }
    } catch (err) {
      // Config might not exist yet
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setTestResult(null)
    
    try {
      if (config) {
        await apiSend('PUT', '/api/electronic-invoice/sdi-config', formData)
        appendAuditEvent({ module: 'FatturazioneElettronica', action: 'UpdateSdiConfig', detail: 'Configurazione SDI aggiornata' })
      } else {
        await apiSend('POST', '/api/electronic-invoice/sdi-config', formData)
        appendAuditEvent({ module: 'FatturazioneElettronica', action: 'CreateSdiConfig', detail: 'Configurazione SDI creata' })
      }
      
      loadConfig()
      alert('Configurazione salvata con successo!')
    } catch (err) {
      setError(err.message || 'Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const result = await apiSend('POST', '/api/electronic-invoice/sdi-config/test', formData)
      setTestResult({ success: true, message: result.message || 'Test connessione riuscito!' })
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Test connessione fallito' })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3} direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Configurazione Canali SDI</Typography>
          <Typography variant="body2" color="text.secondary">Impostazioni per invio fatture elettroniche via SDICoop o PEC</Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {testResult && (
        <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
          {testResult.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* SDICoop Channel */}
        <Grid size={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardHeader 
              title="Canale SDICoop (Web Service)" 
              subheader="Invio diretto tramite web service SDI (richiede certificato digitale)"
              action={
                <FormControlLabel
                  control={<Radio color="primary" checked={formData.channel === 'SDICoop'} onChange={() => setFormData({...formData, channel: 'SDICoop'})} />}
                  label="Usa questo canale"
                />
              }
            />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Endpoint URL"
                  value={formData.endpointUrl}
                  onChange={(e) => setFormData({...formData, endpointUrl: e.target.value})}
                  helperText="URL del web service SDI (produzione o test)"
                />
                <TextField
                  fullWidth
                  label="Certificato (Thumbprint)"
                  value={formData.certificateThumbprint}
                  onChange={(e) => setFormData({...formData, certificateThumbprint: e.target.value})}
                  helperText="Identificativo del certificato digitale installato sul server"
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Password Certificato"
                  value={formData.certificatePassword}
                  onChange={(e) => setFormData({...formData, certificatePassword: e.target.value})}
                  helperText="Password per accedere al certificato"
                />
                <FormControlLabel
                  control={<Switch checked={formData.testMode} onChange={e => setFormData({...formData, testMode: e.target.checked})} label="Modalità Test (ambiente di test SDI)" />}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* PEC Channel */}
        <Grid size={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardHeader 
              title="Canale PEC" 
              subheader="Invio tramite Posta Elettronica Certificata"
              action={
                <FormControlLabel
                  control={<Radio color="primary" checked={formData.channel === 'PEC'} onChange={() => setFormData({...formData, channel: 'PEC'})} />}
                  label="Usa questo canale"
                />
              }
            />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Email PEC"
                  value={formData.pecEmail}
                  onChange={(e) => setFormData({...formData, pecEmail: e.target.value})}
                  helperText="Indirizzo PEC mittente"
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Password PEC"
                  value={formData.pecPassword}
                  onChange={(e) => setFormData({...formData, pecPassword: e.target.value})}
                />
                <TextField
                  fullWidth
                  label="Host IMAP"
                  value={formData.pecHost}
                  onChange={(e) => setFormData({...formData, pecHost: e.target.value})}
                  helperText="Server IMAP per ricezione notifiche (es. smtp.pec.it)"
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Porta IMAP"
                  value={formData.pecPort}
                  onChange={(e) => setFormData({...formData, pecPort: parseInt(e.target.value) || 993})}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Default Channel Selection */}
        <Grid size={12}>
          <Card variant="outlined">
            <CardHeader title="Canale Predefinito" />
            <CardContent>
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend">Canale Predefinito per Invio</FormLabel>
                <RadioGroup 
                  value={formData.channel} 
                  onChange={e => setFormData({...formData, channel: e.target.value})}
                  row
                >
                  <FormControlLabel value="SDICoop" control={<Radio color="primary" />} label="SDICoop (Web Service)" />
                  <FormControlLabel value="PEC" control={<Radio color="primary" />} label="PEC" />
                </RadioGroup>
              </FormControl>
              
              <FormControlLabel
                control={<Switch checked={formData.testMode} onChange={e => setFormData({...formData, testMode: e.target.checked})} />}
                label="Modalità Test (ambiente di test SDI)"
              />
              
              <Stack direction="row" spacing={2} mt={2}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvataggio...' : 'Salva Configurazione'}
                </Button>
                <Button variant="outlined" startIcon={<SyncIcon />} onClick={handleTestConnection} disabled={testing}>
                  {testing ? 'Test in corso...' : 'Test Connessione'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Info Panel */}
        <Grid size={12}>
          <Paper variant="outlined" sx={{ p: 3, bgcolor: 'info.light' }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box sx={{ flexShrink: 0 }}>
                <CheckIcon sx={{ fontSize: 32, color: 'info.main' }} />
              </Box>
              <Box>
                <Typography variant="h6" gutterBottom>Note sulla Configurazione SDI</Typography>
                <Typography variant="body2" paragraph>
                  <strong>SDICoop:</strong> Richiede un certificato digitale valido (file .pfx) installato sul server. 
                  Il thumbprint deve corrispondere al certificato nel Windows Certificate Store (LocalMachine\\My).
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>PEC:</strong> Richiede un indirizzo PEC valido con credenziali IMAP per ricevere le notifiche 
                  di ricezione/rifiuto/consegna dal SDI. La porta IMAP standard SSL è 993.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Modalità Test:</strong> Usa l'ambiente di test SDI (endpoint diversi, nessuna validità legale). 
                  Attivare solo per sviluppo e test. Disattivare per produzione.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}