import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { apiGet } from '../services/apiClient'

const PIE_COLORS = ['#ff9800', '#f44336', '#4caf50', '#2196f3']

export default function ReportsCenter() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({})
  const [yearlyTrend, setYearlyTrend] = useState([])

  useEffect(() => {
    Promise.all([
      apiGet('/api/reports/dashboard-metrics'),
      apiGet('/api/reports/yearly-trend'),
    ]).then(([metricsData, trendData]) => {
      setMetrics(metricsData || {})
      setYearlyTrend(Array.isArray(trendData) ? trendData : [])
    }).catch(() => {
      setMetrics({})
      setYearlyTrend([])
    }).finally(() => setLoading(false))
  }, [])

  const stats = metrics.percentuali || { 
    idoneo: 89.2, 
    'parziale-prescrizioni': 6.5, 
    parziale: 2.5, 
    nonIdoneoTemp: 1.8 
  }

  const fitnessChartData = [
    { name: 'Idoneo', value: stats.idoneo },
    { name: 'Idoneo con limitazioni e prescrizioni', value: stats['parziale-prescrizioni'] },
    { name: 'Idoneo con limitazioni', value: stats.parziale },
    { name: 'Non idoneo temporaneo', value: stats.nonIdoneoTemp },
  ]

  // Mock yearly trend data if not available from API
  const trendData = yearlyTrend.length > 0 ? yearlyTrend : [
    { year: 2015, value: 0 },
    { year: 2016, value: 0 },
    { year: 2017, value: 0 },
    { year: 2018, value: 0 },
    { year: 2019, value: 0 },
    { year: 2020, value: 13 },
    { year: 2021, value: 27 },
    { year: 2022, value: 42 },
    { year: 2023, value: 51 },
    { year: 2024, value: 32 },
  ]

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Reportistica e Statistiche
      </Typography>

      {/* Donut Chart - Fitness Distribution */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Distribuzione esiti dei giudizi di idoneità
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Questo grafico mostra la distribuzione degli esiti dei giudizi conclusi negli ultimi 10 anni per l'azienda selezionata.
        </Typography>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={fitnessChartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              label={({ name, value, percent }) => `${name}: ${value}% (${(percent * 100).toFixed(1)}%)`}
            >
              {fitnessChartData.map((entry, index) => (
                <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* Bar Chart - Yearly Trend */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Trend Annuale (2015-2024)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Distribuzione dei giudizi di idoneità per anno
        </Typography>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={trendData}>
            <XAxis dataKey="year" />
            <YAxis domain={[0, 'dataMax + 10']} />
            <RechartsTooltip formatter={(value) => [value, 'Giudizi']} />
            <Bar dataKey="value" fill="#9c27b0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Detailed Company Reports Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report Dettagliati per Azienda
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Azienda</TableCell>
                <TableCell>Lavoratori</TableCell>
                <TableCell>Visite</TableCell>
                <TableCell>Fatture</TableCell>
                <TableCell>Stato</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Azienda 1</TableCell>
                <TableCell>150</TableCell>
                <TableCell>45</TableCell>
                <TableCell>12</TableCell>
                <TableCell><Chip label="Attivo" color="success" /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}