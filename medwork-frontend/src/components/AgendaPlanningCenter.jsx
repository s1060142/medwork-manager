import { useState, useEffect, useMemo } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import BoltIcon from '@mui/icons-material/Bolt'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import AddIcon from '@mui/icons-material/Add'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import AppointmentsCalendar from './AppointmentsCalendar'
import VisitPlanningCenter from './VisitPlanningCenter'

export default function AgendaPlanningCenter({
  activeCompanyId = '',
  activeBranchId = '',
  onOpenMedicalVisitCreate,
  initialTab = 'calendar',
}) {
  const [currentTab, setCurrentTab] = useState(initialTab === 'planning' ? 'planning' : 'calendar')
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0)
  const [notification, setNotification] = useState(null)

  // Sync if initialTab changes from route
  useEffect(() => {
    if (initialTab === 'planning' || initialTab === 'calendar') {
      setCurrentTab(initialTab)
    }
  }, [initialTab])

  const handleTabChange = (_event, newValue) => {
    setCurrentTab(newValue)
    setNotification(null)
  }

  const handleBatchPlanned = ({ count, date }) => {
    setCalendarRefreshKey((prev) => prev + 1)
    setNotification({
      type: 'success',
      message: `Pianificata con successo una sessione massiva di ${count} visite per il ${date ? new Date(date).toLocaleDateString('it-IT') : 'periodo selezionato'}.`,
      actionLabel: 'Visualizza nel Calendario',
      onAction: () => {
        setCurrentTab('calendar')
        setNotification(null)
      },
    })
  }

  return (
    <Stack spacing={2.5} sx={{ pb: 3 }}>
      {/* UNIFIED HUB HEADER */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip
                label="D.Lgs. 81/08"
                size="small"
                sx={{
                  bgcolor: 'rgba(59, 130, 246, 0.25)',
                  color: '#93c5fd',
                  fontWeight: 700,
                  fontSize: '11px',
                  height: 22,
                }}
              />
              <Typography variant="overline" sx={{ color: '#94a3b8', letterSpacing: 1, fontWeight: 700 }}>
                CENTRO UNIFICATO DEL TEMPO & PIANIFICAZIONE
              </Typography>
            </Stack>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.2 }}>
              Agenda & Pianificazione Visite
            </Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
              Piattaforma unificata per il monitoraggio delle scadenze sanitarie, la gestione del calendario ambulatoriale e la pianificazione di sessioni massive.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Button
              variant={currentTab === 'calendar' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<CalendarMonthIcon />}
              onClick={() => setCurrentTab('calendar')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                color: currentTab === 'calendar' ? '#ffffff' : '#e2e8f0',
                borderColor: 'rgba(255,255,255,0.3)',
                bgcolor: currentTab === 'calendar' ? '#2563eb' : 'transparent',
                '&:hover': {
                  bgcolor: currentTab === 'calendar' ? '#1d4ed8' : 'rgba(255,255,255,0.08)',
                },
              }}
            >
              Calendario Appuntamenti
            </Button>

            <Button
              variant={currentTab === 'planning' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<BoltIcon />}
              onClick={() => setCurrentTab('planning')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                color: currentTab === 'planning' ? '#ffffff' : '#e2e8f0',
                borderColor: 'rgba(255,255,255,0.3)',
                bgcolor: currentTab === 'planning' ? '#0284c7' : 'transparent',
                '&:hover': {
                  bgcolor: currentTab === 'planning' ? '#0369a1' : 'rgba(255,255,255,0.08)',
                },
              }}
            >
              Scadenzario & Batch Planner
            </Button>
          </Stack>
        </Stack>

        {/* INTEGRATED MODERN TAB STRIP */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.12)', mt: 2.5 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'none',
                minHeight: 44,
                py: 1,
                '&.Mui-selected': {
                  color: '#60a5fa',
                  fontWeight: 700,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#60a5fa',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              value="calendar"
              label="📅 Calendario Visite & Appuntamenti"
              id="tab-agenda-calendar"
              aria-controls="tabpanel-agenda-calendar"
            />
            <Tab
              value="planning"
              label="⚡ Scadenzario Normativo & Sessioni Massive (Batch)"
              id="tab-agenda-planning"
              aria-controls="tabpanel-agenda-planning"
            />
          </Tabs>
        </Box>
      </Paper>

      {/* CROSS-TAB BANNER NOTIFICATION */}
      {notification && (
        <Alert
          severity={notification.type}
          action={
            notification.actionLabel && (
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={notification.onAction}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                {notification.actionLabel}
              </Button>
            )
          }
          onClose={() => setNotification(null)}
          sx={{ borderRadius: 2 }}
        >
          {notification.message}
        </Alert>
      )}

      {/* TAB CONTENT: CALENDAR */}
      {currentTab === 'calendar' && (
        <Box role="tabpanel" id="tabpanel-agenda-calendar">
          <AppointmentsCalendar
            key={`cal-${calendarRefreshKey}`}
            activeCompanyId={activeCompanyId}
            activeBranchId={activeBranchId}
            onOpenMedicalVisitCreate={onOpenMedicalVisitCreate}
          />
        </Box>
      )}

      {/* TAB CONTENT: BATCH PLANNING & DEADLINES */}
      {currentTab === 'planning' && (
        <Box role="tabpanel" id="tabpanel-agenda-planning">
          <VisitPlanningCenter
            activeCompanyId={activeCompanyId}
            activeBranchId={activeBranchId}
            onOpenMedicalVisitCreate={onOpenMedicalVisitCreate}
            onBatchPlanned={handleBatchPlanned}
          />
        </Box>
      )}
    </Stack>
  )
}
