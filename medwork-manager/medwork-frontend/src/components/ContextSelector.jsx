import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { apiGet, apiSend } from '../services/apiClient';

const ContextSelector = ({
  onContextSelected,
  role,
  username,
  initialContexts,
}) => {
  const [contexts, setContexts] = useState(initialContexts || []);
  const [selectedContext, setSelectedContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const autoConfirmedRef = useRef(false);

  // Auto-conferma quando l'utente ha UN SOLO contesto disponibile:
  // salta lo schermo di selezione ed entra direttamente (una sola volta).
  useEffect(() => {
    if (autoConfirmedRef.current) return;
    if (loading || saving) return;
    if (contexts.length === 1) {
      autoConfirmedRef.current = true;
      const only = contexts[0];
      setSelectedContext(only);
      handleConfirm(only);
    }
  }, [contexts, loading]);

  // Fetch contexts if not provided
  useEffect(() => {
    if (!initialContexts || initialContexts.length === 0) {
      fetchContexts();
    } else {
      // Auto-select default or first
      const defaultCtx = contexts.find(c => c.isDefault) || contexts[0];
      if (defaultCtx) setSelectedContext(defaultCtx);
    }
  }, [initialContexts]);

  const fetchContexts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet('/api/auth/contexts');
      if (data?.contexts) {
        setContexts(data.contexts);
        const defaultCtx = data.contexts.find(c => c.isDefault) || data.contexts[0] || data.selectedContext;
        if (defaultCtx) setSelectedContext(defaultCtx);
      }
    } catch (err) {
      setError('Impossibile caricare i contesti disponibili');
      console.error('Context fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContext = async (context) => {
    setSelectedContext(context);
  };

  const handleConfirm = async (contextOverride) => {
    const contextToConfirm = contextOverride || selectedContext;
    if (!contextToConfirm) return;
    
    setSaving(true);
    setError('');
    try {
      const response = await apiSend('POST', '/api/auth/select-context', {
        contextId: contextToConfirm.id,
        contextType: contextToConfirm.type,
      });
      
      if (response?.success && response?.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('activeCompanyId', 
          contextToConfirm.type === 'Company' ? String(contextToConfirm.id) : String(contextToConfirm.parentId || '')
        );
        localStorage.setItem('activeBranchId', 
          contextToConfirm.type === 'Branch' ? String(contextToConfirm.id) : ''
        );
        
        onContextSelected(contextToConfirm, response.accessToken);
      } else {
        setError(response?.message || 'Errore durante la selezione del contesto');
      }
    } catch (err) {
      setError('Errore di connessione. Riprova.');
      console.error('Context select error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (contexts.length === 0) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Nessun contesto disponibile. Contatta l'amministratore.
      </Alert>
    );
  }

  const companies = contexts.filter(c => c.type === 'Company');
  const branches = contexts.filter(c => c.type === 'Branch');

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, mb: 4 }}>
      <Card elevation={0} variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 700 }}>
            Selezione Contesto Operativo
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Benvenuto, <strong>{username}</strong> ({role}). Scegli l'azienda e la sede su cui vuoi operare.
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Grid container spacing={3}>
            {companies.map((company) => (
              <Grid key={`company-${company.id}`} size={{ xs: 12, sm: 6 }}>
                <CompanyCard
                  company={company}
                  isSelected={selectedContext?.id === company.id && selectedContext?.type === 'Company'}
                  onSelect={() => handleSelectContext(company)}
                  companyBranches={branches.filter(b => b.parentId === company.id)}
                  selectedBranch={selectedContext?.type === 'Branch' && selectedContext?.parentId === company.id ? selectedContext : null}
                  onBranchSelect={(branch) => handleSelectContext(branch)}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
        <CardActions sx={{ p: 2, px: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleConfirm()}
            disabled={!selectedContext || saving}
            sx={{ minWidth: 200 }}
          >
            {saving ? 'Salvataggio...' : 'Conferma e Accedi'}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

const CompanyCard = ({ company, isSelected, onSelect, companyBranches, selectedBranch, onBranchSelect }) => {
  const cardSelected = isSelected || !!selectedBranch;

  return (
    <Card
      elevation={cardSelected ? 3 : 0}
      variant="outlined"
      sx={{
        height: '100%',
        borderWidth: cardSelected ? 2 : 1,
        borderColor: cardSelected ? 'primary.main' : 'divider',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: cardSelected ? 3 : 1,
        },
      }}
      onClick={onSelect}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: isSelected ? 'primary.main' : 'primary.light',
              color: isSelected ? 'primary.contrastText' : 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BusinessIcon fontSize="large" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {company.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {companyBranches.length > 0 
                ? `${companyBranches.length} sede${companyBranches.length > 1 ? 'i' : ''} disponibile${companyBranches.length > 1 ? 'i' : ''}`
                : 'Nessuna sede configurata'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isSelected && (
              <IconButton size="small" disabled aria-hidden>
                <RadioButtonCheckedIcon color="primary" />
              </IconButton>
            )}
            {!isSelected && (
              <IconButton size="small" disabled aria-hidden>
                <RadioButtonUncheckedIcon color="action" />
              </IconButton>
            )}
          </Box>
        </Box>

        {companyBranches.length > 0 && (
          <Box sx={{ 
            mt: 1, 
            p: 1.5, 
            borderRadius: 2, 
            backgroundColor: isSelected || selectedBranch ? 'action.hover' : 'transparent',
            border: isSelected || selectedBranch ? '1px solid' : 'none',
            borderColor: 'primary.light',
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontWeight: 500, display: 'block' }}>
              Sedi disponibili:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {companyBranches.map((branch) => {
                const isBranchSelected = selectedBranch?.id === branch.id;
                return (
                  <Tooltip key={branch.id} title={`${branch.city || ''} - ${branch.address || ''}`}>
                    <Button
                      variant={isBranchSelected ? 'contained' : 'outlined'}
                      size="small"
                      startIcon={<LocationOnIcon fontSize="small" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBranchSelect(branch);
                      }}
                      disabled={!isSelected && !isBranchSelected}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        width: '100%',
                        opacity: isSelected || isBranchSelected ? 1 : 0.6,
                      }}
                    >
                      {branch.city || '-'} • {branch.address || '-'}
                    </Button>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ContextSelector;