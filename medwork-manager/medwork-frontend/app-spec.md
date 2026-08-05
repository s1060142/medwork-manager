# MedWork Manager - Application Specification

## Overview
MedWork Manager is a comprehensive medical work management platform designed for occupational health services. The application follows a modular structure with distinct sections for different operational areas.

## Main Navigation
### Sidebar Menu
*   **Home**: Main dashboard with activity overview.
*   **Operatori sanitari**: Healthcare professionals management.
*   **Aziende**: Company and worker management.
*   **Lavoratori**: Worker details, episodes, and status tracking.
*   **Protocolli**: Protocol management and documentation.
*   **Scadenze e agende**: Schedules, booking, and agenda management.
*   **Fatturazione**: Invoicing, credit notes, quotes, and billing system.
*   **Audit**: Audit functionality.
*   **Cataloghi**: Catalog management.
*   **Strumenti**: Tools and utilities (e.g., Relazione sanitaria, Allegato 3B, Sincronizzazione dati).
*   **Impostazioni**: Settings, user permissions, and configuration.
*   **Reportistica**: Reporting and analytics.
*   **Ricerca**: Search functionality.
*   **Guida**: Help and documentation.
*   **Feedback**: Feedback collection.
*   **Dati sensibili attivi**: Indicator for sensitive data processing at the bottom of the menu.

## Key Modules

### Dashboard (Home)
*   Welcome message indicating the user and role, such as: "Benvenuto in Medwork, Segreteria Hub".
*   User information panel showing the account type (e.g., Azienda), the specific role (e.g., Segreteria, Medico competente), last access timestamp, and IP address.
*   Activity tracking section ("Le tue attività") featuring a dropdown menu to select categories like SCADENZE, FATTURE, PROTOCOLLI.
*   Filterable activities include "Visite ed accertamenti", "Vaccinazioni", "Nomine", "Prestazioni da fatturare", and "Prestazioni senza listino".
*   Activity list table displaying dates, workers, companies, and associated protocols or episodes.

### Aziende (Companies) & Lavoratori (Workers)
*   **Header Navigation**: A horizontal tab bar allows switching between views like Generali, Luoghi, Mansioni, Lavoratori, Organigramma, Nomine, Prestazioni, Fatturazione, Allegati, Risorse umane, and Storico.
*   **Company Settings (Generali)**: Contains billing data modules ("Dati per fatturazione") including SDI code, IBAN, bank name, default payment methods (e.g., CC - Carta di credito), payment timing (e.g., 30gg fine mese), and intent declarations.
*   **Statistics Dashboard (Workers Tab)**: Dedicated summary section displaying counters for "Lavoratori idonei", "Lavoratori parzialmente idonei", "Lavoratori non idonei", and "Lavoratori senza idoneità".
*   **Worker Management View**: A detailed table listing employees with columns for Cognome, Nome, Codice fiscale, Mansione, Stato idoneità (with color-coded dots), Data ultimo giudizio, and Stato lavorativo.
*   **Worker Interface Customization**: Users can customize the worker's "Generali" tab by adding custom fields, specifying the type, label, size (e.g., 100%), and setting them as mandatory.
*   **Worker Episodes (Episodi)**: Workers have an "Episodi" tab tracking assigned protocols (e.g., Protocollo Unificato) and individual exams (e.g., Visio Test, Visita Medica) with relative states like "Concluso" (green dot) or "Scaduto" (red dot).

### Scadenze e Agende (Schedules & Calendars)
*   **Scadenzario (Schedules)**: Advanced tracking tables for deadlines, switchable between "Aziende" and "Lavoratori" views.
    *   Displays a monthly calendar highlighting days with deadlines and a pie chart summarizing total exams (e.g., Scaduto 78.1%, Programmato 18.8%, Erogato 3.1%).
    *   Lists can be filtered by state (e.g., "Scaduto e in scadenza") and expanded to show specific worker exams and expiration dates.
*   **Agenda Appuntamenti**: Weekly or daily calendar views using color-coded blocks mapped to different companies or healthcare operators (via a bottom legend).
    *   Appointments feature visual states: "Non disponibile" (dashed graphic), "Agenda opzionata" (dashed border), or "Bozza" (fine dashed border).
    *   Tooltips display appointment notes with text limits (up to four lines) and allow editing or deleting.
*   **Prenotazioni & Opzioni**: Interface to book or option an agenda slot, specifying the location, date, time, and assigning specific exams to specific workers.

### Cartella Sanitaria & Refertazione (Health Records & Reporting)
*   **Referti Compilation**: Modals for entering detailed exam data, such as the "Esame Audiometrico" with interactive tonal test graphs tracking hearing levels (dB) across frequencies (Hz) for both ears.
*   **Visita Medica**: Tracks booking/evaluation dates, the competent doctor, visit type (e.g., Preventiva), outcomes (e.g., Normalità clinica), and specific job risks (e.g., Videoterminali).
*   **Firme (Signatures)**: Integrated support for validating documents with "Firma digitale" (Digital Signature) and "Firma grafometrica" (Graphometric Signature via connected devices), appending visual badges to signed PDFs.
*   **Esporta cartella sanitaria**: Export tool with options for "Tutti i referti" or specific date ranges. It includes checkboxes to bundle attachments, delivered services, and signed privacy policies.
*   **Customization**: The reporting interfaces (e.g., for eye exams) can be customized by adding specific mandatory fields alongside standard anamnesis sections.

