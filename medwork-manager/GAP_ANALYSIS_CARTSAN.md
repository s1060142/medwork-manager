# Gap Analysis: MedWork Manager vs Cartsan Suite

## Executive Summary
Cartsan is the market leader in Italy for Medicina del Lavoro software (2,030 clients, 8,120 active users, 10M+ visits). MedWork Manager has solid core domain models but lacks key integration, billing, and portal features that define Cartsan's competitive advantage.

---

## 1. Core Modules Comparison

| Module | Cartsan | MedWork | Gap |
|--------|---------|---------|-----|
| **Cartella Sanitaria e di Rischio (Allegato 3A)** | ✅ Complete, dematerialized | ✅ Complete (MedicalRecord, MedicalVisit, VisitExam, Anamnesis, etc.) | ✅ Minor |
| **Scadenzario Visite e Accertamenti** | ✅ Visite, accertamenti, sopralluoghi, riunioni, nomine | ✅ ScheduledExam, MedicalVisit | ⚠️ Missing: sopralluoghi, riunioni, nomine; export formats |
| **Agende e Pianificazioni** | ✅ User agendas, availability, email convocations | ✅ DoctorAvailability, ScheduledExam | ⚠️ Missing: user agendas, email convocations |
| **Statistiche, Relazioni, Allegato 3B** | ✅ Graphs, tables, email giudizi, Allegato 3B | ✅ ReportsCenter, PortalController 3B endpoint | ⚠️ Missing: charts/graphs, email giudizi, full 3B |
| **Fatturazione Elettronica** | ✅ XML, SDI, approval chain | ❌ Missing | 🔴 **Critical Gap** |
| **Listini, Preventivi, Contabilità** | ✅ Price lists per company, quotes, invoices, credit notes | ❌ Missing | 🔴 **Critical Gap** |
| **Integrazioni Strumenti USB** | ✅ Spirometro, Audiometro, ECG, VisioTest, Drug Test | ❌ Missing | 🔴 **Critical Gap** |
| **Firma Grafometrica (FEA)** | ✅ Advanced electronic signature on PDF | ❌ Missing | 🔴 **Critical Gap** |
| **Telerefertazione ECG** | ✅ Cardiologist network, 24-48h signed reports | ❌ Missing | 🔴 **Critical Gap** |

---

## 2. Integrations Comparison

| Integration | Cartsan | MedWork | Gap |
|-------------|---------|---------|-----|
| **LIS (Laboratory Information System)** | ✅ Auto-acceptance, labels, auto-import referti | ❌ Missing | 🔴 **Critical Gap** |
| **HR Systems** | ✅ Auto-sync assunzioni, dimissioni, assenze, trasferimenti | ❌ Missing | 🔴 **Critical Gap** |
| **Safety/Risk Management** | ✅ Sync with safety systems | ❌ Missing | 🔴 **Critical Gap** |
| **HL7** | ✅ Hospital/polyclinic integration | ❌ Missing | 🟡 Medium Gap |
| **Accounting Software** | ✅ Integration with major Italian accounting | ❌ Missing | 🟡 Medium Gap |

---

## 3. Portal Features Comparison

### Portale Aziende
| Feature | Cartsan | MedWork | Gap |
|---------|---------|---------|-----|
| Gestione anagrafiche lavoratori | ✅ | ✅ (via CompanyPortal) | ✅ |
| Monitoraggio sopralluoghi | ✅ | ❌ Missing | 🟡 Medium |
| Visite mediche e scadenze | ✅ | ✅ Basic dashboard | ✅ Minor |
| Download giudizi idoneità PDF | ✅ | ✅ (via portal) | ✅ |
| Statistiche aggregate + grafici | ✅ | ❌ Missing charts | 🟡 Medium |
| Fattori rischio evoluzione temporale | ✅ | ❌ Missing | 🟡 Medium |

### Portale Lavoratori
| Feature | Cartsan | MedWork | Gap |
|---------|---------|---------|-----|
| Fascicolo sanitario elettronico personale | ✅ | ✅ WorkerPortal | ✅ |
| Visite mediche con data, scadenza, prescrizioni, giudizio | ✅ | ✅ | ✅ |
| Download referti e documentazione | ✅ | ❌ Limited | 🟡 Medium |
| Notifiche scadenze | ⚠️ | ❌ Missing | 🟡 Medium |

---

## 4. Technical/Compliance Comparison

| Aspect | Cartsan | MedWork | Gap |
|--------|---------|---------|-----|
| **ISO 27001 certified** | ✅ (Web version only) | ❌ | 🟡 Medium |
| **D.Lgs. 81/08 compliance** | ✅ Full | ✅ Core models | ✅ |
| **GDPR Art.9 clinical data separation** | ✅ | ✅ (MedicalRecord Doctor-only) | ✅ |
| **Allegato 3A (Cartella sanitaria/rischio)** | ✅ | ✅ | ✅ |
| **Allegato 3B generation** | ✅ Complete | ⚠️ Partial | 🟡 Medium |
| **Windows/Mac/Linux** | ✅ All | ✅ .NET 8 + React | ✅ |
| **Stand-alone/Web/Offline client** | ✅ All modes | ✅ Web only | 🟡 Medium |

---

## 5. Priority Implementation Plan

### 🔴 CRITICAL (Revenue/Compliance blockers)
1. **Fatturazione Elettronica (SDI XML)** - Required for Italian market
2. **Listini, Preventivi, Contabilità** - Core business workflow
3. **Integrazione Strumenti USB** - Major differentiator (spiro, audio, ECG, visio, drug)
4. **Firma Grafometrica (FEA)** - Legal requirement for document signing
5. **Telerefertazione ECG** - High-value service, recurring revenue

### 🟡 HIGH (Competitive parity)
6. **LIS Integration** - Lab workflow automation
7. **HR System Integration** - Auto employee lifecycle sync
8. **Safety/Risk Management Integration** - Cross-selling opportunity
9. **Agende/Pianificazioni + Email Convocazioni** - Operational efficiency
10. **Statistiche con Grafici + Allegato 3B Completo** - Compliance reporting
11. **Alert automatici scadenze alle aziende** - Proactive service
12. **Sopralluoghi, Riunioni, Nomine** - Complete scadenzario
13. **Export multipli (PDF/Excel/CSV)** - Data portability

### 🟢 MEDIUM (Enterprise features)
14. **HL7 Integration** - Hospital market
15. **Portale Aziende/Lavoratori enhancements** - Self-service
16. **ISO 27001 alignment** - Enterprise sales
17. **Client offline/stand-alone modes** - Deployment flexibility

---

## 6. MedWork Strengths (Already Better)
- ✅ Modern stack (.NET 8/10, React, MUI)
- ✅ Clean domain separation (clinical vs fitness)
- ✅ GDPR Art.9 compliance by design
- ✅ QuestPDF with embedded fonts (headless Docker ready)
- ✅ FluentValidation throughout
- ✅ AuditLog on separate DbContext
- ✅ Role-based access (Doctor, Secretary, RSPP, Employer, Worker, Admin)
- ✅ Multi-tenant context switching (Company/Branch)
- ✅ Comprehensive test suite (62 tests passing)
- ✅ CI/CD ready

---

## 7. Estimated Effort

| Priority | Features | Est. Dev Weeks |
|----------|----------|----------------|
| Critical | 5 features | 8-12 weeks |
| High | 8 features | 10-16 weeks |
| Medium | 4 features | 6-10 weeks |
| **Total** | **17 features** | **24-38 weeks** |

---

*Analysis Date: 2025-07-29*
*Source: Cartsan website + MedWork codebase review*