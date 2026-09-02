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
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
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
import { currentDateValue, formDateValue, DATE_PICKER_LOCALE } from '../utils/datePicker'

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

// State field names match the BACKEND PascalCase property names on Company.
// This keeps the PUT payload a 1:1 mapping and avoids lossy translations.
function defaultFormData() {
  return {
    name: '',
    legalName: '',
    atecoCode: '',
    activity: '',
    operationalUnitName: '',
    type: '',
    reference: '',
    status: 'Attiva',
    operationalAddress: '',
    operationalCity: '',
    operationalPostalCode: '',
    operationalProvince: '',
    legalAddress: '',
    legalCity: '',
    legalPostalCode: '',
    legalProvince: '',
    country: '',
    documentStorageLocation: '',
    usualVisitLocation: '',
    clinic: '',
    communicationsEmail: '',
    billingEmail: '',
    contactEmail: '',
    pec: '',
    contactPhone: '',
    fax: '',
    internalContactName: '',
    internalContactEmail: '',
    externalCode: '',
    recipientCode: '',
    contractIdentifier: '',
    orderCode: '',
    cUPCode: '',
    cIGCode: '',
    intentLetterNumber: '',
    intentLetterDate: '',
    intentLetterExpiry: '',
    paymentTerms: '',
    paymentMethod: '',
    accountHolder: '',
    bankName: '',
    iban: '',
    bICSwift: '',
    abi: '',
    cab: '',
    bankChargesDebit: '',
    bankChargesAmount: '0',
    splitPayment: '',
    notes: '',
  }
}

