import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import SaveIcon from '@mui/icons-material/Save'
import PersonIcon from '@mui/icons-material/Person'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import { apiGet, apiSend } from '../services/apiClient'
import CloseIcon from '@mui/icons-material/Close'
import IconButton from '@mui/material/IconButton'
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation'
import AssessmentIcon from '@mui/icons-material/Assessment'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import HealthPlanPreview from './HealthPlanPreview'
import EnterpriseAnalyticsDashboard from './EnterpriseAnalyticsDashboard'
import Allegato3BPreview from './Allegato3BPreview'

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('it-IT')
}

const TABS = [
  { key: 'registry', label: 'Dati anagrafici' },
  { key: 'billing', label: 'Dati fatturazione' },
  { key: 'doctors', label: 'Assegnazione medici' },
  { key: 'contacts', label: 'Figure aziendali' },
]

function defaultFormData() {
  return {
    name: '',
    ragioneSociale: '',
    codiceAteco: '',
    attivitaAzienda: '',
    denominazioneUnitaLocal: '',
    tipologia: '',
    riferimento: '',
    status: 'Attiva',
    indirizzoUnitaLocal: '',
    cittaUnitaLocal: '',
    capUnitaLocal: '',
    provinciaUnitaLocal: '',
    indirizzoSedeLegale: '',
    cittaSedeLegale: '',
    capSedeLegale: '',
    provinciaSedeLegale: '',
    nazione: '',
    luogoConservazioneDocs: '',
    luogoAbitualeVisita: '',
    ambulatorio: '',
    emailComunicazioni: '',
    emailFatturazione: '',
    emailPEC: '',
    contactPhone: '',
    fax: '',
    referenteInternoNome: '',
    referenteInternoEmail: '',
    codiceEsterno: '',
    codiceDestinatario: '',
    identificativoContratto: '',
    codiceCommessa: '',
    codiceCUP: '',
    codiceCig: '',
    dataLetteraIntenti: '',
    scadenzaLetteraIntenti: '',
    condizioniPagamento: '',
    modalitaPagamento: '',
    intestatario: '',
    istituto: '',
    iban: '',
    bicSwift: '',
    abi: '',
    cab: '',
    numeroLetteraIntenti: '',
    addebitoSpeseBancarie: '',
    importoSpeseBancarie: '0',
    splitPayment: '',
    note: '',
  }
}

