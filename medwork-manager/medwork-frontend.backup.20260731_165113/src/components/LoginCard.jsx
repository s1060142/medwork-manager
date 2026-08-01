import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  TextField,
  Link,
  IconButton,
  InputAdornment,
} from '@mui/material'
import { authLogin } from '../services/apiClient'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

function LoginCard({ onLoginSuccess, companies = [], branches = [] }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authLogin(username, password)

      // Persist selected context
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('role', data.role)
      localStorage.setItem('activeCompanyId', '')
      localStorage.setItem('activeBranchId', '')

      onLoginSuccess(data.accessToken, data.role)
    } catch (err) {
      setError(err.message || 'Errore durante il login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '40px',
        minWidth: '320px'
      }}
    >
      {/* Logo and Branding */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        {/* MedWork Logo - Purple and Black as in screenshot */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          mb: 2 
        }}>
          <Box sx={{ 
            width: 48, 
            height: 48, 
            bg: '#6A5ACD', 
            borderRadius: 8, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mr: 2
          }}>
            <PersonOutlineIcon fontSize="large" color="white" />
          </Box>
          <Typography variant="h4" fontWeight="bold" color="#6A5ACD">
            MEDWORK
          </Typography>
        </Box>
        
        <Typography variant="h5" fontWeight="600" color="#212121" mb={1}>
          Suite MedWork
        </Typography>
        <Typography variant="body2" color="#5F6472" mb={4}>
          Piattaforma di Medicina del Lavoro e Sorveglianza Sanitaria.
        </Typography>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%', 
            mb: 2,
            backgroundColor: '#FFEBEE',
            color: '#C62828',
            borderLeft: '4px solid #F44336'
          }}
        >
          {error}
        </Alert>
      )}

      {/* Form Fields */}
      <TextField
        label="Username o Email"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        margin="normal"
        size="small"
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 1 }}>
              <PersonOutlineIcon fontSize="small" color="text.secondary" />
            </Box>
          )
        }}
        InputLabelProps={{
          shrink: true,
        }}
      />

      <TextField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
        size="small"
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 1 }}>
              <LockOutlinedIcon fontSize="small" color="text.secondary" />
            </Box>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword((show) => !show)}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          )
        }}
        InputLabelProps={{
          shrink: true,
        }}
      />

      {/* Remember Me and Forgot Password */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              color="primary"
            />
          }
          label="Ricordami"
          labelPlacement="start"
          sx={{ 
            color: '#5F6472',
            fontSize: '0.875rem'
          }}
        />
        <Link 
          href="/forgot-password" 
          variant="body2"
          color="primary"
          sx={{ 
            textDecoration: 'underline',
            fontSize: '0.875rem'
          }}
        >
          Password dimenticata?
        </Link>
      </Box>

      {/* Login Button */}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
        fullWidth
        size="large"
        sx={{
          height: 48,
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          backgroundColor: '#6A5ACD',
          '&:hover': {
            backgroundColor: '#5A4A9D',
            '@media (hover: none)': {
              backgroundColor: '#6A5ACD'
            }
          }
        }}
      >
        {loading ? 'Accesso in corso...' : 'Accedi'}
      </Button>

      {/* Footer */}
      <Box sx={{ 
        width: '100%', 
        mt: 4, 
        paddingTop: 2, 
        borderTop: '1px solid #E0E0E0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="#9E9E9E">
            v1.0.0
          </Typography>
          <Typography variant="caption" color="#9E9E9E">
            (it)
          </Typography>
        </Box>
        <Link 
          href="/privacy" 
          variant="caption"
          color="text.secondary"
          sx={{ 
            textDecoration: 'underline'
          }}
        >
          Informativa sulla privacy
        </Link>
      </Box>
    </Box>
  )
}

export default LoginCard