import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EditIcon from '@mui/icons-material/Edit'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import BusinessIcon from '@mui/icons-material/Business'
import BadgeIcon from '@mui/icons-material/Badge'
import ContactMailIcon from '@mui/icons-material/ContactMail'
import { apiGet, apiSend } from '../services/apiClient'
import { showNotification } from '../utils/notification'
import { calculateItalianTaxCode } from '../utils/taxCode'
import { getItalianMunicipalities } from '../services/municipalityService'
import { appendAuditEvent } from '../utils/auditTrail'
import DatePicker from './DatePicker'
import { currentDateValue, formDateValue } from '../utils/datePicker'

export default function WorkerFormDialog({
  open,
  onClose,
  onSaved,
  initialCompanyId = '',
  initialBranchId = '',
  worker = null,
}) {
  const isEditing = Boolean(worker?.id)
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [jobRoles, setJobRoles] = useState([])
  const [municipalities, setMunicipalities] = useState([])
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')

  const [form, setForm] = useState({
    companyId: '',
    branchId: '',
    firstName: '',
    lastName: '',
    gender: 'M',
    birthDate: '',
    birthCity: '',
    birthCityCode: '',
    taxCode: '',
    jobRole: '',
    reparto: '',
    matricola: '',
    email: '',
    phone: '',
    domicilio: '',
  })

  // Load reference data
  useEffect(() => {
    if (!open) return

    setLoadingInitial(true)
    setApiError('')
    setErrors({})

    Promise.all([
      apiGet('/api/master-data/companies').catch(() => []),
      apiGet('/api/master-data/branches').catch(() => []),
      apiGet('/api/master-data/job-roles').catch(() => []),
      getItalianMunicipalities().catch(() => []),
    ]).then(([comps, brs, roles, munis]) => {
      const compList = Array.isArray(comps) ? comps : (comps?.data || [])
      const branchList = Array.isArray(brs) ? brs : (brs?.data || [])
      const roleList = Array.isArray(roles) ? roles : (roles?.data || [])
      const muniList = Array.isArray(munis) ? munis : []

      setCompanies(compList)
      setBranches(branchList)
      setJobRoles(roleList)
      setMunicipalities(muniList)

      if (worker?.id) {
        setForm({
          companyId: worker.companyId ? Number(worker.companyId) : '',
          branchId: worker.branchId ? Number(worker.branchId) : '',
          firstName: worker.firstName || '',
          lastName: worker.lastName || '',
          gender: worker.gender || 'M',
          birthDate: worker.birthDate ? worker.birthDate.split('T')[0] : '',
          birthCity: worker.birthCity || '',
          birthCityCode: worker.birthCityCode || '',
          taxCode: (worker.taxCode || '').toUpperCase(),
          jobRole: worker.jobRole || worker.jobRoleName || '',
          reparto: worker.reparto || '',
          matricola: worker.matricola || '',
          email: worker.personalEmail || worker.email || '',
          phone: worker.phoneNumber || worker.phone || '',
          domicilio: worker.domicilio || worker.indirizzoDomicilio || '',
        })
      } else {
        const defaultCompany = initialCompanyId && initialCompanyId !== 'all'
          ? Number(initialCompanyId)
          : (compList[0]?.id ? Number(compList[0].id) : '')

        const availableBranches = branchList.filter((b) => !defaultCompany || Number(b.companyId) === Number(defaultCompany))
        const defaultBranch = initialBranchId && initialBranchId !== 'all'
          ? Number(initialBranchId)
          : (availableBranches[0]?.id ? Number(availableBranches[0].id) : '')

        setForm({
          companyId: defaultCompany,
          branchId: defaultBranch,
          firstName: '',
          lastName: '',
          gender: 'M',
          birthDate: '',
          birthCity: '',
          birthCityCode: '',
          taxCode: '',
          jobRole: roleList[0]?.name || 'Operaio',
          reparto: '',
          matricola: '',
          email: '',
          phone: '',
          domicilio: '',
        })
      }
      setLoadingInitial(false)
    })
  }, [open, worker, initialCompanyId, initialBranchId])

  const handleCompanyChange = (companyId) => {
    const compId = Number(companyId)
    const availableBranches = branches.filter((b) => Number(b.companyId) === compId)
    setForm((prev) => ({
      ...prev,
      companyId: compId,
      branchId: availableBranches[0]?.id ? Number(availableBranches[0].id) : '',
    }))
    if (errors.companyId) setErrors((e) => ({ ...e, companyId: null }))
  }

  const handleBirthCityChange = (cityName) => {
    const found = municipalities.find(
      (m) => m.name.toLowerCase() === cityName.toLowerCase().trim()
    )
    setForm((prev) => ({
      ...prev,
      birthCity: cityName,
      birthCityCode: found?.cadastralCode || prev.birthCityCode || '',
    }))
    if (errors.birthCity) setErrors((e) => ({ ...e, birthCity: null }))
  }

  const handleAutoComputeTaxCode = () => {
    const { firstName, lastName, birthDate, gender, birthCity, birthCityCode } = form
    if (!firstName || !lastName || !birthDate || !gender || (!birthCity && !birthCityCode)) {
      showNotification('Compila Nome, Cognome, Data di Nascita, Sesso e Comune per calcolare il Codice Fiscale.', 'warning')
      return
    }
    const computed = calculateItalianTaxCode(
      {
        firstName,
        lastName,
        birthDate,
        gender,
        birthCity,
        birthCityCode,
      },
      municipalities
    )

    if (computed) {
      setForm((prev) => ({ ...prev, taxCode: computed }))
      if (errors.taxCode) setErrors((e) => ({ ...e, taxCode: null }))
      showNotification(`Codice Fiscale calcolato: ${computed}`, 'success')
    } else {
      showNotification('Impossibile calcolare il Codice Fiscale con i dati forniti.', 'error')
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.companyId) newErrors.companyId = 'Azienda obbligatoria'
    if (!form.branchId) newErrors.branchId = 'Sede obbligatoria'
    if (!form.lastName?.trim()) newErrors.lastName = 'Cognome obbligatorio'
    if (!form.firstName?.trim()) newErrors.firstName = 'Nome obbligatorio'
    if (!form.birthDate) newErrors.birthDate = 'Data di nascita obbligatoria'
    if (!form.birthCity?.trim()) newErrors.birthCity = 'Comune di nascita obbligatorio'
    if (!form.taxCode?.trim() || form.taxCode.trim().length !== 16) {
      newErrors.taxCode = 'Codice Fiscale obbligatorio (16 caratteri alfanumerici)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      showNotification('Compila tutti i campi obbligatori contrassegnati.', 'error')
      return
    }

    setSaving(true)
    setApiError('')

    const payload = {
      companyId: Number(form.companyId),
      branchId: Number(form.branchId),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      taxCode: form.taxCode.trim().toUpperCase(),
      gender: form.gender,
      birthDate: form.birthDate,
      birthCity: form.birthCity.trim(),
      birthCityCode: form.birthCityCode || 'F205',
      jobRole: form.jobRole || 'Operaio',
      reparto: form.reparto || null,
      matricola: form.matricola || null,
      email: form.email || null,
      phone: form.phone || null,
      domicilio: form.domicilio || null,
    }

    try {
      let savedResult
      if (isEditing) {
        savedResult = await apiSend('PUT', `/api/admin-data/employees/${worker.id}`, payload)
        showNotification(`Lavoratore ${payload.lastName} ${payload.firstName} aggiornato con successo.`, 'success')
        appendAuditEvent({ module: 'Workers', action: 'Update', detail: `ID: ${worker.id} - ${payload.lastName} ${payload.firstName}` })
        window.dispatchEvent(new CustomEvent('medwork:employee-updated', { detail: savedResult || { id: worker.id, ...payload } }))
      } else {
        savedResult = await apiSend('POST', '/api/admin-data/employees', payload)
        showNotification(`Lavoratore ${payload.lastName} ${payload.firstName} inserito con successo.`, 'success')
        appendAuditEvent({ module: 'Workers', action: 'Create', detail: `${payload.lastName} ${payload.firstName} (CF: ${payload.taxCode})` })
        window.dispatchEvent(new CustomEvent('medwork:employee-created', { detail: savedResult }))
      }

      onSaved?.(savedResult || payload)
      onClose()
    } catch (err) {
      setApiError(err.message || 'Errore durante il salvataggio del lavoratore.')
      showNotification(err.message || 'Salvataggio fallito.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const availableBranches = branches.filter(
    (b) => !form.companyId || Number(b.companyId) === Number(form.companyId)
  )

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#0f1f3d',
          color: '#ffffff',
          py: 2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {isEditing ? <EditIcon sx={{ color: '#93c5fd' }} /> : <PersonAddIcon sx={{ color: '#93c5fd' }} />}
        <Box>
          <Typography variant="h6" fontWeight={700} color="#ffffff" sx={{ lineHeight: 1.2 }}>
            {isEditing ? `Modifica Lavoratore — ${form.lastName} ${form.firstName}` : 'Inserimento Nuovo Lavoratore'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Anagrafica, collocazione aziendale e dati per la sorveglianza sanitaria (D.Lgs. 81/08)
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loadingInitial ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3} sx={{ mt: 1 }}>
            {apiError && <Alert severity="error">{apiError}</Alert>}

            {/* SEZIONE 1: INQUADRAMENTO AZIENDALE */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <BusinessIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={700} color="#0f1f3d">
                  1. Inquadramento Aziendale & Sede Operativa
                </Typography>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  select
                  size="small"
                  label="Azienda *"
                  value={form.companyId}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  error={Boolean(errors.companyId)}
                  helperText={errors.companyId}
                >
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name || c.ragioneSociale || `Azienda #${c.id}`}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Sede / Filiale *"
                  value={form.branchId}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, branchId: Number(e.target.value) }))
                    if (errors.branchId) setErrors((err) => ({ ...err, branchId: null }))
                  }}
                  error={Boolean(errors.branchId)}
                  helperText={errors.branchId || (availableBranches.length === 0 ? 'Nessuna sede trovata per l\'azienda' : '')}
                >
                  {availableBranches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name || b.address || `Sede #${b.id}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mt: 2 }}>
                <TextField
                  size="small"
                  label="Mansione / Ruolo *"
                  value={form.jobRole}
                  onChange={(e) => setForm((prev) => ({ ...prev, jobRole: e.target.value }))}
                  placeholder="Es. Operaio, Magazziniere, VDT"
                />
                <TextField
                  size="small"
                  label="Reparto / Settore"
                  value={form.reparto}
                  onChange={(e) => setForm((prev) => ({ ...prev, reparto: e.target.value }))}
                  placeholder="Es. Produzione, Uffici"
                />
                <TextField
                  size="small"
                  label="Matricola Aziendale"
                  value={form.matricola}
                  onChange={(e) => setForm((prev) => ({ ...prev, matricola: e.target.value }))}
                  placeholder="Es. MAT-042"
                />
              </Box>
            </Box>

            <Divider />

            {/* SEZIONE 2: DATI ANAGRAFICI */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <BadgeIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={700} color="#0f1f3d">
                  2. Dati Anagrafici & Identificativi
                </Typography>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  size="small"
                  label="Cognome *"
                  value={form.lastName}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, lastName: e.target.value }))
                    if (errors.lastName) setErrors((err) => ({ ...err, lastName: null }))
                  }}
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName}
                />
                <TextField
                  size="small"
                  label="Nome *"
                  value={form.firstName}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, firstName: e.target.value }))
                    if (errors.firstName) setErrors((err) => ({ ...err, firstName: null }))
                  }}
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1.5fr' }, gap: 2, mt: 2 }}>
                <DatePicker
                  label="Data di Nascita *"
                  value={currentDateValue(form.birthDate)}
                  onChange={(date) => {
                    setForm((prev) => ({ ...prev, birthDate: formDateValue(date) }))
                    if (errors.birthDate) setErrors((err) => ({ ...err, birthDate: null }))
                  }}
                  slotProps={{
                    textField: {
                      size: 'small',
                      error: Boolean(errors.birthDate),
                      helperText: errors.birthDate,
                      InputLabelProps: { shrink: true },
                    },
                  }}
                />
                <TextField
                  select
                  size="small"
                  label="Sesso *"
                  value={form.gender}
                  onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                >
                  <MenuItem value="M">Maschio (M)</MenuItem>
                  <MenuItem value="F">Femmina (F)</MenuItem>
                </TextField>
                <TextField
                  size="small"
                  label="Comune di Nascita *"
                  value={form.birthCity}
                  onChange={(e) => handleBirthCityChange(e.target.value)}
                  error={Boolean(errors.birthCity)}
                  helperText={errors.birthCity || (form.birthCityCode ? `Cod. Catastale: ${form.birthCityCode}` : '')}
                  placeholder="Es. Milano, Roma, Napoli"
                />
              </Box>

              {/* Codice Fiscale & Tool Calcola CF */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: 2 }}>
                <TextField
                  size="small"
                  label="Codice Fiscale *"
                  value={form.taxCode}
                  onChange={(e) => {
                    const upper = e.target.value.toUpperCase()
                    setForm((prev) => ({ ...prev, taxCode: upper }))
                    if (errors.taxCode) setErrors((err) => ({ ...err, taxCode: null }))
                  }}
                  error={Boolean(errors.taxCode)}
                  helperText={errors.taxCode || '16 caratteri alfanumerici conformi'}
                  sx={{ flexGrow: 1 }}
                  inputProps={{
                    maxLength: 16,
                    style: { textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold' },
                  }}
                />
                <Button
                  type="button"
                  variant="outlined"
                  color="secondary"
                  startIcon={<AutoFixHighIcon />}
                  onClick={handleAutoComputeTaxCode}
                  sx={{ height: 40, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  Calcola CF
                </Button>
              </Box>
            </Box>

            <Divider />

            {/* SEZIONE 3: CONTATTI E DOMICILIO */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <ContactMailIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={700} color="#0f1f3d">
                  3. Contatti & Domicilio
                </Typography>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  size="small"
                  type="email"
                  label="Indirizzo Email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="nome.cognome@email.it"
                />
                <TextField
                  size="small"
                  label="Telefono / Cellulare"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+39 333 1234567"
                />
              </Box>
              <TextField
                size="small"
                fullWidth
                label="Indirizzo di Residenza / Domicilio"
                value={form.domicilio}
                onChange={(e) => setForm((prev) => ({ ...prev, domicilio: e.target.value }))}
                placeholder="Via Roma 10, 20121 Milano (MI)"
                sx={{ mt: 2 }}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', color: '#64748b' }}>
          Annulla
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving || loadingInitial}
          sx={{ textTransform: 'none', fontWeight: 700, px: 3.5 }}
        >
          {saving ? (
            <>
              <CircularProgress size={18} sx={{ color: '#ffffff', mr: 1 }} />
              Salvataggio...
            </>
          ) : isEditing ? (
            'Salva Modifiche'
          ) : (
            'Crea Lavoratore'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
