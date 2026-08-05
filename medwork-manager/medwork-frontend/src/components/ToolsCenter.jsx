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
  Alert,
  Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import SendIcon from '@mui/icons-material/Send'
import DescriptionIcon from '@mui/icons-material/Description'
import AssessmentIcon from '@mui/icons-material/Assessment'
import MailIcon from '@mui/icons-material/Mail'
import BuildIcon from '@mui/icons-material/Build'
import SyncIcon from '@mui/icons-material/Sync'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import CloudDoneIcon from '@mui/icons-material/CloudDone'
import { apiGet, apiSend } from '../services/apiClient'
import { isOnlineMode, startBackgroundSync, stopBackgroundSync, processSyncQueue, getPendingSyncItems } from '../utils/offlineSupport'

const TOOL_TABS = [
  { key: 'relazione-sanitaria', label: 'Relazione sanitaria', icon: AssessmentIcon },
  { key: 'allegato-3b', label: 'Allegato 3B', icon: DescriptionIcon },
  { key: 'importazioni', label: 'Importazioni', icon: DescriptionIcon },
  { key: 'documentazione', label: 'Documentazione', icon: DescriptionIcon },
  { key: 'attivita-coda', label: 'Attività in coda', icon: AssessmentIcon },
  { key: 'cassetto-firme', label: 'Cassetto delle firme', icon: AssessmentIcon },
  { key: 'messaggi-inviati', label: 'Messaggi inviati', icon: MailIcon },
  { key: 'stampe-personalizzate', label: 'Stampe personalizzate', icon: BuildIcon },
  { key: 'interfacce-personalizzate', label: 'Interfacce personalizzate', icon: BuildIcon },
  { key: 'mail-personalizzate', label: 'Mail personalizzate', icon: MailIcon },
  { key: 'sincronizzazione', label: 'Sincronizzazione dati', icon: SyncIcon },
]

