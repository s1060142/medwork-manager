import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { apiDelete, apiGet, apiPost, apiPut } from '../services/apiClient';

const DeviceCenter = () => {
  const [devices, setDevices] = useState([]);
  const [examLogs, setExamLogs] = useState([]);
  const [parserConfigs, setParserConfigs] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Devices, 1: Exam Logs, 2: Parser Configs
  const [openDeviceDialog, setOpenDeviceDialog] = useState(false);
  const [openExamLogDialog, setOpenExamLogDialog] = useState(false);
  const [openParserConfigDialog, setOpenParserConfigDialog] = useState(false);
  const [deviceForm, setDeviceForm] = useState({
    id: '',
    name: '',
    type: '',
    model: '',
    manufacturer: '',
    serialNumber: '',
    firmwareVersion: '',
    connectionType: 'USB',
    connectionAddress: '',
    configurationJson: '{}',
    parserType: '',
    isActive: true,
  });
  const [examLogForm, setExamLogForm] = useState({
    id: '',
    deviceId: '',
    employeeId: '',
    medicalVisitId: '',
    examTypeId: '',
    rawData: '',
    parsedDataJson: '{}',
    status: 'Success',
    errorMessage: '',
  });
  const [parserConfigForm, setParserConfigForm] = useState({
    id: '',
    name: '',
    deviceType: '',
    manufacturer: '',
    model: '',
    parserType: '',
    configurationJson: '{}',
    isDefault: false,
    isActive: true,
  });
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [medicalVisits, setMedicalVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devicesRes, deviceTypesRes, examTypesRes, employeesRes, visitsRes, examLogsRes, parserConfigsRes] = await Promise.all([
          apiGet('/api/diagnostic-devices'),
          apiGet('/api/master-data/exam-types'), // Assuming we can get device types from exam types? Actually we need a list of device types from the enum.
          apiGet('/api/master-data/exam-types'), // This is a placeholder; we need a proper endpoint for device types.
          apiGet('/api/master-data/employees'),
          apiGet('/api/master-data/medical-visits'),
          apiGet('/api/diagnostic-devices/exams'),
          apiGet('/api/diagnostic-devices/parser-configs'),
        ]);
        setDevices(devicesRes);
        // We don't have an endpoint for device types yet; we'll use the enum from the model.
        // For now, we'll hardcode or get from a metadata endpoint.
        setDeviceTypes([
          { value: 'Spirometer', label: 'Spirometro' },
          { value: 'Audiometer', label: 'Audiometro' },
          { value: 'ECG', label: 'ECG' },
          { value: 'VisionTester', label: 'Test Visivo' },
          { value: 'DrugTestReader', label: 'Lettore Test Droga' },
          { value: 'BloodPressureMonitor', label: 'Misuratore Pressione' },
          { value: 'PulseOximeter', label: 'Saturimetro' },
          { value: 'Other', label: 'Altro' },
        ]);
        setExamTypes(examTypesRes);
        setEmployees(employeesRes);
        setMedicalVisits(visitsRes);
        setExamLogs(examLogsRes);
        setParserConfigs(parserConfigsRes);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeviceChange = (e) => {
    setDeviceForm({ ...deviceForm, [e.target.name]: e.target.value });
  };

  const handleExamLogChange = (e) => {
    setExamLogForm({ ...examLogForm, [e.target.name]: e.target.value });
  };

  const handleParserConfigChange = (e) => {
    setParserConfigForm({ ...parserConfigForm, [e.target.name]: e.target.value });
  };

  const handleOpenDeviceDialog = (device = null) => {
    if (device) {
      setDeviceForm(device);
    } else {
      setDeviceForm({
        id: '',
        name: '',
        type: '',
        model: '',
        manufacturer: '',
        serialNumber: '',
        firmwareVersion: '',
        connectionType: 'USB',
        connectionAddress: '',
        configurationJson: '{}',
        parserType: '',
        isActive: true,
      });
    }
    setOpenDeviceDialog(true);
  };

  const handleCloseDeviceDialog = () => {
    setOpenDeviceDialog(false);
    setDeviceForm({
      id: '',
      name: '',
      type: '',
      model: '',
      manufacturer: '',
      serialNumber: '',
      firmwareVersion: '',
      connectionType: 'USB',
      connectionAddress: '',
      configurationJson: '{}',
      parserType: '',
      isActive: true,
    });
  };

  const handleSaveDevice = async () => {
    try {
      if (deviceForm.id) {
        await apiPut(`/api/diagnostic-devices/${deviceForm.id}`, deviceForm);
      } else {
        await apiPost('/api/diagnostic-devices', deviceForm);
      }
      // Refresh devices
      const updatedDevices = await apiGet('/api/diagnostic-devices');
      setDevices(updatedDevices);
      handleCloseDeviceDialog();
    } catch (err) {
      console.error('Failed to save device:', err);
      alert('Errore durante il salvataggio del dispositivo');
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo dispositivo?')) return;
    try {
      await apiDelete(`/api/diagnostic-devices/${id}`);
      const updatedDevices = await apiGet('/api/diagnostic-devices');
      setDevices(updatedDevices);
    } catch (err) {
      console.error('Failed to delete device:', err);
      alert('Errore durante l\'eliminazione del dispositivo');
    }
  };

  const handleOpenExamLogDialog = (examLog = null) => {
    if (examLog) {
      setExamLogForm(examLog);
    } else {
      setExamLogForm({
        id: '',
        deviceId: '',
        employeeId: '',
        medicalVisitId: '',
        examTypeId: '',
        rawData: '',
        parsedDataJson: '{}',
        status: 'Success',
        errorMessage: '',
      });
    }
    setOpenExamLogDialog(true);
  };

  const handleCloseExamLogDialog = () => {
    setOpenExamLogDialog(false);
    setExamLogForm({
      id: '',
      deviceId: '',
      employeeId: '',
      medicalVisitId: '',
      examTypeId: '',
      rawData: '',
      parsedDataJson: '{}',
      status: 'Success',
      errorMessage: '',
    });
  };

  const handleSaveExamLog = async () => {
    try {
      if (examLogForm.id) {
        await apiPut(`/api/diagnostic-devices/exams/${examLogForm.id}`, examLogForm);
      } else {
        await apiPost('/api/diagnostic-devices/exams', examLogForm);
      }
      // Refresh exam logs
      const updatedExamLogs = await apiGet('/api/diagnostic-devices/exams');
      setExamLogs(updatedExamLogs);
      handleCloseExamLogDialog();
    } catch (err) {
      console.error('Failed to save exam log:', err);
      alert('Errore durante il salvataggio del log esame');
    }
  };

  const handleDeleteExamLog = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo log esame?')) return;
    try {
      await apiDelete(`/api/diagnostic-devices/exams/${id}`);
      const updatedExamLogs = await apiGet('/api/diagnostic-devices/exams');
      setExamLogs(updatedExamLogs);
    } catch (err) {
      console.error('Failed to delete exam log:', err);
      alert('Errore durante l\'eliminazione del log esame');
    }
  };

  const handleOpenParserConfigDialog = (config = null) => {
    if (config) {
      setParserConfigForm(config);
    } else {
      setParserConfigForm({
        id: '',
        name: '',
        deviceType: '',
        manufacturer: '',
        model: '',
        parserType: '',
        configurationJson: '{}',
        isDefault: false,
        isActive: true,
      });
    }
    setOpenParserConfigDialog(true);
  };

  const handleCloseParserConfigDialog = () => {
    setOpenParserConfigDialog(false);
    setParserConfigForm({
      id: '',
      name: '',
      deviceType: '',
      manufacturer: '',
      model: '',
      parserType: '',
      configurationJson: '{}',
      isDefault: false,
      isActive: true,
    });
  };

  const handleSaveParserConfig = async () => {
    try {
      if (parserConfigForm.id) {
        await apiPut(`/api/diagnostic-devices/parser-configs/${parserConfigForm.id}`, parserConfigForm);
      } else {
        await apiPost('/api/diagnostic-devices/parser-configs', parserConfigForm);
      }
      // Refresh parser configs
      const updatedParserConfigs = await apiGet('/api/diagnostic-devices/parser-configs');
      setParserConfigs(updatedParserConfigs);
      handleCloseParserConfigDialog();
    } catch (err) {
      console.error('Failed to save parser config:', err);
      alert('Errore durante il salvataggio della configurazione parser');
    }
  };

  const handleDeleteParserConfig = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa configurazione parser?')) return;
    try {
      await apiDelete(`/api/diagnostic-devices/parser-configs/${id}`);
      const updatedParserConfigs = await apiGet('/api/diagnostic-devices/parser-configs');
      setParserConfigs(updatedParserConfigs);
    } catch (err) {
      console.error('Failed to delete parser config:', err);
      alert('Errore durante l\'eliminazione della configurazione parser');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6">Caricamento dati...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Toolbar>
        <Typography variant="h6" flex="1">
          Gestione Strumenti USB
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDeviceDialog()}>
          Nuovo Strumento
        </Button>
      </Toolbar>
      <Divider />
      <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} textColor="primary">
        <Tab label="Strumenti" />
        <Tab label="Log Esami" />
        <Tab label="Configurazioni Parser" />
      </Tabs>
      <Box sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
        {selectedTab === 0 && (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="tabella dispositivi">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Modello</TableCell>
                    <TableCell>Produttore</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id} hover>
                      <TableCell>{device.name}</TableCell>
                      <TableCell>{device.type}</TableCell>
                      <TableCell>{device.model || '-'}</TableCell>
                      <TableCell>{device.manufacturer || '-'}</TableCell>
                      <TableCell>
                        <Checkbox checked={device.isActive} disabled />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Modifica">
                          <IconButton size="small" aria-label="modifica" onClick={() => handleOpenDeviceDialog(device)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <IconButton size="small" aria-label="elimina" color="error" onClick={() => handleDeleteDevice(device.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        {selectedTab === 1 && (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="tabella log esami">
                <TableHead>
                  <TableRow>
                    <TableCell>Data/Ora</TableCell>
                    <TableCell>Strumento</TableCell>
                    <TableCell>Dipendente</TableCell>
                    <TableCell>Tipo Esame</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>{new Date(log.examDateTime).toLocaleString()}</TableCell>
                      <TableCell>{log.device?.name || '-'}</TableCell>
                      <TableCell>{log.employee?.firstName + ' ' + log.employee?.lastName || '-'}</TableCell>
                      <TableCell>{log.examType?.name || '-'}</TableCell>
                      <TableCell>{log.status}</TableCell>
                      <TableCell>
                        <Tooltip title="Visualizza">
                          <IconButton size="small" aria-label="visualizza" onClick={() => handleOpenExamLogDialog(log)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <IconButton size="small" aria-label="elimina" color="error" onClick={() => handleDeleteExamLog(log.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        {selectedTab === 2 && (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="tabella configurazioni parser">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Tipo Strumento</TableCell>
                    <TableCell>Produttore</TableCell>
                    <TableCell>Modello</TableCell>
                    <TableCell>Tipo Parser</TableCell>
                    <tableCell>Predefinito</tableCell>
                    <TableCell>Attivo</TableCell>
                    <TableCell>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parserConfigs.map((config) => (
                    <TableRow key={config.id} hover>
                      <TableCell>{config.name}</TableCell>
                      <TableCell>{config.deviceType}</TableCell>
                      <TableCell>{config.manufacturer || '-'}</TableCell>
                      <TableCell>{config.model || '-'}</TableCell>
                      <TableCell>{config.parserType}</TableCell>
                      <TableCell>
                        <Checkbox checked={config.isDefault} disabled />
                      </TableCell>
                      <TableCell>
                        <Checkbox checked={config.isActive} disabled />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Modifica">
                          <IconButton size="small" aria-label="modifica" onClick={() => handleOpenParserConfigDialog(config)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <IconButton size="small" aria-label="elimina" color="error" onClick={() => handleDeleteParserConfig(config.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
      {/* Device Dialog */}
      <Dialog open={openDeviceDialog} onClose={handleCloseDeviceDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {deviceForm.id ? 'Modifica Strumento' : 'Nuovo Strumento'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Nome"
            name="name"
            value={deviceForm.name}
            onChange={handleDeviceChange}
            fullWidth
            required
          />
          <Select
            label="Tipo"
            name="type"
            value={deviceForm.type}
            onChange={handleDeviceChange}
            fullWidth
          >
            {deviceTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
          <TextField
            label="Modello"
            name="model"
            value={deviceForm.model}
            onChange={handleDeviceChange}
            fullWidth
          />
          <TextField
            label="Produttore"
            name="manufacturer"
            value={deviceForm.manufacturer}
            onChange={handleDeviceChange}
            fullWidth
          />
          <TextField
            label="Numero di Serie"
            name="serialNumber"
            value={deviceForm.serialNumber}
            onChange={handleDeviceChange}
            fullWidth
          />
          <TextField
            label="Versione Firmware"
            name="firmwareVersion"
            value={deviceForm.firmwareVersion}
            onChange={handleDeviceChange}
            fullWidth
          />
          <Select
            label="Tipo Connessione"
            name="connectionType"
            value={deviceForm.connectionType}
            onChange={handleDeviceChange}
            fullWidth
          >
            <MenuItem value="USB">USB</MenuItem>
            <MenuItem value="Serial">Seriale</MenuItem>
            <MenuItem value="Bluetooth">Bluetooth</MenuItem>
            <MenuItem value="Network">Rete</MenuItem>
          </Select>
          <TextField
            label="Indirizzo/Porta Connessione"
            name="connectionAddress"
            value={deviceForm.connectionAddress}
            onChange={handleDeviceChange}
            fullWidth
          />
          <TextField
            label="Configurazione (JSON)"
            name="configurationJson"
            value={deviceForm.configurationJson}
            onChange={handleDeviceChange}
            fullWidth
            multiline
            rows={4}
          />
          <Select
            label="Tipo Parser"
            name="parserType"
            value={deviceForm.parserType}
            onChange={handleDeviceChange}
            fullWidth
          >
            {/* We can populate parser types from a metadata endpoint or hardcode common ones */}
            <MenuItem value="MIR">MIR</MenuItem>
            <MenuItem value="COSMED">COSMED</MenuItem>
            <MenuItem value="JAEGER">JAEGER</MenuItem>
            <MenuItem value="MAICO">MAICO</MenuItem>
            <MenuItem value="INTERACOUSTICS">INTERACOUSTICS</MenuItem>
            <MenuItem value="WELCHALLYN">WELCHALLYN</MenuItem>
            <MenuItem value="CSV">CSV</MenuItem>
            <MenuItem value="JSON">JSON</MenuItem>
            <MenuItem value="HL7">HL7</MenuItem>
            <MenuItem value="Custom">Custom</MenuItem>
          </Select>
          <FormControlLabel
            control={
              <Checkbox
                checked={deviceForm.isActive}
                onChange={(e) => setDeviceForm({ ...deviceForm, isActive: e.target.checked })}
                color="primary"
              />
            }
            label="Attivo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeviceDialog}>Annulla</Button>
          <Button variant="contained" color="primary" onClick={handleSaveDevice}>
            Salva
          </Button>
        </DialogActions>
      </Dialog>
      {/* Exam Log Dialog */}
      <Dialog open={openExamLogDialog} onClose={handleCloseExamLogDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {examLogForm.id ? 'Modifica Log Esame' : 'Nuovo Log Esame'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Data/Ora Esame"
            type="datetime-local"
            name="examDateTime"
            value={examForm.examDateTime ? new Date(examForm.examDateTime).toISOString().slice(0, 16) : ''}
            onChange={(e) => setExamLogForm({ ...examLogForm, examDateTime: e.target.value })}
            inputFormat="yyyy-MM-dd'T'HH:mm"
          />
          <Select
            label="Strumento"
            name="deviceId"
            value={examLogForm.deviceId}
            onChange={handleExamLogChange}
            fullWidth
          >
            <MenuItem value="">Seleziona uno strumento</MenuItem>
            {devices.map((device) => (
              <MenuItem key={device.id} value={device.id}>
                {device.name} ({device.type})
              </MenuItem>
            ))}
          </Select>
          <Select
            label="Dipendente"
            name="employeeId"
            value={examLogForm.employeeId}
            onChange={handleExamLogChange}
            fullWidth
          >
            <MenuItem value="">Seleziona un dipendente</MenuItem>
            {employees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </MenuItem>
            ))}
          </Select>
          <Select
            label="Visita Medica"
            name="medicalVisitId"
            value={examLogForm.medicalVisitId}
            onChange={handleExamLogChange}
            fullWidth
          >
            <MenuItem value="">Seleziona una visita (opzionale)</MenuItem>
            {medicalVisits.map((visit) => (
              <MenuItem key={visit.id} value={visit.id}>
                {new Date(visit.visitDate).toLocaleDateString()} - {visit.outcome}
              </MenuItem>
            ))}
          </Select>
          <Select
            label="Tipo Esame"
            name="examTypeId"
            value={examLogForm.examTypeId}
            onChange={handleExamLogChange}
            fullWidth
          >
            <MenuItem value="">Seleziona un tipo esame</MenuItem>
            {examTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name} ({type.category})
              </MenuItem>
            ))}
          </Select>
          <TextField
            label="Dati Grezzi"
            name="rawData"
            value={examLogForm.rawData}
            onChange={handleExamLogChange}
            fullWidth
            multiline
            rows={4}
          />
          <TextField
            label="Dati Parsati (JSON)"
            name="parsedDataJson"
            value={examLogForm.parsedDataJson}
            onChange={handleExamLogChange}
            fullWidth
            multiline
            rows={4}
          />
          <Select
            label="Stato"
            name="status"
            value={examLogForm.status}
            onChange={handleExamLogChange}
            fullWidth
          >
            <MenuItem value="Success">Successo</MenuItem>
            <MenuItem value="Error">Errore</MenuItem>
            <MenuItem value="Partial">Parziale</MenuItem>
          </Select>
          <TextField
            label="Messaggio Errore"
            name="errorMessage"
            value={examLogForm.errorMessage}
            onChange={handleExamLogChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExamLogDialog}>Annulla</Button>
          <Button variant="contained" color="primary" onClick={handleSaveExamLog}>
            Salva
          </Button>
        </DialogActions>
      </Dialog>
      {/* Parser Config Dialog */}
      <Dialog open={openParserConfigDialog} onClose={handleCloseParserConfigDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {parserConfigForm.id ? 'Modifica Configurazione Parser' : 'Nuova Configurazione Parser'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Nome"
            name="name"
            value={parserConfigForm.name}
            onChange={handleParserConfigChange}
            fullWidth
            required
          />
          <Select
            label="Tipo Strumento"
            name="deviceType"
            value={parserConfigForm.deviceType}
            onChange={handleParserConfigChange}
            fullWidth
          >
            {deviceTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
          <TextField
            label="Produttore"
            name="manufacturer"
            value={parserConfigForm.manufacturer}
            onChange={handleParserConfigChange}
            fullWidth
          />
          <TextField
            label="Modello"
            name="model"
            value={parserConfigForm.model}
            onChange={handleParserConfigChange}
            fullWidth
          />
          <Select
            label="Tipo Parser"
            name="parserType"
            value={parserConfigForm.parserType}
            onChange={handleParserConfigChange}
            fullWidth
          >
            <MenuItem value="MIR">MIR</MenuItem>
            <MenuItem value="COSMED">COSMED</MenuItem>
            <MenuItem value="JAEGER">JAEGER</MenuItem>
            <MenuItem value="MAICO">MAICO</MenuItem>
            <MenuItem value="INTERACOUSTICS">INTERACOUSTICS</MenuItem>
            <MenuItem value="WELCHALLYN">WELCHALLYN</MenuItem>
            <MenuItem value="CSV">CSV</MenuItem>
            <MenuItem value="JSON">JSON</MenuItem>
            <MenuItem value="HL7">HL7</MenuItem>
            <MenuItem value="Custom">Custom</MenuItem>
          </Select>
          <TextField
            label="Configurazione (JSON)"
            name="configurationJson"
            value={parserConfigForm.configurationJson}
            onChange={handleParserConfigChange}
            fullWidth
            multiline
            rows={4}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={parserConfigForm.isDefault}
                onChange={(e) => setParserConfigForm({ ...parserConfigForm, isDefault: e.target.checked })}
                color="primary"
              />
            }
            label="Predefinito"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={parserConfigForm.isActive}
                onChange={(e) => setParserConfigForm({ ...parserConfigForm, isActive: e.target.checked })}
                color="primary"
              />
            }
            label="Attivo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseParserConfigDialog}>Annulla</Button>
          <Button variant="contained" color="primary" onClick={handleSaveParserConfig}>
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceCenter;