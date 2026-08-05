import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
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
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { apiGet } from '../services/apiClient'

export default function SearchCenter() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = () => {
    if (!query.trim()) return
    setLoading(true)
    apiGet(`/api/master-data/employees?search=${encodeURIComponent(query)}`)
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
        setResults(arr)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Ricerca
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Cerca lavoratore per nome, cognome o codice fiscale..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ endAdornment: <SearchIcon color="action" /> }}
        />
      </Paper>
      {loading && <CircularProgress />}
      {!loading && results.length === 0 && query && (
        <Typography color="text.secondary">Nessun risultato trovato.</Typography>
      )}
      {results.length > 0 && (
        <Paper>
          {results.map((r) => (
            <Box key={r.id} sx={{ p: 2, borderBottom: '1px solid #eee' }}>
              <Typography variant="subtitle1">
                {r.lastName} {r.firstName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {r.taxCode} — {r.jobRole || '-'}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  )
}