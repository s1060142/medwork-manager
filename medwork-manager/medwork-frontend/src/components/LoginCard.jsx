import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { authLogin } from '../services/apiClient'

function LoginCard({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Admin123!')
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrore('')
    setCaricamento(true)

    try {
      const data = await authLogin(username, password)

      onLoginSuccess(data.accessToken, data.role)
    } catch (error) {
      setErrore(error.message || 'Errore durante il login.')
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 420 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Accesso piattaforma
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Credenziali demo: admin/Admin123! oppure doctor/Doctor123!.
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
          <Button type="submit" variant="contained" disabled={caricamento}>
            {caricamento ? 'Accesso in corso...' : 'Accedi'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  )
}

export default LoginCard