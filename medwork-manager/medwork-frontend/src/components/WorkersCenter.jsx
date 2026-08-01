import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { apiGet } from '../services/apiClient'

export default function WorkersCenter() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiGet('/api/master-data/employees')
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = employees
    .filter((e) => {
      const s = search.toLowerCase()
      return (
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(s) ||
        (e.taxCode || '').toLowerCase().includes(s)
      )
    })
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (event, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (loading) return <CircularProgress />

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Lavoratori
      </Typography>

      {/* Statistics */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2">Idonei: 2</Typography>
          <Typography variant="body2">Parzialmente idonei: 0</Typography>
          <Typography variant="body2">Non idonei: 0</Typography>
          <Typography variant="body2">Senza idoneità: 3</Typography>
        </Box>
      </Paper>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Nominativo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button startIcon={<Refresh />} size="small">
          Reset
        </Button>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cognome</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Codice fiscale</TableCell>
              <TableCell>Mansione</TableCell>
              <TableCell>Stato idoneità</TableCell>
              <TableCell>Data ultimo giudizio</TableCell>
              <TableCell>Stato lavorativo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.lastName}</TableCell>
                <TableCell>{row.firstName}</TableCell>
                <TableCell>{row.taxCode || '-'}</TableCell>
                <TableCell>{row.jobRole || '-'}</TableCell>
                <TableCell>
                  <Chip label="Senza idoneità" size="small" />
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>Attivo</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={employees.length}
        rowPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  )
}