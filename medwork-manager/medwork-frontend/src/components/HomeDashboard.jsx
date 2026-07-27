import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import GroupIcon from '@mui/icons-material/Group'
import EventIcon from '@mui/icons-material/Event'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import CampaignIcon from '@mui/icons-material/Campaign'
import BusinessIcon from '@mui/icons-material/Business'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PageHeader from './PageHeader'
import { apiGet } from '../services/apiClient'

function KpiCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <Card elevation={3} sx={{ borderRadius: 3, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute', right: -20, top: -20,
          width: 90, height: 90, borderRadius: '50%',
          background: `${color}1a`,
        }}
      />
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: 2,
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
        }}>
          <Icon />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800} lineHeight={1}>{value}</Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </CardContent>
    </Card>
  )
}

export default function HomeDashboard({ onNavigate, activeCompanyId, activeBranchId }) {
  const [kpi, setKpi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiGet('/api/master-data/companies'),
      apiGet('/api/master-data/employees'),
      apiGet('/api/master-data/medical-visits'),
      apiGet('/api/master-data/scheduled-exams'),
      apiGet('/api/master-data/notification-logs'),
    ])
      .then(([companies, employees, visits, exams, logs]) => {
        setKpi({
          companies: companies.length,
          employees: employees.length,
          visits: visits.length,
          exams: exams.length,
          convocations: logs.length,
        })
      })
      .catch((e) => setError(e.message || 'Errore nel caricamento delle statistiche.'))
      .finally(() => setLoading(false))
  }, [activeCompanyId, activeBranchId])

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        icon={HealthAndSafetyIcon}
        title="Suite MedWork"
        subtitle="Dashboard di sintesi — Medicina del Lavoro e Sorveglianza Sanitaria"
        color="#1976d2"
      />

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid  size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <KpiCard icon={BusinessIcon} label="Aziende" value={kpi?.companies ?? 0} color="#1976d2" />
        </Grid>
        <Grid  size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <KpiCard icon={GroupIcon} label="Lavoratori" value={kpi?.employees ?? 0} color="#00897b" />
        </Grid>
        <Grid  size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <KpiCard icon={EventIcon} label="Visite mediche" value={kpi?.visits ?? 0} color="#7b1fa2" />
        </Grid>
        <Grid  size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <KpiCard icon={AssignmentIcon} label="Accertamenti" value={kpi?.exams ?? 0} color="#f57c00" />
        </Grid>
        <Grid  size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <KpiCard icon={CampaignIcon} label="Convocazioni" value={kpi?.convocations ?? 0} color="#c2185b" />
        </Grid>
      </Grid>

      {/* Quick access cards stile Cartsan */}
      <Typography variant="h6" sx={{ mb: 1.5, mt: 1 }}>Accesso rapido</Typography>
      <Grid container spacing={2.5}>
        {[
          { icon: HealthAndSafetyIcon, title: 'Cartella Sanitaria', desc: 'Visite, anamnesi ed esami del lavoratore', color: '#00897b', target: 'medical-records' },
          { icon: EventIcon, title: 'Scadenzario', desc: 'Pianifica visite e monitora le scadenze', color: '#1976d2', target: 'schedules' },
          { icon: CampaignIcon, title: 'Convocazioni', desc: 'Invia convocazioni email con PDF allegato', color: '#c2185b', target: 'convocazioni' },
          { icon: AssessmentIcon, title: 'Allegato 3B', desc: 'Dati aggregati sanitari e di rischio', color: '#7b1fa2', target: 'allegato-3b' },
        ].map((c) => (
          <Grid  key={c.target} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2} sx={{ borderRadius: 3, cursor: 'pointer', height: '100%', transition: 'all .2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 } }} onClick={() => onNavigate(c.target)}>
              <CardContent>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, background: `linear-gradient(135deg, ${c.color}, ${c.color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', mb: 1.5 }}>
                  <c.icon />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>{c.title}</Typography>
                <Typography variant="body2" color="text.secondary">{c.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
