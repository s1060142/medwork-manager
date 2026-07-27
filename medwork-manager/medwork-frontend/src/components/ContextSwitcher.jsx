import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import BusinessIcon from '@mui/icons-material/Business'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { apiGet, apiSend } from '../services/apiClient'

/**
 * Dialog per il cambio contesto (azienda/sede) dall'header.
 * Riusa la stessa logica di select-context del ContextSelector post-login.
 */
export default function ContextSwitcher({ open, onClose, onContextChanged }) {
  const [contexts, setContexts] = useState([])
  const [selectedContext, setSelectedContext] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError('')
    apiGet('/api/auth/contexts')
      .then((data) => {
        const list = data?.contexts || []
        setContexts(list)
        // Pre-seleziona il contesto attualmente attivo (da localStorage).
        const activeCompany = localStorage.getItem('activeCompanyId')
        const activeBranch = localStorage.getItem('activeBranchId')
        const current =
          list.find((c) => c.type === 'Branch' && String(c.id) === String(activeBranch)) ||
          list.find((c) => c.type === 'Company' && String(c.id) === String(activeCompany)) ||
          list.find((c) => c.isDefault) ||
          list[0]
        if (current) setSelectedContext(current)
      })
      .catch((err) => setError(err.message || 'Impossibile caricare i contesti.'))
      .finally(() => setLoading(false))
  }, [open])

  const companies = contexts.filter((c) => c.type === 'Company')
  const branches = contexts.filter((c) => c.type === 'Branch')

  const handleConfirm = async () => {
    if (!selectedContext) return
    setSaving(true)
    setError('')
    try {
      const response = await apiSend('POST', '/api/auth/select-context', {
        contextId: selectedContext.id,
        contextType: selectedContext.type,
      })
      if (response?.success && response?.accessToken) {
        localStorage.setItem('accessToken', response.accessToken)
        localStorage.setItem(
          'activeCompanyId',
          selectedContext.type === 'Company'
            ? String(selectedContext.id)
            : String(selectedContext.parentId || ''),
        )
        localStorage.setItem(
          'activeBranchId',
          selectedContext.type === 'Branch' ? String(selectedContext.id) : '',
        )
        onContextChanged?.(selectedContext, response.accessToken)
        onClose()
      } else {
        setError(response?.message || 'Errore durante la selezione del contesto.')
      }
    } catch (err) {
      setError(err.message || 'Errore di connessione. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Cambia contesto operativo
        </Typography>
        <IconButton onClick={onClose} aria-label="Chiudi">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {companies.map((company) => {
              const companyBranches = branches.filter((b) => b.parentId === company.id)
              const isCompanySelected =
                selectedContext?.type === 'Company' && selectedContext?.id === company.id
              const selectedBranch =
                selectedContext?.type === 'Branch' && selectedContext?.parentId === company.id
                  ? selectedContext
                  : null
              const cardSelected = isCompanySelected || !!selectedBranch
              return (
                <Grid  key={`company-${company.id}`} size={{ xs: 12, sm: 6 }}>
                  <Box
                    onClick={() => setSelectedContext(company)}
                    sx={{
                      p: 2,
                      height: '100%',
                      borderRadius: 2,
                      border: cardSelected ? '2px solid' : '1px solid',
                      borderColor: cardSelected ? 'primary.main' : 'divider',
                      boxShadow: cardSelected ? 3 : 0,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': { boxShadow: 2 },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 2,
                          backgroundColor: isCompanySelected ? 'primary.main' : 'primary.light',
                          color: isCompanySelected ? 'primary.contrastText' : 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <BusinessIcon />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {company.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {companyBranches.length > 0
                            ? `${companyBranches.length} sede/i`
                            : 'Nessuna sede'}
                        </Typography>
                      </Box>
                      {isCompanySelected && <CheckCircleIcon color="primary" />}
                    </Box>

                    {companyBranches.length > 0 && (
                      <Box
                        sx={{
                          mt: 1,
                          pl: 1.5,
                          borderLeft: '2px solid',
                          borderColor: selectedBranch ? 'primary.main' : 'divider',
                        }}
                      >
                        {companyBranches.map((branch) => {
                          const isBranchSelected = selectedBranch?.id === branch.id
                          return (
                            <Box
                              key={branch.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedContext(branch)
                              }}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                py: 0.75,
                                px: 1,
                                borderRadius: 1,
                                cursor: 'pointer',
                                backgroundColor: isBranchSelected ? 'action.selected' : 'transparent',
                                color: isBranchSelected ? 'primary.main' : 'text.primary',
                                fontWeight: isBranchSelected ? 600 : 400,
                                '&:hover': { backgroundColor: 'action.hover' },
                              }}
                            >
                              <LocationOnIcon fontSize="small" />
                              <span>
                                {branch.city || '-'} • {branch.address || '-'}
                              </span>
                              {isBranchSelected && <CheckCircleIcon color="primary" sx={{ ml: 'auto' }} />}
                            </Box>
                          )
                        })}
                      </Box>
                    )}
                  </Box>
                </Grid>
              )
            })}
          </Grid>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={saving}>
            Annulla
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={!selectedContext || saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
          >
            {saving ? 'Salvataggio...' : 'Cambia contesto'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
