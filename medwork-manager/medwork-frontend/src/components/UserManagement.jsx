import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import KeyIcon from '@mui/icons-material/Key'
import AddIcon from '@mui/icons-material/Add'
import { apiGet, apiSend } from '../services/apiClient'

const ROLES = ['Admin', 'Doctor', 'Secretary', 'Rspp', 'Employer', 'Worker']

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Dialog creazione/modifica
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null) // null = creazione
  const [form, setForm] = useState({ username: '', password: '', role: 'Worker', email: '', taxCode: '' })
  const [formError, setFormError] = useState('')

  // Dialog cambio password
  const [pwDialog, setPwDialog] = useState(false)
  const [pwTarget, setPwTarget] = useState(null)
  const [newPw, setNewPw] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet('/api/admin/users')
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Errore nel caricamento utenti.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ username: '', password: '', role: 'Worker', email: '', taxCode: '' })
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (u) => {
    setEditing(u)
    setForm({ username: u.username, password: '', role: u.role, email: u.email || '', taxCode: u.taxCode || '' })
    setFormError('')
    setDialogOpen(true)
  }

  const save = async () => {
    setFormError('')
    if (!form.username.trim()) { setFormError('Inserisci uno username.'); return }
    if (!editing && !form.password) { setFormError('Inserisci una password iniziale.'); return }
    try {
      if (editing) {
        await apiSend('PUT', `/api/admin/users/${editing.id}`, {
          role: form.role,
          email: form.email || null,
          taxCode: form.taxCode || null,
          isActive: editing.isActive,
        })
      } else {
        await apiSend('POST', '/api/admin/users', {
          username: form.username.trim(),
          password: form.password,
          role: form.role,
          email: form.email || null,
          taxCode: form.taxCode || null,
        })
      }
      setDialogOpen(false)
      await load()
    } catch (e) {
      setFormError(e.message || 'Salvataggio fallito.')
    }
  }

  const deactivate = async (u) => {
    if (!window.confirm(`Disattivare l'utente "${u.username}"? Potrà essere riattivato in seguito.`)) return
    try {
      await apiSend('DELETE', `/api/admin/users/${u.id}`)
      await load()
    } catch (e) {
      setError(e.message || 'Disattivazione fallita.')
    }
  }

  const openChangePw = (u) => {
    setPwTarget(u)
    setNewPw('')
    setPwDialog(true)
  }

  const changePw = async () => {
    if (newPw.length < 8) { alert('La password deve essere di almeno 8 caratteri.'); return }
    try {
      await apiSend('POST', `/api/admin/users/${pwTarget.id}/change-password`, { newPassword: newPw })
      setPwDialog(false)
      await load()
    } catch (e) {
      alert(e.message || 'Cambio password fallito.')
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Gestione utenti</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuovo utente
        </Button>
      </Stack>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading && <Typography>Caricamento…</Typography>}

      {!loading && (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Ruolo</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Ultimo accesso</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.email || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={u.isActive ? 'Attivo' : 'Disattivato'}
                      color={u.isActive ? 'success' : 'default'}
                      variant={u.isActive ? 'filled' : 'outlined'}
                    />
                    {u.mustChangePassword && (
                      <Chip size="small" label="Cambio pwd" color="warning" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    {u.lastLoginAtUtc ? new Date(u.lastLoginAtUtc).toLocaleString('it-IT') : 'mai'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openChangePw(u)} title="Cambia password">
                      <KeyIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(u)} title="Modifica">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => deactivate(u)} title="Disattiva">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">Nessun utente.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Dialog creazione / modifica */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? `Modifica ${editing.username}` : 'Nuovo utente'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Username"
              size="small"
              value={form.username}
              disabled={!!editing}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            {!editing && (
              <TextField
                label="Password iniziale"
                type="password"
                size="small"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            )}
            <TextField
              select
              label="Ruolo"
              size="small"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Email"
              size="small"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Codice fiscale / P.IVA"
              size="small"
              value={form.taxCode}
              helperText="Per portali lavoratore/azienda"
              onChange={(e) => setForm({ ...form, taxCode: e.target.value })}
            />
            {formError && <Typography color="error" variant="body2">{formError}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={save}>Salva</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog cambio password */}
      <Dialog open={pwDialog} onClose={() => setPwDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambia password: {pwTarget?.username}</DialogTitle>
        <DialogContent>
          <TextField
            label="Nuova password (min 8)"
            type="password"
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwDialog(false)}>Annulla</Button>
          <Button variant="contained" onClick={changePw}>Aggiorna</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
