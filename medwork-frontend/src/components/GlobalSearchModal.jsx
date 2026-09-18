import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import AssignmentIcon from '@mui/icons-material/Assignment'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import EventIcon from '@mui/icons-material/Event'
import AssessmentIcon from '@mui/icons-material/Assessment'
import CloseIcon from '@mui/icons-material/Close'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import DrawIcon from '@mui/icons-material/Draw'
import { apiGet } from '../services/apiClient'

const QUICK_ACTIONS = [
  { id: 'act-visit', title: 'Nuova Visita Medica', subtitle: 'Avvia stepper clinico inserimento visita', moduleKey: 'medical-visit-stepper', icon: MedicalServicesIcon, color: '#1976d2' },
  { id: 'act-judgments', title: 'Centro Giudizi di Idoneità', subtitle: 'Verbalizzazione e rilascio certificati Art. 41', moduleKey: 'giudizio-idoneita', icon: HealthAndSafetyIcon, color: '#2e7d32' },
  { id: 'act-batch-sign', title: 'Firma Digitale Massiva', subtitle: 'Firma multipla certificati e giudizi di idoneità', moduleKey: 'batch-signature', icon: DrawIcon, color: '#00838f' },
  { id: 'act-sopralluoghi', title: 'Sopralluoghi Ambienti di Lavoro', subtitle: 'Pianificazione e verbali ispettivi ex Art. 25 D.Lgs. 81/08', moduleKey: 'sopralluoghi', icon: HealthAndSafetyIcon, color: '#00796b' },
  { id: 'act-agenda', title: 'Agenda & Calendario Visite', subtitle: 'Consulta e programma appuntamenti', moduleKey: 'agenda', icon: EventIcon, color: '#ed6c02' },
  { id: 'act-deadlines', title: 'Scadenzario Sorveglianza Sanitaria', subtitle: 'Scadenze visite, nomine e sopralluoghi', moduleKey: 'visit-deadlines', icon: EventIcon, color: '#0288d1' },
  { id: 'act-3b', title: 'Flusso Allegato 3B INAIL', subtitle: 'Cruscotto statistico Art. 40 INAIL', moduleKey: 'allegato-3b', icon: AssessmentIcon, color: '#9c27b0' },
  { id: 'act-groups', title: 'Gruppi Aziendali & Holding', subtitle: 'Gestione aggregata holding e consorzi (D.Lgs. 81/08)', moduleKey: 'company-groups', icon: BusinessIcon, color: '#0d47a1' },
  { id: 'act-protocols', title: 'Protocolli Sanitari & Rischi', subtitle: 'Gestione piani di sorveglianza sanitaria', moduleKey: 'protocols', icon: AssignmentIcon, color: '#d32f2f' },
]