function CompanyProfileDialog({ open, onClose, company }) {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState(defaultFormData())
  const [companyContacts, setCompanyContacts] = useState([])
  const [availableDoctors, setAvailableDoctors] = useState([])
  const [assignedDoctorIds, setAssignedDoctorIds] = useState([])
  const [coordinatorDoctorId, setCoordinatorDoctorId] = useState(null)
  const [healthPlanOpen, setHealthPlanOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [allegato3bOpen, setAllegato3bOpen] = useState(false)

  useEffect(() => {
    if (!open || !company?.id) return

    setFormData((current) => ({
      ...defaultFormData(),
      ...Object.keys(current).reduce((accumulator, key) => {
        if (company[key] !== undefined) {
          accumulator[key] = company[key]
        }
        return accumulator
      }, {}),
    }))

    setAssignedDoctorIds([])
    setCoordinatorDoctorId(null)

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [contactsData, doctorsData, companyDoctorsData] = await Promise.all([
          apiGet(`/api/master-data/company-contacts?companyId=${company.id}`).catch(() => []),
          apiGet('/api/master-data/doctors').catch(() => []),
          apiGet(`/api/master-data/company-doctors?companyId=${company.id}`).catch(() => []),
        ])
        setCompanyContacts(Array.isArray(contactsData) ? contactsData : [])
        setAvailableDoctors(Array.isArray(doctorsData) ? doctorsData : [])
        const assignments = Array.isArray(companyDoctorsData) ? companyDoctorsData : []
        setAssignedDoctorIds(assignments.map((item) => Number(item.doctorId)))
        const coordinator = assignments.find((item) => item.isCoordinator)
        setCoordinatorDoctorId(coordinator ? Number(coordinator.doctorId) : null)
      } catch (requestError) {
        setError(requestError.message || 'Errore nel caricamento della scheda azienda.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [open, company])

  const initials = useMemo(() => {
    if (!company?.name) return 'AZ'
    return company.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [company])

  const handleFieldChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSave = async () => {
    if (!company?.id) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = { ...formData }
      await apiSend('PUT', `/api/admin-data/companies/${company.id}`, payload)

      await apiSend('PUT', '/api/admin-data/company-doctors', {
        companyId: Number(company.id),
        doctorIds: assignedDoctorIds.map((id) => Number(id)),
        coordinatorDoctorId: coordinatorDoctorId ? Number(coordinatorDoctorId) : null,
      })

      setSuccess('Azienda aggiornata correttamente.')
    } catch (requestError) {
      setError(requestError.message || 'Errore durante il salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2.5, background: '#0f1f3d', color: '#ffffff' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 62, height: 62, bgcolor: 'rgba(255,255,255,0.15)' }}>{initials}</Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  Modifica azienda {company?.id ?? ''} - {company?.name || '-'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  {company?.ragioneSociale || '-'} • {company?.cittaUnitaLocal || '-'}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
              <Button variant="outlined" startIcon={<FormatListNumberedIcon />} onClick={() => setAllegato3bOpen(true)} sx={{ color: 'white', borderColor: 'white' }}>
                Allegato 3B
              </Button>
              <Button variant="outlined" startIcon={<AssessmentIcon />} onClick={() => setAnalyticsOpen(true)} sx={{ color: 'white', borderColor: 'white' }}>
                Analytics
              </Button>
              <Button variant="outlined" startIcon={<MedicalInformationIcon />} onClick={() => setHealthPlanOpen(true)} sx={{ color: 'white', borderColor: 'white' }}>
                Piano Sanitario
              </Button>
              <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving} sx={{ color: 'white', borderColor: 'white' }}>
                {saving ? 'Salvataggio...' : 'Salva'}
              </Button>
              <Button variant="contained" onClick={onClose}>
                Chiudi
              </Button>
              <IconButton size="small" onClick={onClose} sx={{ color: '#ffffff' }} aria-label="Chiudi">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ px: 2.5, pt: 1.5, background: '#ffffff' }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
            {TABS.map((item) => (
              <Tab key={item.key} label={item.label} />
            ))}
          </Tabs>
        </Box>

        <Divider />

        <Box sx={{ p: 2.5 }}>
          {!!error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {!!success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {tab === 0 && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Anagrafica</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Nome Azienda*" value={formData.name} onChange={handleFieldChange('name')} />
                  <TextField size="small" label="Ragione Sociale*" value={formData.ragioneSociale} onChange={handleFieldChange('ragioneSociale')} />
                  <TextField size="small" label="Codice ATECO" value={formData.codiceAteco} onChange={handleFieldChange('codiceAteco')} />
                  <TextField size="small" label="Attività Azienda" value={formData.attivitaAzienda} onChange={handleFieldChange('attivitaAzienda')} multiline minRows={2} />
                  <TextField size="small" label="Denominazione Unità Locale" value={formData.denominazioneUnitaLocal} onChange={handleFieldChange('denominazioneUnitaLocal')} />
                  <TextField size="small" label="Tipologia" select value={formData.tipologia} onChange={handleFieldChange('tipologia')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Produzione">Produzione</MenuItem>
                    <MenuItem value="Servizi">Servizi</MenuItem>
                    <MenuItem value="Commercio">Commercio</MenuItem>
                  </TextField>
                  <TextField size="small" label="Riferimento" value={formData.riferimento} onChange={handleFieldChange('riferimento')} />
                  <TextField size="small" label="Status" select value={formData.status} onChange={handleFieldChange('status')}>
                    <MenuItem value="Attiva">Attiva</MenuItem>
                    <MenuItem value="Archiviata">Archiviata</MenuItem>
                  </TextField>
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Indirizzi</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Indirizzo Unità Locale" value={formData.indirizzoUnitaLocal} onChange={handleFieldChange('indirizzoUnitaLocal')} />
                  <TextField size="small" label="Città Unità Locale" value={formData.cittaUnitaLocal} onChange={handleFieldChange('cittaUnitaLocal')} />
                  <TextField size="small" label="CAP Unità Locale" value={formData.capUnitaLocal} onChange={handleFieldChange('capUnitaLocal')} />
                  <TextField size="small" label="Provincia Unità Locale" value={formData.provinciaUnitaLocal} onChange={handleFieldChange('provinciaUnitaLocal')} />
                  <TextField size="small" label="Indirizzo Sede Legale" value={formData.indirizzoSedeLegale} onChange={handleFieldChange('indirizzoSedeLegale')} />
                  <TextField size="small" label="Città Sede Legale" value={formData.cittaSedeLegale} onChange={handleFieldChange('cittaSedeLegale')} />
                  <TextField size="small" label="CAP Sede Legale" value={formData.capSedeLegale} onChange={handleFieldChange('capSedeLegale')} />
                  <TextField size="small" label="Provincia Sede Legale" value={formData.provinciaSedeLegale} onChange={handleFieldChange('provinciaSedeLegale')} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Contatti</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Email Comunicazioni" type="email" value={formData.emailComunicazioni} onChange={handleFieldChange('emailComunicazioni')} />
                  <TextField size="small" label="Email Fatturazione" type="email" value={formData.emailFatturazione} onChange={handleFieldChange('emailFatturazione')} />
                  <TextField size="small" label="PEC" value={formData.emailPEC} onChange={handleFieldChange('emailPEC')} />
                  <TextField size="small" label="Telefono" type="tel" value={formData.contactPhone} onChange={handleFieldChange('contactPhone')} />
                  <TextField size="small" label="Fax" type="tel" value={formData.fax} onChange={handleFieldChange('fax')} />
                  <TextField size="small" label="Nome Referente Interno" value={formData.referenteInternoNome} onChange={handleFieldChange('referenteInternoNome')} />
                  <TextField size="small" label="Email Referente Interno" type="email" value={formData.referenteInternoEmail} onChange={handleFieldChange('referenteInternoEmail')} />
                  <TextField size="small" label="Codice Esterno" value={formData.codiceEsterno} onChange={handleFieldChange('codiceEsterno')} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Note</Typography>
                <TextField
                  size="small"
                  label="Note"
                  multiline
                  minRows={3}
                  value={formData.note}
                  onChange={handleFieldChange('note')}
                  fullWidth
                />
              </Paper>
            </Stack>
          )}

          {tab === 1 && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Dati generali</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Codice destinatario" value={formData.codiceDestinatario} onChange={handleFieldChange('codiceDestinatario')} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Dati di contratto</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Identificativo contratto" value={formData.identificativoContratto} onChange={handleFieldChange('identificativoContratto')} />
                  <TextField size="small" label="Codice commessa" value={formData.codiceCommessa} onChange={handleFieldChange('codiceCommessa')} />
                  <TextField size="small" label="Codice CUP" value={formData.codiceCUP} onChange={handleFieldChange('codiceCUP')} />
                  <TextField size="small" label="Codice CIG" value={formData.codiceCig} onChange={handleFieldChange('codiceCig')} />
                  <TextField size="small" label="Data contratto" type="date" value={formData.dataLetteraIntenti} onChange={handleFieldChange('dataLetteraIntenti')} InputLabelProps={{ shrink: true }} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Dati di pagamento</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Condizioni pagamento" select value={formData.condizioniPagamento} onChange={handleFieldChange('condizioniPagamento')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Immediato">Immediato</MenuItem>
                    <MenuItem value="30gg">30 giorni</MenuItem>
                    <MenuItem value="60gg">60 giorni</MenuItem>
                  </TextField>
                  <TextField size="small" label="Modalità pagamento" select value={formData.modalitaPagamento} onChange={handleFieldChange('modalitaPagamento')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Bonifico">Bonifico</MenuItem>
                    <MenuItem value="RID">RID</MenuItem>
                    <MenuItem value="Assegno">Assegno</MenuItem>
                  </TextField>
                  <TextField size="small" label="Intestatario" value={formData.intestatario} onChange={handleFieldChange('intestatario')} />
                  <TextField size="small" label="Istituto" value={formData.istituto} onChange={handleFieldChange('istituto')} />
                  <TextField size="small" label="IBAN" value={formData.iban} onChange={handleFieldChange('iban')} />
                  <TextField size="small" label="BIC/Swift" value={formData.bicSwift} onChange={handleFieldChange('bicSwift')} />
                  <TextField size="small" label="ABI" value={formData.abi} onChange={handleFieldChange('abi')} />
                  <TextField size="small" label="CAB" value={formData.cab} onChange={handleFieldChange('cab')} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Altri dati</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Numero lettera intenti" value={formData.numeroLetteraIntenti} onChange={handleFieldChange('numeroLetteraIntenti')} />
                  <TextField size="small" label="Data lettera intenti" type="date" value={formData.dataLetteraIntenti} onChange={handleFieldChange('dataLetteraIntenti')} InputLabelProps={{ shrink: true }} />
                  <TextField size="small" label="Scadenza lettera intenti" type="date" value={formData.scadenzaLetteraIntenti} onChange={handleFieldChange('scadenzaLetteraIntenti')} InputLabelProps={{ shrink: true }} />
                  <TextField size="small" label="Addebito spese bancarie" select value={formData.addebitoSpeseBancarie} onChange={handleFieldChange('addebitoSpeseBancarie')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Sì">Sì</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </TextField>
                  <TextField size="small" label="Importo spese bancarie" type="number" value={formData.importoSpeseBancarie} onChange={handleFieldChange('importoSpeseBancarie')} />
                  <TextField size="small" label="Esigibilità iva default" select value={formData.splitPayment} onChange={handleFieldChange('splitPayment')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Immediata">Immediata</MenuItem>
                    <MenuItem value="Differita">Differita</MenuItem>
                  </TextField>
                </Box>
              </Paper>
            </Stack>
          )}

          {tab === 2 && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Medico Coordinatore</Typography>
                <TextField
                  size="small"
                  select
                  fullWidth
                  value={coordinatorDoctorId ?? ''}
                  onChange={(event) => {
                    const value = event.target.value ? Number(event.target.value) : null
                    setCoordinatorDoctorId(value)
                    if (value && !assignedDoctorIds.includes(value)) {
                      setAssignedDoctorIds((current) => [...current, value])
                    }
                  }}
                  sx={{ maxWidth: 420 }}
                >
                  <MenuItem value="">Nessuno</MenuItem>
                  {availableDoctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {`${doctor.lastName || ''} ${doctor.firstName || ''}`.trim() || `Medico #${doctor.id}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Medici Coordinati</Typography>
                {availableDoctors.length === 0 ? (
                  <Alert severity="info">Nessun medico disponibile.</Alert>
                ) : (
                  <Stack spacing={1}>
                    {availableDoctors.map((doctor) => {
                      const isAssigned = assignedDoctorIds.includes(Number(doctor.id))
                      const isCoordinator = coordinatorDoctorId === Number(doctor.id)
                      return (
                        <Box key={doctor.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(25, 118, 210, 0.1)' }}>
                              <PersonIcon fontSize="small" color="primary" />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{`${doctor.lastName || ''} ${doctor.firstName || ''}`.trim() || `Medico #${doctor.id}`}</Typography>
                              <Typography variant="caption" color="text.secondary">{doctor.specialty || doctor.medicalLicenseNumber || '-'}</Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {isCoordinator && <Chip size="small" color="primary" label="Coordinatore" />}
                            <Button size="small" variant={isAssigned ? 'outlined' : 'contained'} onClick={() => {
                              if (isAssigned) {
                                setAssignedDoctorIds((current) => current.filter((id) => id !== Number(doctor.id)))
                                if (coordinatorDoctorId === Number(doctor.id)) {
                                  setCoordinatorDoctorId(null)
                                }
                              } else {
                                setAssignedDoctorIds((current) => [...current, Number(doctor.id)])
                              }
                            }}>
                              {isAssigned ? 'Rimuovi' : 'Assegna'}
                            </Button>
                          </Stack>
                        </Box>
                      )
                    })}
                  </Stack>
                )}
              </Paper>
            </Stack>
          )}

          {tab === 3 && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Figure aziendali</Typography>
                {companyContacts.length === 0 ? (
                  <Alert severity="info">Nessuna figura aziendale trovata.</Alert>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 900 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ruolo</TableCell>
                          <TableCell>Nominativo</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Telefono</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {companyContacts.map((contact) => (
                          <TableRow key={contact.id} hover>
                            <TableCell>{contact.ruolo || '-'}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{contact.nominativo || '-'}</TableCell>
                            <TableCell>{contact.email || '-'}</TableCell>
                            <TableCell>{contact.telefono || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Paper>
            </Stack>
          )}
        </Box>
      </DialogContent>
      <HealthPlanPreview 
        open={healthPlanOpen} 
        onClose={() => setHealthPlanOpen(false)} 
        companyId={company?.id} 
      />
      <EnterpriseAnalyticsDashboard
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        companyId={company?.id}
        companyName={company?.name}
      />
      <Allegato3BPreview
        open={allegato3bOpen}
        onClose={() => setAllegato3bOpen(false)}
        companyId={company?.id}
        companyName={company?.name}
      />
    </Dialog>
  )
}

export default CompanyProfileDialog
