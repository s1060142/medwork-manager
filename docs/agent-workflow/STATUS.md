# WORKFLOW STATUS

Current Status:
READY_FOR_QA

Task:
Sostituzione Frasi Rapide con Checklist Anamnestica Dinamica per Mansione (D.Lgs. 81/08 Allegato 3A)

Last Updated:
2026-09-27 13:41

Owner:
Hermes (QA Lead)

Next Action:
QA Browser Verification:
1. Verifica Login `doctor` / `Doctor123!` su tenant `default`
2. Verifica risposta 200 su `/api/master-data/employees` e caricamento dati in `WorkersCenter` (tabella, metriche, filtri e Quick Actions)
3. Verifica apertura modale "Nuovo Lavoratore" (form unificato [WorkerFormDialog.jsx](file:///c:/github/medwork-manager/medwork-frontend/src/components/WorkerFormDialog.jsx))
4. Verifica apertura `MedicalVisitStepper` (Nuova Visita Medica) e presenza della Checklist Anamnestica per Mansione & Rischi (VDT, MMC, Rumore, Chimico, Notturno, Guida, Generale)
5. Verifica auto-suggerimento mansione del lavoratore e funzionamento del pulsante "Applica check standard" e toggles dei singoli check
6. Verifica assenza di voci duplicate o orfane di "Frasi Tipo" nei moduli di navigazione
7. Verifica navigazione a `Gestione Aziende` (nessuna riga di tab duplicata)



