import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  Typography,
} from '@mui/material'
import { apiGet } from '../services/apiClient'

const STORAGE_KEY = 'medwork.archivedEmployees'

function toDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleDateString('it-IT') : '-'
}

function normalizeText(value) {
  return String(value || '').toLowerCase()
}

function classifyFitness(outcome) {
  const text = normalizeText(outcome)
  if (!text.trim()) return { key: 'none', label: 'Senza idoneità', color: 'default' }
  if (text.includes('non idone')) return { key: 'not-fit', label: 'Non idoneo', color: 'error' }
  if (text.includes('prescr') || text.includes('parzial') || text.includes('limit')) {
    return { key: 'partial', label: 'Parzialmente idoneo', color: 'warning' }
  }
  if (text.includes('idone')) return { key: 'fit', label: 'Idoneo', color: 'success' }
  return { key: 'none', label: 'Senza idoneità', color: 'default' }
}

function loadArchived() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveArchived(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

function WorkersCenter({ activeCompanyId = '', activeBranchId = '', onOpenEmployeeCreate, onOpenEmployeeCrud }) {
  const [activeTab, setActiveTab] = useState('workers')
  const [employees, setEmployees] = useState([])
  const [visits, setVisits] = useState([])
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [jobRoles, setJobRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [fitnessFilter, setFitnessFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [archivedIds, setArchivedIds] = useState(() => loadArchived())

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')

        const [employeesData, visitsData, companiesData, branchesData, rolesData] = await Promise.all([
          apiGet('/api/master-data/employees'),
          apiGet('/api/master-data/medical-visits'),
          apiGet('/api/master-data/companies'),
          apiGet('/api/master-data/branches'),
          apiGet('/api/master-data/job-roles'),
        ])

        // Le API restituiscono un wrapper paginato { total, items: [...] } oppure un array grezzo.
        const asArray = (d) => (Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : [])
        setEmployees(asArray(employeesData))
        setVisits(asArray(visitsData))
        setCompanies(asArray(companiesData))
        setBranches(asArray(branchesData))
        setJobRoles(asArray(rolesData))
      } catch (requestError) {
        setError(requestError.message || 'Errore nel caricamento dati lavoratori.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const latestVisitByEmployee = useMemo(() => {
    return visits.reduce((accumulator, visit) => {
      const employeeId = Number(visit.employeeId)
      const date = toDate(visit.visitDate)
      if (!date) return accumulator
      if (!accumulator[employeeId] || date > toDate(accumulator[employeeId].visitDate)) {
        accumulator[employeeId] = visit
      }
      return accumulator
    }, {})
  }, [visits])

  const workerRows = useMemo(() => {
    return employees
      .map((employee) => {
        const latestVisit = latestVisitByEmployee[Number(employee.id)]
        const fitness = classifyFitness(latestVisit?.outcome)
        return {
          ...employee,
          latestVisitDate: latestVisit?.visitDate || null,
          latestOutcome: latestVisit?.outcome || '',
          fitness,
          isArchived: archivedIds.includes(Number(employee.id)),
          jobRoleDisplay: employee.jobRoleName || employee.jobRole || '-',
          workingStatus: 'Attivo',
        }
      })
      .sort((left, right) => String(left.lastName || '').localeCompare(String(right.lastName || '')))
  }, [employees, latestVisitByEmployee, archivedIds])

  const filteredRows = useMemo(() => {
    const needle = normalizeText(search)

    return workerRows.filter((row) => {
      if (!showArchived && row.isArchived) return false
      if (fitnessFilter !== 'all' && row.fitness.key !== fitnessFilter) return false

      if (!needle) return true

      const searchable = `${row.lastName} ${row.firstName} ${row.taxCode} ${row.jobRoleDisplay} ${row.companyName || ''}`.toLowerCase()
      return searchable.includes(needle)
    })
  }, [workerRows, showArchived, fitnessFilter, search])

  const kpi = useMemo(() => {
    const source = workerRows.filter((row) => !row.isArchived)
    return {
      fit: source.filter((item) => item.fitness.key === 'fit').length,
      partial: source.filter((item) => item.fitness.key === 'partial').length,
      notFit: source.filter((item) => item.fitness.key === 'not-fit').length,
      none: source.filter((item) => item.fitness.key === 'none').length,
    }
  }, [workerRows])

  const contextualRolesWithCount = useMemo(() => {
    const counts = workerRows
      .filter((row) => !row.isArchived)
      .reduce((accumulator, row) => {
      const key = row.jobRoleDisplay || '-'
      accumulator[key] = (accumulator[key] || 0) + 1
      return accumulator
    }, {})

    const rows = []
    Object.keys(counts).forEach((name) => {
      const role = jobRoles.find((item) => item.name === name)
      rows.push({
        id: role?.id || name,
        name,
        count: counts[name],
      })
    })

    return rows.sort((a, b) => b.count - a.count)
  }, [workerRows, jobRoles])

  const toggleArchived = (employeeId) => {
    const id = Number(employeeId)
    const next = archivedIds.includes(id)
      ? archivedIds.filter((item) => item !== id)
      : [...archivedIds, id]

    setArchivedIds(next)
    saveArchived(next)
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="h6">Aziende / Lavoratori</Typography>
            <Typography variant="body2" color="text.secondary">Vista operativa con KPI idoneità, filtri avanzati e stato lavorativo.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={onOpenEmployeeCrud}>Gestione completa</Button>
            <Button variant="contained" onClick={onOpenEmployeeCreate}>Aggiungi</Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems={{ md: 'center' }} sx={{ mt: 1.5 }}>
          <Stack direction="row" spacing={0.8} alignItems="center">
            <Typography variant="body2" color="text.secondary">Azienda corrente</Typography>
            <Typography variant="body2" color="text.secondary">›</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{companies.length} aziende caricate</Typography>
            <Chip size="small" variant="outlined" label={`${workerRows.filter((x) => !x.isArchived).length} lavoratori`} />
          </Stack>
        </Stack>

        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mt: 1.5 }} variant="scrollable" allowScrollButtonsMobile>
          <Tab value="general" label="Generali" />
          <Tab value="places" label={`Luoghi (${branches.length})`} />
          <Tab value="roles" label={`Mansioni (${contextualRolesWithCount.length})`} />
          <Tab value="workers" label={`Lavoratori (${workerRows.filter((x) => !x.isArchived).length})`} />
        </Tabs>
      </Paper>

      {!!error && <Alert severity="error">{error}</Alert>}
      {loading && <Alert severity="info">Caricamento dati in corso...</Alert>}

      {!loading && activeTab === 'workers' && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Lavoratori idonei</Typography>
              <Typography variant="h5">{kpi.fit}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Parzialmente idonei</Typography>
              <Typography variant="h5">{kpi.partial}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Non idonei</Typography>
              <Typography variant="h5">{kpi.notFit}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Senza idoneità</Typography>
              <Typography variant="h5">{kpi.none}</Typography>
            </Paper>
          </Box>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.2}>
              <TextField
                size="small"
                label="Cerca lavoratore"
                placeholder="Cognome, nome, codice fiscale, mansione..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: { lg: 260 } }}
              />

              <TextField
                select
                size="small"
                label="Stato idoneità"
                value={fitnessFilter}
                onChange={(event) => setFitnessFilter(event.target.value)}
                sx={{ minWidth: { lg: 200 } }}
              >
                <MenuItem value="all">Tutti</MenuItem>
                <MenuItem value="fit">Idoneo</MenuItem>
                <MenuItem value="partial">Parzialmente idoneo</MenuItem>
                <MenuItem value="not-fit">Non idoneo</MenuItem>
                <MenuItem value="none">Senza idoneità</MenuItem>
              </TextField>

              <FormControlLabel
                sx={{ ml: { lg: 'auto' } }}
                control={<Switch checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />}
                label="Mostra archiviati"
              />
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Cognome</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Codice fiscale</TableCell>
                  <TableCell>Mansione</TableCell>
                  <TableCell>Stato idoneità</TableCell>
                  <TableCell>Data ultimo giudizio</TableCell>
                  <TableCell>Stato lavorativo</TableCell>
                  <TableCell align="right">Azione</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.lastName}</TableCell>
                    <TableCell>{row.firstName}</TableCell>
                    <TableCell>{row.taxCode || '-'}</TableCell>
                    <TableCell>{row.jobRoleDisplay}</TableCell>
                    <TableCell>
                      <Chip size="small" color={row.fitness.color} label={row.fitness.label} variant="outlined" />
                    </TableCell>
                    <TableCell>{formatDate(row.latestVisitDate)}</TableCell>
                    <TableCell>
                      <Chip size="small" color="success" label={row.workingStatus} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => toggleArchived(row.id)}>
                        {row.isArchived ? 'Ripristina' : 'Archivia'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography variant="body2" color="text.secondary">Nessun lavoratore trovato con i filtri correnti.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {!loading && activeTab === 'general' && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Aziende</Typography>
              <Typography variant="h5">{companies.length}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Luoghi</Typography>
              <Typography variant="h5">{branches.length}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Mansioni</Typography>
              <Typography variant="h5">{contextualRolesWithCount.length}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Lavoratori attivi</Typography>
              <Typography variant="h5">{workerRows.filter((x) => !x.isArchived).length}</Typography>
            </Paper>
          </Box>
        </Paper>
      )}

      {!loading && activeTab === 'places' && (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Azienda</TableCell>
                <TableCell>Città</TableCell>
                <TableCell>Indirizzo</TableCell>
                <TableCell>Provincia</TableCell>
                <TableCell>Dipendenti</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.companyName || '-'}</TableCell>
                  <TableCell>{row.city || '-'}</TableCell>
                  <TableCell>{row.address || '-'}</TableCell>
                  <TableCell>{row.province || '-'}</TableCell>
                  <TableCell>{row.employeesCount ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
        </Paper>
      )}

      {!loading && activeTab === 'roles' && (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell>Mansione</TableCell>
                <TableCell>Dipendenti</TableCell>
                <TableCell>Descrizione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contextualRolesWithCount.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell>{jobRoles.find((x) => x.name === row.name)?.description || '-'}</TableCell>
                </TableRow>
              ))}
              {contextualRolesWithCount.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="body2" color="text.secondary">Nessuna mansione presente nel contesto selezionato.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </TableContainer>
        </Paper>
      )}
    </Stack>
  )
}

export default WorkersCenter
