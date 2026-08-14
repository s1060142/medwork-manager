import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { apiGet } from '../services/apiClient'

function Allegato3BPreview({ open, onClose, companyId, companyName }) {
  const [year, setYear] = useState(new Date().getFullYear() - 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !companyId) return
    loadData()
  }, [open, companyId, year])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await apiGet(`/api/doctor-data/companies/${companyId}/allegato-3b?year=${year}`)
      setData(result)
    } catch (err) {
      setError(err.message || 'Errore nel caricamento dei dati Allegato 3B.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Allegato 3B - Generazione Automatica</Typography>
        <TextField 
          select={false}
          type="number"
          label="Anno di riferimento"
          size="small"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          sx={{ width: 150 }}
        />
      </DialogTitle>
      
      <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
        {loading ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : error ? (
           <Alert severity="error">{error}</Alert>
        ) : data ? (
          <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }} id="allegato-3b-printable">
            <Box textAlign="center">
              <Typography variant="h5" fontWeight="bold">ALLEGATO 3B</Typography>
              <Typography variant="subtitle1">Informazioni relative ai dati aggregati sanitari e di rischio dei lavoratori sottoposti a sorveglianza sanitaria</Typography>
            </Box>
            
            <Divider />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Azienda</Typography>
                <Typography variant="body1" fontWeight="bold">{data.companyName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Anno</Typography>
                <Typography variant="body1" fontWeight="bold">{data.year}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Lavoratori Soggetti a Sorveglianza</Typography>
                <Typography variant="body1" fontWeight="bold">{data.totalEmployeesSubjectToSurveillance}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Visite Effettuate nell'Anno</Typography>
                <Typography variant="body1" fontWeight="bold">{data.totalVisits}</Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 2 }}>Esiti Giudizi di Idoneità</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>Esito</TableCell>
                    <TableCell align="right">Numero</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow><TableCell>Idonei (Senza Limitazioni)</TableCell><TableCell align="right">{data.idonei}</TableCell></TableRow>
                  <TableRow><TableCell>Idonei Parziali (Con prescrizioni/limitazioni)</TableCell><TableCell align="right">{data.idoneiParziali}</TableCell></TableRow>
                  <TableRow><TableCell>Non Idonei (Permanenti e Temporanei)</TableCell><TableCell align="right">{data.inidonei}</TableCell></TableRow>
                  <TableRow><TableCell>Sospesi (In attesa di esami, etc)</TableCell><TableCell align="right">{data.sospesi}</TableCell></TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" sx={{ mt: 2 }}>Fattori di Rischio Riscontrati (Esposti)</Typography>
            {Object.keys(data.riskExposures || {}).length === 0 ? (
              <Typography variant="body2">Nessun fattore di rischio mappato o lavoratori non assegnati a rischi.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell>Fattore di Rischio</TableCell>
                      <TableCell align="right">Lavoratori Esposti</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.riskExposures).map(([risk, count]) => (
                      <TableRow key={risk}>
                        <TableCell>{risk}</TableCell>
                        <TableCell align="right">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box sx={{ mt: 4, pt: 4, borderTop: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Luogo e Data: _______________________</Typography>
              <Typography variant="body2">Timbro e Firma Medico Competente: _______________________</Typography>
            </Box>

          </Paper>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
        <Button 
          variant="contained" 
          startIcon={<PictureAsPdfIcon />} 
          onClick={handlePrint}
          disabled={loading || !data}
        >
          Stampa PDF / Salva CSV
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default Allegato3BPreview
