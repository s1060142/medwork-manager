using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Tipo di strumento diagnostico supportato
/// </summary>
public enum DeviceType
{
    Spirometer = 1,
    Audiometer = 2,
    ECG = 3,
    VisionTester = 4,
    DrugTestReader = 5,
    BloodPressureMonitor = 6,
    PulseOximeter = 7,
    Other = 99
}

/// <summary>
/// Configurazione strumento diagnostico connesso via USB/Seriale/Bluetooth
/// </summary>
public class DiagnosticDevice
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public DeviceType Type { get; set; }

    [StringLength(50)]
    public string? Model { get; set; }

    [StringLength(50)]
    public string? Manufacturer { get; set; }

    [StringLength(50)]
    public string? SerialNumber { get; set; }

    [StringLength(50)]
    public string? FirmwareVersion { get; set; }

    /// <summary>
    /// Tipo connessione: USB, Serial, Bluetooth, Network
    /// </summary>
    [StringLength(20)]
    public string ConnectionType { get; set; } = "USB";

    /// <summary>
    /// Porta o indirizzo (es: COM3, /dev/ttyUSB0, 192.168.1.100:5000)
    /// </summary>
    [StringLength(100)]
    public string? ConnectionAddress { get; set; }

    /// <summary>
    /// Configurazione specifica dispositivo (JSON)
    /// </summary>
    public string? ConfigurationJson { get; set; }

    /// <summary>
    /// Parser da usare per interpretare l'output
    /// </summary>
    [StringLength(50)]
    public string ParserType { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public ICollection<DeviceExamLog> ExamLogs { get; set; } = new List<DeviceExamLog>();
}

/// <summary>
/// Log esami eseguiti tramite strumento
/// </summary>
public class DeviceExamLog
{
    public int Id { get; set; }

    public int DeviceId { get; set; }
    public DiagnosticDevice? Device { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int ExamTypeId { get; set; }
    public ExamType? ExamType { get; set; }

    public DateTime ExamDateTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Dati grezzi ricevuti dallo strumento
    /// </summary>
    public string? RawData { get; set; }

    /// <summary>
    /// Dati parsati (JSON)
    /// </summary>
    public string? ParsedDataJson { get; set; }

    /// <summary>
    /// Stato: Success, Error, Partial
    /// </summary>
    [StringLength(20)]
    public string Status { get; set; } = "Success";

    /// <summary>
    /// Messaggio errore se presente
    /// </summary>
    [StringLength(1000)]
    public string? ErrorMessage { get; set; }

    public int? CreatedByUserId { get; set; }
}

/// <summary>
/// Configurazione parser per tipo dispositivo
/// </summary>
public class DeviceParserConfig
{
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;

    public DeviceType DeviceType { get; set; }

    [StringLength(100)]
    public string? Manufacturer { get; set; }

    [StringLength(50)]
    public string? Model { get; set; }

    /// <summary>
    /// Tipo parser: HL7, CSV, JSON, Custom, MIR, COSMED, JAEGER, MAICO, INTERACOUSTICS, WELCHALLYN, etc.
    /// </summary>
    [Required]
    [StringLength(50)]
    public string ParserType { get; set; } = string.Empty;

    /// <summary>
    /// Configurazione parser (delimitatori, encoding, mapping campi, ecc.)
    /// </summary>
    public string? ConfigurationJson { get; set; }

    public bool IsDefault { get; set; } = false;
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Dati spirometria parsati
/// </summary>
public class SpirometryData
{
    public double? FVC { get; set; }           // Forced Vital Capacity (L)
    public double? FEV1 { get; set; }          // Forced Expiratory Volume in 1 sec (L)
    public double? FEV1FVC { get; set; }       // Ratio %
    public double? PEF { get; set; }           // Peak Expiratory Flow (L/s)
    public double? FEF2575 { get; set; }       // Forced Expiratory Flow 25-75% (L/s)
    public double? FEF25 { get; set; }
    public double? FEF50 { get; set; }
    public double? FEF75 { get; set; }
    public double? FET { get; set; }           // Forced Expiratory Time (s)
    public double? FIVC { get; set; }          // Forced Inspiratory Vital Capacity (L)
    public double? FIF50 { get; set; }
    public double? PIF { get; set; }           // Peak Inspiratory Flow (L/s)
    public double? MVV { get; set; }           // Maximum Voluntary Ventilation (L/min)
    public int? QualityGrade { get; set; }     // ATS/ERS quality grade (A-F)
    public string? Interpretation { get; set; }
    public string? FlowVolumeCurveBase64 { get; set; } // Curve flow-volume encoded
}

/// <summary>
/// Dati audiometria parsati
/// </summary>
public class AudiometryData
{
    // Orecchio destro - via aerea
    public int? R_125 { get; set; }
    public int? R_250 { get; set; }
    public int? R_500 { get; set; }
    public int? R_1000 { get; set; }
    public int? R_2000 { get; set; }
    public int? R_3000 { get; set; }
    public int? R_4000 { get; set; }
    public int? R_6000 { get; set; }
    public int? R_8000 { get; set; }

    // Orecchio sinistro - via aerea
    public int? L_125 { get; set; }
    public int? L_250 { get; set; }
    public int? L_500 { get; set; }
    public int? L_1000 { get; set; }
    public int? L_2000 { get; set; }
    public int? L_3000 { get; set; }
    public int? L_4000 { get; set; }
    public int? L_6000 { get; set; }
    public int? L_8000 { get; set; }

    // Via ossea (opzionale)
    public int? R_BC_250 { get; set; }
    public int? R_BC_500 { get; set; }
    public int? R_BC_1000 { get; set; }
    public int? R_BC_2000 { get; set; }
    public int? R_BC_4000 { get; set; }
    public int? L_BC_250 { get; set; }
    public int? L_BC_500 { get; set; }
    public int? L_BC_1000 { get; set; }
    public int? L_BC_2000 { get; set; }
    public int? L_BC_4000 { get; set; }

    // Masking
    public bool? R_Masked { get; set; }
    public bool? L_Masked { get; set; }

    // Speech audiometry
    public int? R_SRT { get; set; } // Speech Reception Threshold
    public int? R_SDS { get; set; } // Speech Discrimination Score %
    public int? L_SRT { get; set; }
    public int? L_SDS { get; set; }

    public string? Classification { get; set; } // Normal, Conductive, Sensorineural, Mixed
    public string? Notes { get; set; }
}

/// <summary>
/// Dati ECG parsati
/// </summary>
public class ECGData
{
    public int HeartRate { get; set; }          // bpm
    public int PRInterval { get; set; }         // ms
    public int QRSDuration { get; set; }        // ms
    public int QTInterval { get; set; }         // ms
    public int QTCorrected { get; set; }        // ms (Bazett)
    public int PAxis { get; set; }              // degrees
    public int QRSAxis { get; set; }            // degrees
    public int TAxis { get; set; }              // degrees

    // Amplitude (mV)
    public double? PAmplitude { get; set; }
    public double? QAmplitude { get; set; }
    public double? RAmplitude { get; set; }
    public double? SAmplitude { get; set; }
    public double? TAmplitude { get; set; }

    public string? Rhythm { get; set; }         // Sinus, AFib, etc.
    public string? Interpretation { get; set; } // Automated interpretation
    public string? MinnesotaCode { get; set; }  // Minnesota code classification
    public string? WaveformBase64 { get; set; } // 12-lead waveform encoded
    public string? Notes { get; set; }
}

/// <summary>
/// Dati test visivo parsati
/// </summary>
public class VisionTestData
{
    // Acutezza visiva (Snellen/LogMAR)
    public string? R_Uncorrected { get; set; }  // es: "10/10", "0.0"
    public string? R_Corrected { get; set; }
    public string? L_Uncorrected { get; set; }
    public string? L_Corrected { get; set; }
    public string? Binocular_Uncorrected { get; set; }
    public string? Binocular_Corrected { get; set; }

    // Visione da vicino
    public string? R_Near_Uncorrected { get; set; }
    public string? R_Near_Corrected { get; set; }
    public string? L_Near_Uncorrected { get; set; }
    public string? L_Near_Corrected { get; set; }

