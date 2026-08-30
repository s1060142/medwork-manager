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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  Typography,
} from '@mui/material'
import { apiGet, apiSend } from '../services/apiClient'
import { downloadCsv } from '../utils/csv'
import SearchIcon from '@mui/icons-material/Search'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import AddIcon from '@mui/icons-material/Add'

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

function WorkersCenter({ activeCompanyId = '', activeBranchId = '', onOpenEmployeeCreate, onOpenEmployeeCrud, onOpenEmployeeProfile }) {
  const [employees, setEmployees] = useState([])
  const [visits, setVisits] = useState([])
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [jobRoles, setJobRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [workerSearch, setWorkerSearch] = useState('')
  const [workerStatus, setWorkerStatus] = useState('active')
  const [companySearch, setCompanySearch] = useState('')
  const [companyArchiviation, setCompanyArchiviation] = useState('active')
  const [companyContext, setCompanyContext] = useState(activeCompanyId || 'all')
  const [selectedCompanyId, setSelectedCompanyId] = useState(activeCompanyId || '')

  useEffect(() => {
    setCompanyContext(activeCompanyId || 'all')
    setSelectedCompanyId(activeCompanyId || '')
  }, [activeCompanyId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [employeesData, visitsData, companiesData, branchesData, rolesData] = await Promise.all([
        apiGet('/api/master-data/employees?includeArchived=true'),
        apiGet('/api/master-data/medical-visits'),
        apiGet('/api/master-data/companies'),
        apiGet('/api/master-data/branches'),
        apiGet('/api/master-data/job-roles'),
      ])

      setEmployees(Array.isArray(employeesData) ? employeesData : [])
      setVisits(Array.isArray(visitsData) ? visitsData : [])
      setCompanies(Array.isArray(companiesData) ? companiesData : [])
      setBranches(Array.isArray(branchesData) ? branchesData : [])
      setJobRoles(Array.isArray(rolesData) ? rolesData : [])
    } catch (requestError) {
      setError(requestError.message || 'Errore nel caricamento dati lavoratori.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const handleEmployeeCreated = () => {
      loadData()
    }
    window.addEventListener('medwork:employee-created', handleEmployeeCreated)
    return () => window.removeEventListener('medwork:employee-created', handleEmployeeCreated)
  }, [])

  const handleResetFilters = () => {
    setCompanySearch('')
    setCompanyArchiviation('active')
    setWorkerSearch('')
    setWorkerStatus('active')
    setCompanyContext('all')
    setSelectedCompanyId('')
  }

  const handleFilterEmployees = async () => {
    try {
      setError('')
      const params = new URLSearchParams()
      params.set('includeArchived', 'true')
      if (workerSearch) params.set('search', workerSearch)
      if (companyContext && companyContext !== 'all') params.set('companyId', String(companyContext))
      const query = params.toString()
      const endpoint = `/api/master-data/employees${query ? `?${query}` : ''}`
      const data = await apiGet(endpoint)
      setEmployees(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(requestError?.message || 'Errore durante il filtro lavoratori.')
    }
  }

  const handleToggleArchive = async (row) => {
    const employeeId = Number(row.id)
    const currentArchived = row.isArchived === true
    const newArchived = !currentArchived

    // Optimistically update
    setEmployees((previous) =>
      previous.map((item) =>
        Number(item.id) === employeeId ? { ...item, isArchived: newArchived } : item
      )
    )

    try {
      await apiSend('PATCH', `/api/admin-data/employees/${employeeId}/archive`, {
        isArchived: newArchived
      })
    } catch (requestError) {
      // Revert on error
      setEmployees((previous) =>
        previous.map((item) =>
          Number(item.id) === employeeId ? { ...item, isArchived: currentArchived } : item
        )
      )
      window.alert(requestError?.message || "Errore durante l'aggiornamento dello stato del lavoratore.")
    }
  }

  const handleDeleteEmployee = async (row) => {
    const employeeId = Number(row.id)
    const label = `${row.lastName || ''} ${row.firstName || ''}`.trim() || `ID ${employeeId}`
    if (!window.confirm(`Sei sicuro di voler eliminare il lavoratore "${label}"? L'operazione non è reversibile.`)) {
      return
    }
    try {
      await apiSend('DELETE', `/api/admin-data/employees/${employeeId}`)
      setEmployees((previous) => previous.filter((item) => Number(item.id) !== employeeId))
    } catch (requestError) {
      window.alert(requestError?.message || 'Errore durante l\'eliminazione del lavoratore.')
    }
  }

  const handleExportCompanies = () => {
    const headers = ['id', 'name', 'vatNumber', 'city', 'province', 'status']
    const labelMap = {
      id: 'ID',
      name: 'Nome',
      vatNumber: 'P.IVA',
      city: 'Città',
      province: 'Provincia',
      status: 'Stato',
    }
    const rows = visibleCompanyRows.map((row) => ({
      id: row.id,
      name: row.name || row.ragioneSociale || '',
      vatNumber: row.vatNumber || '',
      city: row.cittaUnitaLocal || '',
      province: row.provincia || '',
      status: row.status || '',
    }))
    downloadCsv(
      'aziende',
      headers.map((key) => ({ label: labelMap[key], value: key })),
      rows,
    )
  }

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
           isArchived: employee.isArchived === true,
           jobRoleDisplay: employee.jobRoleName || employee.jobRole || '-',
           workingStatus: 'Attivo',
         }
       })
       .sort((left, right) => String(left.lastName || '').localeCompare(String(right.lastName || '')))
   }, [employees, latestVisitByEmployee])

  useEffect(() => {
    if (companyContext === 'all') {
      return
    }
  }, [companyContext])

  useEffect(() => {
    if (!activeCompanyId || activeCompanyId === 'all') {
      return
    }
  }, [activeCompanyId, activeBranchId])

  const filteredCompanyRows = useMemo(() => {
    const needle = normalizeText(companySearch)

    return companies.filter((row) => {
      const isArchived = row.status === 'Archiviata'
      if (companyArchiviation === 'active' && isArchived) return false
      if (companyArchiviation === 'archived' && !isArchived) return false
      if (!needle) return true
      const searchable = `${row.name || ''} ${row.ragioneSociale || ''} ${row.cittaUnitaLocal || ''} ${row.provincia || ''}`.toLowerCase()
      return searchable.includes(needle)
    })
  }, [companies, companySearch, companyArchiviation])

  const filteredWorkerRows = useMemo(() => {
    const needle = normalizeText(workerSearch)
    const source = employees.filter((row) => {
      if (!companyContext || companyContext === 'all') return true
      return Number(row.companyId) === Number(companyContext)
    })

    const statusFiltered = employeeStatusFilter(source, workerStatus)

    return statusFiltered
      .map((employee) => {
        const latestVisit = latestVisitByEmployee[Number(employee.id)]
        const fitness = classifyFitness(latestVisit?.outcome)
        return {
          ...employee,
          latestVisitDate: latestVisit?.visitDate || null,
          latestOutcome: latestVisit?.outcome || '',
          fitness,
          isArchived: employee.isArchived === true,
          jobRoleDisplay: employee.jobRoleName || employee.jobRole || '-',
          workingStatus: 'Attivo',
        }
      })
      .sort((left, right) => String(left.lastName || '').localeCompare(String(right.lastName || '')))
      .filter((row) => {
        if (!needle) return true
        const searchable = `${row.lastName || ''} ${row.firstName || ''} ${row.taxCode || ''} ${row.jobRoleDisplay || ''}`.toLowerCase()
        return searchable.includes(needle)
      })
  }, [employees, workerSearch, workerStatus, latestVisitByEmployee, companyContext])

  function employeeStatusFilter(list, status) {
    if (status === 'all') return list
    if (status === 'active') return list.filter((item) => !item.isArchived)
    if (status === 'archived') return list.filter((item) => item.isArchived)
    return list
  }

  const visibleBranches = useMemo(() => {
    if (!companyContext || companyContext === 'all') return branches
    return branches.filter((item) => Number(item.companyId) === Number(companyContext))
  }, [branches, companyContext])

  const visibleCompanyRows = useMemo(() => filteredCompanyRows, [filteredCompanyRows])

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h6">Aziende / Lavoratori</Typography>
            <Typography variant="body2" color="text.secondary">
              Vista operativa con filtri avanzati e stato lavorativo.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={onOpenEmployeeCrud} className="legacy-btn-secondary">Gestione completa</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={onOpenEmployeeCreate} className="legacy-btn">Aggiungi</Button>
          </Stack>
        </Box>

        <Box className="legacy-table-toolbar">
          <Box className="legacy-table-toolbar-filters">
            <TextField
              size="small"
              label="Nominativo"
              variant="outlined"
              value={companySearch}
              onChange={(event) => setCompanySearch(event.target.value)}
            />
            <TextField
              size="small"
              label="Provincia"
              variant="outlined"
              value=""
              onChange={() => {}}
            />
            <TextField
              size="small"
              label="Comune"
              variant="outlined"
              value=""
              onChange={() => {}}
            />
            <TextField
              size="small"
              label="Archiviazione"
              select
              variant="outlined"
              value={companyArchiviation}
              onChange={(event) => setCompanyArchiviation(event.target.value)}
            >
              <MenuItem value="active">Attive</MenuItem>
              <MenuItem value="archived">Archiviate</MenuItem>
            </TextField>
          </Box>
          <Box className="legacy-table-toolbar-filters">
            <Button className="legacy-btn" startIcon={<RestartAltIcon />} onClick={handleResetFilters}>Reset</Button>
            <Button className="legacy-btn" startIcon={<SearchIcon />} onClick={loadData}>Ricerca</Button>
            <Button className="legacy-btn" onClick={onOpenEmployeeCreate}>Ricerca lavoratori</Button>
          </Box>
        </Box>

        <Box className="legacy-data-table">
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Azienda</TableCell>
                <TableCell>Indirizzo</TableCell>
                <TableCell>P.Iva</TableCell>
                <TableCell>Medico</TableCell>
                <TableCell>Coordinati</TableCell>
                <TableCell>Dip.</TableCell>
                <TableCell>Archiviata</TableCell>
                <TableCell>Archivio</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleCompanyRows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const next = Number(row.id)
                    setCompanyContext(next)
                    setSelectedCompanyId(next)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      const next = Number(row.id)
                      setCompanyContext(next)
                      setSelectedCompanyId(next)
                    }
                  }}
                  sx={{
                    ...(Number(selectedCompanyId) === Number(row.id)
                      ? { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                      : { backgroundColor: 'transparent' }),
                  }}
                >
                  <TableCell padding="checkbox" />
                  <TableCell>{`${String(row.id || '').padStart(3, '0')} - ${row.name || '-'} - ${row.companyGroupCode || 1}`}</TableCell>
                  <TableCell>{`${row.indirizzoUnitaLocal || ''}${row.cittaUnitaLocal ? ` - ${row.cittaUnitaLocal}` : ''}${row.provincia ? ` (${row.provincia})` : ''}`}</TableCell>
                  <TableCell>{row.vatNumber || '-'}</TableCell>
                  <TableCell>{row.doctorName || '-'}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{row.employeesCount ?? '-'}</TableCell>
                  <TableCell>{row.status === 'Archiviata' ? 'Sì' : 'No'}</TableCell>
                  <TableCell>
                    <Box className="row-actions">
                      <button
                        type="button"
                        className="legacy-icon-btn-sm"
                        aria-label="Archivio"
                        title={row.status === 'Archiviata' ? 'Ripristina azienda' : 'Archivia azienda'}
                        onClick={async (event) => {
                          event.stopPropagation()
                          const newStatus = row.status === 'Archiviata' ? 'Attiva' : 'Archiviata'
                          setCompanies((previous) =>
                            previous.map((item) =>
                              Number(item.id) === Number(row.id) ? { ...item, status: newStatus } : item,
                            ),
                          )
                          try {
                            await apiSend('PATCH', `/api/admin-data/companies/${row.id}`, { status: newStatus })
                          } catch (requestError) {
                            setCompanies((previous) =>
                              previous.map((item) =>
                                Number(item.id) === Number(row.id) ? { ...item, status: row.status } : item,
                              ),
                            )
                            window.alert(requestError?.message || 'Errore durante l\'aggiornamento stato azienda.')
                          }
                        }}
                      >📁</button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {visibleCompanyRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography variant="body2" color="text.secondary">Nessuna azienda trovata.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box className="legacy-table-footer">
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={onOpenEmployeeCreate}>+ Nuovo lavoratore</Button>
            <Button variant="outlined" onClick={() => window.print()}>Stampa</Button>
            <Button variant="outlined" onClick={() => window.alert('Stampe massive non ancora disponibile')}>Stampe massive</Button>
            <Button variant="outlined" onClick={() => window.alert('Operazioni massive non ancora disponibile')}>Operazioni massive</Button>
            <Button variant="outlined" onClick={handleExportCompanies}>Esporta dati in excel</Button>
            <Button variant="outlined" onClick={() => window.alert('Importazione lavoratori non ancora disponibile')}>Importa lavoratori</Button>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">Elementi per pagina</Typography>
            <TextField size="small" select sx={{ minWidth: 90 }} value={20} onChange={() => {}}>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </TextField>
            <Typography variant="caption" color="text.secondary">
              {visibleCompanyRows.length ? `1 - ${visibleCompanyRows.length} of ${filteredCompanyRows.length}` : '0 of 0'}
            </Typography>
          </Stack>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1">Lavoratori</Typography>
        </Box>

        <Box className="legacy-table-toolbar">
          <Box className="legacy-table-toolbar-filters">
            <TextField
              size="small"
              label="Cognome"
              variant="outlined"
              value={workerSearch}
              onChange={(event) => setWorkerSearch(event.target.value)}
            />
            <TextField size="small" label="Nome" variant="outlined" value="" onChange={() => {}} />
            <TextField size="small" label="Codice fiscale" variant="outlined" value="" onChange={() => {}} />
            <TextField
              size="small"
              label="Stato"
              select
              variant="outlined"
              value={workerStatus}
              onChange={(event) => setWorkerStatus(event.target.value)}
            >
              <MenuItem value="active">Non cessati</MenuItem>
              <MenuItem value="all">Tutti</MenuItem>
              <MenuItem value="archived">Archiviati</MenuItem>
            </TextField>
          </Box>
          <Box className="legacy-table-toolbar-filters">
            <Button className="legacy-btn" startIcon={<RestartAltIcon />} onClick={handleResetFilters}>Reset</Button>
            <Button className="legacy-btn" startIcon={<SearchIcon />} onClick={handleFilterEmployees}>Filtra</Button>
          </Box>
        </Box>

        <Box className="legacy-data-table">
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Lavoratore</TableCell>
                <TableCell>Data nascita</TableCell>
                <TableCell>Mansione</TableCell>
                <TableCell>Reparto</TableCell>
                <TableCell>Luogo di lavoro</TableCell>
                <TableCell>Periodicità</TableCell>
                <TableCell>Ultima visita</TableCell>
                <TableCell>Prossima visita</TableCell>
                <TableCell>Scadenza</TableCell>
                <TableCell>Visita</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWorkerRows.map((row) => {
                const latestVisit = latestVisitByEmployee[Number(row.id)]
                return (
                  <TableRow
                    key={row.id}
                    hover
                    onDoubleClick={() => {
                      onOpenEmployeeProfile?.(row)
                    }}
                  >
                    <TableCell padding="checkbox" />
                    <TableCell sx={{ fontWeight: 600 }}>{`${row.lastName || ''} ${row.firstName || ''}`.trim()}</TableCell>
                    <TableCell>{formatDate(row.birthDate)}</TableCell>
                    <TableCell>{row.jobRoleDisplay}</TableCell>
                    <TableCell>{row.reparto || '-'}</TableCell>
                    <TableCell>{row.luogoDiLavoro || '-'}</TableCell>
                    <TableCell>{row.periodicita || '-'}</TableCell>
                    <TableCell>{formatDate(row.dataUltimaVisita || latestVisit?.visitDate)}</TableCell>
                    <TableCell>{formatDate(row.dataProssimaVisita || latestVisit?.nextDeadlineDate)}</TableCell>
                    <TableCell>{formatDate(latestVisit?.nextDeadlineDate)}</TableCell>
                    <TableCell>
                      <Box className="row-actions">
                        <button
                          type="button"
                          className="legacy-icon-btn-sm"
                          aria-label="Lista"
                          title="Apri cartella lavoratore"
                          onClick={() => onOpenEmployeeProfile?.(row)}
                        >📋</button>
                        <button
                          type="button"
                          className="legacy-icon-btn-sm"
                          aria-label="Scudo"
                          title="Idoneità / cartella sanitaria"
                          onClick={() => onOpenEmployeeProfile?.(row)}
                        >🛡️</button>
                        <button
                          type="button"
                          className="legacy-icon-btn-sm"
                          aria-label="Archivio"
                          title={row.isArchived ? 'Ripristina' : 'Archivia'}
                          onClick={() => handleToggleArchive(row)}
                        >📁</button>
                        <button
                          type="button"
                          className="legacy-icon-btn-sm"
                          aria-label="Altro"
                          title="Gestione / modifica"
                          onClick={() => onOpenEmployeeCrud?.()}
                        >⋯</button>
                        <button
                          type="button"
                          className="legacy-icon-btn-sm"
                          aria-label="Elimina"
                          title="Elimina lavoratore"
                          onClick={() => handleDeleteEmployee(row)}
                        >🗑️</button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredWorkerRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11}>
                    <Typography variant="body2" color="text.secondary">Nessun lavoratore trovato.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box className="legacy-table-footer">
          <Box />
          <Typography variant="caption" color="text.secondary">
            {filteredWorkerRows.length
              ? `${filteredWorkerRows.length} lavoratori mostrati`
              : 'Nessun lavoratore'}
          </Typography>
        </Box>
      </Paper>

      {!!error && <Alert severity="error">{error}</Alert>}
      {loading && <Alert severity="info">Caricamento dati in corso...</Alert>}
    </Stack>
  )
}

export default WorkersCenter
