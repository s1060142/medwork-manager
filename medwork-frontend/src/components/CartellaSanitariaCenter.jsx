import { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import PersonIcon from '@mui/icons-material/Person'
import HistoryIcon from '@mui/icons-material/History'
import { apiGet, apiSend } from '../services/apiClient'

const FIELDS = [
  { key: 'medicalHistory', label: 'Anamnesi patologica remota', multiline: true, rows: 4, helperText: 'Patologie pregresse, interventi chirurgici, ospedalizzazioni' },
  { key: 'familyHistory', label: 'Anamnesi familiare', multiline: true, rows: 2, helperText: 'Malattie genetiche, cardiovascolari, oncologiche nei familiari di I° grado' },
  { key: 'currentTherapies', label: 'Terapie farmacologiche in corso', multiline: true, rows: 2, helperText: 'Elencare farmaci, dosaggio e frequenza' },
  { key: 'allergies', label: 'Allergie e intolleranze', multiline: true, rows: 2, helperText: 'Allergie a farmaci, sostanze, materiali. Specificare tipo di reazione' },
  { key: 'notes', label: 'Annotazioni del medico competente', multiline: true, rows: 3, helperText: 'Note cliniche riservate (art. 25 c. 1 lett. l D.Lgs. 81/08)' },
]

export default function CartellaSanitariaCenter({ employeeId: employeeIdProp }) {
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [employeeId, setEmployeeId] = useState(employeeIdProp || '')
  const [record, setRecord] = useState(null)
  const [draft, setDraft] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState('')

  // Load employee list for autocomplete (when used standalone, without prop)
  useEffect(() => {
    if (employeeIdProp) return
    setLoadingEmployees(true)
    apiGet('/api/master-data/employees')
      .then((data) => {
        setEmployeeOptions(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
      .finally(() => setLoadingEmployees(false))
  }, [employeeIdProp])

  // Load medical record when employeeId changes
  useEffect(() => {
    const eid = employeeIdProp || employeeId
    if (!eid) return
    setLoading(true)
    setError('')
    setRecord(null)
    setDraft({})
    apiGet(`/api/medical-records-v2/employee/${eid}`)
      .then((data) => {
        setRecord(data)
        setDraft({
          medicalHistory: data.medicalHistory || '',
          notes: data.notes || '',
          currentTherapies: data.currentTherapies || '',
          allergies: data.allergies || '',
          familyHistory: data.familyHistory || '',
        })
      })
      .catch((err) => {
        if (err?.status === 404) {
          setRecord(null)
          setDraft({ medicalHistory: '', notes: '', currentTherapies: '', allergies: '', familyHistory: '' })
        } else {
          setError(err.message || 'Errore caricamento cartella.')
        }
      })
      .finally(() => setLoading(false))
  }, [employeeId, employeeIdProp])

  const autosave = () => {
    if (!record) return
    const eid = employeeIdProp || employeeId
    if (!eid) return
    apiSend('PATCH', `/api/medical-records-v2/${record.id}`, draft).catch(() => {})
  }

  const save = async () => {
    const eid = employeeIdProp || employeeId
    if (!eid) return
    setSaving(true)
    setError('')
    try {
      const result = record
        ? await apiSend('PUT', `/api/medical-records-v2/${record.id}`, draft)
        : await apiSend('POST', `/api/medical-records-v2/employee/${eid}`, draft)
      setRecord(result)
      setSavedAt(new Date().toLocaleTimeString('it-IT'))
    } catch (err) {
      setError(err.message || 'Salvataggio fallito.')
    } finally {
      setSaving(false)
    }
  }

  const activeEmployeeId = employeeIdProp || employeeId

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6">Cartella Sanitaria e di Rischio</Typography>
            <Typography variant="caption" color="text.secondary">
              Allegato 3A — D.M. 9 luglio 2012 | Art. 25 D.Lgs. 81/08
            </Typography>
          </Box>
          {activeEmployeeId && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={save}
              disabled={saving || !activeEmployeeId}
              size="small"
            >
              {saving ? 'Salvataggio…' : record ? 'Aggiorna cartella' : 'Crea cartella'}
            </Button>
          )}
        </Box>

        {/* Employee selector (only shown standalone) */}
        {!employeeIdProp && (
          <Box sx={{ mb: 3 }}>
            <Autocomplete
              options={employeeOptions}
              loading={loadingEmployees}
              value={selectedEmployee}
              onChange={(_e, val) => {
                setSelectedEmployee(val)
                setEmployeeId(val?.id || '')
              }}
              getOptionLabel={(opt) => `${opt.lastName || ''} ${opt.firstName || ''} — ${opt.companyName || ''} (${opt.taxCode || ''})`}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seleziona lavoratore"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
                    endAdornment: (
                      <>
                        {loadingEmployees ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
        )}

        {/* Employee info banner */}
        {selectedEmployee && !employeeIdProp && (
          <Alert severity="info" icon={<PersonIcon />} sx={{ mb: 2 }}>
            <strong>{selectedEmployee.lastName} {selectedEmployee.firstName}</strong> — {selectedEmployee.companyName || '-'} | Mansione: {selectedEmployee.jobRoleName || selectedEmployee.jobRole || '-'} | C.F.: {selectedEmployee.taxCode || '-'}
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {activeEmployeeId && !loading && (
          <>
            {record && (
              <Alert severity="success" icon={<HistoryIcon />} sx={{ mb: 2 }}>
                Cartella esistente — ultima modifica: {record.updatedAt ? new Date(record.updatedAt).toLocaleDateString('it-IT') : 'non disponibile'} | Creata il: {record.createdAt ? new Date(record.createdAt).toLocaleDateString('it-IT') : '-'}
              </Alert>
            )}
            {!record && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Nessuna cartella sanitaria trovata per questo lavoratore. Compilare i campi e salvare per crearla.
              </Alert>
            )}

            <Divider sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">SEZIONE ANAMNESTICA — Allegato 3A</Typography>
            </Divider>

            <Stack spacing={2.5}>
              {FIELDS.map((f) => (
                <TextField
                  key={f.key}
                  label={f.label}
                  multiline={f.multiline}
                  rows={f.rows}
                  fullWidth
                  size="small"
                  value={draft[f.key] || ''}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  onBlur={autosave}
                  helperText={f.helperText}
                  placeholder={f.helperText}
                />
              ))}
            </Stack>

            <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tooltip title="Autosave attivo: la cartella viene salvata automaticamente al cambio campo">
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  💾 Autosave attivo
                </Typography>
              </Tooltip>
              <Stack direction="row" spacing={2} alignItems="center">
                {savedAt && <Typography variant="caption" color="success.main">✓ Salvato alle {savedAt}</Typography>}
                <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving}>
                  {saving ? 'Salvataggio…' : record ? 'Aggiorna cartella' : 'Crea cartella'}
                </Button>
              </Stack>
            </Box>
          </>
        )}

        {!activeEmployeeId && !employeeIdProp && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              Seleziona un lavoratore per visualizzare o creare la cartella sanitaria.
            </Typography>
          </Box>
        )}
      </Paper>
    </Stack>
  )
}
