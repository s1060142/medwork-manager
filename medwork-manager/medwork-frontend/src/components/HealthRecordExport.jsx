import { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import CancelIcon from '@mui/icons-material/Cancel'

export default function HealthRecordExport() {
  const [mode, setMode] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [includeAttachments, setIncludeAttachments] = useState(true)
  const [includeServices, setIncludeServices] = useState(true)
  const [includePrivacy, setIncludePrivacy] = useState(true)
  const [exporting, setExporting] = useState(false)

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => setExporting(false), 2000)
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Esporta cartella sanitaria
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Opzioni di esportazione
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant={mode === 'all' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setMode('all')}
          >
            Tutti i referti
          </Button>
          <Button
            variant={mode === 'period' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setMode('period')}
          >
            Scegli il periodo
          </Button>
        </Box>
        {mode === 'period' && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Data inizio"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Data fine"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Includi
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={includeAttachments}
              onChange={(e) => setIncludeAttachments(e.target.checked)}
            />
          }
          label="Allegati dei referti"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={includeServices}
              onChange={(e) => setIncludeServices(e.target.checked)}
            />
          }
          label="Prestazioni erogate e refertate"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={includePrivacy}
              onChange={(e) => setIncludePrivacy(e.target.checked)}
            />
          }
          label="Informativa privacy firmata"
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Esportazione in corso...' : 'Procedi'}
        </Button>
        <Button startIcon={<CancelIcon />}>Annulla</Button>
      </Box>
    </Box>
  )
}