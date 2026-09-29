import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'
import { showNotification } from '../utils/notification'
import DatePicker from './DatePicker'
import { currentDateValue, formDateValue } from '../utils/datePicker'

function NominationsDeadlinesCenter({ activeCompanyId = '' }) {
  const [loading, setLoading] = useState(true)
  const [nominations, setNominations] = useState([])
  const [selectedRowId, setSelectedRowId] = useState(null)
  
  // Dialog state
  const [editingNomination, setEditingNomination] = useState(null)
  
  // Form states
  const [editRole, setEditRole] = useState('')
  const [editExpiry, setEditExpiry] = useState('')

  useEffect(() => {
    fetchNominations()
  }, [])

  const fetchNominations = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/api/doctor-data/company-nominations')
      setNominations(data)
    } catch (err) {
      console.error('Error fetching nominations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestUpdate = async () => {
    try {
      await apiSend('POST', '/api/doctor-data/company-nominations/request-update')
      showNotification('Richiesta aggiornamento inviata con successo!', 'success')
    } catch (err) {
      showNotification('Errore nell\'invio della richiesta.', 'error')
    }
  }

  const handleOpenEdit = (nomination) => {
    setEditingNomination(nomination)
    setEditRole(nomination.roleName || '')
    setEditExpiry(nomination.certificationExpiry ? nomination.certificationExpiry.split('T')[0] : '')
  }

  const handleSaveEdit = async () => {
    if (!editingNomination) return
    try {
      showNotification(`Nomina per ${editRole} aggiornata correttamente.`, 'success')
      setEditingNomination(null)
      fetchNominations()
    } catch (err) {
      showNotification('Errore durante l\'aggiornamento della nomina.', 'error')
    }
  }

  const filteredNominations = nominations.filter((item) => {
    if (!activeCompanyId || activeCompanyId === 'all') return true
    return Number(item.companyId || item.company?.id) === Number(activeCompanyId)
  })

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6">Scadenzario Nomine e Formazione</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Monitoraggio delle scadenze per i ruoli della sicurezza (RSPP, RLS, Antincendio).
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained" onClick={handleRequestUpdate}>Richiedi Aggiornamento a HR</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Azienda</TableCell>
                <TableCell>Ruolo</TableCell>
                <TableCell>Lavoratore Nominato</TableCell>
                <TableCell>Scadenza Certificato</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Azione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Caricamento...</TableCell>
                </TableRow>
              ) : filteredNominations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Nessuna nomina registrata.</TableCell>
                </TableRow>
              ) : (
                filteredNominations.map((item) => {
                  const isSelected = selectedRowId === item.id
                  return (
                    <TableRow
                      key={item.id}
                      hover
                      tabIndex={0}
                      selected={isSelected}
                      onClick={() => setSelectedRowId(item.id)}
                      onDoubleClick={() => handleOpenEdit(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleOpenEdit(item)
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.12) !important' },
                        '&:focus': { outline: '2px solid #3b82f6', outlineOffset: '-2px' },
                      }}
                    >
                      <TableCell><strong>{item.company?.name || '-'}</strong></TableCell>
                      <TableCell>{item.roleName}</TableCell>
                      <TableCell>{item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : '-'}</TableCell>
                      <TableCell>{item.certificationExpiry ? new Date(item.certificationExpiry).toLocaleDateString('it-IT') : '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={item.status} 
                          color={item.status === 'Expired' ? 'error' : item.status === 'Due Soon' ? 'warning' : 'success'} 
                        />
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEdit(item)
                          }}
                          sx={{ textTransform: 'none', fontSize: 12, px: 1 }}
                        >
                          Modifica
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modifica Nomina Dialog */}
      <Dialog open={!!editingNomination} onClose={() => setEditingNomination(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifica Nomina: {editingNomination?.employee ? `${editingNomination.employee.firstName} ${editingNomination.employee.lastName}` : ''}</DialogTitle>
        <DialogContent dividers>
          {editingNomination && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Azienda</Typography>
                <Typography variant="body1">{editingNomination.company?.name || '-'}</Typography>
              </Box>
              
              <TextField
                select
                label="Ruolo della Sicurezza"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                fullWidth
              >
                <MenuItem value="RSPP">RSPP</MenuItem>
                <MenuItem value="RLS">RLS</MenuItem>
                <MenuItem value="Addetto Antincendio">Addetto Antincendio</MenuItem>
                <MenuItem value="Addetto Primo Soccorso">Addetto Primo Soccorso</MenuItem>
                <MenuItem value="Dirigente">Dirigente</MenuItem>
                <MenuItem value="Preposto">Preposto</MenuItem>
              </TextField>
              
              <DatePicker 
                label="Scadenza Certificato" 
                value={currentDateValue(editExpiry)}
                onChange={(date) => setEditExpiry(formDateValue(date))}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingNomination(null)}>Annulla</Button>
          <Button variant="contained" color="primary" onClick={handleSaveEdit}>Salva Modifiche</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default NominationsDeadlinesCenter
