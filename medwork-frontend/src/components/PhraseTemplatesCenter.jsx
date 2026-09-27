import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import ComputerIcon from '@mui/icons-material/Computer'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import ScienceIcon from '@mui/icons-material/Science'
import NightsStayIcon from '@mui/icons-material/NightsStay'
import DriveEtaIcon from '@mui/icons-material/DriveEta'
import HeightIcon from '@mui/icons-material/Height'
import { apiGet, apiSend } from '../services/apiClient'
import { appendAuditEvent } from '../utils/auditTrail'
import { showNotification } from '../utils/notification'

const CATEGORIES = ['Anamnesi', 'EsameObiettivo', 'OrganiBersaglio', 'Prescrizioni', 'Limitazioni', 'Conclusioni']

// STRUCTURED CLINICAL PRESET PACKAGES BY RISK & MANSIONE
const STRUCTURED_RISK_PRESETS = [
  {
    id: "vdt",
    title: "Videoterminalista (VDT)",
    riskFactor: "Uso VDT prolungato (>20h/sett)",
    icon: <ComputerIcon color="primary" />,
    color: "#3b82f6",
    items: [
      { category: "Anamnesi", text: "Nega astenopia, cefalea retro-oculare, fotofobia. Nega disturbi visivi acuti o variazioni recenti del visus.", tags: "VDT, Vista, Astenopia" },
      { category: "EsameObiettivo", text: "Apparato visivo: motilità oculare estrinseca indenne, riflesso fotomotore presente bilateralmente. Rachide cervicale mobile senza contratture antalgiche.", tags: "VDT, Esame Oculare, Rachide" },
      { category: "OrganiBersaglio", text: "Apparato visivo, rachide cervicale e dorso-lombare, apparato muscolo-scheletrico arti superiori.", tags: "VDT, Organi Bersaglio" },
      { category: "Prescrizioni", text: "Utilizzo di lenti correttive prescritte durante l'attività a VDT. Pause di 15 min ogni 120 min di lavoro continuo.", tags: "VDT, Prescrizioni" },
      { category: "Conclusioni", text: "Idoneo alla mansione di videoterminalista con rispetto della pausa ergonomica.", tags: "VDT, Idoneità" },
    ],
  },
  {
    id: "mmc",
    title: "Movimentazione Manuale Carichi (MMC)",
    riskFactor: "Sollevamento, trasporto e traino pesi (Indice RNLE > 1.0)",
    icon: <FitnessCenterIcon color="warning" />,
    color: "#f59e0b",
    items: [
      { category: "Anamnesi", text: "Nega rachialgie acute o croniche, lombosciatalgie, ernie discali note, interventi chirurgici a carico della colonna.", tags: "MMC, Rachide, Lombalgia" },
      { category: "EsameObiettivo", text: "Rachide in asse. Flesso-estensione e rotazioni del tronco complete e non dolenti. Segno di Lasègue e Wassermann negativi bilateralmente. Tono-trofismo muscolare conservato.", tags: "MMC, Esame Rachide" },
      { category: "OrganiBersaglio", text: "Rachide lombo-sacrale, articolazioni scapolo-omerali e coxo-femorali, apparato osteoarticolare.", tags: "MMC, Organi Bersaglio" },
      { category: "Limitazioni", text: "Evitare sollevamento manuale di carichi superiori a 15 kg; movimentazione carichi esclusivamente con ausili meccanici o in coppia.", tags: "MMC, Limitazioni" },
      { category: "Conclusioni", text: "Idoneo alla mansione di addetto alla movimentazione carichi con ausili ergonomici.", tags: "MMC, Idoneità" },
    ],
  },
  {
    id: "rumore",
    title: "Esposizione a Rumore & Vibrazioni",
    riskFactor: "Livello Lex > 85 dB(A) / Vibrazioni corpo intero o mano-braccio",
    icon: <VolumeUpIcon color="error" />,
    color: "#ef4444",
    items: [
      { category: "Anamnesi", text: "Nega acufeni, ipoacusia progressiva, vertigini o parestesie/fenomeno di Raynaud alle estremità superiori.", tags: "Rumore, Udito, Vibrazioni" },
      { category: "EsameObiettivo", text: "Otoscopia bilaterale: condotti uditivi esterni pervii, membrane timpaniche integre e normotrofiche. Prova di Rinne e Weber nella norma.", tags: "Rumore, Otoscopia" },
      { category: "OrganiBersaglio", text: "Apparato uditivo (coclea e via acustica), apparato neuro-vascolare periferico arti superiori.", tags: "Rumore, Organi Bersaglio" },
      { category: "Prescrizioni", text: "Obbligo rigoroso di indossare DPI uditivi (cuffie/inserti con attenuazione idonea SNR > 28 dB) in area produzione.", tags: "Rumore, DPI Udito" },
      { category: "Conclusioni", text: "Idoneo all'attività in ambienti rumorosi con uso continuativo dei DPI uditivi.", tags: "Rumore, Idoneità" },
    ],
  },
  {
    id: "chimico",
    title: "Agenti Chimici & Biologici",
    riskFactor: "Contatto o inalazione sostanze chimiche/polveri/solventi",
    icon: <ScienceIcon color="secondary" />,
    color: "#8b5cf6",
    items: [
      { category: "Anamnesi", text: "Nega dermatiti da contatto, asma professionale, tosse persistente, rinite allergica o intolleranze note a solventi.", tags: "Chimico, Cute, Respiratorio" },
      { category: "EsameObiettivo", text: "Cute integra ed esente da lesioni eczematose o flogistiche. Murmure vescicolare fisiologico su tutto l'ambito polmonare, non rumori umidi né secchi.", tags: "Chimico, Cute, Polmoni" },
      { category: "OrganiBersaglio", text: "Cute e annessi, apparato respiratorio, fegato, reni ed emopoiesi.", tags: "Chimico, Organi Bersaglio" },
      { category: "Prescrizioni", text: "Utilizzo obbligatorio di guanti in nitrile/butile idonei e mascherina FFP2/FFP3/filtri ABEK nelle fasi di travaso e miscelazione.", tags: "Chimico, DPI" },
      { category: "Conclusioni", text: "Idoneo all'esposizione chimica controllata con rigoroso rispetto dei protocolli di sicurezza e DPI.", tags: "Chimico, Idoneità" },
    ],
  },
  {
    id: "notturno",
    title: "Lavoro Notturno (D.Lgs. 66/2003)",
    riskFactor: "Turni notturni (>80 notti/anno o turni h24)",
    icon: <NightsStayIcon color="info" />,
    color: "#0284c7",
    items: [
      { category: "Anamnesi", text: "Nega disturbi del sonno (insonnia, apnee ostruttive), patologie cardiovascolari instabili, diabete non compensato o disturbi gastrointestinali cronici.", tags: "Notturno, Sonno, Cardiovascolare" },
      { category: "EsameObiettivo", text: "Pressione arteriosa e frequenza cardiaca stabili. Addome trattabile, non dolente né dolorabile. Tono dell'umore e vigilanza nella norma.", tags: "Notturno, Parametri" },
      { category: "OrganiBersaglio", text: "Apparato cardiovascolare, ritmo circadiano, apparato gastroenterico, sistema neuro-psichico.", tags: "Notturno, Organi Bersaglio" },
      { category: "Conclusioni", text: "Idoneo allo svolgimento di turni di lavoro notturni.", tags: "Notturno, Idoneità" },
    ],
  },
  {
    id: "guida",
    title: "Guida Muletti / Mezzi Meccanici",
    riskFactor: "Rischio terzi, mansioni sicurezza (Accordo Stato-Regioni)",
    icon: <DriveEtaIcon color="success" />,
    color: "#10b981",
    items: [
      { category: "Anamnesi", text: "Nega sincopi, crisi epilettiche, vertigini, assunzione di farmaci sedativi o psicoattivi, abuso di alcool o sostanze stupefacenti.", tags: "Guida, Muletti, Alcool-Droghe" },
      { category: "EsameObiettivo", text: "Visus binoculare 10/10 con o senza correzione. Campo visivo, senso cromatico e stereoscopico nella norma. Tempi di reazione conservati.", tags: "Guida, Visus, Riflessi" },
      { category: "OrganiBersaglio", text: "Sistema nervoso centrale, apparato visivo e vestibolare, riflessi psicomotori.", tags: "Guida, Organi Bersaglio" },
      { category: "Conclusioni", text: "Idoneo alla conduzione di carrelli elevatori e macchine movimento terra (esente da controindicazioni psicofisiche).", tags: "Guida, Idoneità" },
    ],
  },
  {
    id: "quota",
    title: "Lavori in Quota & Ambienti Confinati",
    riskFactor: "Attività >2m di altezza / Spazi confinati (D.P.R. 177/2011)",
    icon: <HeightIcon color="warning" />,
    color: "#d97706",
    items: [
      { category: "Anamnesi", text: "Nega vertigini, acrofobia, claustrofobia, cardiopatie ischemiche, aritmie o perdite di coscienza transitorie.", tags: "Quota, Vertigini, Claustrofobia" },
      { category: "EsameObiettivo", text: "Test di Romberg negativo. Apparato vestibolare indenne. Non deficit focali neurologici. PA e frequenza cardiaca ottimali.", tags: "Quota, Romberg, Vestibolare" },
      { category: "OrganiBersaglio", text: "Equilibrio vestibolare, apparato cardiovascolare, sistema neuromuscolare.", tags: "Quota, Organi Bersaglio" },
      { category: "Conclusioni", text: "Idoneo ai lavori in quota e in spazi confinati.", tags: "Quota, Idoneità" },
    ],
  },
]

