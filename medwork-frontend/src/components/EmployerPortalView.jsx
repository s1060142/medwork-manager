import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import DownloadIcon from '@mui/icons-material/Download'
import FolderZipIcon from '@mui/icons-material/FolderZip'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import PersonIcon from '@mui/icons-material/Person'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'

import { apiGet, apiGetRawBlob, apiSend, getApiBaseUrl, getHeaders } from '../services/apiClient'

export default function EmployerPortalView({ companyId: propCompanyId = null }) {
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(propCompanyId || 'all')
  const [employees, setEmployees] = useState([])
  const [visits, setVisits] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [feedback, setFeedback] = useState(null)
  const [zipLoading, setZipLoading] = useState(false)
  const [downloadingEmpId, setDownloadingEmpId] = useState(null)

  // New hire / movement dialog
  const [movementDialogOpen, setMovementDialogOpen] = useState(false)
  const [savingMovement, setSavingMovement] = useState(false)
  const [movementForm, setMovementForm] = useState({
    firstName: '',
    lastName: '',
    taxCode: '',
    jobRole: '',
    department: '',
    notes: '',
  })

  useEffect(() => {
    loadPortalData()
  }, [])

  const loadPortalData = async () => {
    setLoading(true)
    setFeedback(null)
    try {
      const [compData, empData, visitsData] = await Promise.all([
        apiGet('/api/master-data/companies').catch(() => []),
        apiGet('/api/master-data/employees').catch(() => []),
        apiGet('/api/visit-judgments').catch(() => [])
      ])

      const unwrap = (d) => (Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : (d?.items || [])))
      const compList = unwrap(compData)
      const empList = unwrap(empData)
      const visitList = unwrap(visitsData)

      setCompanies(compList)
      setEmployees(empList)
      setVisits(visitList)

      if (propCompanyId) {
        setSelectedCompanyId(propCompanyId)
      } else if (compList.length > 0 && selectedCompanyId === 'all') {
        setSelectedCompanyId(compList[0].id)
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Errore nel caricamento del cruscotto aziendale.' })
    } finally {
      setLoading(false)
    }
  }

  const activeCompany = useMemo(() => {
    if (selectedCompanyId === 'all') return companies[0] || null
    return companies.find((c) => Number(c.id) === Number(selectedCompanyId)) || companies[0] || null
  }, [companies, selectedCompanyId])

  const companyEmployees = useMemo(() => {
    if (!activeCompany) return []
    return employees.filter((e) => Number(e.companyId) === Number(activeCompany.id))
  }, [employees, activeCompany])

  // Attach latest judgment to each employee
  const decoratedEmployees = useMemo(() => {
    return companyEmployees.map((emp) => {
      const empVisits = visits.filter((v) => Number(v.employeeId) === Number(emp.id) || v.employeeTaxCode === emp.taxCode)
      const latest = empVisits.length > 0
        ? empVisits.sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0))[0]
        : null

      let complianceStatus = 'VALID'
      if (!latest) {
        complianceStatus = 'TO_EXAMINE'
      } else if (latest.nextDeadlineDate) {
        const deadline = new Date(latest.nextDeadlineDate)
        const now = new Date()
        const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
        if (diffDays < 0) {
          complianceStatus = 'EXPIRED'
        } else if (diffDays <= 60) {
          complianceStatus = 'EXPIRING'
        }
      }

      return {
        ...emp,
        latestVisit: latest,
        complianceStatus,
      }
    })
  }, [companyEmployees, visits])

  const filteredEmployees = useMemo(() => {
    return decoratedEmployees.filter((emp) => {
      if (statusFilter !== 'all' && emp.complianceStatus !== statusFilter) {
        return false
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase()
        const match =
          (emp.firstName || '').toLowerCase().includes(q) ||
          (emp.lastName || '').toLowerCase().includes(q) ||
          (emp.taxCode || '').toLowerCase().includes(q) ||
          (emp.jobRole || '').toLowerCase().includes(q) ||
          (emp.department || '').toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [decoratedEmployees, statusFilter, searchTerm])

  const metrics = useMemo(() => {
    const total = decoratedEmployees.length
    const valid = decoratedEmployees.filter((e) => e.complianceStatus === 'VALID').length
    const expiring = decoratedEmployees.filter((e) => e.complianceStatus === 'EXPIRING').length
    const expired = decoratedEmployees.filter((e) => e.complianceStatus === 'EXPIRED').length
    const toExamine = decoratedEmployees.filter((e) => e.complianceStatus === 'TO_EXAMINE').length
    const complianceRate = total > 0 ? Math.round((valid / total) * 100) : 100

    return { total, valid, expiring, expired, toExamine, complianceRate }
  }, [decoratedEmployees])

  const handleDownloadSinglePdf = async (emp) => {
    if (!emp.latestVisit?.id) {
      setFeedback({
        type: 'warning',
        message: `Nessun giudizio di idoneità registrato per ${emp.lastName} ${emp.firstName}.`,
      })
      return
    }
    setDownloadingEmpId(emp.id)
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/documents/visits/${emp.latestVisit.id}/fitness-judgment-pdf`,
        { headers: getHeaders() }
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Giudizio_Idoneita_${emp.lastName}_${emp.firstName}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Errore nel download del certificato per ${emp.lastName} ${emp.firstName}.`,
      })
    } finally {
      setDownloadingEmpId(null)
    }
  }

  const handleDownloadAllZip = async () => {
    if (!activeCompany?.id) return
    setZipLoading(true)
    setFeedback(null)
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/documents/company/${activeCompany.id}/judgments-zip`,
        { headers: getHeaders() }
      )
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeComp = (activeCompany.name || 'Azienda').replace(/[\s/]/g, '_')
      a.download = `Archivio_Giudizi_Idoneita_${safeComp}.zip`
      a.click()
      window.URL.revokeObjectURL(url)
      setFeedback({ type: 'success', message: '✓ Archivio ZIP dei giudizi scaricato con successo.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Impossibile scaricare l\'archivio ZIP.' })
    } finally {
      setZipLoading(false)
    }
  }

  const handleCreateMovement = async () => {
    if (!movementForm.firstName || !movementForm.lastName || !movementForm.taxCode) {
      setFeedback({ type: 'warning', message: 'Compila Nome, Cognome e Codice Fiscale obbligatori.' })
      return
    }
    setSavingMovement(true)
    try {
      const payload = {
        companyId: activeCompany.id,
        firstName: movementForm.firstName,
        lastName: movementForm.lastName,
        taxCode: movementForm.taxCode.toUpperCase(),
        jobRole: movementForm.jobRole || 'Operaio',
        department: movementForm.department || 'Produzione',
        isActive: true,
      }
      await apiSend('POST', '/api/master-data/employees', payload)
      setFeedback({ type: 'success', message: '✓ Notifica lavoratore registrata con successo nel piano di sorveglianza.' })
      setMovementDialogOpen(false)
      setMovementForm({ firstName: '', lastName: '', taxCode: '', jobRole: '', department: '', notes: '' })
      loadPortalData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Errore nella registrazione della notifica lavoratore.' })
    } finally {
      setSavingMovement(false)
    }
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 1500, mx: 'auto', p: 2.5 }}>
      {/* HEADER PORTALE DATORE DI LAVORO / RSPP */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <BusinessIcon color="primary" sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="#0f172a">
                  Portale Datore di Lavoro & RSPP (D.Lgs. 81/08)
                </Typography>
                <Typography variant="body2" color="primary" fontWeight={600}>
                  Portale di consultazione idoneità e conformità sanitaria
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Azienda: <strong>{activeCompany?.name || 'Seleziona Azienda'}</strong> • P.IVA: {activeCompany?.vatNumber || activeCompany?.taxCode || '-'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {companies.length > 1 && (
              <TextField
                select
                size="small"
                label="Seleziona Azienda"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                sx={{ minWidth: 220 }}
              >
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            )}

            <Button
              variant="contained"
              color="primary"
              startIcon={zipLoading ? <CircularProgress size={18} color="inherit" /> : <FolderZipIcon />}
              disabled={zipLoading || companyEmployees.length === 0}
              onClick={handleDownloadAllZip}
              sx={{ fontWeight: 600 }}
            >
              {zipLoading ? 'Generazione ZIP...' : 'Scarica Tutti i Giudizi (ZIP)'}
            </Button>

            <Button
              variant="outlined"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={() => setMovementDialogOpen(true)}
              sx={{ fontWeight: 600 }}
            >
              Segnala Lavoratore
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {feedback && (
        <Alert severity={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* KPI CARDS */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card variant="outlined" sx={{ borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                ORGANICO SORVEGLIANZA
              </Typography>
              <Typography variant="h4" fontWeight={700} color="#0f172a" sx={{ mt: 0.5 }}>
                {metrics.total}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Lavoratori registrati
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card variant="outlined" sx={{ borderRadius: 2, borderLeft: '4px solid #2e7d32' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                COMPLIANCE SORVEGLIANZA
              </Typography>
              <Typography variant="h4" fontWeight={700} color="#2e7d32" sx={{ mt: 0.5 }}>
                {metrics.valid} ({metrics.complianceRate}%)
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 0.5, fontWeight: 500 }}>
                Compliance Sorveglianza: {metrics.complianceRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card variant="outlined" sx={{ borderRadius: 2, borderLeft: '4px solid #ed6c02' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                IN SCADENZA (60 GG)
              </Typography>
              <Typography variant="h4" fontWeight={700} color="#ed6c02" sx={{ mt: 0.5 }}>
                {metrics.expiring}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Da pianificare a breve
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card variant="outlined" sx={{ borderRadius: 2, borderLeft: '4px solid #d32f2f' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                SCADUTI / NON RINNOVATI
              </Typography>
              <Typography variant="h4" fontWeight={700} color="#d32f2f" sx={{ mt: 0.5 }}>
                {metrics.expired}
              </Typography>
              <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                Attenzione richiesta
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card variant="outlined" sx={{ borderRadius: 2, borderLeft: '4px solid #0288d1' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                DA SOTTOPORRE A VISITA
              </Typography>
              <Typography variant="h4" fontWeight={700} color="#0288d1" sx={{ mt: 0.5 }}>
                {metrics.toExamine}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Nuove assunzioni / cambio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* REGISTRO IDONEITA LAVORATORI */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ mb: 2.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#0f172a">
              Registro Lavoratori & Giudizi di Idoneità (Copia Datore di Lavoro)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Garanzia di conformità GDPR: visualizzazione limitata alle sole conclusioni legali (senza dati clinici o anamnestici).
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Cerca lavoratore, CF, mansione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 260 } }}
            />
            <TextField
              select
              size="small"
              label="Stato Idoneità"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="all">Tutti gli stati</MenuItem>
              <MenuItem value="VALID">Validi</MenuItem>
              <MenuItem value="EXPIRING">In scadenza (&lt; 60 gg)</MenuItem>
              <MenuItem value="EXPIRED">Scaduti</MenuItem>
              <MenuItem value="TO_EXAMINE">Da sottoporre</MenuItem>
            </TextField>
          </Stack>
        </Stack>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          {loading ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <CircularProgress size={32} />
              <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">Caricamento registro lavoratori...</Typography>
            </Box>
          ) : filteredEmployees.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Nessun lavoratore trovato per i filtri selezionati.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Lavoratore</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Codice Fiscale</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mansione / Reparto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Data Ultima Visita</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Scadenza Idoneità</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Esito Formale</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Prescrizioni / Limitazioni</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Certificato PDF</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.map((emp) => {
                  const visit = emp.latestVisit
                  const visitDateStr = visit?.visitDate ? new Date(visit.visitDate).toLocaleDateString('it-IT') : '-'
                  const deadlineStr = visit?.nextDeadlineDate ? new Date(visit.nextDeadlineDate).toLocaleDateString('it-IT') : '-'
                  const prescText = [visit?.prescriptions, visit?.limitations].filter(Boolean).join(' • ') || '-'

                  let statusChip = (
                    <Chip size="small" icon={<CheckCircleIcon />} label="Idoneo" color="success" />
                  )
                  if (emp.complianceStatus === 'EXPIRING') {
                    statusChip = <Chip size="small" icon={<WarningAmberIcon />} label="In Scadenza" color="warning" />
                  } else if (emp.complianceStatus === 'EXPIRED') {
                    statusChip = <Chip size="small" icon={<ErrorOutlineIcon />} label="Scaduto" color="error" />
                  } else if (emp.complianceStatus === 'TO_EXAMINE') {
                    statusChip = <Chip size="small" label="Da sottoporre" color="info" variant="outlined" />
                  }

                  return (
                    <TableRow key={emp.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {emp.lastName} {emp.firstName}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {emp.taxCode}
                      </TableCell>
                      <TableCell>{emp.jobRole || 'Operaio'} {emp.department ? `(${emp.department})` : ''}</TableCell>
                      <TableCell>{visitDateStr}</TableCell>
                      <TableCell>{deadlineStr}</TableCell>
                      <TableCell>{statusChip}</TableCell>
                      <TableCell sx={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prescText}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Scarica Giudizio di Idoneità PDF (Art. 41 D.Lgs. 81/08)">
                          <span>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={downloadingEmpId === emp.id ? <CircularProgress size={16} /> : <DownloadIcon />}
                              disabled={!visit || downloadingEmpId === emp.id}
                              onClick={() => handleDownloadSinglePdf(emp)}
                              sx={{ textTransform: 'none', fontSize: '0.78rem' }}
                            >
                              PDF
                            </Button>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Paper>

      {/* DIALOG SEGNALAZIONE LAVORATORE */}
      <Dialog open={movementDialogOpen} onClose={() => setMovementDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0f1f3d', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
            Segnalazione Lavoratore / Assunzione / Cambio Mansione
          </Typography>
          <IconButton size="small" onClick={() => setMovementDialogOpen(false)} sx={{ color: '#ffffff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3, mt: 1 }}>
          <Stack spacing={2.5}>
            <Alert severity="info">
              Invia i dati del lavoratore al Medico Competente per l'inclusione nel protocollo di sorveglianza sanitaria e la pianificazione della visita preventiva.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nome *"
                  fullWidth
                  value={movementForm.firstName}
                  onChange={(e) => setMovementForm({ ...movementForm, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cognome *"
                  fullWidth
                  value={movementForm.lastName}
                  onChange={(e) => setMovementForm({ ...movementForm, lastName: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              label="Codice Fiscale *"
              fullWidth
              value={movementForm.taxCode}
              onChange={(e) => setMovementForm({ ...movementForm, taxCode: e.target.value.toUpperCase() })}
              inputProps={{ maxLength: 16 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mansione Specifica"
                  fullWidth
                  value={movementForm.jobRole}
                  onChange={(e) => setMovementForm({ ...movementForm, jobRole: e.target.value })}
                  placeholder="Es. Carrellista, Saldatore..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Reparto / Cantiere"
                  fullWidth
                  value={movementForm.department}
                  onChange={(e) => setMovementForm({ ...movementForm, department: e.target.value })}
                  placeholder="Es. Logistica, Produzione..."
                />
              </Grid>
            </Grid>
            <TextField
              label="Note operative per il Medico Competente"
              multiline
              rows={2}
              fullWidth
              value={movementForm.notes}
              onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
              placeholder="Es. Nuova assunzione con decorrenza dal 1° del mese; richiede visita preventiva pre-assuntiva."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setMovementDialogOpen(false)}>Annulla</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={savingMovement}
            onClick={handleCreateMovement}
            sx={{ fontWeight: 600 }}
          >
            {savingMovement ? 'Invio in corso...' : 'Invia Segnalazione'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
