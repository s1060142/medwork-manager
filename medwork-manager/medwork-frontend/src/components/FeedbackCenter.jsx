import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Chip,
} from '@mui/material'
import FeedbackIcon from '@mui/icons-material/Feedback'

export default function FeedbackCenter() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ category: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!form.subject.trim() || !form.message.trim()) return
    setSubmitted(true)
    setTimeout(() => {
      setOpen(false)
      setSubmitted(false)
      setForm({ category: '', subject: '', message: '' })
    }, 2000)
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Feedback
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Il tuo feedback ci aiuta a migliorare MedWork Manager. Seleziona una categoria e
          descrivi la tua segnalazione.
        </Typography>
      </Paper>

      <Button
        variant="contained"
        startIcon={<FeedbackIcon />}
        onClick={() => setOpen(true)}
      >
        Invia Feedback
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invia Feedback</DialogTitle>
        <DialogContent>
          {submitted ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Chip label="Feedback inviato con successo!" color="success" />
            </Box>
          ) : (
            <>
              <FormControl fullWidth margin="dense">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={form.category}
                  label="Categoria"
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <MenuItem value="bug">Bug / Errore</MenuItem>
                  <MenuItem value="feature">Richiesta funzionalità</MenuItem>
                  <MenuItem value="improvement">Miglioramento</MenuItem>
                  <MenuItem value="other">Altro</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                margin="dense"
                label="Oggetto"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Messaggio"
                multiline
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annulla</Button>
          {!submitted && (
            <Button variant="contained" onClick={handleSubmit}>
              Invia
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}