export default function ToolsCenter() {
  const [activeTab, setActiveTab] = useState('relazione-sanitaria')
  const [companies, setCompanies] = useState([])
  const [excludedExams, setExcludedExams] = useState([])
  const [excludedSearch, setExcludedSearch] = useState('')
  const [examTypes, setExamTypes] = useState([])
  const [allegato3bYear, setAllegato3bYear] = useState(new Date().getFullYear().toString())
  const [allegato3bFormat, setAllegato3bFormat] = useState('excel')
  const [allegato3bGroupBy, setAllegato3bGroupBy] = useState('company')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  // Initialize offline support and start background sync
  useEffect(() => {
    const unsubscribeOnline = (online) => setOnline(online)
    const unsubscribe = (online) => unsubscribeOnline(online)
    
    // We need to use the actual listener from offlineSupport
    // This is a simplified version - in reality we'd use the proper listener
    const checkOnline = () => setOnline(navigator.onLine)
    window.addEventListener('online', checkOnline)
    window.addEventListener('offline', checkOnline)
    
    startBackgroundSync()
    
    // Update pending sync count periodically
    const interval = setInterval(async () => {
      const pending = await getPendingSyncItems()
      setPendingSyncCount(pending.filter(p => p.status === 'pending').length)
    }, 5000)
    
    return () => {
      window.removeEventListener('online', checkOnline)
      window.removeEventListener('offline', checkOnline)
      clearInterval(interval)
      stopBackgroundSync()
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    Promise.all([
      apiGet('/api/master-data/companies'),
      apiGet('/api/master-data/exam-types'),
    ]).then(([companyData, examData]) => {
      setCompanies(Array.isArray(companyData) ? companyData : [])
      setExamTypes(Array.isArray(examData) ? examData : [])
    }).catch(() => {
      setCompanies([])
      setExamTypes([])
    })
  }, [])

  const filteredExamTypes = examTypes.filter(e =>
    e.name.toLowerCase().includes(excludedSearch.toLowerCase())
  )

  const handleAddExcluded = (exam) => {
    if (!excludedExams.find(x => x.id === exam.id)) {
      setExcludedExams(prev => [...prev, { ...exam, excludedAt: new Date().toISOString() }])
      setExcludedSearch('')
    }
  }

  const handleRemoveExcluded = (id) => {
    setExcludedExams(prev => prev.filter(x => x.id !== id))
  }

  const handleGenerateReport = async () => {
    setLoading(true)
    try {
      // In real app, this would call the backend to generate the report
      await new Promise(resolve => setTimeout(resolve, 1500))
      alert('Relazione sanitaria generata con successo!')
    } catch (error) {
      alert('Errore durante la generazione')
    } finally {
      setLoading(false)
    }
  }

  const handleExportAllegato3B = async () => {
    setLoading(true)
    try {
      // In real app, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert(`Allegato 3B esportato in formato ${allegato3bFormat.toUpperCase()}`)
    } catch (error) {
      alert('Errore durante l\'esportazione')
    } finally {
      setLoading(false)
    }
  }

  const renderRelazioneSanitaria = () => (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Parametri relazione sanitaria
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configura i parametri per la generazione della relazione sanitaria annuale.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel id="company-label">Azienda *</InputLabel>
              <Select
                labelId="company-label"
                label="Azienda"
                value={excludedExams.length > 0 ? '' : ''}
                onChange={() => {}}
              >
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
              <FormHelperText>Seleziona l'azienda per la relazione</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>
              Vedi azienda
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Data inizio *"
              type="date"
              size="small"
              value="2024-01-01"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Data fine *"
              type="date"
              size="small"
              value="2024-12-31"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Opzioni raggruppamento
        </Typography>
        <Stack spacing={1.5}>
          <FormControlLabel
            control={<Checkbox checked={true} />}
            label="Raggruppa tutti i dati per sede aziendale"
          />
          <FormControlLabel
            control={<Checkbox checked={false} />}
            label="Raggruppa dati biostatistici per protocollo"
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Button
          variant="contained"
          size="large"
          onClick={handleGenerateReport}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />}
        >
          {loading ? 'Generazione in corso...' : 'Genera Relazione Sanitaria'}
        </Button>
      </Paper>

      {/* Excluded Exams Section */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" gutterBottom>
            Accertamenti esclusi
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Cerca accertamento..."
              value={excludedSearch}
              onChange={(e) => setExcludedSearch(e.target.value)}
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
              }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => {}}>
              Aggiungi
            </Button>
          </Box>
        </Stack>

        {excludedExams.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Puoi escludere degli accertamenti
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Altrimenti lascia vuota questa tabella per includerli tutti
            </Typography>
            <Typography variant="caption" color="text.disabled">
              ↑ Cerca e aggiungi accertamenti da escludere
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Accertamento</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell align="right">Azione</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {excludedExams.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => handleRemoveExcluded(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  )

  const renderAllegato3B = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Esporta Allegato 3B
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Genera l'Allegato 3B per l'invio ai servizi competenti (D.Lgs. 81/08).
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel id="year-label">Anno di riferimento *</InputLabel>
            <Select labelId="year-label" label="Anno" value={allegato3bYear} onChange={(e) => setAllegato3bYear(e.target.value)}>
              {Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString()).map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel id="format-label">Formato esportazione</InputLabel>
            <Select labelId="format-label" value={allegato3bFormat} onChange={(e) => setAllegato3bFormat(e.target.value)}>
              <MenuItem value="excel">Excel (.xlsx)</MenuItem>
              <MenuItem value="xml">XML</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel id="group-label">Raggruppa per</InputLabel>
            <Select labelId="group-label" value={allegato3bGroupBy} onChange={(e) => setAllegato3bGroupBy(e.target.value)}>
              <MenuItem value="company">Azienda</MenuItem>
              <MenuItem value="doctor">Medico</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Button
        variant="contained"
        size="large"
        startIcon={<DownloadIcon />}
        onClick={handleExportAllegato3B}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? 'Esportazione...' : 'Esporta Allegato 3B'}
      </Button>
    </Paper>
  )

  const renderPlaceholder = (title, description, actionLabel, actionIcon, onAction) => (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <actionIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
        {description}
      </Typography>
      {onAction && (
        <Button variant="contained" startIcon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Paper>
  )

  const renderSincronizzazioneTab = () => (
    <Stack spacing={2}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" gutterBottom>Sincronizzazione dati</Typography>
            <Typography variant="body2" color="text.secondary">
              Stato connessione: <strong>{online ? 'Online' : 'Offline'}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={online ? 'Connesso' : 'Offline'}
              icon={online ? <CloudDoneIcon fontSize="small" /> : <WifiOffIcon fontSize="small" />}
              color={online ? 'success' : 'warning'}
              variant="outlined"
            />
            <Chip
              label={`In coda: ${pendingSyncCount}`}
              icon={<SyncIcon fontSize="small" />}
              color="info"
              variant="outlined"
            />
            <Button
              variant="contained"
              startIcon={<SyncIcon />}
              onClick={async () => {
                await processSyncQueue()
                const pending = await getPendingSyncItems()
                setPendingSyncCount(pending.filter(p => p.status === 'pending').length)
              }}
              disabled={!online}
            >
              Sincronizza ora
            </Button>
          </Box>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Coda di sincronizzazione
        </Typography>
      
        {pendingSyncCount === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
            <CloudDoneIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>Tutto sincronizzato</Typography>
            <Typography variant="body2" color="text.secondary">
              Non ci sono elementi in attesa di sincronizzazione.
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {pendingSyncCount} elemento{pendingSyncCount > 1 ? 'i' : ''} in attesa di sincronizzazione.
              Verranno processati automaticamente quando la connessione sarà disponibile.
            </Typography>
            <Button variant="outlined" startIcon={<SyncIcon />} onClick={processSyncQueue} disabled={!online}>
              Forza sincronizzazione
            </Button>
          </Paper>
        )}
      </Paper>
    </Stack>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'relazione-sanitaria':
        return renderRelazioneSanitaria()
      case 'allegato-3b':
        return renderAllegato3B()
      case 'importazioni':
        return renderPlaceholder(
          'Importazioni',
          'Importa dati da file esterni (Excel, CSV, XML) per popolamento anagrafiche, accertamenti, scadenze.',
          'Importa file',
          AddIcon,
          () => {}
        )
      case 'documentazione':
        return renderPlaceholder(
          'Documentazione',
          'Gestisci documenti aziendali, manuali, procedure e allegati. Carica, versione e condividi file.',
          'Carica documento',
          AddIcon,
          () => {}
        )
      case 'attivita-coda':
        return renderPlaceholder(
          'Attività in coda',
          'Monitora le attività in background: invii SDI, sincronizzazioni, report programmati, backup.',
          'Aggiorna',
          SendIcon,
          () => {}
        )
      case 'cassetto-firme':
        return renderPlaceholder(
          'Cassetto delle firme',
          'Visualizza e gestisci le firme digitali e grafometriche acquisite. Verifica validità e scadenze.',
          'Verifica firme',
          AssessmentIcon,
          () => {}
        )
      case 'messaggi-inviati':
        return renderPlaceholder(
          'Messaggi inviati',
          'Storico comunicazioni inviate: email, SMS, PEC, notifiche app. Filtra per destinatario, canale, stato.',
          'Nuovo messaggio',
          MailIcon,
          () => {}
        )
      case 'stampe-personalizzate':
        return renderPlaceholder(
          'Stampe personalizzate',
          'Crea template di stampa personalizzati per referti, certificati, relazioni. Editor drag-and-drop.',
          'Nuovo template',
          BuildIcon,
          () => {}
        )
      case 'interfacce-personalizzate':
        return renderPlaceholder(
          'Interfacce personalizzate',
          'Personalizza campi, layout e viste per utenti e ruoli. Configura campi obbligatori, visibilità, validazioni.',
          'Configura interfaccia',
          BuildIcon,
          () => {}
        )
      case 'mail-personalizzate':
              return renderPlaceholder(
                'Mail personalizzate',
                'Gestisci template email per notifiche automatiche: convocazioni, scadenze, invii SDI, report.',
                'Nuovo template',
                MailIcon,
                () => {}
              )
            case 'sincronizzazione':
              return renderSincronizzazioneTab()
            default:
        return renderPlaceholder('Strumento', 'Seleziona uno strumento dal menu', '', null, null)
    }
  }

  return (
    <Box>
      {/* Tool Tabs */}
      <Paper sx={{ p: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(event, newTab) => setActiveTab(newTab)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ width: '100%' }}
          TabIndicatorProps={{ style: { display: 'none' } }}
        >
          {TOOL_TABS.map((tab) => (
            <Tab
              key={tab.key}
              label={tab.label}
              icon={<tab.icon fontSize="small" />}
              sx={{ minWidth: 120, minHeight: 48 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {renderTabContent()}
    </Box>
  )
}