export default function GlobalSearchModal({ open, onClose, onSelectWorker, onSelectCompany, onNavigateModule }) {
  const [query, setQuery] = useState('')
  const [employees, setEmployees] = useState([])
  const [companies, setCompanies] = useState([])
  const [protocols, setProtocols] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  // Load data on mount and whenever modal opens
  const loadMasterData = () => {
    apiGet('/api/master-data/employees')
      .then(d => { if (Array.isArray(d)) setEmployees(d) })
      .catch(() => {})
    apiGet('/api/master-data/companies')
      .then(d => { if (Array.isArray(d)) setCompanies(d) })
      .catch(() => {})
    apiGet('/api/master-data/protocols')
      .then(d => { if (Array.isArray(d)) setProtocols(d) })
      .catch(() => {})
  }

  useEffect(() => {
    loadMasterData()
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      loadMasterData()
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Live dynamic backend employee search when query length >= 2
  useEffect(() => {
    if (!open || query.trim().length < 2) return
    let active = true
    const timer = setTimeout(() => {
      apiGet(`/api/master-data/employees/search?q=${encodeURIComponent(query.trim())}`)
        .then(res => {
          if (active && Array.isArray(res) && res.length > 0) {
            setEmployees(prev => {
              const map = new Map(prev.map(item => [item.id, item]))
              res.forEach(item => map.set(item.id, item))
              return Array.from(map.values())
            })
          }
        })
        .catch(() => {})
    }, 200)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, open])

  // Filter and group results
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return {
        actions: QUICK_ACTIONS,
        employees: [],
        companies: [],
        protocols: [],
        total: QUICK_ACTIONS.length,
      }
    }

    const matchedActions = QUICK_ACTIONS.filter(
      a => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    )

    const matchedEmployees = employees
      .filter(e => {
        const full = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase()
        const tax = (e.taxCode || '').toLowerCase()
        const comp = (e.companyName || '').toLowerCase()
        const job = (e.jobRole || '').toLowerCase()
        return full.includes(q) || tax.includes(q) || comp.includes(q) || job.includes(q)
      })
      .slice(0, 6)

    const matchedCompanies = companies
      .filter(c => {
        const name = (c.name || '').toLowerCase()
        const vat = (c.vatNumber || c.taxCode || '').toLowerCase()
        const city = (c.city || '').toLowerCase()
        return name.includes(q) || vat.includes(q) || city.includes(q)
      })
      .slice(0, 4)

    const matchedProtocols = protocols
      .filter(p => {
        const name = (p.name || '').toLowerCase()
        const desc = (p.description || '').toLowerCase()
        return name.includes(q) || desc.includes(q)
      })
      .slice(0, 4)

    const total = matchedActions.length + matchedEmployees.length + matchedCompanies.length + matchedProtocols.length

    return {
      actions: matchedActions,
      employees: matchedEmployees,
      companies: matchedCompanies,
      protocols: matchedProtocols,
      total,
    }
  }, [query, employees, companies, protocols])

  const flatList = useMemo(() => {
    const list = []
    searchResults.actions.forEach(a => list.push({ type: 'action', data: a }))
    searchResults.employees.forEach(e => list.push({ type: 'employee', data: e }))
    searchResults.companies.forEach(c => list.push({ type: 'company', data: c }))
    searchResults.protocols.forEach(p => list.push({ type: 'protocol', data: p }))
    return list
  }, [searchResults])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatList.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + flatList.length) % Math.max(1, flatList.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatList[selectedIndex]) {
        handleSelectItem(flatList[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSelectItem = (item) => {
    onClose()
    if (item.type === 'action') {
      if (onNavigateModule) onNavigateModule(item.data.moduleKey)
    } else if (item.type === 'employee') {
      if (onSelectWorker) onSelectWorker(item.data)
    } else if (item.type === 'company') {
      if (onSelectCompany) onSelectCompany(item.data)
    } else if (item.type === 'protocol') {
      if (onNavigateModule) onNavigateModule('protocols')
    }
  }

  let runningIndex = 0

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          top: -60,
        },
      }}
    >
      <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #eef2f6' }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Cerca lavoratore (nome/CF), azienda, protocollo o azione rapida... (↑↓ per scorrere, Invio)"
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" sx={{ fontSize: 28, mr: 1 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Chip label="ESC per chiudere" size="small" variant="outlined" sx={{ mr: 1, fontSize: '0.75rem' }} />
                <IconButton size="small" onClick={onClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: { fontSize: '1.15rem', py: 0.5 },
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0, maxHeight: 480, overflowY: 'auto' }}>
        {flatList.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Nessun risultato trovato per &quot;<strong>{query}</strong>&quot;
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Verifica l&apos;ortografia del nome, del codice fiscale o della ragione sociale.
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 1 }}>
            {/* AZIONI RAPIDE */}
            {searchResults.actions.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ px: 2.5, py: 0.5, display: 'block', fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
                  AZIONI & MODULI RAPIDI
                </Typography>
                {searchResults.actions.map((act) => {
                  const itemIndex = runningIndex++
                  const isSelected = itemIndex === selectedIndex
                  const IconComp = act.icon
                  return (
                    <ListItem key={act.id} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => handleSelectItem({ type: 'action', data: act })}
                        sx={{ px: 2.5, py: 1 }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: act.color, width: 34, height: 34 }}>
                            <IconComp sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{act.title}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary">{act.subtitle}</Typography>}
                        />
                        <Chip label="Modulo" size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
                <Divider sx={{ my: 1 }} />
              </Box>
            )}

            {/* LAVORATORI */}
            {searchResults.employees.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ px: 2.5, py: 0.5, display: 'block', fontWeight: 700, color: '#1976d2', letterSpacing: 0.5 }}>
                  👤 LAVORATORI ({searchResults.employees.length})
                </Typography>
                {searchResults.employees.map((emp) => {
                  const itemIndex = runningIndex++
                  const isSelected = itemIndex === selectedIndex
                  return (
                    <ListItem key={emp.id} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => handleSelectItem({ type: 'employee', data: emp })}
                        sx={{ px: 2.5, py: 1 }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#1976d2', width: 34, height: 34 }}>
                            <PersonIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={700}>
                              {emp.firstName} {emp.lastName}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              CF: <strong style={{ fontFamily: 'monospace' }}>{emp.taxCode || 'N/D'}</strong> • {emp.jobRole || 'Mansione N/D'} • Azienda: {emp.companyName || 'N/D'}
                            </Typography>
                          }
                        />
                        <Chip label="Apri Scheda" size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
                <Divider sx={{ my: 1 }} />
              </Box>
            )}

            {/* AZIENDE */}
            {searchResults.companies.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ px: 2.5, py: 0.5, display: 'block', fontWeight: 700, color: '#2e7d32', letterSpacing: 0.5 }}>
                  🏢 AZIENDE CLIENTI ({searchResults.companies.length})
                </Typography>
                {searchResults.companies.map((comp) => {
                  const itemIndex = runningIndex++
                  const isSelected = itemIndex === selectedIndex
                  return (
                    <ListItem key={comp.id} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => handleSelectItem({ type: 'company', data: comp })}
                        sx={{ px: 2.5, py: 1 }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#2e7d32', width: 34, height: 34 }}>
                            <BusinessIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={700}>{comp.name}</Typography>}
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              P.IVA/CF: {comp.vatNumber || comp.taxCode || 'N/D'} • Sede: {comp.city || comp.address || 'N/D'}
                            </Typography>
                          }
                        />
                        <Chip label="Azienda" size="small" color="success" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
                <Divider sx={{ my: 1 }} />
              </Box>
            )}

            {/* PROTOCOLLI */}
            {searchResults.protocols.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ px: 2.5, py: 0.5, display: 'block', fontWeight: 700, color: '#ed6c02', letterSpacing: 0.5 }}>
                  📋 PROTOCOLLI SANITARI ({searchResults.protocols.length})
                </Typography>
                {searchResults.protocols.map((prot) => {
                  const itemIndex = runningIndex++
                  const isSelected = itemIndex === selectedIndex
                  return (
                    <ListItem key={prot.id} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => handleSelectItem({ type: 'protocol', data: prot })}
                        sx={{ px: 2.5, py: 1 }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#ed6c02', width: 34, height: 34 }}>
                            <AssignmentIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={700}>{prot.name}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary">{prot.description || `Cadenza: ${prot.cadenceDays || 365} giorni`}</Typography>}
                        />
                        <Chip label="Protocollo" size="small" color="warning" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </Box>
            )}
          </List>
        )}
      </DialogContent>
      
      <Box sx={{ p: 1.5, px: 2.5, bgcolor: '#f8f9fa', borderTop: '1px solid #eaeef5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          ↑↓ per navigare • ↵ Invio per selezionare • ESC per chiudere
        </Typography>
        <Chip icon={<FlashOnIcon />} label="Global Omnisearch Attivo" size="small" color="primary" sx={{ height: 22, fontSize: '0.7rem' }} />
      </Box>
    </Dialog>
  )
}