    // Campimetria / Campi visivi
    public string? VisualFieldTest { get; set; } // Humphrey, Goldmann, etc.
    public string? R_VisualFieldResult { get; set; }
    public string? L_VisualFieldResult { get; set; }
    public double? R_MD { get; set; } // Mean Deviation
    public double? L_MD { get; set; }
    public double? R_PSD { get; set; } // Pattern Standard Deviation
    public double? L_PSD { get; set; }

    // Visione colori
    public string? ColorVisionTest { get; set; } // Ishihara, Farnsworth D15, etc.
    public string? R_ColorVision { get; set; }
    public string? L_ColorVision { get; set; }

    // Stereopsi / Visione binoculare
    public string? StereopsisTest { get; set; } // Titmus, Lang, etc.
    public string? StereopsisResult { get; set; } // secondi d'arco

    // Rifrazione (se autorefrattometro)
    public string? R_Sphere { get; set; }
    public string? R_Cylinder { get; set; }
    public string? R_Axis { get; set; }
    public string? L_Sphere { get; set; }
    public string? L_Cylinder { get; set; }
    public string? L_Axis { get; set; }
    public string? Add { get; set; } // Addizione per presbiopia

    public string? Notes { get; set; }
}

/// <summary>
/// Dati drug test parsati
/// </summary>
public class DrugTestData
{
    public DateTime TestDateTime { get; set; }
    public string? TestType { get; set; } // Urine, Saliva, Hair, Sweat
    public string? DeviceModel { get; set; }
    public string? LotNumber { get; set; }
    public string? OperatorId { get; set; }

    // Risultati per sostanza (Negativo/Positivo + concentrazione se quantitativo)
    public DrugTestResult? THC { get; set; }        // Cannabis
    public DrugTestResult? COC { get; set; }        // Cocaina
    public DrugTestResult? OPI { get; set; }        // Oppiacei
    public DrugTestResult? AMP { get; set; }        // Amfetamine
    public DrugTestResult? MET { get; set; }        // Metanfetamine
    public DrugTestResult? BZO { get; set; }        // Benzodiazepine
    public DrugTestResult? BAR { get; set; }        // Barbiturici
    public DrugTestResult? MTD { get; set; }        // Metadone
    public DrugTestResult? TCA { get; set; }        // Triciclici
    public DrugTestResult? PCP { get; set; }        // PCP
    public DrugTestResult? BUP { get; set; }        // Buprenorfina
    public DrugTestResult? OXY { get; set; }        // Ossicodone
    public DrugTestResult? FEN { get; set; }        // Fentanil
    public DrugTestResult? ALCOHOL { get; set; }    // Alcol
    public DrugTestResult? ETG { get; set; }        // EtG (marker alcol)
    public DrugTestResult? COTININE { get; set; }   // Cotinina (nicotina)

    // Controlli
    public bool? TemperatureOK { get; set; }
    public bool? CreatinineOK { get; set; }
    public bool? pH_OK { get; set; }
    public bool? AdulterantOK { get; set; }

    public string? OverallResult { get; set; } // Negative, Positive, Invalid
    public string? Notes { get; set; }
}

public class DrugTestResult
{
    public bool IsPositive { get; set; }
    public double? Concentration { get; set; } // ng/mL o mcg/mL
    public string? Unit { get; set; }
    public string? Cutoff { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Dati pressione arteriosa parsati
/// </summary>
public class BloodPressureData
{
    public int Systolic { get; set; }
    public int Diastolic { get; set; }
    public int HeartRate { get; set; }
    public string? IrregularHeartbeat { get; set; }
    public string? Position { get; set; } // Sitting, Standing, Supine
    public string? Arm { get; set; } // Right, Left
    public int? MAP { get; set; } // Mean Arterial Pressure
    public int? PP { get; set; } // Pulse Pressure
    public string? Classification { get; set; } // Normal, Elevated, Stage 1, Stage 2, Crisis
    public string? Notes { get; set; }
}

/// <summary>
/// Dati saturimetro parsati
/// </summary>
public class PulseOximetryData
{
    public int SpO2 { get; set; }           // %
    public int HeartRate { get; set; }      // bpm
    public double? PI { get; set; }         // Perfusion Index %
    public string? WaveformQuality { get; set; }
    public string? Notes { get; set; }
}