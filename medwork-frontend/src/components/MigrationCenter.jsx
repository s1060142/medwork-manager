import React, { useState } from 'react'
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
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Tabs,
  Tab,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import StorageIcon from '@mui/icons-material/Storage'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { apiSend } from '../services/apiClient'

const STEPS = ['Sorgente Dati', 'Caricamento', 'Validazione Dry-Run', 'Esecuzione']

const SAMPLE_CSV = `Azienda;PartitaIVA;CodiceFiscale;Indirizzo;Comune;Provincia
Acme SpA;12345678901;12345678901;Via Roma 10;Milano;MI
Beta Srl;98765432109;98765432109;Corso Italia 5;Roma;RM

Cognome;Nome;CodiceFiscale;Azienda;Mansione;DataNascita;Sesso;Email
Rossi;Mario;RSSMRA80A01F205X;Acme SpA;Operaio Manutentore;1980-01-01;M;mario.rossi@email.it
Bianchi;Laura;BNCLRA85M41H501Y;Beta Srl;Impiegata Amministrativa;1985-08-15;F;laura.bianchi@email.it

CodiceFiscale;DataVisita;ProssimaScadenza;Esito;Prescrizioni;Limitazioni
RSSMRA80A01F205X;2025-06-10;2026-06-10;Idoneo;Uso DPI antirumore;Nessuna
BNCLRA85M41H501Y;2025-09-20;2026-09-20;Idoneo con prescrizioni;Pause VDT 15 min ogni 2 ore;Nessuna`