export default function PhraseTemplatesCenter() {
  const [phrases, setPhrases] = useState([])
  const [activeTab, setActiveTab] = useState(0) // 0: Catalogo Frasi, 1: Preset Strutturati per Rischio
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState(null)
  const [error, setError] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ category: 'Anamnesi', text: '', tags: '' })
  const [installingPreset, setInstallingPreset] = useState(false)

  const load = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('category', category)
    if (favouritesOnly) params.set('favouritesOnly', 'true')
    apiGet(`/api/phrase-templates?${params.toString()}`)
      .then((data) => setPhrases(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Errore nel caricamento delle frasi.'))
  }

  useEffect(load, [query, category, favouritesOnly])

  const filtered = useMemo(() => phrases, [phrases])

  const openNew = () => {
    setEditing(null)
    setForm({ category: 'Anamnesi', text: '', tags: '' })
    setEditorOpen(true)
  }

  const openEdit = (phrase) => {
    if (!phrase) return
    setSelectedRowId(phrase.id)
    setEditing(phrase)
    setForm({ category: phrase.category, text: phrase.text, tags: phrase.tags || '' })
    setEditorOpen(true)
  }

  const save = () => {
    if (!form.text.trim()) return
    const payload = { ...form, isFavourite: editing?.isFavourite || false }
    const action = editing
      ? apiSend('PUT', `/api/phrase-templates/${editing.id}`, payload)
      : apiSend('POST', '/api/phrase-templates', payload)
    action
      .then(() => {
        setEditorOpen(false)
        appendAuditEvent({ module: 'Frasi tipo', action: editing ? 'Modifica' : 'Creazione', detail: form.text.slice(0, 40) })
        showNotification(editing ? 'Frase tipo aggiornata con successo' : 'Nuova frase tipo creata', 'success')
        load()
      })
      .catch((err) => setError(err.message || 'Salvataggio fallito.'))
  }

  const remove = (phrase) => {
    if (!window.confirm('Eliminare questa frase tipo?')) return
    apiSend('DELETE', `/api/phrase-templates/${phrase.id}`)
      .then(() => {
        showNotification('Frase tipo eliminata', 'info')
        load()
      })
      .catch((err) => setError(err.message || 'Eliminazione fallita.'))
  }

  const toggleFavourite = (phrase) => {
    apiSend('PUT', `/api/phrase-templates/${phrase.id}`, { ...phrase, isFavourite: !phrase.isFavourite })
      .then(load)
      .catch((err) => setError(err.message || 'Aggiornamento preferito fallito.'))
  }

  const handleInstallRiskPackage = async (presetPkg) => {
    if (!presetPkg || !presetPkg.items) return
    setInstallingPreset(true)
    setError('')
    try {
      for (const item of presetPkg.items) {
        await apiSend('POST', '/api/phrase-templates', {
          category: item.category,
          text: item.text,
          tags: `${presetPkg.title}, ${item.tags}`,
          isFavourite: true,
        })
      }
      showNotification(`✓ Pacchetto "${presetPkg.title}" (${presetPkg.items.length} frasi) installato nei template!`, 'success')
      load()
      setActiveTab(0)
    } catch (err) {
      setError(err.message || 'Errore durante l\'importazione del pacchetto.')
    } finally {
      setInstallingPreset(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <LibraryBooksIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                Libreria Frasi Tipo & Reperti Clinici Strutturati
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Frasario clinico standardizzato per Anamnesi, Esame Obiettivo, Organi Bersaglio, Prescrizioni e Idoneità.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openNew}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Nuova Frase
          </Button>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, next) => setActiveTab(next)}
          sx={{ borderBottom: '1px solid #e2e8f0', mt: 1 }}
        >
          <Tab label={`Frasi Attive (${filtered.length})`} icon={<LibraryBooksIcon fontSize="small" />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Pacchetti Strutturati per Rischio & Mansione" icon={<AutoFixHighIcon fontSize="small" />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Paper>

      {/* TAB 0: CATALOGO FRASI */}
      {activeTab === 0 && (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Cerca per testo, tag, rischio..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }}
                sx={{ minWidth: 260, flexGrow: 1 }}
              />
              <TextField
                select
                size="small"
                label="Categoria Clinica"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">Tutte le categorie</MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
              <Chip
                label="Solo Preferiti"
                clickable
                color={favouritesOnly ? 'warning' : 'default'}
                icon={<StarIcon sx={{ fontSize: '16px !important' }} />}
                onClick={() => setFavouritesOnly((v) => !v)}
                variant={favouritesOnly ? 'filled' : 'outlined'}
              />
              <Button
                variant="outlined"
                onClick={() => { setQuery(''); setCategory(''); setFavouritesOnly(false); }}
                sx={{ textTransform: 'none' }}
              >
                Reset
              </Button>
            </Box>

            {!!error && <Alert severity="warning" sx={{ mt: 1.5 }}>{error}</Alert>}
          </Paper>

          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>Pref.</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 140 }}>Categoria</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Testo Reperto / Frase Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 220 }}>Tag & Rischio</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, width: 120 }}>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((phrase) => {
                    const isSelected = selectedRowId === phrase.id
                    return (
                      <TableRow
                        key={phrase.id}
                        hover
                        tabIndex={0}
                        selected={isSelected}
                        onClick={() => setSelectedRowId(phrase.id)}
                        onDoubleClick={() => openEdit(phrase)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openEdit(phrase)
                          }
                        }}
                        sx={{
                          cursor: 'pointer',
                          '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.12) !important' },
                          '&:focus': { outline: '2px solid #3b82f6', outlineOffset: '-2px' },
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <IconButton size="small" onClick={() => toggleFavourite(phrase)} title="Preferito">
                            {phrase.isFavourite ? <StarIcon color="warning" fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={phrase.category}
                            size="small"
                            color={phrase.category === 'Conclusioni' ? 'primary' : phrase.category === 'EsameObiettivo' ? 'success' : 'default'}
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '11px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                            {phrase.text}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {phrase.tags ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {phrase.tags.split(',').map((t, i) => (
                                <Chip key={i} size="small" label={t.trim()} sx={{ fontSize: '10px', height: 20 }} />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Modifica Frase">
                            <IconButton size="small" color="primary" onClick={() => openEdit(phrase)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Elimina">
                            <IconButton size="small" color="error" onClick={() => remove(phrase)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Nessuna frase trovata. Passa al tab "Pacchetti Strutturati per Rischio" per importare i reperti standard.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>
      )}

      {/* TAB 1: PACCHETTI STRUTTURATI PER RISCHIO & MANSIONE */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Preset clinici strutturati conformi alle linee guida di medicina del lavoro (D.Lgs. 81/08). Clicca su "Installa Pacchetto" per aggiungere tutti i reperti strutturati alla tua libreria.
          </Typography>

          <Grid container spacing={2.5}>
            {STRUCTURED_RISK_PRESETS.map((pkg) => (
              <Grid item xs={12} md={6} key={pkg.id}>
                <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: `5px solid ${pkg.color}`, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ p: 1, bgcolor: `${pkg.color}15`, borderRadius: 2 }}>
                          {pkg.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {pkg.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pkg.riskFactor}
                          </Typography>
                        </Box>
                      </Stack>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AutoFixHighIcon />}
                        onClick={() => handleInstallRiskPackage(pkg)}
                        disabled={installingPreset}
                        sx={{ textTransform: 'none', fontWeight: 600, bgcolor: pkg.color, '&:hover': { opacity: 0.9 } }}
                      >
                        Installa ({pkg.items.length})
                      </Button>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack spacing={1}>
                      {pkg.items.map((item, idx) => (
                        <Box key={idx} sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Chip label={item.category} size="small" sx={{ fontSize: '10px', height: 18, fontWeight: 700 }} />
                            <Typography variant="caption" color="text.secondary">{item.tags}</Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ fontSize: '12px', color: '#334155' }}>
                            {item.text}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* DIALOG EDITOR */}
      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Modifica Frase Tipo' : 'Nuova Frase Tipo'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Categoria Clinica *"
              value={form.category}
              onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Testo Reperto / Frase *"
              multiline
              minRows={4}
              value={form.text}
              onChange={(e) => setForm((c) => ({ ...c, text: e.target.value }))}
              placeholder="Inserisci il testo standard da inserire nelle visite..."
            />
            <TextField
              label="Tag e Riferimenti Rischio (separati da virgola)"
              value={form.tags}
              onChange={(e) => setForm((c) => ({ ...c, tags: e.target.value }))}
              placeholder="es. VDT, Vista, Astenopia, MMC"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditorOpen(false)} sx={{ textTransform: 'none' }}>
            Annulla
          </Button>
          <Button variant="contained" onClick={save} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Salva Reperto
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