function CompanyProfileDialog({ open, onClose, company, onSaveCompany }) {
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
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!open || !company?.id) return

    // The dialog is opened with `company` from the list endpoint (lightweight projection).
    // Re-fetch the full record to populate every extended field.
    const loadFull = async () => {
      try {
        setLoading(true)
        setError('')
        const full = await apiGet(`/api/admin-data/companies/${company.id}`)
        const source = full && full.id ? full : company
        setFormData((current) => ({
          ...defaultFormData(),
          name: source.name || current.name,
          legalName: source.legalName ?? current.legalName,
          atecoCode: source.atecoCode || current.atecoCode,
          activity: source.activity || current.activity,
          operationalUnitName: source.operationalUnitName || current.operationalUnitName,
          type: source.type || current.type,
          reference: source.reference || current.reference,
          status: source.status || current.status,
          operationalAddress: source.operationalAddress || current.operationalAddress,
          operationalCity: source.operationalCity || current.operationalCity,
          operationalPostalCode: source.operationalPostalCode || current.operationalPostalCode,
          operationalProvince: source.operationalProvince || current.operationalProvince,
          legalAddress: source.legalAddress || current.legalAddress,
          legalCity: source.legalCity || current.legalCity,
          legalPostalCode: source.legalPostalCode || current.legalPostalCode,
          legalProvince: source.legalProvince || current.legalProvince,
          country: source.country || current.country,
          documentStorageLocation: source.documentStorageLocation || current.documentStorageLocation,
          usualVisitLocation: source.usualVisitLocation || current.usualVisitLocation,
          clinic: source.clinic || current.clinic,
          communicationsEmail: source.communicationsEmail || current.communicationsEmail,
          billingEmail: source.billingEmail || current.billingEmail,
          contactEmail: source.contactEmail || current.contactEmail,
          pec: source.pec || current.pec,
          contactPhone: source.contactPhone || current.contactPhone,
          fax: source.fax || current.fax,
          internalContactName: source.internalContactName || current.internalContactName,
          internalContactEmail: source.internalContactEmail || current.internalContactEmail,
          externalCode: source.externalCode || current.externalCode,
          recipientCode: source.recipientCode || current.recipientCode,
          contractIdentifier: source.contractIdentifier || current.contractIdentifier,
          orderCode: source.orderCode || current.orderCode,
          cUPCode: source.cUPCode || current.cUPCode,
          cIGCode: source.cIGCode || current.cIGCode,
          intentLetterNumber: source.intentLetterNumber || current.intentLetterNumber,
          intentLetterDate: source.intentLetterDate || current.intentLetterDate,
          intentLetterExpiry: source.intentLetterExpiry || current.intentLetterExpiry,
          paymentTerms: source.paymentTerms || current.paymentTerms,
          paymentMethod: source.paymentMethod || current.paymentMethod,
          accountHolder: source.accountHolder || current.accountHolder,
          bankName: source.bankName || current.bankName,
          iban: source.iban || current.iban,
          bICSwift: source.bICSwift || current.bICSwift,
          abi: source.abi || current.abi,
          cab: source.cab || current.cab,
          bankChargesDebit: source.bankChargesDebit || current.bankChargesDebit,
          bankChargesAmount: source.bankChargesAmount ?? current.bankChargesAmount,
          splitPayment: source.splitPayment || current.splitPayment,
          notes: source.notes || current.notes,
        }))
        setDirty(false)
      } catch (requestError) {
        setError(requestError.message || 'Errore nel caricamento della scheda azienda.')
      } finally {
        setLoading(false)
      }
    }
    loadFull()

    setAssignedDoctorIds([])
    setCoordinatorDoctorId(null)

    const load = async () => {
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
        // non-fatal: doctors/contacts are sub-resources
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
    setDirty(true)
  }

  const handleSave = async () => {
    if (!company?.id) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      // Sanitize: convert empty strings to null; coerce numbers; dates → ISO yyyy-MM-dd.
      const sanitizedFormData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => {
          if (value === '') return [key, null]
          if (key === 'bankChargesAmount') return [key, value === null || value === '' ? null : Number(value)]
          if (key === 'intentLetterDate' || key === 'intentLetterExpiry') {
            if (!value) return [key, null]
            // Already ISO yyyy-MM-dd from date picker, otherwise try to parse
            const iso = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
              ? value.slice(0, 10)
              : new Date(value).toISOString().slice(0, 10)
            return [key, iso]
          }
          return [key, value]
        })
      )

      await apiSend('PUT', `/api/admin-data/companies/${company.id}`, sanitizedFormData)

      await apiSend('PUT', '/api/admin-data/company-doctors', {
        companyId: Number(company.id),
        doctorIds: assignedDoctorIds.map((id) => Number(id)),
        coordinatorDoctorId: coordinatorDoctorId ? Number(coordinatorDoctorId) : null,
      })

      setSuccess('Azienda aggiornata correttamente.')
      setDirty(false)

      if (typeof onSaveCompany === 'function') {
        onSaveCompany(sanitizedFormData)
      }
    } catch (requestError) {
      setError(requestError.message || 'Errore durante il salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  const confirmClose = () => {
    if (!dirty) return onClose()
    const ok = window.confirm('Hai modifiche non salvate. Chiudere comunque?')
    if (ok) onClose()
  }

  return (
    <Dialog open={open} onClose={confirmClose} maxWidth="xl" fullWidth>
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
                  {company?.legalName || '-'} • {company?.operationalCity || '-'}
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
              <Button variant="contained" onClick={confirmClose}>
                Chiudi
              </Button>
              <IconButton size="small" onClick={confirmClose} sx={{ color: '#ffffff' }} aria-label="Chiudi">
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
                  <TextField size="small" label="Ragione Sociale" value={formData.legalName} onChange={handleFieldChange('legalName')} />
                  <TextField size="small" label="Codice ATECO" value={formData.atecoCode} onChange={handleFieldChange('atecoCode')} />
                  <TextField size="small" label="Attività Azienda" value={formData.activity} onChange={handleFieldChange('activity')} multiline minRows={2} />
                  <TextField size="small" label="Denominazione Unità Locale" value={formData.operationalUnitName} onChange={handleFieldChange('operationalUnitName')} />
                  <TextField size="small" label="Tipologia" select value={formData.type} onChange={handleFieldChange('type')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Produzione">Produzione</MenuItem>
                    <MenuItem value="Servizi">Servizi</MenuItem>
                    <MenuItem value="Commercio">Commercio</MenuItem>
                  </TextField>
                  <TextField size="small" label="Riferimento" value={formData.reference} onChange={handleFieldChange('reference')} />
                  <TextField size="small" label="Status" select value={formData.status} onChange={handleFieldChange('status')}>
                    <MenuItem value="Attiva">Attiva</MenuItem>
                    <MenuItem value="Archiviata">Archiviata</MenuItem>
                  </TextField>
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Indirizzi</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Indirizzo Unità Locale" value={formData.operationalAddress} onChange={handleFieldChange('operationalAddress')} />
                  <TextField size="small" label="Città Unità Locale" value={formData.operationalCity} onChange={handleFieldChange('operationalCity')} />
                  <TextField size="small" label="CAP Unità Locale" value={formData.operationalPostalCode} onChange={handleFieldChange('operationalPostalCode')} />
                  <TextField size="small" label="Provincia Unità Locale" value={formData.operationalProvince} onChange={handleFieldChange('operationalProvince')} />
                  <TextField size="small" label="Indirizzo Sede Legale" value={formData.legalAddress} onChange={handleFieldChange('legalAddress')} />
                  <TextField size="small" label="Città Sede Legale" value={formData.legalCity} onChange={handleFieldChange('legalCity')} />
                  <TextField size="small" label="CAP Sede Legale" value={formData.legalPostalCode} onChange={handleFieldChange('legalPostalCode')} />
                  <TextField size="small" label="Provincia Sede Legale" value={formData.legalProvince} onChange={handleFieldChange('legalProvince')} />
                  <TextField size="small" label="Nazione" value={formData.country} onChange={handleFieldChange('country')} />
                  <TextField size="small" label="Luogo Conservazione Documenti" value={formData.documentStorageLocation} onChange={handleFieldChange('documentStorageLocation')} />
                  <TextField size="small" label="Luogo Abituale Visita" value={formData.usualVisitLocation} onChange={handleFieldChange('usualVisitLocation')} />
                  <TextField size="small" label="Ambulatorio" value={formData.clinic} onChange={handleFieldChange('clinic')} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Contatti</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Email Comunicazioni" type="email" value={formData.communicationsEmail} onChange={handleFieldChange('communicationsEmail')} />
                  <TextField size="small" label="Email Fatturazione" type="email" value={formData.billingEmail} onChange={handleFieldChange('billingEmail')} />
                  <TextField size="small" label="PEC" type="email" value={formData.pec} onChange={handleFieldChange('pec')} />
                  <TextField size="small" label="Email Contatto (legacy)" type="email" value={formData.contactEmail} onChange={handleFieldChange('contactEmail')} />
                  <TextField size="small" label="Telefono" type="tel" value={formData.contactPhone} onChange={handleFieldChange('contactPhone')} />
                  <TextField size="small" label="Fax" type="tel" value={formData.fax} onChange={handleFieldChange('fax')} />
                  <TextField size="small" label="Nome Referente Interno" value={formData.internalContactName} onChange={handleFieldChange('internalContactName')} />
                  <TextField size="small" label="Email Referente Interno" type="email" value={formData.internalContactEmail} onChange={handleFieldChange('internalContactEmail')} />
                  <TextField size="small" label="Codice Esterno" value={formData.externalCode} onChange={handleFieldChange('externalCode')} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Note</Typography>
                <TextField
                  size="small"
                  label="Note"
                  multiline
                  minRows={3}
                  value={formData.notes}
                  onChange={handleFieldChange('notes')}
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
                  <TextField size="small" label="Codice destinatario" value={formData.recipientCode} onChange={handleFieldChange('recipientCode')} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Dati di contratto</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Identificativo contratto" value={formData.contractIdentifier} onChange={handleFieldChange('contractIdentifier')} />
                  <TextField size="small" label="Codice commessa" value={formData.orderCode} onChange={handleFieldChange('orderCode')} />
                  <TextField size="small" label="Codice CUP" value={formData.cUPCode} onChange={handleFieldChange('cUPCode')} />
                  <TextField size="small" label="Codice CIG" value={formData.cIGCode} onChange={handleFieldChange('cIGCode')} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Dati di pagamento</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Condizioni pagamento" select value={formData.paymentTerms} onChange={handleFieldChange('paymentTerms')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Immediato">Immediato</MenuItem>
                    <MenuItem value="30gg">30 giorni</MenuItem>
                    <MenuItem value="60gg">60 giorni</MenuItem>
                  </TextField>
                  <TextField size="small" label="Modalità pagamento" select value={formData.paymentMethod} onChange={handleFieldChange('paymentMethod')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Bonifico">Bonifico</MenuItem>
                    <MenuItem value="RID">RID</MenuItem>
                    <MenuItem value="Assegno">Assegno</MenuItem>
                  </TextField>
                  <TextField size="small" label="Intestatario" value={formData.accountHolder} onChange={handleFieldChange('accountHolder')} />
                  <TextField size="small" label="Istituto" value={formData.bankName} onChange={handleFieldChange('bankName')} />
                  <TextField size="small" label="IBAN" value={formData.iban} onChange={handleFieldChange('iban')} />
                  <TextField size="small" label="BIC/Swift" value={formData.bICSwift} onChange={handleFieldChange('bICSwift')} />
                  <TextField size="small" label="ABI" value={formData.abi} onChange={handleFieldChange('abi')} />
                  <TextField size="small" label="CAB" value={formData.cab} onChange={handleFieldChange('cab')} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Altri dati</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <TextField size="small" label="Numero lettera intenti" value={formData.intentLetterNumber} onChange={handleFieldChange('intentLetterNumber')} />
                  <DesktopDatePicker
                    label="Data lettera intenti"
                    value={currentDateValue(formData.intentLetterDate)}
                    onChange={(date) => handleFieldChange('intentLetterDate')({ target: { value: formDateValue(date) } })}
                    inputFormat="yyyy-MM-dd"
                    locale={DATE_PICKER_LOCALE}
                    renderInput={(params) => <TextField {...params} size="small" />}
                  />
                  <DesktopDatePicker
                    label="Scadenza lettera intenti"
                    value={currentDateValue(formData.intentLetterExpiry)}
                    onChange={(date) => handleFieldChange('intentLetterExpiry')({ target: { value: formDateValue(date) } })}
                    inputFormat="yyyy-MM-dd"
                    locale={DATE_PICKER_LOCALE}
                    renderInput={(params) => <TextField {...params} size="small" />}
                  />
                  <TextField size="small" label="Addebito spese bancarie" select value={formData.bankChargesDebit} onChange={handleFieldChange('bankChargesDebit')}>
                    <MenuItem value="">Seleziona</MenuItem>
                    <MenuItem value="Sì">Sì</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </TextField>
                  <TextField size="small" label="Importo spese bancarie" type="number" value={formData.bankChargesAmount} onChange={handleFieldChange('bankChargesAmount')} />
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
                >
                  <MenuItem value="">— Nessuno —</MenuItem>
                  {availableDoctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.lastName} {doctor.firstName}
                    </MenuItem>
                  ))}
                </TextField>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.2 }}>Medici assegnati</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {availableDoctors.map((doctor) => {
                    const checked = assignedDoctorIds.includes(Number(doctor.id))
                    return (
                      <Chip
                        key={doctor.id}
                        label={`${doctor.lastName} ${doctor.firstName}`}
                        color={checked ? 'primary' : 'default'}
                        onClick={() => {
                          setAssignedDoctorIds((current) =>
                            current.includes(Number(doctor.id))
                              ? current.filter((id) => id !== Number(doctor.id))
                              : [...current, Number(doctor.id)]
                          )
                          setDirty(true)
                        }}
                      />
                    )
                  })}
                </Stack>
              </Paper>
            </Stack>
          )}

          {tab === 3 && (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button startIcon={<PersonAddIcon />} variant="outlined" onClick={async () => {
                  const nominativo = window.prompt('Nominativo figura aziendale?')
                  if (!nominativo) return
                  const ruolo = window.prompt('Ruolo (RSPP / RLS / DL / Dirigente)?', 'RSPP')
                  if (!ruolo) return
                  try {
                    const created = await apiSend('POST', '/api/admin-data/company-contacts', {
                      companyId: company.id,
                      nominativo,
                      ruolo,
                    })
                    setCompanyContacts((current) => [...current, created])
                    setDirty(true)
                  } catch (requestError) {
                    setError(requestError.message || 'Errore creazione contatto.')
                  }
                }}>
                  Aggiungi figura
                </Button>
              </Box>
              <Paper variant="outlined" sx={{ p: 0 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ruolo</TableCell>
                      <TableCell>Nominativo</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Telefono</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companyContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>{contact.ruolo}</TableCell>
                        <TableCell>{contact.nominativo}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.telefono}</TableCell>
                        <TableCell>
                          <Button size="small" color="error" onClick={async () => {
                            try {
                              await apiSend('DELETE', `/api/admin-data/company-contacts/${contact.id}`)
                              setCompanyContacts((current) => current.filter((c) => c.id !== contact.id))
                              setDirty(true)
                            } catch (requestError) {
                              setError(requestError.message || 'Errore eliminazione contatto.')
                            }
                          }}>Elimina</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {companyContacts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">Nessuna figura aziendale.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Stack>
          )}
        </Box>
      </DialogContent>
      {healthPlanOpen && <HealthPlanPreview open={healthPlanOpen} onClose={() => setHealthPlanOpen(false)} companyId={company?.id} />}
      {analyticsOpen && <EnterpriseAnalyticsDashboard open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} companyId={company?.id} />}
      {allegato3bOpen && <Allegato3BPreview open={allegato3bOpen} onClose={() => setAllegato3bOpen(false)} companyId={company?.id} />}
    </Dialog>
  )
}

export default CompanyProfileDialog