export default function MigrationCenter() {
  const [activeStep, setActiveStep] = useState(0)
  const [sourceFormat, setSourceFormat] = useState('Winasped')
  const [csvContent, setCsvContent] = useState(SAMPLE_CSV)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [dryRunResult, setDryRunResult] = useState(null)
  const [parsedPayload, setParsedPayload] = useState(null)
  const [executionReport, setExecutionReport] = useState(null)
  const [previewTab, setPreviewTab] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text === 'string') {
        setCsvContent(text)
      }
    }
    reader.readAsText(file)
  }

  const handleRunDryRun = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      // 1. Parse CSV
      const payload = await apiSend('POST', '/api/migration/parse-csv', {
        csvContent: csvContent,
        sourceFormat: sourceFormat,
      })
      setParsedPayload(payload)

      // 2. Perform Dry-Run Validation
      const result = await apiSend('POST', '/api/migration/dry-run', payload)
      setDryRunResult(result)
      setActiveStep(2)
    } catch (err) {
      setErrorMsg(err.message || 'Errore durante la validazione del file.')
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteMigration = async () => {
    if (!parsedPayload) return
    setLoading(true)
    setErrorMsg('')
    try {
      const report = await apiSend('POST', '/api/migration/execute', parsedPayload)
      setExecutionReport(report)
      setActiveStep(3)
    } catch (err) {
      setErrorMsg(err.message || "Errore durante l'esecuzione della migrazione.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setActiveStep(0)
    setDryRunResult(null)
    setParsedPayload(null)
    setExecutionReport(null)
    setErrorMsg('')
    setFileName('')
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 1400, mx: 'auto', p: 2 }}>
      {/* HEADER */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <StorageIcon color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Universal Migration Engine
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Importatore universale per la migrazione rapida di dati storici da Winasped, CartSan, CSV e dump relazionali.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* STEPPER */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stepper activeStep={activeStep}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {/* STEP 0: SORGENTE DATI */}
      {activeStep === 0 && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              1. Seleziona il formato del gestionale sorgente
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Scegli la struttura dei file che desideri importare in MedWork.
            </Typography>

            <Grid container spacing={2}>
              {[
                { key: 'Winasped', label: 'Winasped / WinAspi', desc: 'File CSV/Dump tabelle anagrafiche e storico visite' },
                { key: 'CartSan', label: 'CartSan', desc: 'Esportazione standard CartSan (Aziende, Dipendenti, Idoneità)' },
                { key: 'UnifiedCsv', label: 'CSV / Excel MedWork Universale', desc: 'Tracciato standard multiproposito' },
              ].map((fmt) => (
                <Grid item xs={12} md={4} key={fmt.key}>
                  <Paper
                    variant="outlined"
                    onClick={() => setSourceFormat(fmt.key)}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      borderWidth: sourceFormat === fmt.key ? 2 : 1,
                      borderColor: sourceFormat === fmt.key ? 'primary.main' : 'divider',
                      bgcolor: sourceFormat === fmt.key ? 'primary.50' : '#ffffff',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700} color={sourceFormat === fmt.key ? 'primary.main' : 'text.primary'}>
                      {fmt.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {fmt.desc}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => setActiveStep(1)}>
                Continua al Caricamento
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* STEP 1: CARICAMENTO */}
      {activeStep === 1 && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              2. Carica il file esportato ({sourceFormat})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Trascina il file CSV o incolla direttamente il contenuto testuale nel riquadro sottostante.
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
              <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                Seleziona File CSV / Dump
                <input type="file" accept=".csv,.txt,.json" hidden onChange={handleFileUpload} />
              </Button>
              {fileName && (
                <Chip label={`File: ${fileName}`} color="primary" variant="outlined" onDelete={() => setFileName('')} />
              )}
            </Stack>

            <TextField
              fullWidth
              multiline
              rows={12}
              label="Contenuto CSV / Dump"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              variant="outlined"
              sx={{ fontFamily: 'monospace', fontSize: 13 }}
            />

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => setActiveStep(0)}>
                Indietro
              </Button>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                disabled={loading || !csvContent.trim()}
                onClick={handleRunDryRun}
              >
                {loading ? 'Analisi in corso...' : 'Valida & Anteprima (Dry-Run)'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: ANTEPRIMA & VALIDAZIONE DRY-RUN */}
      {activeStep === 2 && dryRunResult && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  3. Esito Validazione Preventiva (Dry-Run)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verifica i dati riconosciuti prima di procedere al salvataggio nel database.
                </Typography>
              </Box>
              <Chip
                icon={dryRunResult.isValid ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
                label={dryRunResult.isValid ? 'Pronto per la migrazione' : 'Presenza di Errori Bloccanti'}
                color={dryRunResult.isValid ? 'success' : 'error'}
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            {/* STATISTICHE RICONOSCIUTE */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {dryRunResult.totalCompanies}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aziende Identificate
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {dryRunResult.totalEmployees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lavoratori Riconosciuti
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {dryRunResult.totalVisits}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visite Storiche Mappate
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* WARNINGS & ERRORS */}
            {dryRunResult.warnings?.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningAmberIcon />}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Avvisi non bloccanti ({dryRunResult.warnings.length}):
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, fontSize: 13 }}>
                  {dryRunResult.warnings.slice(0, 5).map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                  {dryRunResult.warnings.length > 5 && (
                    <li>...e altri {dryRunResult.warnings.length - 5} avvisi</li>
                  )}
                </Box>
              </Alert>
            )}

            {dryRunResult.errors?.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Errori rilevati ({dryRunResult.errors.length}):
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, fontSize: 13 }}>
                  {dryRunResult.errors.slice(0, 5).map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </Box>
              </Alert>
            )}

            {/* TABS ANTEPRIMA */}
            <Tabs value={previewTab} onChange={(_e, v) => setPreviewTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label={`Aziende (${dryRunResult.previewCompanies?.length || 0})`} />
              <Tab label={`Lavoratori (${dryRunResult.previewEmployees?.length || 0})`} />
              <Tab label={`Visite Storiche (${dryRunResult.previewVisits?.length || 0})`} />
            </Tabs>

            {previewTab === 0 && (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Nome Azienda</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Partita IVA</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Codice Fiscale</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Città / Sede</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dryRunResult.previewCompanies?.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.vatNumber || '-'}</TableCell>
                        <TableCell>{c.taxCode || '-'}</TableCell>
                        <TableCell>{c.city ? `${c.city} (${c.province || '-'})` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {previewTab === 1 && (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Nominativo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Codice Fiscale</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Azienda</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mansione</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dryRunResult.previewEmployees?.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell>{`${e.lastName} ${e.firstName}`}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{e.taxCode}</TableCell>
                        <TableCell>{e.companyName}</TableCell>
                        <TableCell>{e.jobRole || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {previewTab === 2 && (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>CF Lavoratore</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Data Visita</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Prossima Scadenza</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Giudizio</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Prescrizioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dryRunResult.previewVisits?.map((v, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{v.employeeTaxCode}</TableCell>
                        <TableCell>{new Date(v.visitDate).toLocaleDateString()}</TableCell>
                        <TableCell>{v.nextDeadlineDate ? new Date(v.nextDeadlineDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Chip label={v.outcome} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>{v.prescriptions || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => setActiveStep(1)}>
                Rivedi File
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                disabled={loading || !dryRunResult.isValid}
                onClick={handleExecuteMigration}
              >
                {loading ? 'Salvataggio in corso...' : 'Conferma ed Esegui Migrazione nel Database'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: ESECUZIONE COMPLETATA */}
      {activeStep === 3 && executionReport && (
        <Card variant="outlined" sx={{ borderRadius: 3, borderTop: 4, borderTopColor: 'success.main' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 1.5 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Migrazione Completata con Successo!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              Tutti i dati storici sono stati importati nel database MedWork e associati al tenant corrente.
            </Typography>

            <Grid container spacing={2} sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {executionReport.totalCompaniesImported}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Aziende Create
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {executionReport.totalEmployeesImported}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Lavoratori Registrati
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {executionReport.totalVisitsImported}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Visite Storiche Persistite
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleReset}>
                Esegui Nuova Importazione
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}
