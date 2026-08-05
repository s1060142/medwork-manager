import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import { apiGet, apiSend } from '../services/apiClient'

const COMPANY_TABS = [
  { key: 'generali', label: 'Generali' },
  { key: 'luoghi', label: 'Luoghi' },
  { key: 'mansioni', label: 'Mansioni' },
  { key: 'lavoratori', label: 'Lavoratori' },
  { key: 'organigramma', label: 'Organigramma' },
  { key: 'nomine', label: 'Nomine' },
  { key: 'prestazioni', label: 'Prestazioni' },
  { key: 'fatturazione', label: 'Fatturazione' },
  { key: 'allegati', label: 'Allegati' },
  { key: 'risorse-umane', label: 'Risorse umane' },
  { key: 'storico', label: 'Storico' },
]

const FITNESS_STATUS_COLORS = {
  'Idoneo': 'success',
  'Parzialmente idoneo': 'warning',
  'Non idoneo': 'error',
  'Senza idoneità': 'default',
}

const WORK_STATUS_COLORS = {
  'Attivo': 'success',
  'Inattivo': 'default',
  'Sospeso': 'warning',
  'Cessato': 'error',
}

export default function AziendeCenter() {
  const [activeTab, setActiveTab] = useState('lavoratori')
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [fitnessStats, setFitnessStats] = useState({ idonei: 0, parziali: 0, nonIdonei: 0, senzaIdoneita: 0 })

  // Load companies on mount
  useEffect(() => {
    apiGet('/api/master-data/companies')
      .then(setCompanies)
      .catch(() => setCompanies([]))
  }, [])

  // Load workers when company changes
  useEffect(() => {
    if (!selectedCompanyId) {
      setWorkers([])
      setFitnessStats({ idonei: 0, parziali: 0, nonIdonei: 0, senzaIdoneita: 0 })
      return
    }
    setLoading(true)
    apiGet(`/api/master-data/employees?companyId=${selectedCompanyId}`)
      .then((data) => {
        const arr = Array.isArray(data) ? data : (data.items || [])
        setWorkers(arr)
        const counts = arr.reduce((acc, e) => {
          const status = e.fitnessStatus || 'Senza idoneità'
          if (status === 'Idoneo') acc.idonei++
          else if (status === 'Parzialmente idoneo') acc.parziali++
          else if (status === 'Non idoneo') acc.nonIdonei++
          else acc.senzaIdoneita++
          return acc
        }, { idonei: 0, parziali: 0, nonIdonei: 0, senzaIdoneita: 0 })
        setFitnessStats(counts)
      })
      .catch(() => {
        setWorkers([])
        setFitnessStats({ idonei: 0, parziali: 0, nonIdonei: 0, senzaIdoneita: 0 })
      })
      .finally(() => setLoading(false))
  }, [selectedCompanyId])

  const filteredWorkers = useMemo(() => {
    if (!search) return workers
    const s = search.toLowerCase()
    return workers.filter((w) =>
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(s) ||
      (w.taxCode || '').toLowerCase().includes(s) ||
      (w.jobRole || '').toLowerCase().includes(s)
    )
  }, [workers, search])

  const paginatedWorkers = useMemo(() => {
    const start = page * rowsPerPage
    return filteredWorkers.slice(start, start + rowsPerPage)
  }, [filteredWorkers, page, rowsPerPage])

  const handleChangePage = (event, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const renderGeneraliTab = () => (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Dati per fatturazione</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          <TextField label="Codice SDI" size="small" />
          <TextField label="IBAN" size="small" />
          <TextField label="Banca" size="small" />
          <TextField label="Metodo pagamento default" size="small" select>
            <MenuItem value="CC">CC - Carta di credito</MenuItem>
            <MenuItem value="BON">Bonifico</MenuItem>
          </TextField>
          <TextField label="Tempi pagamento" size="small" placeholder="30gg fine mese" />
        </Stack>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Dichiarazioni d'intento</Typography>
        <Typography variant="body2" color="text.secondary">Gestione dichiarazioni d'intento per esportazioni intracomunitarie.</Typography>
      </Paper>
    </Stack>
  )

  const renderLavoratoriTab = () => (
    <Stack spacing={2}>
      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, flexGrow: 1, minWidth: 200 }}>
          <Typography variant="h6" color="success.main">Idonei</Typography>
          <Typography variant="h3" color="success.main">{fitnessStats.idonei}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flexGrow: 1, minWidth: 200 }}>
          <Typography variant="h6" color="warning.main">Parzialmente idonei</Typography>
          <Typography variant="h3" color="warning.main">{fitnessStats.parziali}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flexGrow: 1, minWidth: 200 }}>
          <Typography variant="h6" color="error.main">Non idonei</Typography>
          <Typography variant="h3" color="error.main">{fitnessStats.nonIdonei}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flexGrow: 1, minWidth: 200 }}>
          <Typography variant="h6" color="text.secondary">Senza idoneità</Typography>
          <Typography variant="h3" color="text.secondary">{fitnessStats.senzaIdoneita}</Typography>
        </Paper>
      </Box>

      {/* Worker Table */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Cerca lavoratore..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <Button startIcon={<RefreshIcon />} size="small" disabled={loading} onClick={() => { setPage(0); }}>
          Aggiorna
        </Button>
        <Button startIcon={<AddIcon />} size="small" variant="contained">
          Nuovo lavoratore
        </Button>
      </Box>

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
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : paginatedWorkers.map((row) => {
              const fitnessStatus = row.fitnessStatus || 'Senza idoneità'
              const workStatus = row.workStatus || 'Attivo'
              return (
                <TableRow key={row.id} hover>
                  <TableCell>{row.lastName}</TableCell>
                  <TableCell>{row.firstName}</TableCell>
                  <TableCell>{row.taxCode || '-'}</TableCell>
                  <TableCell>{row.jobRole || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={fitnessStatus}
                      size="small"
                      color={FITNESS_STATUS_COLORS[fitnessStatus] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {row.lastFitnessDate
                      ? new Date(row.lastFitnessDate).toLocaleDateString('it-IT')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={workStatus}
                      size="small"
                      color={WORK_STATUS_COLORS[workStatus] || 'default'}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
            {paginatedWorkers.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {selectedCompanyId ? 'Nessun lavoratore trovato' : 'Seleziona un\'azienda'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredWorkers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Stack>
  )

  const renderPlaceholderTab = (label) => (
    <Stack spacing={2}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          Sezione in sviluppo
        </Typography>
      </Paper>
    </Stack>
  )

  const renderTabContent = (tabKey) => {
    switch (tabKey) {
      case 'generali':
        return renderGeneraliTab()
      case 'lavoratori':
        return renderLavoratoriTab()
      case 'luoghi':
        return renderPlaceholderTab('Luoghi / Sedi')
      case 'mansioni':
        return renderPlaceholderTab('Mansioni / Job Roles')
      case 'organigramma':
        return renderPlaceholderTab('Organigramma')
      case 'nomine':
        return renderPlaceholderTab('Nomine')
      case 'prestazioni':
        return renderPlaceholderTab('Prestazioni')
      case 'fatturazione':
        return renderPlaceholderTab('Fatturazione')
      case 'allegati':
        return renderPlaceholderTab('Allegati')
      case 'risorse-umane':
        return renderPlaceholderTab('Risorse umane')
      case 'storico':
        return renderPlaceholderTab('Storico')
      default:
        return renderPlaceholderTab('Sezione')
    }
  }

  return (
    <Stack spacing={2}>
      {/* Company Selector */}
      <Paper sx={{ p: 2 }}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel>Azienda</InputLabel>
          <Select
            value={selectedCompanyId}
            label="Azienda"
            onChange={(e) => {
              setSelectedCompanyId(e.target.value)
              setPage(0)
            }}
          >
            <MenuItem value="">Seleziona un'azienda</MenuItem>
            {companies.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Horizontal Tab Bar */}
      <Paper sx={{ p: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(event, newTab) => {
            setActiveTab(newTab)
            setPage(0)
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ width: '100%' }}
          aria-label="Company sections"
        >
          {COMPANY_TABS.map((tab) => (
            <Tab key={tab.key} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {renderTabContent(activeTab)}
    </Stack>
  )
}