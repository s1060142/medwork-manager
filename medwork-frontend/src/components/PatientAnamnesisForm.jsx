import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography
} from '@mui/material'

const API_BASE = 'http://localhost:5030' // Or configured

function PatientAnamnesisForm({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    workHistory: '',
    personalHistory: '',
    familyHistory: '',
    remotePathology: '',
    recentPathology: '',
    lifestyleHabits: '',
    occupationalExposures: ''
  })

  useEffect(() => {
    if (!token) {
      setError('Token mancante o non valido.')
      setLoading(false)
      return
    }

    const loadAnamnesis = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/patient-portal/anamnesis`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Link scaduto o non valido.')
        }

        const result = await response.json()
        setData(result)
        setFormData({
          workHistory: result.workHistory || '',
          personalHistory: result.personalHistory || '',
          familyHistory: result.familyHistory || '',
          remotePathology: result.remotePathology || '',
          recentPathology: result.recentPathology || '',
          lifestyleHabits: result.lifestyleHabits || '',
          occupationalExposures: result.occupationalExposures || ''
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadAnamnesis()
  }, [token])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/api/patient-portal/anamnesis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visitId: data.visitId,
          ...formData
        })
      })

      if (!response.ok) {
        throw new Error('Errore durante il salvataggio dei dati.')
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Alert severity="success" sx={{ fontSize: '1.2rem', py: 2 }}>
          Dati inviati con successo! Il Medico Competente li riceverà per la visita. Puoi chiudere questa pagina.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom color="primary">MedWork - Questionario Anamnestico</Typography>
      <Typography variant="body1" paragraph>
        Compila i campi sottostanti. I dati inseriti verranno trasmessi in modo sicuro e cifrato direttamente al Medico Competente.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {data && (
        <Card variant="outlined">
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  name="familyHistory"
                  label="Anamnesi Familiare (Malattie di genitori, fratelli)"
                  multiline rows={3}
                  value={formData.familyHistory}
                  onChange={handleChange}
                  fullWidth
                />
                
                <TextField
                  name="personalHistory"
                  label="Anamnesi Fisiologica (Allergie, Interventi chirurgici passati)"
                  multiline rows={3}
                  value={formData.personalHistory}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  name="remotePathology"
                  label="Anamnesi Patologica Remota (Malattie croniche)"
                  multiline rows={3}
                  value={formData.remotePathology}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  name="recentPathology"
                  label="Anamnesi Patologica Prossima (Sintomi o problemi recenti)"
                  multiline rows={3}
                  value={formData.recentPathology}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  name="lifestyleHabits"
                  label="Abitudini di Vita (Fumo, Alcol, Sport)"
                  multiline rows={3}
                  value={formData.lifestyleHabits}
                  onChange={handleChange}
                  fullWidth
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    disabled={saving}
                  >
                    {saving ? 'Invio in corso...' : 'Invia Dati al Medico'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>
      )}
    </Container>
  )
}

export default PatientAnamnesisForm
