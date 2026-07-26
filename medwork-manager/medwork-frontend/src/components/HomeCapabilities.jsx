import { Box, Button, Paper, Stack, Typography } from '@mui/material'

const CAPABILITIES = [
  {
    id: 1,
    title: 'Idoneità, accertamenti e cartella sanitaria',
    description: 'Gestisci visite, giudizio di idoneità e cartella sanitaria del lavoratore in un unico flusso operativo.',
    target: 'employees',
  },
  {
    id: 2,
    title: 'Agende, scadenze e prenotazioni',
    description: 'Riduci i tempi di pianificazione con dashboard scadenze e calendario appuntamenti medico-lavoratore.',
    target: 'schedules',
  },
  {
    id: 3,
    title: 'Protocolli sanitari',
    description: 'Definisci protocolli per mansione/rischio con periodicità, esami e regole attive per azienda.',
    target: 'protocols',
  },
  {
    id: 4,
    title: 'Accesso anche senza connessione',
    description: 'Il frontend supporta caching offline base e ripristino sessione per continuità operativa.',
    target: 'tools',
    featured: true,
  },
  {
    id: 5,
    title: 'Strumenti diagnostici, firma grafometrica e digitale',
    description: 'Raccolta esami, riepilogo attività diagnostiche e firma digitale operativa con tracciamento.',
    target: 'tools',
  },
  {
    id: 6,
    title: 'Allegato 3B e Relazione sanitaria',
    description: 'Genera report direzionali e adempimenti periodici in PDF direttamente dal centro report.',
    target: 'reporting',
  },
  {
    id: 7,
    title: 'Gestione multitenente e multidominio',
    description: 'Imposta contesto azienda/sede attiva e configurazioni operative centralizzate.',
    target: 'settings',
  },
  {
    id: 8,
    title: 'Fatturazione, parcelle e preventivi',
    description: 'Gestisci preventivi e fatture con stato documento, importo e scadenze.',
    target: 'billing',
  },
]

function HomeCapabilities({ onNavigate }) {
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, backgroundColor: '#edf9f4', borderColor: '#d7ebe3' }}>
        <Typography variant="h6">Copertura funzionale piattaforma</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Tutte le aree richieste sono state abilitate con moduli operativi dedicati.
        </Typography>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
        {CAPABILITIES.map((item) => (
          <Paper
            key={item.id}
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: item.featured ? '#d9d3ff' : '#edf9f4',
              borderColor: item.featured ? '#c0b8ff' : '#d7ebe3',
            }}
          >
            <Typography
              sx={{
                position: 'absolute',
                right: 16,
                top: 10,
                color: 'rgba(55, 90, 145, 0.12)',
                fontSize: 80,
                fontWeight: 800,
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              {item.id}
            </Typography>

            <Typography variant="h6" sx={{ maxWidth: '85%', fontWeight: 700 }}>
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2, mb: 2, maxWidth: '85%' }}>
              {item.description}
            </Typography>

            <Button variant="outlined" onClick={() => onNavigate(item.target)}>
              Scopri di più
            </Button>
          </Paper>
        ))}
      </Box>
    </Stack>
  )
}

export default HomeCapabilities
