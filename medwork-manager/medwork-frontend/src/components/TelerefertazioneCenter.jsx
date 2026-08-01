import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  FilterList as FilterListIcon,
  HourglassEmpty as HourglassEmptyIcon,
  MedicalServices as MedicalServicesIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { apiGet, apiSend } from '../services/apiClient'

const STATUS_CHIPS = {
  Pending: { label: 'In attesa', color: 'warning', icon: <HourglassEmptyIcon fontSize="small" /> },
  Completed: { label: 'Completato', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  Draft: { label: 'Bozza', color: 'default', icon: <AssignmentIcon fontSize="small" /> },
  Signed: { label: 'Firmato', color: 'primary', icon: <SendIcon fontSize="small" /> },
}

function formatDate(dateValue) {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(dateValue) {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function daysSince(dateValue) {
  if (!dateValue) return null
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null
  const now = new Date()
  const diffMs = now - date
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export default function TelerefertazioneCenter() {
  const [queue, setQueue] = useState([])
  const [reports, setReports] = useState([])
  const [cardiologists, setCardiologists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [formData, setFormData] = useState({
    visitExamId: '',
    cardiologistId: '',
    reportContent: '',
    status: 'Pending',
  })
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [queueData, reportsData, cardiologistsData] = await Promise.all([
        apiGet('/api/telerefertazione/coda').catch(() => []),
        apiGet('/api/telerefertazione/referti').catch(() => []),
        apiGet('/api/master-data/doctors').catch(() => []),
      ])
      setQueue(Array.isArray(queueData) ? queueData : [])
      setReports(Array.isArray(reportsData) ? reportsData : [])
      setCardiologists(Array.isArray(cardiologistsData) ? cardiologistsData : [])
    } catch (err) {
      setError(err.message || 'Errore durante il caricamento dei dati.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => !search || (r.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.examTypeName || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.cardiologistName || '').toLowerCase().includes(search.toLowerCase()))
      .filter((r) => !statusFilter || r.status === statusFilter)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [reports, search, statusFilter])

  const handleView = (report) => {
    setSelectedReport(report)
    setViewDialogOpen(true)
  }

  const handleEdit = (report) => {
    setSelectedReport(report)
    setFormData({
      visitExamId: report.visitExamId,
      cardiologistId: report.cardiologistId,
      reportContent: report.reportContent || '',
      status: report.status || 'Pending',
    })
    setEditDialogOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedReport(null)
    setFormData({
      visitExamId: '',
      cardiologistId: '',
      reportContent: '',
      status: 'Pending',
    })
    setEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.visitExamId || !formData.reportContent.trim()) {
      alert('Esame e contenuto referto sono obbligatori.')
      return
    }
    setSubmitting(true)
    try {
      if (selectedReport) {
        await apiSend('PUT', `/api/telerefertazione/referti/${selectedReport.id}`, formData)
      } else {
        await apiSend('POST', '/api/telerefertazione/referti', formData)
      }
      setEditDialogOpen(false)
      await loadData()
    } catch (err) {
      alert(err.message || 'Errore durante il salvataggio.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSign = async (reportId) => {
    if (!window.confirm('Firmare il referto? Questa operazione lo marca come Completato.')) return
    try {
      await apiSend('POST', `/api/telerefertazione/referti/${reportId}/firma`, { cardiologistId: 0 })
      await loadData()
    } catch (err) {
      alert(err.message || 'Errore durante la firma.')
    }
  }

  const handleDelete = async (reportId) => {
    if (!window.confirm('Eliminare definitivamente questo referto?')) return
    try {
      await apiSend('DELETE', `/api/telerefertazione/referti/${reportId}`)
      await loadData()
    } catch (err) {
      alert(err.message || 'Errore durante l\'eliminazione.')
    }
  }

  const getSlaBadge = (createdAt) => {
    const days = daysSince(createdAt)
    if (days === null) return <Chip label="N/D" size="small" color="default" />
    if (days <= 1) return <Chip label={`${days}g (entro 24h)`} size="small" color="success" icon={<CheckCircleIcon fontSize="small" />} />
    if (days <= 2) return <Chip label={`${days}g (entro 48h)`} size="small" color="warning" icon={<WarningIcon fontSize="small" />} />
    return <Chip label={`${days}g (SCADUTO)`} size="small" color="error" icon={<ErrorIcon fontSize="small" />} />
  }

  const StatusChip = ({ status }) => {
    const cfg = STATUS_CHIPS[status] || { label: status, color: 'default' }
    return (
      <Chip label={cfg.label} size="small" color={cfg.color} icon={cfg.icon} variant="outlined" />
    )
  }

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <MedicalServicesIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Telerefertazione ECG</Typography>
            <Typography variant="body2" color="text.secondary">Piattaforma cardiologi • SLA 24/48h</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} disabled={loading}>Aggiorna</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateNew}>Nuovo Referto</Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

      {/* Coda ECG (esami senza referto) */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HourglassEmptyIcon color="warning" /> Coda ECG da refertare ({queue.length})
        </Typography>
        {queue.length === 0 ? (
          <Typography color="text.secondary" variant="body1">Nessun esame ECG in attesa di referto.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Lavoratore</TableCell>
                  <TableCell>Azienda</TableCell>
                  <TableCell>Esame</TableCell>
                  <TableCell>Data visita</TableCell>
                  <TableCell>Esito esame</TableCell>
                  <TableCell align="right">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queue.map((item) => (
                                  <TableRow key={item.visitExamId} hover>
                                    <TableCell>{item.employeeName}</TableCell>
                                    <TableCell>{item.companyName}</TableCell>
                                    <TableCell>{item.examTypeName}</TableCell>
                                    <TableCell>{formatDate(item.visitDate)}</TableCell>
                                    <TableCell>
                                      <Typography variant="body2" component="span" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                        {item.result || '-'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Tooltip title="Crea referto">
                                        <IconButton size="small" onClick={() => {
                                          setFormData(prev => ({ ...prev, visitExamId: item.visitExamId, reportContent: item.result || '' }))
                                          setEditDialogOpen(true)
                                        }}>
                                          <AddIcon />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))} 
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )} 
                      </Paper>

      {/* Lista Referti */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          <Typography variant="h6">Referti Cardiologici</Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="status-filter-label">Stato</InputLabel>
              <Select labelId="status-filter-label" value={statusFilter} label="Stato" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="Pending">In attesa</MenuItem>
                <MenuItem value="Draft">Bozza</MenuItem>
                <MenuItem value="Completed">Completato</MenuItem>
                <MenuItem value="Signed">Firmato</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Cerca lavoratore, esame, medico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
              sx={{ minWidth: 260 }}
            />
          </Stack>
        </Stack>

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

        {!loading && filteredReports.length === 0 && (
          <Typography color="text.secondary" variant="body1" sx={{ textAlign: 'center', py: 4 }}>
            Nessun referto trovato.
          </Typography>
        )}

        {!loading && filteredReports.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Lavoratore</TableCell>
                  <TableCell>Esame</TableCell>
                  <TableCell>Data visita</TableCell>
                  <TableCell>Cardiologo</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>SLA</TableCell>
                  <TableCell>Creato il</TableCell>
                  <TableCell align="right">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>{report.employeeName || `- (ID: ${report.employeeId})`}</TableCell>
                    <TableCell>{report.examTypeName || '-'}</TableCell>
                    <TableCell>{formatDate(report.visitDate)}</TableCell>
                    <TableCell>{report.cardiologistName || '-'}</TableCell>
                    <TableCell><StatusChip status={report.status} /></TableCell>
                    <TableCell align="center">{getSlaBadge(report.createdAt)}</TableCell>
                    <TableCell>{formatDateTime(report.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Visualizza">
                        <IconButton size="small" onClick={() => handleView(report)}><VisibilityIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title="Modifica">
                        <IconButton size="small" onClick={() => handleEdit(report)}><EditIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title="Duplica">
                        <IconButton size="small" onClick={() => {
                          setFormData({
                            visitExamId: report.visitExamId,
                            cardiologistId: report.cardiologistId,
                            reportContent: report.reportContent || '',
                            status: 'Draft',
                          })
                          setEditDialogOpen(true)
                        }}><ContentCopyIcon /></IconButton>
                      </Tooltip>
                      {report.status !== 'Signed' && (
                        <Tooltip title="Firma (Completa)">
                          <IconButton size="small" color="success" onClick={() => handleSign(report.id)}><SendIcon /></IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Elimina">
                        <IconButton size="small" color="error" onClick={() => handleDelete(report.id)}><DeleteIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                                  ))} 
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
      </Paper>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedReport ? `Referto #${selectedReport.id}` : 'Dettaglio Referto'}</DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          {selectedReport && (
            <Stack spacing={2} sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Lavoratore</Typography>
                  <Typography variant="body1">{selectedReport.employeeName || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Azienda</Typography>
                  <Typography variant="body1">{selectedReport.companyName || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Esame</Typography>
                  <Typography variant="body1">{selectedReport.examTypeName || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Data visita</Typography>
                  <Typography variant="body1">{formatDate(selectedReport.visitDate)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Cardiologo</Typography>
                  <Typography variant="body1">{selectedReport.cardiologistName || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Stato</Typography>
                  <StatusChip status={selectedReport.status} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">SLA</Typography>
                  {getSlaBadge(selectedReport.createdAt)}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Creato il</Typography>
                  <Typography variant="body1">{formatDateTime(selectedReport.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Firmato il</Typography>
                  <Typography variant="body1">{selectedReport.signedOffAt ? formatDateTime(selectedReport.signedOffAt) : '-'}</Typography>
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Contenuto referto</Typography>
              <Paper variant="outlined" sx={{ p: 2, bg: 'grey.50', whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 300, overflow: 'auto' }}>
                {selectedReport.reportContent || '-'}
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{selectedReport ? 'Modifica Referto' : 'Nuovo Referto'}</DialogTitle>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} sx={{ p: 2, minWidth: 500 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="exam-label">Esame ECG *</InputLabel>
                  <Select labelId="exam-label" value={formData.visitExamId} label="Esame ECG" onChange={(e) => setFormData(prev => ({ ...prev, visitExamId: e.target.value }))}>
                    {queue.map((item) => (
                      <MenuItem key={item.visitExamId} value={item.visitExamId}>
                        {item.employeeName} - {item.examTypeName} ({formatDate(item.visitDate)})
                      </MenuItem>
                    ))}
                    {reports.map((r) => (
                      <MenuItem key={r.visitExamId} value={r.visitExamId}>
                        {r.employeeName} - {r.examTypeName} ({formatDate(r.visitDate)}) - [già refertato]
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="cardio-label">Cardiologo</InputLabel>
                  <Select labelId="cardio-label" value={formData.cardiologistId} label="Cardiologo" onChange={(e) => setFormData(prev => ({ ...prev, cardiologistId: e.target.value ? Number(e.target.value) : '' }))}>
                    <MenuItem value="">Non assegnato</MenuItem>
                    {cardiologists.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.firstName} {d.lastName} {d.medicalLicenseNumber ? `(${d.medicalLicenseNumber})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Stato</InputLabel>
                  <Select labelId="status-label" value={formData.status} label="Stato" onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}>
                    <MenuItem value="Draft">Bozza</MenuItem>
                    <MenuItem value="Pending">In attesa</MenuItem>
                    <MenuItem value="Completed">Completato</MenuItem>
                    <MenuItem value="Signed">Firmato</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  label="Contenuto Referto *"
                  value={formData.reportContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportContent: e.target.value }))}
                  placeholder="Diagnosi, conclusioni, raccomandazioni..."
                  required
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={submitting}>Annulla</Button>
          <Button variant="contained" type="submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : (selectedReport ? 'Salva' : 'Crea')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}