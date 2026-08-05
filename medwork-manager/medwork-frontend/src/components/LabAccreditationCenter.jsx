import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Paper,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import CancelIcon from '@mui/icons-material/Cancel'

const LABORATORIES = [
  'Laboratorio Analisi Roma',
  'Laboratorio Analisi Milano',
  'Laboratorio Analisi Napoli',
  'Laboratorio Analisi Torino',
  'Laboratorio Analisi Firenze',
]

export default function LabAccreditationCenter() {
  const [lab, setLab] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    if (!lab) return
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setLab('')
    }, 3000)
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Invita accredamenti al laboratorio
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Indica a quale laboratorio vuoi inviare l'accreditamento selezionato.
        </Typography>
        <FormControl fullWidth margin="dense">
          <InputLabel>Laboratorio</InputLabel>
          <Select
            value={lab}
            label="Laboratorio"
            onChange={(e) => setLab(e.target.value)}
          >
            {LABORATORIES.map((l) => (
              <MenuItem key={l} value={l}>
                {l}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSend}
          disabled={!lab}
        >
          Invia
        </Button>
        <Button startIcon={<CancelIcon />}>Annulla</Button>
      </Box>
      {sent && (
        <Paper sx={{ p: 2, mt: 2, backgroundColor: '#e8f5e9' }}>
          <Typography variant="body2" color="success.main">
            Accreditamento inviato con successo!
          </Typography>
        </Paper>
      )}
    </Box>
  )
}