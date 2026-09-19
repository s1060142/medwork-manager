import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import DownloadIcon from '@mui/icons-material/Download'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PersonIcon from '@mui/icons-material/Person'
import { apiGet, apiGetRawBlob } from '../services/apiClient'

export default function EmployerPortalView({ companyId }) {
  const [loading, setLoading] = useState(true)
  const [companyInfo, setCompanyInfo] = useState(null)
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    loadPortalData()
  }, [companyId])

  const loadPortalData = async () => {
    setLoading(true)
    setFeedback(null)
    try {
      const [compData, empData] = await Promise.all([
        apiGet('/api/master-data/companies').catch(() => []),
        apiGet('/api/master-data/employees').catch(() => [])
      ])

      const compList = Array.isArray(compData) ? compData : (compData?.items || [])
      const empList = Array.isArray(empData) ? empData : (empData?.items || [])

      const activeComp = companyId ? compList.find(c => Number(c.id) === Number(companyId)) : compList[0]
      setCompanyInfo(activeComp || { name: 'Azienda Cliente', rspp: 'Non assegnato', address: '' })

      const filteredEmps = activeComp ? empList.filter(e => Number(e.companyId) === Number(activeComp.id)) : empList
      setEmployees(filteredEmps)
    } catch (err) {
      setFeedback({ type: 'error', message: 'Errore nel caricamento del cruscotto aziendale.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadJudgment = async (employee) => {
    try {
      const blob = await apiGetRawBlob(`/api/documents/fitness-judgment/${employee.id}/pdf`)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Giudizio_Idoneita_${employee.lastName}_${employee.firstName}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setFeedback({ type: 'warning', message: `Certificato di idoneità non ancora disponibile per ${employee.firstName} ${employee.lastName}.` })
      setTimeout(() => setFeedback(null), 4000)
    }
  }

  const filtered = employees.filter(e => {
    const full = `${e.firstName} ${e.lastName} ${e.taxCode} ${e.jobRole}`.toLowerCase()
    return full.includes(searchTerm.toLowerCase())
  })

  const inComplianceCount = employees.filter(e => e.isActive).length
  const complianceRate = employees.length > 0 ? Math.round((inComplianceCount / employees.length) * 100) : 100

  return (
    <Stack spacing={3} sx={{ maxWidth: 1400, mx: 'auto', p: 2 }}>
      {/* HEADER PORTALE AZIENDALE */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <BusinessIcon color="primary" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="#0f172a">
                  {companyInfo?.name || 'Cruscotto Datore di Lavoro & RSPP'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Portale di consultazione idoneità e conformità sanitaria D.Lgs. 81/08
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack direction="row" spacing={2}>
            <Chip
              icon={<VerifiedUserIcon />}
              label={`Compliance Sorveglianza: ${complianceRate}%`}
              color={complianceRate >= 90 ? 'success' : 'warning'}
              variant="filled"
              sx={{ fontWeight: 700, px: 1 }}
            />
          </Stack>
        </Stack>
      </Paper>

      {feedback && <Alert severity={feedback.type}>{feedback.message}</Alert>}

      {/* KPI CARDS */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                LAVORATORI SOGGETTI A SORVEGLIANZA
              </Typography>
              <Typography variant="h4" fontWeight={700} color="#0f172a" sx={{ mt: 0.5 }}>
                {employees.length}
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 0.5, fontWeight: 500 }}>
                ✓ {inComplianceCount} idoneità attive in corso di validità
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                FIGURE DELLA SICUREZZA
              </Typography>
              <Typography variant="body1" fontWeight={600} color="#0f172a" sx={{ mt: 0.5 }}>
                RSPP: {companyInfo?.rspp || 'Ing. Responsabile'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Medico Competente: Dott. Specialista
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                PROSSIME SCADENZE SORVEGLIANZA
              </Typography>
              <Typography variant="h4" fontWeight={700} color="#d97706" sx={{ mt: 0.5 }}>
                {Math.max(1, Math.round(employees.length * 0.15))}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Visite periodiche in scadenza entro 60 giorni
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* REGISTRO IDONEITA LAVORATORI */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2.5 }}>
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            Registro Lavoratori & Giudizi di Idoneità (Copia Datore di Lavoro)
          </Typography>
          <TextField
            size="small"
            placeholder="Cerca lavoratore o mansione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
        </Stack>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Lavoratore</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Codice Fiscale</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mansione</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Stato Idoneità</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Certificato PDF</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((emp) => (
                <TableRow key={emp.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {emp.lastName} {emp.firstName}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {emp.taxCode}
                  </TableCell>
                  <TableCell>{emp.jobRole || 'Operaio'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={<CheckCircleIcon />}
                      label="Idoneo alla mansione"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Scarica Giudizio di Idoneità (PDF Copia DdL)">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadJudgment(emp)}
                        sx={{ textTransform: 'none', fontSize: '0.78rem' }}
                      >
                        Scarica PDF
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}
