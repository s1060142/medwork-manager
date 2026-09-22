import { useEffect, useState, useMemo } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import SaveIcon from '@mui/icons-material/Save'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import CloseIcon from '@mui/icons-material/Close'
import HealingIcon from '@mui/icons-material/Healing'
import DescriptionIcon from '@mui/icons-material/Description'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import SendIcon from '@mui/icons-material/Send'
import DrawIcon from '@mui/icons-material/Draw'
import VerifiedIcon from '@mui/icons-material/Verified'
import LockIcon from '@mui/icons-material/Lock'

import { apiGet, apiSend, getApiBaseUrl, getHeaders } from '../services/apiClient'
import { currentDateValue, formDateValue, DATE_PICKER_LOCALE } from '../utils/datePicker'

const OUTCOMES = [
  { code: 'IDONE0', label: 'Idoneo alla mansione', color: 'success' },
  { code: 'IDONE0P', label: 'Idoneo alla mansione con prescrizioni', color: 'warning' },
  { code: 'IDONE0L', label: 'Idoneo alla mansione con limitazioni', color: 'warning' },
  { code: 'NONIDONE0', label: 'Non idoneo', color: 'error' },
  { code: 'INATTESA', label: 'In attesa di accertamenti', color: 'info' },
]

const PRESCRIPTION_PRESETS = [
  { category: 'DPI', text: 'Uso obbligatorio DPI uditivi (otoprotettori SNR ≥ 28 dB)', type: 'presc' },
  { category: 'DPI', text: 'Uso obbligatorio occhiali di protezione con ripari laterali', type: 'presc' },
  { category: 'DPI', text: 'Uso guanti di protezione chimica/meccanica specifici', type: 'presc' },
  { category: 'DPI', text: 'Uso calzature di sicurezza con puntale e suola antiscivolo', type: 'presc' },
  { category: 'DPI', text: 'Uso maschera respiratoria filtrante FFP2/FFP3', type: 'presc' },
  { category: 'VDT', text: 'Prescrizione uso lenti correttive per lavoro a VDT', type: 'presc' },
  { category: 'VDT', text: 'Pausa visiva di 15 minuti ogni 120 minuti a VDT', type: 'presc' },
  { category: 'MMC', text: 'Limitazione MMC: sollevamento massimo consentito 10 kg', type: 'limit' },
  { category: 'MMC', text: 'Limitazione MMC: sollevamento massimo consentito 15 kg', type: 'limit' },
  { category: 'MMC', text: 'Divieto di sollevamento carichi con torsione del tronco', type: 'limit' },
  { category: 'Mansione', text: 'Esclusione da mansioni che comportano lavoro in quota (> 2m)', type: 'limit' },
  { category: 'Mansione', text: 'Esclusione da lavoro in turno notturno (00:00 - 06:00)', type: 'limit' },
  { category: 'Mansione', text: 'Divieto di guida carrelli elevatori e macchine semoventi', type: 'limit' },
  { category: 'Mansione', text: 'Esclusione da spazi confinati o a rischio asfissia', type: 'limit' },
]

function getOutcomeInfo(code, label) {
  if (code === 'IDONE0') return OUTCOMES[0]
  if (code === 'IDONE0P') return OUTCOMES[1]
  if (code === 'IDONE0L') return OUTCOMES[2]
  if (code === 'NONIDONE0') return OUTCOMES[3]
  if (code === 'INATTESA') return OUTCOMES[4]
  const found = OUTCOMES.find((o) => o.label === label)
  if (found) return found
  return { code: 'IDONE0', label: label || 'Idoneo', color: 'success' }
}