### Gestione Protocolli (Protocol Management)
*   **Protocolli di mansione**: Ability to define protocols (e.g., "Protocollo per Videoterminalista") linked to specific workplaces and containing a list of exams with defined periodicities (e.g., "5A 50 2A").
*   **Application**: Protocols can be applied in bulk to workers of a specific company, with options to set expiration dates automatically or based on the start date of the job role.
*   **Personalization**: Individual worker protocols can be adjusted by adding specific extra exams with custom periodicities (e.g., "1A").

### Fatturazione (Invoicing & Billing)
*   **Creazione Fattura Multi-azienda**: Multi-step wizard (Benvenuto, Linea, Dati da fatturare, Note, Riepilogo) to generate invoices. The summary step shows the invoice number, total items, total amount (IE), and date, with options to save as a draft or finalize.
*   **Note di Credito**: A similar wizard workflow to select a client (e.g., Dilaxia S.p.a.), identify a specific reference invoice, and specify the items to refund.
*   **Preventivi (Quotes)**: Itemized lists detailing specific services (e.g., Visita Medica, Visio Test) with quantities, unit prices, VAT codes, manual discounts, and calculated totals.
*   **Listini Aziendali**: Directory of configured price lists (e.g., Aibox centrale, Company esterne, Listino Dilaxia) assigned to specific company locations.
*   **Parcella del Medico**: Tracks pending ("Da saldare") and cleared payments owed to healthcare operators based on the number of executed services.

### Strumenti & Modalità Offline (Tools & Offline Mode)
*   **Modalità Offline**: The application supports an offline working mode. 
    *   A connection status indicator alerts the user (e.g., "Connessione: Offline" in orange).
    *   A popup notifies the user immediately if the internet connection is lost, suggesting to reload the page and switch to offline mode.
    *   The homepage displays the timestamp of the last downloaded appointments.
*   **Sincronizza Dati**: A synchronization tool to review and sync offline-compiled data once reconnected. It highlights conflicts (red icon), warnings (yellow icon), or data ready to sync (green icon).
*   **Relazione Sanitaria**: Generation tool filterable by company and date, with options to group all data by company branch. Users can explicitly exclude specific exams.
*   **Allegato 3B**: Export tool available in Excel or XML formats, groupable by Company or Doctor, filtering by specific workplaces and years.
*   **Invia accertamenti al laboratorio**: Modals to dispatch specific booked exams directly to integrated external laboratories.

### Reportistica (Reporting)
*   **Analytics Dashboard**: Visual charts tracking outcomes.
    *   Bar charts showing the historical volume trend of judgments over the years (e.g., 2015-2024).
    *   Donut charts displaying the distribution of fitness outcomes: Idoneo (e.g., 89.2%), Idoneo con limitazioni e prescrizioni (e.g., 6.5%), Idoneo con limitazioni, and Non idoneo temporaneo.
*   **Prestazioni Eseguite**: Detailed tabular reports tracking performed services (e.g., Sopralluogo MC), quantities, companies, locations, operators, and their current billing status (Fatturato: No/Yes).

### Impostazioni & Utenti (Settings & Users)
*   **Utenti (User Management)**: Profiles for system operators (e.g., Mauro Bertasi) detailing active status, username, and assigned roles (e.g., Operatore sanitario).
    *   **Firme**: Configuration for external signature providers (e.g., Yousign via Email OTP).
    *   **Visibilità**: Granular control over which specific companies, buildings, levels, and rooms an operator can access.
    *   **Permessi**: A detailed permission matrix granting or denying "Visualizzazione" (View) and "Modifica" (Edit) rights across individual modules (e.g., Aziende, Protocolli, Fatturazione, Audit).
*   **Sedi**: Configuration list of physical locations tied to the system, detailing addresses and municipalities (e.g., Centro medico Cavour, Villa Stuart).
*   **Disponibilità Operatori**: Operator scheduling matrix mapping available days, shift times (e.g., 08:00-13:00, 13:00-18:00), and logging extraordinary presences or absences.

## Key Features
1. **Multi-tenant Architecture**: Supports multiple companies with separate data, locations, and workflows.
2. **Role-based & Granular Access**: Different roles with appropriate permissions, customizable down to view/edit rights per module and physical location visibility.
3. **Offline Resilience**: Dedicated offline mode with data caching and a robust synchronization manager for conflict resolution.
4. **Comprehensive Financials**: Multi-step processes for invoicing, credit notes, quotes, and operator payroll (parcelle).
5. **Calendar Integration**: Visual calendars for scheduling, options, and advanced deadline tracking (Scadenzario) with statistical breakdowns.
6. **Advanced Document Management**: Protocol assignment, health record compilation, and native support for digital and graphometric signatures.
7. **Reporting & Analytics**: Comprehensive reporting with visual charts and detailed operational tabular data.

## Technical Notes
- The application follows a clean, modern UI design with a consistent navigation pattern.
- Uses a light color scheme with blue accents for primary actions.
- Responsive layout with clear section separation.
- Extensive use of checkboxes, dropdowns, modal popups, and date pickers for input.
- Detailed status indicators (badges and colored dots) for worker readiness, appointment states, and synchronization statuses.
- Comprehensive filtering and search functionality across all major data tables.