import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
} from '@mui/material'
import DrawIcon from '@mui/icons-material/Draw'
import VerifiedIcon from '@mui/icons-material/Verified'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LockIcon from '@mui/icons-material/Lock'
import FilterListIcon from '@mui/icons-material/FilterList'

import { apiGet, apiSend } from '../services/apiClient'

export default function BatchSignatureCenter() {
  const [visits, setVisits] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // PIN / Confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [pinCode, setPinCode] = useState('1234')

  const loadVisits = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet('/api/doctor-data/unsigned-visits')
      setVisits(Array.isArray(data) ? data : [])
      setSelectedIds(new Set())
    } catch (err) {
      setError(err.message || 'Errore nel caricamento delle visite da firmare.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVisits()
  }, [])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(visits.map(v => v.visitId)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleOpenConfirm = () => {
    if (selectedIds.size === 0) return
    setConfirmModalOpen(true)
  }

  const handleExecuteBatchSign = async () => {
    setSigning(true)
    setError('')
    try {
      const payload = {
        visitIds: Array.from(selectedIds),
        pin: pinCode,
        signatureType: 'CADES_PADES_DIGITAL'
      }
      const response = await apiSend('POST', '/api/doctor-data/batch-sign', payload)
      setConfirmModalOpen(false)
      setSuccessMsg(`✓ Firma digitale applicata con successo a ${response.signedCount || selectedIds.size} giudizi di idoneità.`)
      await loadVisits()
    } catch (err) {
      setError(err.message || 'Errore durante l\'applicazione della firma.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, md: 2 } }}>
      {/* HEADER */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0f1f3d">
              Firma Digitale Massiva Giudizi di Idoneità (D.Lgs. 81/08)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Apposizione certificato di firma digitale (PAdES/CAdES) su blocchi di giudizi di idoneità emessi e in attesa di validazione.
            </Typography>
          </Box>
          <Chip
            icon={<VerifiedIcon />}
            label="Certificato Digitale Attivo"
            color="primary"
            variant="outlined"
            size="small"
          />
        </Stack>
      </Paper>

      {/* FEEDBACK */}
      {error && <Alert severity="error">{error}</Alert>}
      {successMsg && (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          {successMsg}
        </Alert>
      )}

      {/* VISITS TABLE */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f1f3d">
                Giudizi in Attesa di Firma ({visits.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedIds.size} selezionati per la firma cumulativa
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={signing ? <CircularProgress size={18} color="inherit" /> : <DrawIcon />}
              disabled={selectedIds.size === 0 || signing || loading}
              onClick={handleOpenConfirm}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Firma Digitale Massiva {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </Button>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : visits.length === 0 ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Nessun giudizio di idoneità in attesa di firma. Tutti i documenti risultano regolarmente firmati.
            </Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.size === visits.length && visits.length > 0}
                        indeterminate={selectedIds.size > 0 && selectedIds.size < visits.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell><strong>Lavoratore</strong></TableCell>
                    <TableCell><strong>Azienda</strong></TableCell>
                    <TableCell><strong>Data Visita</strong></TableCell>
                    <TableCell><strong>Tipo Visita</strong></TableCell>
                    <TableCell><strong>Esito Giudizio</strong></TableCell>
                    <TableCell align="center"><strong>Stato</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visits.map((row) => (
                    <TableRow key={row.visitId} hover selected={selectedIds.has(row.visitId)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(row.visitId)}
                          onChange={() => handleSelectOne(row.visitId)}
                        />
                      </TableCell>
                      <TableCell><strong>{row.employeeName}</strong></TableCell>
                      <TableCell>{row.companyName}</TableCell>
                      <TableCell>{new Date(row.visitDate).toLocaleDateString('it-IT')}</TableCell>
                      <TableCell>{row.visitType}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.outcome || 'Idoneo'}
                          size="small"
                          color={
                            (row.outcome || '').toLowerCase().includes('inidoneo') || (row.outcome || '').toLowerCase().includes('non idoneo')
                              ? 'error'
                              : (row.outcome || '').toLowerCase().includes('prescriz') || (row.outcome || '').toLowerCase().includes('limitaz')
                              ? 'warning'
                              : 'success'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label="Da Firmare" size="small" color="warning" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* CONFIRMATION & PIN DIALOG */}
      <Dialog open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Conferma Firma Digitale
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">
              Stai per apporre la firma digitale su <strong>{selectedIds.size} documenti</strong>. L'operazione genererà l'impronta crittografica conforme PAdES.
            </Alert>
            <TextField
              fullWidth
              size="small"
              label="PIN Dispositivo / OTP Firma"
              type="password"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              helperText="Inserisci il PIN del certificato di firma del Medico Competente"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmModalOpen(false)} disabled={signing}>
            Annulla
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={signing ? <CircularProgress size={18} color="inherit" /> : <DrawIcon />}
            onClick={handleExecuteBatchSign}
            disabled={signing || !pinCode}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {signing ? 'Firma in corso...' : `Conferma Firma (${selectedIds.size})`}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
