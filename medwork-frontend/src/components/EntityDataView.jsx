import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5099'

function formatValue(value) {
  if (value === null || value === undefined) {
    return '-'
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? '-' : value.join(' • ')
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime()) && value.includes('T')) {
      return parsed.toLocaleDateString('it-IT')
    }
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 'Sì' : 'No'
  }

  return String(value)
}

function toHeaderLabel(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase())
}

function EntityDataView({ title, endpoint }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (response.status === 401 || response.status === 403) {
          throw new Error('Non hai i permessi per visualizzare questa entità con il ruolo corrente.')
        }

        if (!response.ok) {
          throw new Error('Errore nel caricamento dei dati.')
        }

        const data = await response.json()
        setRows(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Si è verificato un errore imprevisto.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [endpoint])

  const columns = useMemo(() => {
    if (rows.length === 0) {
      return []
    }
    return Object.keys(rows[0])
  }, [rows])

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!!error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && rows.length === 0 && (
        <Alert severity="info">Nessun dato disponibile.</Alert>
      )}

      {!loading && !error && rows.length > 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column}>{toHeaderLabel(column)}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id ?? `${index}-${title}`} hover>
                  {columns.map((column) => (
                    <TableCell key={`${index}-${column}`}>{formatValue(row[column])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}

export default EntityDataView