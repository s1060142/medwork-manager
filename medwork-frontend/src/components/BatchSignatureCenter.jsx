import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Snackbar
} from '@mui/material'
import DrawIcon from '@mui/icons-material/Draw'
import { apiGet, apiSend } from '../services/apiClient'

function BatchSignatureCenter() {
  const [visits, setVisits] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

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

  const handleBatchSign = async () => {
    if (selectedIds.size === 0) return
    setSigning(true)
    setError('')
    
    try {
      const response = await apiSend('/api/doctor-data/batch-sign', 'POST', {
        visitIds: Array.from(selectedIds)
      })
      setSuccessMsg(`Firma applicata con successo a ${response.signedCount} visite.`)
      await loadVisits()
    } catch (err) {
      setError(err.message || 'Errore durante l\'applicazione della firma.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Firma Multipla (Batch Signature)</Typography>
      
      <Alert severity="info">
        Seleziona i giudizi di idoneità da firmare digitalmente in blocco. L'azione applicherà il tuo certificato di firma a tutti i documenti selezionati.
      </Alert>

      {error && <Alert severity="error">{error}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Visite in attesa di firma ({visits.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={signing ? <CircularProgress size={20} color="inherit" /> : <DrawIcon />} 
              disabled={selectedIds.size === 0 || signing || loading}
              onClick={handleBatchSign}
              color="primary"
            >
              Firma {selectedIds.size > 0 ? `(${selectedIds.size})` : ''} Selezionati
            </Button>
          </Stack>

          {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : visits.length === 0 ? (
            <Alert severity="success">Nessun documento in attesa di firma.</Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
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
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Esito</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visits.map(row => (
                    <TableRow key={row.visitId} selected={selectedIds.has(row.visitId)}>
                      <TableCell padding="checkbox">
                        <Checkbox 
                          checked={selectedIds.has(row.visitId)}
                          onChange={() => handleSelectOne(row.visitId)}
                        />
                      </TableCell>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{row.companyName}</TableCell>
                      <TableCell>{new Date(row.visitDate).toLocaleDateString('it-IT')}</TableCell>
                      <TableCell>{row.visitType}</TableCell>
                      <TableCell>{row.outcome}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Snackbar 
        open={Boolean(successMsg)} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMsg('')}
        message={successMsg}
      />
    </Stack>
  )
}

export default BatchSignatureCenter
