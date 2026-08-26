import React, { useState, useCallback } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Typography, CircularProgress, Paper } from '@mui/material'
import { getHeaders, hrImportCsv, hrExportCsv, hrExportExcel, API_BASE_URL } from '../services/apiClient'
import { getTenantId, setTenantId } from '../services/apiClient'
import { useAuth } from '../contexts/AuthContext'

interface HrImportExportDialogProps {
  open: boolean
  onClose: () => void
  onImportSuccess?: () => void
  onExportSuccess?: () => void
}

export const HrImportExportDialog: React.FC<HrImportExportDialogProps> = ({ open, onClose, onImportSuccess, onExportSuccess }) => {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importFileName, setImportFileName] = useState('')
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState('')
  const [exportFileName, setExportFileName] = useState('')
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState('')
  const [error, setError] = useState('')
  const { token, tenantId } = useAuth()

  const handleImport = useCallback(async () => {
    if (!importFile || !importFileName) {
      setError('Seleziona un file e una nome file')
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    setImportStatus('Caricamento file...')
    setError('')

    try {
      await hrImportCsv(importFile, importFileName)
      setImportProgress(100)
      setImportStatus('Importazione completata!')
      setError('')
      if (onImportSuccess) onImportSuccess()
    } catch (err) {
      setError('Errore di connesso al backend.')
    } finally {
      setIsImporting(false)
    }
  }, [importFile, importFileName])

  const handleExportCsv = useCallback(async () => {
    setIsExporting(true)
    setExportProgress(0)
    setExportStatus('Export in corso...')
    setError('')

    try {
      const blob = await hrExportCsv()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'employees.csv'
      a.click()
      window.URL.revokeObjectURL(url)
      setExportProgress(100)
      setExportStatus('Esportazione completata!')
      setError('')
      if (onExportSuccess) onExportSuccess()
    } catch (err) {
      setError('Errore durante l\'esportazione CSV.')
    } finally {
      setIsExporting(false)
    }
  }, [tenantId])

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true)
    setExportProgress(0)
    setExportStatus('Export in corso...')
    setError('')

    try {
      const blob = await hrExportExcel()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'employees.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
      setExportProgress(100)
      setExportStatus('Esportazione completata!')
      setError('')
      if (onExportSuccess) onExportSuccess()
    } catch (err) {
      setError('Errore durante l\'esportazione Excel.')
    } finally {
      setIsExporting(false)
    }
  }, [tenantId])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0])
      setImportFileName(e.target.files[0].name)
      setError('')
    }
  }, [])

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target && target.files && target.files.length > 0) {
        setImportFile(target.files[0])
        setImportFileName(target.files[0].name)
        setError('')
      }
    }
    input.click()
  }, [])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>HR Import/Export</DialogTitle>
      <DialogContent>
        {error && (
          <Paper sx={{ mb: 2, p: 2 }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}

        <Typography variant="body2" sx={{ mb: 2 }}>
          Importa dati HR da CSV o esporta dati in CSV/Excel.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Nome file"
            value={importFileName}
            onChange={(e) => setImportFileName(e.target.value)}
            onFocus={handleFileSelect}
            variant="outlined"
            size="small"
            disabled={isImporting}
            fullWidth
            inputProps={{
              onClick: handleFileSelect,
            }}
            helperText="Seleziona un file CSV per importare"
          />
          <Button
            variant="contained"
            onClick={handleFileSelect}
            disabled={isImporting}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Seleziona file
          </Button>
        </Box>

        {isImporting && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={32} />
            <Typography sx={{ mt: 1 }}>{importStatus}</Typography>
            <Typography sx={{ mt: 1 }}>{importProgress}%</Typography>
            <Box sx={{ width: 300, mx: 'auto' }}>
              <TextField
                label="Progresso"
                value={`${importProgress}%`}
                type="number"
                variant="outlined"
                size="small"
                disabled
                fullWidth
                inputProps={{ readOnly: true }}
              />
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleExportCsv}
            disabled={isExporting}
            sx={{ flex: 1 }}
          >
            {isExporting ? 'In esportazione...' : 'Esporta CSV'}
          </Button>
          <Button
            variant="contained"
            onClick={handleExportExcel}
            disabled={isExporting}
            sx={{ flex: 1 }}
          >
            {isExporting ? 'In esportazione...' : 'Esporta Excel (.xlsx)'}
          </Button>
        </Box>

        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ mt: 2 }}
        >
          Chiudi
        </Button>
      </DialogContent>
      <DialogActions>
        {error && (
          <Button variant="outlined" color="error" onClick={() => setError('')}>
            Ignora errore
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default HrImportExportDialog
