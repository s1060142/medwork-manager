import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import EventIcon from '@mui/icons-material/Event'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DrawIcon from '@mui/icons-material/Draw'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SendIcon from '@mui/icons-material/Send'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import ShieldIcon from '@mui/icons-material/Shield'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import AssignmentIcon from '@mui/icons-material/Assignment'
import EmailIcon from '@mui/icons-material/Email'
import RefreshIcon from '@mui/icons-material/Refresh'
import { apiGet, apiSend } from '../services/apiClient'

export default function Dashboard({ onOpenMedicalVisitCreate, onNavigateModule }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [digestStatus, setDigestStatus] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet('/api/doctor-data/dashboard')
      setSummary(data)
    } catch (err) {
      setError(err.message || 'Errore nel caricamento della dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSendMorningDigest = async () => {
    try {
      setDigestStatus('Invio in corso...')
      await apiSend('POST', '/api/doctor-data/agenda/morning-digest', {})
      setDigestStatus('✓ Morning Digest inviato con successo alla tua email aziendale!')
      setTimeout(() => setDigestStatus(''), 4000)
    } catch (err) {
      setDigestStatus('Errore invio digest: ' + (err.message || 'Server error'))
      setTimeout(() => setDigestStatus(''), 4000)
    }
  }

  const todayStr = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (loading && !summary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={3} sx={{ pb: 4 }}>
      {/* HERO GREETING & QUICK ACTIONS */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0f1f3d 0%, #1e3a8a 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="overline" sx={{ color: '#93c5fd', letterSpacing: 1.5, fontWeight: 700 }}>
              COCKPIT OPERATIVO MEDICO COMPETENTE (D.LGS. 81/08)
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
              Il Mio Giorno
            </Typography>
            <Typography variant="body2" sx={{ color: '#e2e8f0', mt: 0.5, textTransform: 'capitalize' }}>
              📅 {todayStr}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="outlined"
              sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', textTransform: 'none' }}
              startIcon={<EmailIcon />}
              onClick={handleSendMorningDigest}
            >
              Morning Digest
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' }, textTransform: 'none', fontWeight: 700 }}
              startIcon={<MedicalServicesIcon />}
              onClick={() => onOpenMedicalVisitCreate && onOpenMedicalVisitCreate()}
            >
              + Nuova Visita Medica
            </Button>
            <IconButton sx={{ color: '#ffffff' }} onClick={loadData} title="Aggiorna dati">
              <RefreshIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {digestStatus && <Alert severity={digestStatus.startsWith('✓') ? 'success' : 'info'}>{digestStatus}</Alert>}

      {/* KPI METRICS CARDS */}
      <Grid container spacing={2.5}>
        {/* Visite Oggi */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '5px solid #1976d2', height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    VISITE IN PROGRAMMA OGGI
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="#1976d2" sx={{ my: 0.5 }}>
                    {summary?.visitsToday ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pazienti schedulati in giornata
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1976d2', width: 44, height: 44 }}>
                  <EventIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Giudizi da Firmare */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            variant="outlined" 
            sx={{ 
              borderRadius: 3, 
              borderLeft: '5px solid #7c3aed', 
              height: '100%',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#faf5ff' }
            }}
            onClick={() => onNavigateModule && onNavigateModule('batch-signature')}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    GIUDIZI DA FIRMARE
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="#7c3aed" sx={{ my: 0.5 }}>
                    {summary?.pendingSignatures ?? 0}
                  </Typography>
                  <Typography variant="caption" color="#7c3aed" fontWeight={600}>
                    Firma Multipla Digitale →
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f3e8ff', color: '#7c3aed', width: 44, height: 44 }}>
                  <DrawIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Scadenze 7 Giorni */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            variant="outlined" 
            sx={{ 
              borderRadius: 3, 
              borderLeft: '5px solid #ed6c02', 
              height: '100%',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#fffbf5' }
            }}
            onClick={() => onNavigateModule && onNavigateModule('schedules')}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    SCADENZE VISITE (7 GG)
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="#ed6c02" sx={{ my: 0.5 }}>
                    {summary?.deadlinesThisWeek ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary?.overdueVisits ? `${summary.overdueVisits} già scadute` : 'In scadenza a breve'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#fff3e0', color: '#ed6c02', width: 44, height: 44 }}>
                  <WarningIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Radar */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            variant="outlined" 
            sx={{ 
              borderRadius: 3, 
              borderLeft: '5px solid #16a34a', 
              height: '100%',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f0fdf4' }
            }}
            onClick={() => onNavigateModule && onNavigateModule('compliance')}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ width: '100%', mr: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    COMPLIANCE D.LGS. 81/08
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="#16a34a" sx={{ my: 0.5 }}>
                    {summary?.complianceScore ?? 98}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={summary?.complianceScore ?? 98} 
                    color={summary?.complianceScore > 90 ? 'success' : summary?.complianceScore > 75 ? 'warning' : 'error'}
                    sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                  />
                </Box>
                <Avatar sx={{ bgcolor: '#dcfce7', color: '#16a34a', width: 44, height: 44 }}>
                  <ShieldIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AGENDA PAZIENTI DEL GIORNO (ONE-CLICK APPOINTMENT -> VISIT) */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#ffffff' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#0f1f3d">
              📅 Agenda Pazienti & Visite del Giorno
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avvia la visita medica in 1 clic per accedere subito a cartella, anamnesi e reperti.
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onNavigateModule && onNavigateModule('schedules')}
          >
            Visualizza Calendario Completo →
          </Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell><strong>Orario</strong></TableCell>
                <TableCell><strong>Lavoratore</strong></TableCell>
                <TableCell><strong>Codice Fiscale</strong></TableCell>
                <TableCell><strong>Azienda & Mansione</strong></TableCell>
                <TableCell><strong>Tipo Visita</strong></TableCell>
                <TableCell><strong>Stato</strong></TableCell>
                <TableCell align="right"><strong>Azione Medico</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(!summary?.todaySchedule || summary.todaySchedule.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nessuna visita programmata per oggi. Usa i pulsanti sopra per pianificare visite o richiamare lavoratori.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                summary.todaySchedule.map((item) => (
                  <TableRow key={item.visitId} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#1976d2">
                        {item.time || '09:00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {item.employeeName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {item.taxCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.companyName}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.jobRole}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.visitType} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        size="small"
                        color={item.isSigned ? 'success' : item.status.includes('Completata') ? 'info' : 'warning'}
                        sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => {
                          if (onOpenMedicalVisitCreate) {
                            onOpenMedicalVisitCreate(item.employeeId)
                          }
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Avvia Visita
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* QUICK WORKFLOW SHORTCUTS */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2.5, 
              borderRadius: 3, 
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
            }}
            onClick={() => onNavigateModule && onNavigateModule('visit-planning')}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0284c7' }}>
                <GroupAddIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Pianificatore Massivo Visite
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Genera sessioni di visita sequenziali per reparti e aziende in blocco.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2.5, 
              borderRadius: 3, 
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
            }}
            onClick={() => onNavigateModule && onNavigateModule('recall-campaigns')}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#fef3c7', color: '#d97706' }}>
                <SendIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Convocazioni & Recall Automatici
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Lancia solleciti automatizzati via Email/SMS per idoneità in scadenza.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2.5, 
              borderRadius: 3, 
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
            }}
            onClick={() => onNavigateModule && onNavigateModule('protocols')}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#dcfce7', color: '#15803d' }}>
                <AssignmentIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Smart Protocol Generator
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Genera protocolli sanitari basati sui fattori di rischio e mansioni D.Lgs. 81.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  )
}