export default function GiudizioIdoneitaCenter({ medicalVisitId = null }) {
  const [visits, setVisits] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchText, setSearchText] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState('all')
  const [selectedOutcomeCode, setSelectedOutcomeCode] = useState('all')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activeVisit, setActiveVisit] = useState(null)
  const [judgmentForm, setJudgmentForm] = useState({
    outcomeCode: 'IDONE0',
    outcome: 'Idoneo alla mansione',
    prescriptions: '',
    limitations: '',
    nextReviewDate: '',
  })
  const [saving, setSaving] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [pecSendingId, setPecSendingId] = useState(null)
  const [pecBulkLoading, setPecBulkLoading] = useState(false)
  const [pecSentMap, setPecSentMap] = useState({})
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [pinCode, setPinCode] = useState('1234')
  const [autoDispatchPec, setAutoDispatchPec] = useState(true)
  const [batchSigning, setBatchSigning] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [visitsData, companiesData] = await Promise.all([
        apiGet('/api/visit-judgments'),
        apiGet('/api/master-data/companies').catch(() => []),
      ])
      const unwrap = (d) => (Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []))
      const list = unwrap(visitsData)
      setVisits(list)
      setCompanies(unwrap(companiesData))

      if (medicalVisitId) {
        const found = list.find((v) => Number(v.id) === Number(medicalVisitId))
        if (found) {
          openEdit(found)
        }
      }
    } catch (err) {
      setError(err.message || 'Errore nel caricamento delle visite e dei giudizi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [medicalVisitId])

  const openEdit = (visit) => {
    setActiveVisit(visit)
    const info = getOutcomeInfo(visit.outcomeCode, visit.outcome)
    setJudgmentForm({
      outcomeCode: visit.outcomeCode || info.code,
      outcome: visit.outcome || info.label,
      prescriptions: visit.prescriptions || '',
      limitations: visit.limitations || '',
      nextReviewDate: visit.nextDeadlineDate ? visit.nextDeadlineDate.slice(0, 10) : '',
    })
    setSuccess('')
    setEditDialogOpen(true)
  }

  const handleToggleDialogPreset = (preset) => {
    const isPrescription = preset.type === 'presc'
    const targetField = isPrescription ? 'prescriptions' : 'limitations'
    const currentVal = judgmentForm[targetField] || ''

    if (currentVal.includes(preset.text)) {
      const updated = currentVal
        .split(';')
        .map(s => s.trim())
        .filter(s => s && s !== preset.text)
        .join('; ')
      setJudgmentForm(prev => ({ ...prev, [targetField]: updated }))
    } else {
      const updated = currentVal.trim()
        ? `${currentVal.trim()}; ${preset.text}`
        : preset.text
      setJudgmentForm(prev => ({ ...prev, [targetField]: updated }))
    }
  }

  const handleSaveJudgment = async () => {
    if (!activeVisit?.id) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        outcomeCode: judgmentForm.outcomeCode,
        outcome: judgmentForm.outcome,
        prescriptions: judgmentForm.prescriptions || null,
        limitations: judgmentForm.limitations || null,
        nextReviewDate: judgmentForm.nextReviewDate ? new Date(judgmentForm.nextReviewDate).toISOString() : null,
      }
      await apiSend('PUT', `/api/visit-judgments/${activeVisit.id}`, payload)
      setSuccess('✓ Giudizio di idoneità salvato e aggiornato con successo.')

      setVisits((prev) =>
        prev.map((item) =>
          item.id === activeVisit.id
            ? {
                ...item,
                outcomeCode: payload.outcomeCode,
                outcome: payload.outcome,
                prescriptions: payload.prescriptions,
                limitations: payload.limitations,
                nextDeadlineDate: payload.nextReviewDate,
              }
            : item
        )
      )
      setEditDialogOpen(false)
    } catch (err) {
      setError(err.message || 'Salvataggio giudizio fallito.')
    } finally {
      setSaving(false)
    }
  }

  const downloadPdf = async (visitId) => {
    if (!visitId) return
    setDownloadingId(visitId)
    setError('')
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/documents/visits/${visitId}/fitness-judgment-pdf`,
        { headers: getHeaders() }
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `giudizio-idoneita-${visitId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Impossibile scaricare il certificato PDF. Riprovare.')
    } finally {
      setDownloadingId(null)
    }
  }

  const downloadAllegato3APdf = async (visitId) => {
    if (!visitId) return
    setDownloadingId(visitId)
    setError('')
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/documents/visits/${visitId}/allegato-3a-pdf`,
        { headers: getHeaders() }
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `allegato-3a-cartella-sanitaria-${visitId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Impossibile scaricare l\'Allegato 3A PDF. Riprovare.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleSendPec = async (visitId) => {
    setPecSendingId(visitId)
    setError('')
    setSuccess('')
    try {
      const res = await apiSend('POST', '/api/alerts/send-judgment-pec', { visitId })
      if (res.success) {
        setPecSentMap((prev) => ({ ...prev, [visitId]: true }))
        setSuccess(`✓ Giudizio di idoneità trasmesso via PEC (${res.recipientPec}) con certificato PDF allegato.`)
      } else {
        setError(res.errorMessage || 'Invio PEC fallito.')
      }
    } catch (err) {
      setError(err.message || 'Errore durante la trasmissione PEC.')
    } finally {
      setPecSendingId(null)
    }
  }

  const handleSendBulkPec = async () => {
    const visitIds = filteredVisits.map((v) => v.id)
    if (visitIds.length === 0) return
    setPecBulkLoading(true)
    setError('')
    setSuccess('')
    try {
      const results = await apiSend('POST', '/api/alerts/send-bulk-judgments-pec', { visitIds })
      const successful = results.filter((r) => r.success).length
      const mapUpdate = {}
      results.forEach((r) => {
        if (r.success) mapUpdate[r.visitId] = true
      })
      setPecSentMap((prev) => ({ ...prev, ...mapUpdate }))
      setSuccess(`✓ Trasmissione massiva completata: ${successful} su ${results.length} giudizi inviati via PEC.`)
    } catch (err) {
      setError(err.message || 'Errore durante la trasmissione massiva PEC.')
    } finally {
      setPecBulkLoading(false)
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredVisits.map((v) => v.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleOpenBatchSignConfirm = () => {
    if (selectedIds.size === 0) {
      if (filteredVisits.length > 0) {
        setSelectedIds(new Set(filteredVisits.map((v) => v.id)))
      } else {
        return
      }
    }
    setConfirmModalOpen(true)
  }

  const handleExecuteBatchSignAndPec = async () => {
    const targetIds = Array.from(selectedIds)
    if (targetIds.length === 0) return
    setBatchSigning(true)
    setError('')
    setSuccess('')
    try {
      const signPayload = {
        visitIds: targetIds,
        pin: pinCode,
        signatureType: 'CADES_PADES_DIGITAL',
      }
      const signRes = await apiSend('POST', '/api/doctor-data/batch-sign', signPayload)
      const signedCount = signRes?.signedCount || targetIds.length

      let pecCount = 0
      if (autoDispatchPec) {
        const pecRes = await apiSend('POST', '/api/alerts/send-bulk-judgments-pec', { visitIds: targetIds })
        const pecResults = Array.isArray(pecRes) ? pecRes : []
        pecCount = pecResults.filter((r) => r.success).length
        const mapUpdate = {}
        pecResults.forEach((r) => {
          if (r.success) mapUpdate[r.visitId] = true
        })
        setPecSentMap((prev) => ({ ...prev, ...mapUpdate }))
      }

      setSuccess(
        `✓ Firma Digitale Massiva completata con successo: ${signedCount} giudizi firmati digitalmente.` +
          (autoDispatchPec ? ` Trasmessi via PEC a ${pecCount} datori di lavoro con certificato PDF allegato.` : '')
      )
      setConfirmModalOpen(false)
      setSelectedIds(new Set())
      loadData()
    } catch (err) {
      setError(err.message || 'Errore durante la firma massiva e trasmissione PEC.')
    } finally {
      setBatchSigning(false)
    }
  }

  // Filtered rows
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (selectedCompanyId !== 'all' && Number(v.companyId) !== Number(selectedCompanyId)) {
        return false
      }
      if (selectedOutcomeCode !== 'all') {
        const info = getOutcomeInfo(v.outcomeCode, v.outcome)
        if (info.code !== selectedOutcomeCode) return false
      }
      if (searchText.trim()) {
        const needle = searchText.trim().toLowerCase()
        const match =
          (v.employeeFullName || '').toLowerCase().includes(needle) ||
          (v.employeeTaxCode || '').toLowerCase().includes(needle) ||
          (v.companyName || '').toLowerCase().includes(needle) ||
          (v.doctorFullName || '').toLowerCase().includes(needle) ||
          (v.outcome || '').toLowerCase().includes(needle)
        if (!match) return false
      }
      return true
    })
  }, [visits, selectedCompanyId, selectedOutcomeCode, searchText])

  // KPIs
  const metrics = useMemo(() => {
    let idonei = 0
    let prescrizioni = 0
    let inidonei = 0
    let inAttesa = 0

    visits.forEach((v) => {
      const info = getOutcomeInfo(v.outcomeCode, v.outcome)
      if (info.code === 'IDONE0') idonei++
      else if (info.code === 'IDONE0P' || info.code === 'IDONE0L') prescrizioni++
      else if (info.code === 'NONIDONE0') inidonei++
      else inAttesa++
    })

    return { total: visits.length, idonei, prescrizioni, inidonei, inAttesa }
  }, [visits])

  return (
    <Box sx={{ p: 2.5, maxWidth: 1500, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f1f3d' }}>
            Centro Giudizi di Idoneità (Art. 41 D.Lgs. 81/08)
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#00838f', mt: 0.5 }}>
            Firma Digitale Massiva &amp; Auto-Dispatch Pipeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestione, consultazione, verbalizzazione, firma digitale massiva PAdES e rilascio dei certificati legali di idoneità alla mansione specifica con notifica PEC automatica.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Chip
            icon={<VerifiedIcon />}
            label="Auto-Dispatch Post-Firma"
            color="success"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <Button
            variant="contained"
            color="success"
            startIcon={batchSigning ? <CircularProgress size={18} color="inherit" /> : <VerifiedIcon />}
            disabled={batchSigning || filteredVisits.length === 0}
            onClick={handleOpenBatchSignConfirm}
            sx={{ fontWeight: 700 }}
          >
            {batchSigning
              ? 'Firma & Invio in corso...'
              : selectedIds.size > 0
              ? `Firma e Invia PEC Selezionati (${selectedIds.size})`
              : 'Firma e Invia PEC Selezionati'}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DrawIcon />}
            onClick={handleOpenBatchSignConfirm}
            disabled={filteredVisits.length === 0}
            sx={{ fontWeight: 600 }}
          >
            Firma Massiva
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={pecBulkLoading ? <CircularProgress size={18} color="inherit" /> : <MarkEmailReadIcon />}
            disabled={pecBulkLoading || filteredVisits.length === 0}
            onClick={handleSendBulkPec}
            sx={{ fontWeight: 600 }}
          >
            {pecBulkLoading ? 'Invio PEC in corso...' : `Invia ${filteredVisits.length} Giudizi via PEC`}
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderLeft: '4px solid #1976d2' }}>
            <Typography variant="caption" color="text.secondary">Totale Visite</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>{metrics.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderLeft: '4px solid #2e7d32' }}>
            <Typography variant="caption" color="text.secondary">Idonei</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>{metrics.idonei}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderLeft: '4px solid #ed6c02' }}>
            <Typography variant="caption" color="text.secondary">Con Prescrizioni / Limitazioni</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#ed6c02' }}>{metrics.prescrizioni}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderLeft: '4px solid #d32f2f' }}>
            <Typography variant="caption" color="text.secondary">Non Idonei</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>{metrics.inidonei}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderLeft: '4px solid #0288d1' }}>
            <Typography variant="caption" color="text.secondary">In Attesa Accertamenti</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0288d1' }}>{metrics.inAttesa}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Toolbar Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Cerca lavoratore, CF, mansione..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 260, flexGrow: 1 }}
          />
          <TextField
            size="small"
            select
            label="Azienda"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">Tutte le aziende</MenuItem>
            {companies.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Esito Giudizio"
            value={selectedOutcomeCode}
            onChange={(e) => setSelectedOutcomeCode(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">Tutti gli esiti</MenuItem>
            {OUTCOMES.map((o) => (
              <MenuItem key={o.code} value={o.code}>{o.label}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={() => {
              setSearchText('')
              setSelectedCompanyId('all')
              setSelectedOutcomeCode('all')
            }}
          >
            Reset
          </Button>
          <Button variant="contained" startIcon={<SearchIcon />} onClick={loadData}>
            Aggiorna
          </Button>
        </Stack>
      </Paper>

      {/* Main Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress size={36} />
            <Typography variant="body2" sx={{ mt: 1.5 }} color="text.secondary">Caricamento giudizi in corso...</Typography>
          </Box>
        ) : filteredVisits.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">Nessun giudizio di idoneità trovato con i filtri correnti.</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f4f6f9' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.size > 0 && selectedIds.size < filteredVisits.length}
                    checked={filteredVisits.length > 0 && selectedIds.size === filteredVisits.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Data Visita</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lavoratore</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Codice Fiscale</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Azienda</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mansione / Reparto</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Esito Formale</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Prescrizioni / Limitazioni</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Scadenza</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>PEC</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVisits.map((row) => {
                const info = getOutcomeInfo(row.outcomeCode, row.outcome)
                const visitDateStr = row.visitDate ? new Date(row.visitDate).toLocaleDateString('it-IT') : '-'
                const deadlineStr = row.nextDeadlineDate ? new Date(row.nextDeadlineDate).toLocaleDateString('it-IT') : '-'
                const notes = [row.prescriptions, row.limitations].filter(Boolean).join(' • ') || '-'
                const isPecSent = pecSentMap[row.id]
                const isSelected = selectedIds.has(row.id)

                return (
                  <TableRow key={row.id} hover selected={isSelected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectOne(row.id)}
                      />
                    </TableCell>
                    <TableCell>{visitDateStr}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.employeeFullName || '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.employeeTaxCode || '-'}</TableCell>
                    <TableCell>{row.companyName || '-'}</TableCell>
                    <TableCell>{row.jobRole || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={info.label}
                        color={info.color}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {notes}
                    </TableCell>
                    <TableCell>{deadlineStr}</TableCell>
                    <TableCell align="center">
                      {isPecSent ? (
                        <Chip size="small" color="success" label="Inviata" icon={<MarkEmailReadIcon />} />
                      ) : (
                        <Chip size="small" variant="outlined" label="Da inviare" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Invia Giudizio via PEC al Datore di Lavoro">
                          <IconButton
                            size="small"
                            color={isPecSent ? 'success' : 'secondary'}
                            disabled={pecSendingId === row.id}
                            onClick={() => handleSendPec(row.id)}
                          >
                            {pecSendingId === row.id ? <CircularProgress size={18} /> : <SendIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica Giudizio & Prescrizioni">
                          <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Scarica Certificato Idoneità PDF (Art. 41)">
                          <IconButton
                            size="small"
                            color="secondary"
                            disabled={downloadingId === row.id}
                            onClick={() => downloadPdf(row.id)}
                          >
                            {downloadingId === row.id ? <CircularProgress size={18} /> : <DownloadIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Scarica Cartella Sanitaria Allegato 3A (PDF)">
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={downloadingId === row.id}
                            onClick={() => downloadAllegato3APdf(row.id)}
                          >
                            <DescriptionIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Detail / Editing Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0f1f3d', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
              Verbalizzazione Giudizio di Idoneità (Art. 41 D.Lgs. 81/08)
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Lavoratore: {activeVisit?.employeeFullName} • {activeVisit?.companyName}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setEditDialogOpen(false)} sx={{ color: '#ffffff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3, mt: 1 }}>
          <Stack spacing={2.5}>
            <TextField
              select
              label="Esito Formale Giudizio *"
              value={judgmentForm.outcomeCode}
              onChange={(e) => {
                const selected = OUTCOMES.find((o) => o.code === e.target.value)
                setJudgmentForm({
                  ...judgmentForm,
                  outcomeCode: e.target.value,
                  outcome: selected?.label || '',
                })
              }}
              fullWidth
            >
              {OUTCOMES.map((o) => (
                <MenuItem key={o.code} value={o.code}>
                  <Chip label={o.label} color={o.color} size="small" sx={{ mr: 1 }} />
                  {o.label}
                </MenuItem>
              ))}
            </TextField>

            {/* PRESCRIZIONI CHIPS */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fcfdfe' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <HealingIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700} color="#0f1f3d">
                  Inserisci Prescrizioni o Limitazioni Standard
                </Typography>
              </Stack>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {PRESCRIPTION_PRESETS.map((p, idx) => {
                  const targetField = p.type === 'presc' ? 'prescriptions' : 'limitations'
                  const active = (judgmentForm[targetField] || '').includes(p.text)
                  return (
                    <Chip
                      key={idx}
                      label={p.text}
                      size="small"
                      color={active ? (p.type === 'presc' ? 'primary' : 'warning') : 'default'}
                      variant={active ? 'filled' : 'outlined'}
                      onClick={() => handleToggleDialogPreset(p)}
                      sx={{ cursor: 'pointer', fontWeight: active ? 600 : 400 }}
                    />
                  )
                })}
              </Box>
            </Paper>

            <TextField
              label="Prescrizioni specifiche"
              multiline
              rows={2}
              fullWidth
              value={judgmentForm.prescriptions}
              onChange={(e) => setJudgmentForm({ ...judgmentForm, prescriptions: e.target.value })}
              placeholder="Es. Obbligo di utilizzo DPI uditivi classe SNR ≥ 28 dB durante l'uso di macchine utensili..."
              helperText="Specificare eventuali misure o dispositivi di protezione obbligatori per il lavoratore."
            />

            <TextField
              label="Limitazioni operative"
              multiline
              rows={2}
              fullWidth
              value={judgmentForm.limitations}
              onChange={(e) => setJudgmentForm({ ...judgmentForm, limitations: e.target.value })}
              placeholder="Es. Esclusione dalla movimentazione manuale di carichi > 10 kg; non idoneo al lavoro notturno..."
              helperText="Specificare divieti o esclusioni da mansioni specifiche o posture prolungate."
            />

            <DesktopDatePicker
              label="Data Prossima Revisione / Scadenza Idoneità *"
              InputLabelProps={{ shrink: true }}
              value={currentDateValue(judgmentForm.nextReviewDate)}
              onChange={(date) =>
                setJudgmentForm({
                  ...judgmentForm,
                  nextReviewDate: formDateValue(date),
                })
              }
              inputFormat="dd/MM/yyyy"
              locale={DATE_PICKER_LOCALE}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Annulla</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
            onClick={handleSaveJudgment}
            sx={{ fontWeight: 600 }}
          >
            {saving ? 'Salvataggio...' : 'Salva Giudizio'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Firma Digitale Massiva & Auto-Dispatch */}
      <Dialog open={confirmModalOpen} onClose={() => !batchSigning && setConfirmModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f1f3d' }}>
          Conferma Firma Digitale Massiva
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Stai per applicare la Firma Digitale qualificata (CADES/PADES) a <strong>{selectedIds.size}</strong> giudizi di idoneità selezionati.
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="password"
              label="PIN Firma Digitale / SmartCard"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              InputProps={{ startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" /> }}
              helperText="Inserisci il PIN del certificato crittografico o token CNS"
            />
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoDispatchPec}
                    onChange={(e) => setAutoDispatchPec(e.target.checked)}
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Auto-Dispatch PEC al Datore
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Invia contestualmente il certificato PDF alla PEC aziendale
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmModalOpen(false)} disabled={batchSigning}>
            Annulla
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={batchSigning ? <CircularProgress size={18} color="inherit" /> : <VerifiedIcon />}
            onClick={handleExecuteBatchSignAndPec}
            disabled={batchSigning || !pinCode}
            sx={{ fontWeight: 700 }}
          >
            {batchSigning ? 'Firma in corso...' : 'Conferma Firma e Invio PEC'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
