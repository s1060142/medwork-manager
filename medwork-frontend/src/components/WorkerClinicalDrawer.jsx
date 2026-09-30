import { useState, useEffect } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Typography,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import HistoryIcon from '@mui/icons-material/History'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import HealingIcon from '@mui/icons-material/Healing'
import ShieldIcon from '@mui/icons-material/Shield'
import PersonIcon from '@mui/icons-material/Person'
import { apiGet } from '../services/apiClient'

export default function WorkerClinicalDrawer({
  open,
  onClose,
  employeeId,
  employeeData,
  onApplyData,
}) {
  const [loading, setLoading] = useState(false)
  const [visitsHistory, setVisitsHistory] = useState([])
  const [context, setContext] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !employeeId) return

    setLoading(true)
    setError('')

    Promise.all([
      apiGet(`/api/doctor-data/employees/${employeeId}/context`).catch(() => null),
      apiGet('/api/master-data/medical-visits').catch(() => []),
    ])
      .then(([contextData, allVisits]) => {
        setContext(contextData)
        if (Array.isArray(allVisits)) {
          const empVisits = allVisits
            .filter((v) => Number(v.employeeId) === Number(employeeId))
            .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
          setVisitsHistory(empVisits)
        }
      })
      .catch((err) => {
        setError(err.message || 'Errore nel caricamento storico clinico.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [open, employeeId])

  const workerName = employeeData
    ? `${employeeData.firstName} ${employeeData.lastName}`
    : `Lavoratore #${employeeId}`

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480 },
          p: 0,
          bgcolor: '#f8fafc',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* DRAWER TOP BAR */}
      <Box
        sx={{
          p: 2.5,
          bgcolor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: '#2563eb' }}>
            <HistoryIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#f8fafc', lineHeight: 1.2 }}>
              Fascicolo Clinico Lavoratore
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              D.Lgs. 81/08 Allegato 3A — Storico Sorveglianza
            </Typography>
          </Box>
        </Stack>

        <IconButton onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* WORKER IDENTIFICATION STRIP */}
      <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
          {workerName}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontFamily: 'monospace' }}>
          CF: {employeeData?.taxCode || 'Non specificato'}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
          <Chip
            size="small"
            label={employeeData?.companyName || context?.companyName || 'Azienda attiva'}
            sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '11px' }}
          />
          <Chip
            size="small"
            label={employeeData?.jobRole || context?.jobRole || 'Mansione non specificata'}
            sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 600, fontSize: '11px' }}
          />
        </Stack>
      </Box>

      {/* CONTENT SCROLL */}
      <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Stack spacing={2.5}>
            {/* PROTOCOL RISKS CARD */}
            {context?.riskFactors && context.riskFactors.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#ffffff' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <ShieldIcon sx={{ fontSize: 18, color: '#d97706' }} />
                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                    Fattori di Rischio Mansione
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.5}>
                  {context.riskFactors.map((rf, idx) => (
                    <Chip
                      key={idx}
                      size="small"
                      label={typeof rf === 'string' ? rf : (rf.name || `Rischio #${idx}`)}
                      color="warning"
                      variant="outlined"
                      sx={{ fontSize: '11px', fontWeight: 600 }}
                    />
                  ))}
                </Stack>
              </Paper>
            )}

            {/* ACTIVE LIMITATIONS ALERT */}
            {visitsHistory.length > 0 && (visitsHistory[0].limitations || visitsHistory[0].prescriptions) && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  borderLeft: '4px solid #ea580c',
                  bgcolor: '#fff7ed',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                  <WarningAmberIcon sx={{ fontSize: 18, color: '#ea580c' }} />
                  <Typography variant="subtitle2" fontWeight={700} color="#9a3412">
                    Prescrizioni / Limitazioni in Vigore
                  </Typography>
                </Stack>
                {visitsHistory[0].prescriptions && (
                  <Typography variant="body2" sx={{ color: '#7c2d12', mb: 0.5 }}>
                    <strong>Prescrizioni:</strong> {visitsHistory[0].prescriptions}
                  </Typography>
                )}
                {visitsHistory[0].limitations && (
                  <Typography variant="body2" sx={{ color: '#7c2d12' }}>
                    <strong>Limitazioni:</strong> {visitsHistory[0].limitations}
                  </Typography>
                )}
              </Paper>
            )}

            {/* VISITS TIMELINE */}
            <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon sx={{ fontSize: 18, color: '#2563eb' }} />
              Cronologia Visite ({visitsHistory.length})
            </Typography>

            {visitsHistory.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Nessuna visita precedente registrata per questo lavoratore. Questa sarà la prima visita di sorveglianza sanitaria.
                </Typography>
              </Paper>
            ) : (
              visitsHistory.map((v, i) => (
                <Paper
                  key={v.id || i}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: '#ffffff',
                    position: 'relative',
                    borderColor: i === 0 ? '#93c5fd' : '#e2e8f0',
                    boxShadow: i === 0 ? '0 2px 8px rgba(37,99,235,0.06)' : 'none',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                          {new Date(v.visitDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Typography>
                        {i === 0 && (
                          <Chip size="small" label="Ultima Visita" color="primary" sx={{ height: 18, fontSize: '10px' }} />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {v.visitType || 'Periodica'}
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      label={v.outcome || (v.isFit ? 'Idoneo' : 'Da valutare')}
                      color={v.outcome?.includes('Limitaz') || v.outcome?.includes('Prescriz') ? 'warning' : v.isFit ? 'success' : 'info'}
                      sx={{ fontWeight: 600, fontSize: '11px' }}
                    />
                  </Stack>

                  {/* CLINICAL FINDINGS SUMMARY */}
                  <Stack spacing={0.8} sx={{ my: 1, fontSize: '12px', color: '#334155' }}>
                    {v.bloodPressure && (
                      <Typography variant="caption" sx={{ display: 'block', color: '#475569' }}>
                        🩺 <strong>Parametri:</strong> PA: {v.bloodPressure} {v.heartRate ? `| FC: ${v.heartRate}` : ''}
                      </Typography>
                    )}
                    {v.objectiveExam && (
                      <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, maxHeight: 80, overflowY: 'auto' }}>
                        <Typography variant="caption" sx={{ color: '#475569', whiteSpace: 'pre-line' }}>
                          {v.objectiveExam}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  {/* ACTION: APPLY PREVIOUS DATA */}
                  {onApplyData && (
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<ContentCopyIcon sx={{ fontSize: 13 }} />}
                      onClick={() => onApplyData(v)}
                      sx={{ textTransform: 'none', fontSize: '11px', p: 0.5, mt: 0.5 }}
                    >
                      Copia reperti nello stepper
                    </Button>
                  )}
                </Paper>
              ))
            )}
          </Stack>
        )}
      </Box>

      {/* DRAWER FOOTER */}
      <Box sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
        <Button variant="outlined" size="small" onClick={onClose} sx={{ textTransform: 'none' }}>
          Chiudi Fascicolo
        </Button>
      </Box>
    </Drawer>
  )
}
