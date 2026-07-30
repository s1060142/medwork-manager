import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { authLogin } from '../services/apiClient'

function LoginCard({ onLoginSuccess, companies = [], branches = [] }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Admin123!')
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')

  const branchesForSelectedCompany = branches.filter(
    (b) => Number(b.companyId) === Number(selectedCompanyId)
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrore('')
    setCaricamento(true)

    try {
      const data = await authLogin(username, password)

      // Persisti il contesto selezionato
      localStorage.setItem('activeCompanyId', selectedCompanyId)
      localStorage.setItem('activeBranchId', selectedBranchId)

      onLoginSuccess(
        data.accessToken,
        data.role,
        selectedCompanyId,
        selectedBranchId
      )
    } catch (error) {
      setErrore(error.message || 'Errore durante il login.')
    } finally {
      setCaricamento(false)
    }
  }

  // Reset branch quando cambia azienda
  useEffect(() => {
    if (selectedCompanyId === '') {
      setSelectedBranchId('')
    }
  }, [selectedCompanyId])

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 520 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Accesso piattaforma
      </Typography>

      {!!errore && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errore}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            disabled={caricamento}
          >
            {caricamento ? 'Accesso in corso...' : 'Accedi'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  )
}

export default LoginCard