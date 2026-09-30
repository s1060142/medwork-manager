import { useState, useEffect, useRef } from 'react'
import { IconButton, Tooltip, CircularProgress, Box, Typography } from '@mui/material'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'

export default function VoiceDictationButton({ onTextRecognized, fieldName = 'campo', size = 'small' }) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'it-IT'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript
          if (transcript && onTextRecognized) {
            onTextRecognized(transcript.trim())
          }
        }
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } catch (e) {
      console.warn('Speech recognition not available:', e)
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
      }
    }
  }, [onTextRecognized])

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.warn('Error starting speech recognition:', err)
        setIsListening(false)
      }
    }
  }

  if (!isSupported) {
    return (
      <Tooltip title="Dettatura vocale non supportata in questo browser (usa Chrome, Edge o Safari)">
        <span>
          <IconButton size={size} disabled sx={{ opacity: 0.4 }}>
            <MicOffIcon fontSize={size === 'small' ? 'small' : 'medium'} />
          </IconButton>
        </span>
      </Tooltip>
    )
  }

  return (
    <Tooltip title={isListening ? 'In ascolto... Parla ora (clicca per fermare)' : `Dettatura vocale per ${fieldName}`}>
      <IconButton
        size={size}
        color={isListening ? 'error' : 'primary'}
        onClick={toggleListening}
        sx={{
          bgcolor: isListening ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
          border: isListening ? '1px solid #ef4444' : 'none',
          animation: isListening ? 'pulse 1.2s infinite' : 'none',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
            '70%': { transform: 'scale(1.08)', boxShadow: '0 0 0 6px rgba(239, 68, 68, 0)' },
            '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
          },
        }}
      >
        <MicIcon fontSize={size === 'small' ? 'small' : 'medium'} />
      </IconButton>
    </Tooltip>
  )
}
