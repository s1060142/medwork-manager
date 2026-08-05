import { Box, Typography, Paper, Link, List, ListItem, ListItemText, Divider } from '@mui/material'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'

export default function HelpCenter() {
  const sections = [
    {
      title: 'Guida Rapida',
      items: [
        'Utilizza la barra di ricerca in alto per trovare lavoratori, aziende o pratiche.',
        'Il menu laterale consente di navigare tra le diverse sezioni dell\'applicazione.',
        'Ogni sezione è filtrata automaticamente in base all\'azienda e al sito selezionati.',
      ],
    },
    {
      title: 'Gestione Lavoratori',
      items: [
        'La sezione "Lavoratori" mostra l\'elenco dei lavoratori con il loro stato di idoneità.',
        'Utilizza i filtri per cercare lavoratori per nome, cognome o codice fiscale.',
        'Esporta i dati in formato CSV per analisi esterne.',
      ],
    },
    {
      title: 'Fatturazione',
      items: [
        'La sezione "Fatturazione" guida attraverso un wizard in 5 passaggi.',
        'Salva le fatture come bozza prima della creazione definitiva.',
        'Consulta il riepilogo prima di confermare.',
      ],
    },
    {
      title: 'Scadenze e Agende',
      items: [
        'Visualizza le scadenze in formato calendario.',
        'Filtra per stato: scaduto, programmato, erogato.',
        'Ricevi notifiche per le scadenze imminenti.',
      ],
    },
    {
      title: 'Supporto',
      items: [
        'Per assistenza tecnica contatta l\'amministratore di sistema.',
        'Per questioni cliniche rivolgersi al medico competente.',
        'Segnala feedback tramite la sezione "Feedback" nel menu.',
      ],
    },
  ]

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Guida
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Benvenuto nella guida di MedWork Manager. Qui trovi le istruzioni per utilizzare le
          principali funzionalità della piattaforma.
        </Typography>
      </Paper>
      {sections.map((section) => (
        <Paper key={section.title} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            <HelpOutlineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {section.title}
          </Typography>
          <List dense>
            {section.items.map((item, i) => (
              <ListItem key={i} disablePadding>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
          <Divider />
        </Paper>
      ))}
    </Box>
  )
}