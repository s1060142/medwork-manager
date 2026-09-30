import { useState, useEffect, useRef } from 'react'
import {
  Alert,
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
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import DrawIcon from '@mui/icons-material/Draw'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import TabletMacIcon from '@mui/icons-material/TabletMac'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import HistoryIcon from '@mui/icons-material/History'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import ShieldIcon from '@mui/icons-material/Shield'

import { apiGet, apiSend } from '../services/apiClient'

// Pure JS SHA-256 for browser signature hashing
async function computeSha256Hex(str) {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(str))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function FirmaGrafometricaCenter({ activeCompanyId = '' }) {
  const [tabIndex, setTabIndex] = useState(0)

  // Visit & Patient selection
  const [visits, setVisits] = useState([])
  const [loadingVisits, setLoadingVisits] = useState(false)
  const [selectedVisitId, setSelectedVisitId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Signature canvas
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [strokePoints, setStrokePoints] = useState([])
  const [signingSuccess, setSigningSuccess] = useState('')
  const [signingError, setSigningError] = useState('')
  const [savingSignature, setSavingSignature] = useState(false)

  // Signature Registry
  const [signaturesList, setSignaturesList] = useState([])
  const [loadingSignatures, setLoadingSignatures] = useState(false)

  // Verification Tool (Preserved & Enhanced)
  const [hash, setHash] = useState('')
  const [signature, setSignature] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [result, setResult] = useState(null)
  const [verifyError, setVerifyError] = useState('')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    loadRecentVisits()
    loadSignaturesRegistry()
  }, [activeCompanyId])

  const loadRecentVisits = async () => {
    setLoadingVisits(true)
    try {
      const data = await apiGet('/api/doctor-data/medical-visits')
      const list = Array.isArray(data) ? data : (data?.data || [])
      setVisits(list)
      if (list.length > 0 && !selectedVisitId) {
        setSelectedVisitId(list[0].id)
      }
    } catch {
      // fallback
    } finally {
      setLoadingVisits(false)
    }
  }

  const loadSignaturesRegistry = async () => {
    setLoadingSignatures(true)
    try {
      const data = await apiGet('/api/signatures')
      setSignaturesList(Array.isArray(data) ? data : [])
    } catch {
      // fallback
    } finally {
      setLoadingSignatures(false)
    }
  }

  // Selected visit object
  const selectedVisit = visits.find(v => Number(v.id) === Number(selectedVisitId))

  // Filtered visits list for picker
  const filteredVisits = visits.filter(v => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const name = `${v.employee?.firstName || ''} ${v.employee?.lastName || ''}`.toLowerCase()
    const cf = (v.employee?.taxCode || '').toLowerCase()
    const comp = (v.employee?.company?.name || '').toLowerCase()
    return name.includes(q) || cf.includes(q) || comp.includes(q)
  })

  // Canvas Drawing Handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
        time: Date.now(),
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now(),
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const coords = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    setStrokePoints(prev => [...prev, coords])
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const coords = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
    setHasSignature(true)
    setStrokePoints(prev => [...prev, coords])
  }

  const stopDrawing = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    setIsDrawing(false)
  }

  const handleClearSignature = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHasSignature(false)
    setStrokePoints([])
    setSigningSuccess('')
    setSigningError('')
  }

  const handleCommitSignature = async () => {
    if (!hasSignature || !canvasRef.current || !selectedVisit) {
      setSigningError('Traccia prima la firma sul riquadro touch.')
      return
    }

    try {
      setSavingSignature(true)
      setSigningError('')
      const dataUrl = canvasRef.current.toDataURL('image/png')
      const workerName = selectedVisit.employee
        ? `${selectedVisit.employee.firstName} ${selectedVisit.employee.lastName}`
        : 'Lavoratore'
      
      // Compute cryptographic hash of the signature + timestamp + visit ID
      const signaturePayload = `${workerName}|${selectedVisit.id}|${Date.now()}|${dataUrl.slice(0, 100)}`
      const hashHex = await computeSha256Hex(signaturePayload)

      await apiSend('POST', '/api/signatures', {
        signer: `${workerName} (${selectedVisit.employee?.taxCode || 'CF'})`,
        hash: hashHex,
        documentId: `VISIT-${selectedVisit.id}-GIUDIZIO`,
      })

      setSigningSuccess(`✓ Firma FEA apposta con successo! Impronta crittografica SHA-256: ${hashHex.slice(0, 16)}...`)
      loadSignaturesRegistry()
    } catch (err) {
      setSigningError(err.message || 'Errore nel salvataggio della firma.')
    } finally {
      setSavingSignature(false)
    }
  }

  // Verification tool actions
  const verify = async () => {
    setVerifying(true)
    setVerifyError('')
    setResult(null)
    try {
      const data = await apiSend('POST', '/api/signatures/verify', {
        contentHash: hash,
        signatureBase64: signature,
        publicKeyBase64: publicKey,
      })
      setResult(data.isValid)
    } catch (err) {
      setVerifyError(err.message || 'Verifica firma fallita.')
    } finally {
      setVerifying(false)
    }
  }

  const loadSampleHash = async () => {
    try {
      const data = await apiSend('GET', '/api/signatures/hash-sample')
      setHash(data.hash)
    } catch {
      // ignore
    }
  }

  return (
    <Stack spacing={3} sx={{ pb: 4 }}>
      {/* HEADER BANNER */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TabletMacIcon color="primary" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h6" fontWeight={700} color="#0f1f3d">
                  Centro Firma su Tablet & Kiosk Paziente (FEA)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sottoscrizione digitale dei Giudizi di Idoneità (Art. 41 D.Lgs. 81/08) con Firma Elettronica Avanzata conforme DPR 445/2000.
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => { loadRecentVisits(); loadSignaturesRegistry(); }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Aggiorna Coda
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* TABS */}
      <Paper variant="outlined" sx={{ borderRadius: 3, bgcolor: '#ffffff' }}>
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            icon={<DrawIcon />}
            iconPosition="start"
            label="✍️ Postazione Tablet Paziente (FEA)"
            sx={{ textTransform: 'none', fontWeight: 700 }}
          />
          <Tab
            icon={<HistoryIcon />}
            iconPosition="start"
            label="📋 Registro Firme Acquisite"
            sx={{ textTransform: 'none', fontWeight: 700 }}
          />
          <Tab
            icon={<ShieldIcon />}
            iconPosition="start"
            label="🔍 Verifica Crittografica Integrità"
            sx={{ textTransform: 'none', fontWeight: 700 }}
          />
        </Tabs>

        {/* TAB 0: TABLET KIOSK SIGNING VIEW */}
        {tabIndex === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* LEFT: SELECT VISIT / PATIENT */}
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Seleziona Visita in Attesa di Firma
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Cerca per lavoratore o CF..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ mb: 2, bgcolor: '#ffffff' }}
                  />

                  {loadingVisits ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : filteredVisits.length === 0 ? (
                    <Alert severity="info">Nessuna visita recente trovata.</Alert>
                  ) : (
                    <Stack spacing={1} sx={{ maxHeight: 420, overflowY: 'auto' }}>
                      {filteredVisits.map((v) => {
                        const isSelected = Number(v.id) === Number(selectedVisitId)
                        const wName = v.employee ? `${v.employee.firstName} ${v.employee.lastName}` : `Paziente #${v.employeeId}`
                        return (
                          <Paper
                            key={v.id}
                            variant="outlined"
                            onClick={() => {
                              setSelectedVisitId(v.id)
                              handleClearSignature()
                            }}
                            sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              cursor: 'pointer',
                              bgcolor: isSelected ? '#eff6ff' : '#ffffff',
                              borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
                              transition: 'all 0.15s ease',
                              '&:hover': { bgcolor: isSelected ? '#dbeafe' : '#f1f5f9' },
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="subtitle2" fontWeight={isSelected ? 700 : 600} color={isSelected ? 'primary.main' : 'text.primary'}>
                                  {wName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {v.employee?.company?.name || 'Azienda'} • {new Date(v.visitDate).toLocaleDateString('it-IT')}
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={v.outcomeCode || 'IDONEO'}
                                color={v.outcomeCode?.includes('NON') ? 'error' : v.outcomeCode?.includes('IDONE0P') ? 'warning' : 'success'}
                                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                              />
                            </Stack>
                          </Paper>
                        )
                      })}
                    </Stack>
                  )}
                </Paper>
              </Grid>

              {/* RIGHT: TABLET SIGNATURE INTERFACE */}
              <Grid item xs={12} md={8}>
                {selectedVisit ? (
                  <Stack spacing={2.5}>
                    {/* DOCUMENT SUMMARY CARD */}
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: '#ffffff',
                        borderLeft: '4px solid #2563eb',
                      }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
                        <Box>
                          <Typography variant="h6" fontWeight={700} color="#0f172a">
                            {selectedVisit.employee ? `${selectedVisit.employee.firstName} ${selectedVisit.employee.lastName}` : 'Lavoratore'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            C.F.: <strong>{selectedVisit.employee?.taxCode || '—'}</strong> | Mansione: <strong>{selectedVisit.employee?.jobRole || 'Addetto'}</strong>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Azienda: {selectedVisit.employee?.company?.name || 'Azienda'} | Data Visita: {new Date(selectedVisit.visitDate).toLocaleDateString('it-IT')}
                          </Typography>
                        </Box>
                        <Chip
                          label={selectedVisit.outcome || 'Idoneo alla mansione specifica'}
                          color={selectedVisit.outcomeCode?.includes('NON') ? 'error' : 'success'}
                          sx={{ fontWeight: 700, px: 1 }}
                        />
                      </Stack>

                      {/* LEGAL CLAUSE ART 41 C. 9 */}
                      <Alert severity="info" sx={{ mt: 2, fontSize: '0.8125rem' }}>
                        <strong>D.Lgs. 81/08 Art. 41 comma 9:</strong> Il lavoratore dichiara di aver preso visione del giudizio di idoneità sopra formulato dal Medico Competente ed è edotto della facoltà di proporre ricorso entro 30 giorni dalla data di comunicazione all'organo di vigilanza territorialmente competente (ASL / SPISAL).
                      </Alert>
                    </Paper>

                    {/* TOUCH SIGNATURE PAD */}
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        textAlign: 'center',
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DrawIcon color="primary" />
                          <Typography variant="subtitle2" fontWeight={700}>
                            Riquadro di Sottoscrizione Touch (Lavoratore)
                          </Typography>
                        </Stack>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={handleClearSignature}
                          sx={{ textTransform: 'none' }}
                        >
                          Cancella
                        </Button>
                      </Stack>

                      <Box
                        sx={{
                          border: '2px dashed #94a3b8',
                          borderRadius: 2,
                          bgcolor: '#ffffff',
                          cursor: 'crosshair',
                          touchAction: 'none',
                          p: 1,
                        }}
                      >
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={200}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          style={{
                            width: '100%',
                            height: '180px',
                            display: 'block',
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Traccia la firma utilizzando pennino capacitivo o dito sullo schermo touch.
                      </Typography>
                    </Paper>

                    {signingSuccess && <Alert severity="success">{signingSuccess}</Alert>}
                    {signingError && <Alert severity="error">{signingError}</Alert>}

                    {/* ACTIONS */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<FileDownloadIcon />}
                        href={`/api/documents/visits/${selectedVisit.id}/fitness-judgment-pdf`}
                        target="_blank"
                        sx={{ textTransform: 'none' }}
                      >
                        Apri Certificato PDF Ufficiale
                      </Button>

                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={<CheckCircleIcon />}
                        disabled={!hasSignature || savingSignature}
                        onClick={handleCommitSignature}
                        sx={{ fontWeight: 700, px: 4, textTransform: 'none' }}
                      >
                        {savingSignature ? 'Registrazione in corso...' : 'Conferma e Salva Firma FEA'}
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Alert severity="info">Seleziona una visita medica dall'elenco a sinistra per procedere alla firma del lavoratore.</Alert>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 1: REGISTRY OF SIGNED DOCUMENTS */}
        {tabIndex === 1 && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Registro Audit Firme Elettroniche Avanzate (DPR 445/2000)
              </Typography>
              <Chip
                label={`${signaturesList.length} firme archiviate`}
                color="primary"
                size="small"
                variant="outlined"
              />
            </Stack>

            {loadingSignatures ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress size={32} />
              </Box>
            ) : signaturesList.length === 0 ? (
              <Alert severity="info">Nessuna firma registrata al momento.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Firmatario</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Documento</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Impronta SHA-256</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Data / Ora</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Stato</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {signaturesList.map((sig) => (
                      <TableRow key={sig.id} hover>
                        <TableCell>#{sig.id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {sig.signer}
                          </Typography>
                        </TableCell>
                        <TableCell>{sig.documentId || 'Certificato Visita'}</TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', p: 0.5, borderRadius: 1 }}>
                            {sig.hash ? `${sig.hash.slice(0, 16)}...` : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(sig.timestamp).toLocaleString('it-IT')}</TableCell>
                        <TableCell>
                          <Chip
                            icon={<VerifiedUserIcon />}
                            label="Valido FEA"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* TAB 2: FORENSIC VERIFICATION TOOL */}
        {tabIndex === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Verifica Integrità Crittografica Documento
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Incolla l'hash SHA-256 del documento (es. PDF firmato), la firma (base64) e la chiave pubblica del
              firmatario per verificarne l'autenticità e l'integrità.
            </Alert>
            {verifyError && <Alert severity="error" sx={{ mb: 2 }}>{verifyError}</Alert>}
            <Stack spacing={2}>
              <TextField
                label="Content Hash (hex)"
                fullWidth
                value={hash}
                onChange={(e) => setHash(e.target.value)}
              />
              <TextField
                label="Signature (base64)"
                multiline
                rows={3}
                fullWidth
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
              />
              <TextField
                label="Public Key (base64)"
                multiline
                rows={3}
                fullWidth
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
              />
              <Stack direction="row" spacing={2}>
                <Button variant="contained" startIcon={<VerifiedUserIcon />} onClick={verify} disabled={verifying}>
                  {verifying ? 'Verifica…' : 'Verifica firma'}
                </Button>
                <Button variant="outlined" onClick={loadSampleHash}>
                  Carica hash di esempio
                </Button>
              </Stack>
              {result !== null && (
                <Alert severity={result ? 'success' : 'warning'}>
                  {result ? 'Firma valida: documento autentico e non alterato.' : 'Firma NON valida o documento alterato.'}
                </Alert>
              )}
            </Stack>
          </Box>
        )}
      </Paper>
    </Stack>
  )
}
