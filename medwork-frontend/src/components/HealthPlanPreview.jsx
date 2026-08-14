import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip
} from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import { apiGet } from '../services/apiClient'

function HealthPlanPreview({ open, onClose, companyId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState(null)

  useEffect(() => {
    if (!open || !companyId) return

    const loadPlan = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await apiGet(`/api/doctor-data/companies/${companyId}/health-plan`)
        setPlan(data)
      } catch (err) {
        setError(err.message || 'Errore nel caricamento del piano sanitario.')
      } finally {
        setLoading(false)
      }
    }

    loadPlan()
  }, [open, companyId])

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Piano Sanitario Aziendale
      </DialogTitle>
      <DialogContent dividers sx={{ '@media print': { overflow: 'visible' } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : plan ? (
          <Box className="print-area">
            <Typography variant="h5" gutterBottom>{plan.companyName}</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 4 }}>
              Data elaborazione: {new Date().toLocaleDateString('it-IT')}
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell><strong>Lavoratore</strong></TableCell>
                    <TableCell><strong>Mansione</strong></TableCell>
                    <TableCell><strong>Fattori di Rischio</strong></TableCell>
                    <TableCell><strong>Protocolli Sanitari</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plan.employees && plan.employees.length > 0 ? (
                    plan.employees.map((emp, index) => (
                      <TableRow key={index}>
                        <TableCell>{emp.fullName}</TableCell>
                        <TableCell>{emp.jobRole}</TableCell>
                        <TableCell>
                          {emp.risks?.length > 0 ? emp.risks.map(r => (
                            <Chip key={r} label={r} size="small" variant="outlined" sx={{ m: 0.5 }} />
                          )) : <Typography variant="caption" color="text.secondary">Nessun rischio</Typography>}
                        </TableCell>
                        <TableCell>
                          {emp.protocols?.length > 0 ? emp.protocols.map(p => (
                            <Chip key={p} label={p} size="small" color="primary" variant="outlined" sx={{ m: 0.5 }} />
                          )) : <Typography variant="caption" color="text.secondary">Nessun protocollo</Typography>}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Nessun lavoratore attivo associato a questa azienda.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ '@media print': { display: 'none' } }}>
        <Button onClick={onClose} color="inherit">Chiudi</Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />} disabled={!plan}>
          Stampa
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default HealthPlanPreview
