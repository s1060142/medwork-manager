import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
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
import SearchIcon from '@mui/icons-material/Search'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import { apiGet, apiSend } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'

const CATEGORIES = ['Anamnesi', 'EsameObiettivo', 'Conclusioni']

export default function PhraseTemplatesCenter() {
  const [phrases, setPhrases] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [error, setError] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ category: 'Anamnesi', text: '', tags: '' })

  const load = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('category', category)
    if (favouritesOnly) params.set('favouritesOnly', 'true')
    apiGet(`/api/phrase-templates?${params.toString()}`)
      .then((data) => setPhrases(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Errore nel caricamento delle frasi.'))
  }

  useEffect(load, [query, category, favouritesOnly])

  const filtered = useMemo(() => phrases, [phrases])

  const openNew = () => {
    setEditing(null)
    setForm({ category: 'Anamnesi', text: '', tags: '' })
    setEditorOpen(true)
  }

  const openEdit = (phrase) => {
    setEditing(phrase)
    setForm({ category: phrase.category, text: phrase.text, tags: phrase.tags || '' })
    setEditorOpen(true)
  }

  const save = () => {
    if (!form.text.trim()) return
    const payload = { ...form, isFavourite: editing?.isFavourite || false }
    const action = editing
      ? apiSend('PUT', `/api/phrase-templates/${editing.id}`, payload)
      : apiSend('POST', '/api/phrase-templates', payload)
    action
      .then(() => {
        setEditorOpen(false)
        appendAuditEvent({ module: 'Frasi tipo', action: editing ? 'Modifica' : 'Creazione', detail: form.text.slice(0, 40) })
        load()
      })
      .catch((err) => setError(err.message || 'Salvataggio fallito.'))
  }

  const remove = (phrase) => {
    if (!window.confirm('Eliminare questa frase tipo?')) return
    apiSend('DELETE', `/api/phrase-templates/${phrase.id}`)
      .then(load)
      .catch((err) => setError(err.message || 'Eliminazione fallita.'))
  }

  const toggleFavourite = (phrase) => {
    apiSend('PUT', `/api/phrase-templates/${phrase.id}`, { ...phrase, isFavourite: !phrase.isFavourite })
      .then(load)
      .catch((err) => setError(err.message || 'Aggiornamento preferito fallito.'))
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6">Libreria frasi tipo</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Frasi predefinite per anamnesi, esame obiettivo e conclusioni. Ricerca fuzzy e preferiti per medico.
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mt: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Cerca frase..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" /> }}
          />
          <TextField
            select
            size="small"
            label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Tutte</MenuItem>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
          <Chip
            label="Solo preferiti"
            clickable
            color={favouritesOnly ? 'primary' : 'default'}
            onClick={() => setFavouritesOnly((v) => !v)}
          />
          <Button variant="contained" onClick={openNew}>Nuova frase</Button>
        </Box>

        {!!error && <Alert severity="warning" sx={{ mt: 1.5 }}>{error}</Alert>}
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Categoria</TableCell>
              <TableCell>Frase</TableCell>
              <TableCell>Tag</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((phrase) => (
              <TableRow key={phrase.id} hover>
                <TableCell>{phrase.category}</TableCell>
                <TableCell>{phrase.text}</TableCell>
                <TableCell>{phrase.tags ? <Chip size="small" label={phrase.tags} /> : '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => toggleFavourite(phrase)} title="Preferito">
                    {phrase.isFavourite ? <StarIcon color="warning" /> : <StarBorderIcon />}
                  </IconButton>
                  <Button size="small" onClick={() => openEdit(phrase)}>Modifica</Button>
                  <Button size="small" color="error" onClick={() => remove(phrase)}>Elimina</Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary">Nessuna frase trovata.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Modifica frase tipo' : 'Nuova frase tipo'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Categoria"
              value={form.category}
              onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Testo"
              multiline
              minRows={3}
              value={form.text}
              onChange={(e) => setForm((c) => ({ ...c, text: e.target.value }))}
            />
            <TextField
              label="Tag (separati da virgola)"
              value={form.tags}
              onChange={(e) => setForm((c) => ({ ...c, tags: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={save}>Salva</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
