import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { apiGet } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'
import { downloadCsv } from '../utils/csv'

const STORAGE_KEY = 'medwork.protocols'

function readProtocols() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveProtocols(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function ProtocolsCenter({ activeTab, onTabChange }) {
  const [protocols, setProtocols] = useState(() => readProtocols())
  const [riskFactors, setRiskFactors] = useState([])
  const [examTypes, setExamTypes] = useState([])
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    cadenceDays: 365,
    objective: '',
    riskFactorId: '',
    examTypeId: '',
  })
  const [searchText, setSearchText] = useState('')

  const visibleProtocols = useMemo(() => {
    const needle = (searchText || '').toLowerCase()
    if (!needle) return protocols
    return protocols.filter((row) =>
      `${row.name || ''} ${row.objective || ''}`.toLowerCase().includes(needle),
    )
  }, [protocols, searchText])

  const handleExport = () => {
    const headers = [
      { label: 'Protocollo', value: 'name' },
      { label: 'Obiettivo', value: 'objective' },
      { label: 'Rischio', value: 'riskLabel' },
      { label: 'Esame', value: 'examLabel' },
      { label: 'Cadenza (gg)', value: 'cadenceDays' },
      { label: 'Stato', value: 'statusLabel' },
    ]
    const rows = visibleProtocols.map((row) => ({
      ...row,
      riskLabel: riskMap[row.riskFactorId] || '-',
      examLabel: examMap[row.examTypeId] || '-',
      statusLabel: row.active ? 'Attivo' : 'Disattivo',
    }))
    downloadCsv('protocolli', headers, rows)
  }

  useEffect(() => {
    Promise.all([apiGet('/api/master-data/risk-factors'), apiGet('/api/master-data/exam-types')])
      .then(([risks, exams]) => {
        setRiskFactors(Array.isArray(risks) ? risks : [])
        setExamTypes(Array.isArray(exams) ? exams : [])
      })
      .catch((requestError) => {
        setError(requestError.message || 'Impossibile caricare i cataloghi per i protocolli.')
      })
  }, [])

  const riskMap = useMemo(
    () =>
      riskFactors.reduce((accumulator, item) => {
        accumulator[item.id] = item.name
        return accumulator
      }, {}),
    [riskFactors],
  )

  const examMap = useMemo(
    () =>
      examTypes.reduce((accumulator, item) => {
        accumulator[item.id] = item.name
        return accumulator
      }, {}),
    [examTypes],
  )

  const handleSave = () => {
    if (!formData.name.trim()) return

    const next = [
      {
        id: `${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
        active: true,
      },
      ...protocols,
    ]

    setProtocols(next)
    saveProtocols(next)
    appendAuditEvent({ module: 'Protocolli', action: 'Create', detail: formData.name })
    setFormData({ name: '', cadenceDays: 365, objective: '', riskFactorId: '', examTypeId: '' })
  }

  const toggleActive = (id) => {
    const next = protocols.map((row) => (row.id === id ? { ...row, active: !row.active } : row))
    setProtocols(next)
    saveProtocols(next)
    const changed = next.find((item) => item.id === id)
    appendAuditEvent({ module: 'Protocolli', action: changed?.active ? 'Enable' : 'Disable', detail: changed?.name })
  }

  return (
    <Stack spacing={2}>
      <Box className="legacy-table-toolbar">
        <Box className="legacy-table-toolbar-filters">
          <TextField size="small" label="Cerca" variant="outlined" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
          <Button className="legacy-btn" startIcon={<SearchIcon />} onClick={() => setSearchText(searchText)}>Ricerca</Button>
        </Box>
        <Box className="legacy-table-toolbar-filters">
          <Button variant="outlined" onClick={() => window.print()}>Stampa</Button>
          <Button variant="outlined" onClick={handleExport}>Esporta excel</Button>
          <Button className="legacy-btn" onClick={handleSave}>+ Nuovo protocollo</Button>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table size="small" sx={{ minWidth: 980 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Protocollo</TableCell>
              <TableCell>Rischio</TableCell>
              <TableCell>Esame</TableCell>
              <TableCell>Cadenza</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell align="right">Azione</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleProtocols.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell padding="checkbox" />
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.objective || 'Nessun obiettivo specificato.'}</Typography>
                </TableCell>
                <TableCell>{riskMap[row.riskFactorId] || '-'}</TableCell>
                <TableCell>{examMap[row.examTypeId] || '-'}</TableCell>
                <TableCell>{row.cadenceDays} gg</TableCell>
                <TableCell>
                  <Chip size="small" color={row.active ? 'success' : 'default'} label={row.active ? 'Attivo' : 'Disattivo'} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => toggleActive(row.id)}>
                    {row.active ? 'Disattiva' : 'Attiva'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {visibleProtocols.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary">Nessun protocollo configurato.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {!!error && <Alert severity="error">{error}</Alert>}
    </Stack>
  )
}

export default ProtocolsCenter
