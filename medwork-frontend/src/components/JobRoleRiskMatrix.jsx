import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert
} from '@mui/material'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { apiGet, apiSend } from '../services/apiClient'

const STANDARD_RISK_COLUMNS = [
  { id: 'rumore', label: 'Rumore (>85dB)', code: 'RUM', color: '#1976d2', defaultProtocol: 'Protocollo Rumore Annuale' },
  { id: 'vdt', label: 'Videoterminale', code: 'VDT', color: '#0284c7', defaultProtocol: 'Protocollo VDT (2/5 anni)' },
  { id: 'mmc', label: 'MMC / Rachide', code: 'MMC', color: '#d97706', defaultProtocol: 'Protocollo Biomeccanico MMC' },
  { id: 'chimico', label: 'Rischio Chimico', code: 'CHIM', color: '#9333ea', defaultProtocol: 'Protocollo Chimico & IBE' },
  { id: 'biologico', label: 'Biologico', code: 'BIO', color: '#16a34a', defaultProtocol: 'Protocollo Rischio Biologico' },
  { id: 'guida', label: 'Guida / Muletti', code: 'GUIDA', color: '#dc2626', defaultProtocol: 'Protocollo Guida & Drug Test' },
  { id: 'notturno', label: 'Lavoro Notturno', code: 'NOTT', color: '#475569', defaultProtocol: 'Protocollo Lavoro Notturno' },
  { id: 'radiazioni', label: 'Radiazioni', code: 'RAD', color: '#b45309', defaultProtocol: 'Protocollo Radiazioni Semestrale' },
]

const DEFAULT_MANSIONI_TEMPLATES = [
  { jobRole: 'Impiegato Amministrativo / Ufficio', risks: ['vdt'] },
  { jobRole: 'Magazziniere / Carrellista', risks: ['mmc', 'guida', 'rumore'] },
  { jobRole: 'Operaio Saldatore / Manutentore', risks: ['rumore', 'chimico', 'mmc'] },
  { jobRole: 'Operatore Chimico / Laboratorio', risks: ['chimico', 'biologico'] },
  { jobRole: 'Autista Mezzi Pesanti / Spedizioniere', risks: ['guida', 'mmc', 'notturno'] },
  { jobRole: 'Addetto alle Pulizie / Sanificazione', risks: ['chimico', 'mmc', 'biologico'] },
  { jobRole: 'Guardia Giurata / Turnista H24', risks: ['notturno'] },
]

export default function JobRoleRiskMatrix({ companyId, companyName }) {
  const [matrixData, setMatrixData] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  
  const [newRoleDialogOpen, setNewRoleDialogOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')

  useEffect(() => {
    loadMatrix()
  }, [companyId])

  const loadMatrix = async () => {
    setLoading(true)
    setFeedback(null)
    try {
      // In a real database, this queries the company's job roles and assigned risk factors
      const savedStorageKey = `medwork_mansiogram_${companyId || 'default'}`
      const saved = localStorage.getItem(savedStorageKey)
      if (saved) {
        setMatrixData(JSON.parse(saved))
      } else {
        setMatrixData(DEFAULT_MANSIONI_TEMPLATES)
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Errore nel caricamento del mansiogramma aziendale.' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRisk = (roleIndex, riskId) => {
    setMatrixData(prev => {
      const updated = [...prev]
      const currentRole = { ...updated[roleIndex] }
      const currentRisks = new Set(currentRole.risks || [])
      
      if (currentRisks.has(riskId)) {
        currentRisks.delete(riskId)
      } else {
        currentRisks.add(riskId)
      }
      
      currentRole.risks = Array.from(currentRisks)
      updated[roleIndex] = currentRole
      return updated
    })
  }

  const handleSaveMatrix = () => {
    setSaving(true)
    try {
      const savedStorageKey = `medwork_mansiogram_${companyId || 'default'}`
      localStorage.setItem(savedStorageKey, JSON.stringify(matrixData))
      setFeedback({ type: 'success', message: '✓ Mansiogramma aziendale e matrice rischi salvati con successo!' })
    } catch (err) {
      setFeedback({ type: 'error', message: 'Errore durante il salvataggio.' })
    } finally {
      setSaving(false)
      setTimeout(() => setFeedback(null), 4000)
    }
  }

  const handleAddRole = () => {
    if (!newRoleName.trim()) return
    setMatrixData(prev => [...prev, { jobRole: newRoleName.trim(), risks: [] }])
    setNewRoleName('')
    setNewRoleDialogOpen(false)
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ mb: 2.5 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <HealthAndSafetyIcon color="primary" />
            <Typography variant="h6" fontWeight={700} color="#0f1f3d">
              Smart Mansiogramma & Matrice Rischi (D.Lgs. 81/08)
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {companyName ? `Azienda: ${companyName}` : 'Configurazione Mansioni, Fattori di Rischio e Protocolli Sanitari.'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setNewRoleDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Aggiungi Mansione
          </Button>
          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveMatrix}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? 'Salvataggio...' : 'Salva Matrice'}
          </Button>
        </Stack>
      </Stack>

      {feedback && <Alert severity={feedback.type} sx={{ mb: 2 }}>{feedback.message}</Alert>}

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Mansione Aziendale (Job Role)</TableCell>
              {STANDARD_RISK_COLUMNS.map(col => (
                <TableCell key={col.id} align="center" sx={{ fontWeight: 700, minWidth: 100 }}>
                  <Tooltip title={col.defaultProtocol}>
                    <Chip
                      size="small"
                      label={col.code}
                      sx={{ bgcolor: col.color, color: '#fff', fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  </Tooltip>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.68rem', color: '#64748b' }}>
                    {col.label}
                  </Typography>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 700, minWidth: 100 }}>Rischi Attivi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matrixData.map((row, rIdx) => {
              const activeCount = row.risks?.length || 0
              return (
                <TableRow key={rIdx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#fcfdfe' } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                    {row.jobRole}
                  </TableCell>
                  {STANDARD_RISK_COLUMNS.map(col => {
                    const isChecked = row.risks?.includes(col.id)
                    return (
                      <TableCell key={col.id} align="center" sx={{ p: 0.5 }}>
                        <Checkbox
                          size="small"
                          checked={!!isChecked}
                          onChange={() => handleToggleRisk(rIdx, col.id)}
                          sx={{
                            color: col.color,
                            '&.Mui-checked': { color: col.color },
                          }}
                        />
                      </TableCell>
                    )
                  })}
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={`${activeCount} rischi`}
                      color={activeCount > 2 ? 'warning' : activeCount > 0 ? 'primary' : 'default'}
                      variant={activeCount > 0 ? 'filled' : 'outlined'}
                      sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DIALOG AGGIUNGI MANSIONE */}
      <Dialog open={newRoleDialogOpen} onClose={() => setNewRoleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nuova Mansione Aziendale</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Denominazione Mansione *"
            placeholder="Es. Elettricista Impiantista"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewRoleDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleAddRole} disabled={!newRoleName.trim()}>
            Aggiungi
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
