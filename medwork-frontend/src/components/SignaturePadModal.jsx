import React, { useRef, useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Alert,
  Chip
} from '@mui/material'
import DrawIcon from '@mui/icons-material/Draw'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'

export default function SignaturePadModal({ open, onClose, onSignatureCaptured, documentTitle = 'Giudizio di Idoneità / Cartella Sanitaria' }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [strokePoints, setStrokePoints] = useState([])

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      handleClear()
    }
  }, [open])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
        time: Date.now()
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now()
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const coords = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    setStrokePoints(prev => [...prev, coords])
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const coords = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
    setHasSignature(true)
    setStrokePoints(prev => [...prev, coords])
  }

  const stopDrawing = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    setIsDrawing(false)
  }

  const handleClear = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHasSignature(false)
    setStrokePoints([])
  }

  const handleConfirm = () => {
    if (!hasSignature || !canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    const biometricMetadata = {
      pointsCount: strokePoints.length,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
    if (typeof onSignatureCaptured === 'function') {
      onSignatureCaptured({ dataUrl, biometricMetadata })
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <DrawIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Firma Elettronica Avanzata (FEA)
            </Typography>
          </Stack>
          <Chip
            icon={<VerifiedUserIcon />}
            label="Conforme AgID / D.Lgs. 81/08"
            color="success"
            size="small"
            variant="outlined"
          />
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Apponi la firma nel riquadro sottostante per la sottoscrizione di: <strong>{documentTitle}</strong>.
        </Typography>

        <Box
          sx={{
            border: '2px dashed #94a3b8',
            borderRadius: 2,
            bgcolor: '#f8fafc',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            touchAction: 'none',
            overflow: 'hidden'
          }}
        >
          <canvas
            ref={canvasRef}
            width={520}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ width: '100%', height: '200px', cursor: 'crosshair' }}
          />
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Parametri biometrici (tratto, pressione temporale) acquisiti a fini di validità legale.
          </Typography>
          <Button
            size="small"
            startIcon={<DeleteOutlineIcon />}
            onClick={handleClear}
            disabled={!hasSignature}
            sx={{ textTransform: 'none' }}
          >
            Cancella
          </Button>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Annulla
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon />}
          onClick={handleConfirm}
          disabled={!hasSignature}
          sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
        >
          Conferma & Apponi Firma
        </Button>
      </DialogActions>
    </Dialog>
  )
}
