# MedWork Manager - Application Specification

## Overview

MedWork Manager is a comprehensive medical work management platform designed for occupational health services. The application follows a modular structure with distinct sections for different operational areas.

## Main Navigation

### Sidebar Menu
- **Home**: Main dashboard with activity overview
- **Operatori sanitari**: Healthcare professionals management
- **Aziende**: Company and worker management
- **Lavoratori**: Worker details and status tracking
- **Protocolli**: Protocol management and documentation
- **Scadenze e agende**: Schedules and agenda management
- **Fatturazione**: Invoicing and billing system
- **Audit**: Audit functionality
- **Cataloghi**: Catalog management
- **Strumenti**: Tools and utilities
- **Impostazioni**: Settings and configuration
- **Reportistica**: Reporting and analytics
- **Ricerca**: Search functionality
- **Guida**: Help and documentation
- **Feedback**: Feedback collection

## Key Modules

### Dashboard (Home)
- Welcome message: "Benvenuto in Medwork, Segreteria Hub"
- User information panel showing:
  - Account type: Azienda
  - Role: Segreteria
  - Last access: Today at 12:15:33
  - Internet address: 127.0.0.1
- Activity tracking section ("Le tue attività") with:
  - Categories: SCADENZE, FATTURE, PROTOCOLLI
  - Filterable activities: "Visite ed accertamenti", "Vaccinazioni", "Nomine", "Prestazioni da fatturare", "Prestazioni senza listino"
  - Activity list with dates, companies, and episodes

### Aziende (Companies)
- Company hierarchy navigation
- Worker categories displayed as statistics:
  - Lavoratori idonei: 2
  - Lavoratori parzialmente idonei: 0
  - Lavoratori non idonei: 0
  - Lavoratori senza idoneità: 3
- Worker list with detailed information:
  - Columns: Cognome, Nome, Codice fiscale, Mansione, Stato idoneità, Data ultimo giudizio, Stato lavorativo
  - Worker status indicators (Senza idoneità, Idoneo, Attivo)
  - Search functionality and CSV export option
  - Pagination (1-5 of 5)

### Fatturazione (Invoicing)
- Multi-company invoice creation workflow with 5 steps:
  1. Benvenuto (Welcome)
  2. Linea (Line)
  3. Dati da fatturare (Invoice data)
  4. Note (Notes)
  5. Riepilogo (Summary)
- Invoice preview showing:
  - Invoice number (7)
  - Number of invoice items (2491)
  - Total amount (86523,48 €)
  - Invoice date (29/09/2021)
- Action buttons: "Indietro" (Back), "Salva come bozza" (Save as draft), "Crea fattura" (Create invoice)

### Listino (Company Lists)
- List of companies with addresses and locations:
  - Albox centrale (Lago)
  - Company esterne (2 luoghi)
  - Listino dedicato (Electron Service SAS)
  - Listino Dilaxia (2 luoghi)
  - Listino esterno (NSI Nier Soluzioni Informatiche > Sede API)
  - Listino Migani (Migani Home)
  - Listino per Mario Bianchi Srl (Mario Bianchi Srl)
  - Listino principale (AZ.1000)
  - NSI sede principale (NSI Nier Soluzioni Informatiche > Sede principale NSI)
  - Sede separata Accenture (Accenture S.p.A. > 02)
- Pagination showing "1-10 di 12"

### Disponibilità (Availability)
- Operator availability management with:
  - Date range selection (01/11/2024 to 30/11/2024)
  - Weekly calendar view with time slots
  - Checkbox selection for working days (Lunedì, Martedì, Mercoledì, etc.)
  - Time slot indicators (08:00-13:00, 13:00-18:00)
  - Extraordinary presence/absence options
  - Historical availability tracking

### Invita accredamenti al laboratorio
- Laboratory accreditation request interface with:
  - "Invia accredamenti al laboratorio" header
  - Instruction text: "Indica a quale laboratorio vuoi inviare l'accreditamento selezionato."
  - Laboratory dropdown selection
  - "Annulla" and "Invia" buttons

### Esporta cartella sanitaria
- Health record export functionality with:
  - Options: "Tutti i referti" (All reports) or "Scegli il periodo" (Choose period)
  - Date range selection fields
  - Checkboxes for including:
    - Allegati dei referti (Attachments)
    - Prestazioni erogate e refertate (Delivered and reported services)
    - Informativa privacy firmata (Signed privacy information)
  - "Annulla" and "Procedi" buttons

### Reportistica (Reporting)
- Analytics dashboard with:
  - Yearly trend charts showing activity over time (2015-2024)
  - Distribution charts for worker status:
    - Idoneo (89.2%)
    - Idoneo con limitazioni e prescrizioni (6.5%)
    - Idoneo con limitazioni (small portion)
    - Non idoneo temporaneo (small portion)
  - Detailed reports by company and worker
  - Export functionality for reports

### Scadenzario (Schedules)
- Calendar view for deadline tracking with:
  - Monthly calendar display (October 2024 shown)
  - Accreditation tracking with 32 total items
  - Pie chart showing accreditation status:
    - Scaduto (78.1%)
    - Programmato (18.8%)
    - Erogato (3.1%)
  - Company-specific accreditation lists with counts and dependencies

## Key Features

1. **Multi-tenant Architecture**: Supports multiple companies with separate data and workflows
2. **Role-based Access**: Different roles with appropriate permissions (e.g., Segreteria, Operatori sanitari)
3. **Workflow Management**: Multi-step processes for invoicing and other operations
4. **Calendar Integration**: Visual calendar for scheduling and deadline tracking
5. **Reporting & Analytics**: Comprehensive reporting with charts and data visualization
6. **Document Management**: Protocol and health record management with export capabilities
7. **User Activity Tracking**: Dashboard showing user activities and pending tasks

## Technical Notes

- The application follows a clean, modern UI design with a consistent navigation pattern
- Uses a light color scheme with blue accents for primary actions
- Responsive layout with clear section separation
- Extensive use of checkboxes, dropdowns, and date pickers for input
- Detailed status indicators for worker and invoice statuses
- Comprehensive filtering and search functionality across modules

## Implementation Considerations

- Ensure proper synchronization between calendar views and deadline tracking
- Implement robust validation for invoice data and date ranges
- Maintain consistency in company and worker data across all modules
- Provide clear visual indicators for status changes (e.g., "Attivo", "Senza idoneità")
- Support multi-company workflows with clear separation of data and processes