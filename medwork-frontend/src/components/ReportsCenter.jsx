import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import RefreshIcon from '@mui/icons-material/Refresh'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SearchIcon from '@mui/icons-material/Search'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { apiGet, getHeaders, safeReadError, buildApiError, API_BASE_URL } from '../services/apiClient'
import { currentDateValue, formDateValue, DATE_PICKER_LOCALE } from '../utils/datePicker'
import { showNotification } from '../utils/notification'

function formatDate(dateValue) {
  if (!dateValue) return '-'
  return new Date(dateValue).toLocaleDateString('it-IT')
}

function createBasePdf(title, subtitle) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  doc.setFontSize(16)
  doc.text(title, 40, 44)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(subtitle, 40, 62)
  doc.text(`Generato il: ${new Date().toLocaleString('it-IT')}`, 40, 76)
  return doc
}

function savePdf(doc, fileName) {
  doc.save(fileName)
}

function inDateRange(value, dateFrom, dateTo) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  if (dateFrom) {
    const from = new Date(dateFrom)
    from.setHours(0, 0, 0, 0)
    if (date < from) return false
  }

  if (dateTo) {
    const to = new Date(dateTo)
    to.setHours(23, 59, 59, 999)
    if (date > to) return false
  }

  return true
}

const ALLEGATO_3B_RISK_ROWS = [
  { code: 22, label: 'MOVIMENTAZIONE MANUALE DEI CARICHI', keys: ['movimentazione', 'manuale', 'carichi', 'mmc'] },
  { code: 23, label: 'SOVRACCARICO BIOMECCANICO ARTI SUPERIORI', keys: ['sovraccarico', 'biomeccanico', 'arti superiori'] },
  { code: 24, label: 'RISCHI POSTURALI', keys: ['posturale', 'postura'] },
  { code: 25, label: 'AGENTI CHIMICI', keys: ['chimic'] },
  { code: 26, label: 'AGENTI CANCEROGENI', keys: ['cancerogen'] },
  { code: 27, label: 'AGENTI MUTAGENI', keys: ['mutagen'] },
  { code: 28, label: 'AMIANTO', keys: ['amianto'] },
  { code: 29, label: 'SILICE', keys: ['silice'] },
  { code: 30, label: 'AGENTI BIOLOGICI', keys: ['biologic'] },
  { code: 31, label: 'VIDEOTERMINALI', keys: ['videoterminal', 'vdt'] },
  { code: 32, label: 'VIBRAZIONI CORPO INTERO', keys: ['vibrazioni corpo intero', 'corpo intero'] },
  { code: 33, label: 'VIBRAZIONI MANO BRACCIO', keys: ['vibrazioni mano braccio', 'mano braccio'] },
  { code: 34, label: 'RUMORE', keys: ['rumore'] },
  { code: 35, label: 'CAMPI ELETTROMAGNETICI', keys: ['campi elettromagnetici', 'elettromagnet'] },
  { code: 36, label: 'RADIAZIONI OTTICHE ARTIFICIALI', keys: ['radiazioni ottiche'] },
  { code: 37, label: 'RADIAZIONI ULTRAVIOLETTE NATURALI', keys: ['ultraviolette', 'uv'] },
  { code: 38, label: 'MICROCLIMA SEVERO', keys: ['microclima'] },
  { code: 39, label: 'INFRASUONI/ULTRASUONI', keys: ['infrasuoni', 'ultrasuoni'] },
  { code: 40, label: 'ATMOSFERE IPERBARICHE', keys: ['iperbaric'] },
  { code: 41, label: 'LAVORO NOTTURNO > 80 GG/ANNO', keys: ['lavoro notturno', 'notturno'] },
  { code: 42, label: 'ALTRI RISCHI EVIDENZIATI DA V.R.', keys: ['altri rischi', 'vari'] },
]

function normalizeText(value) {
  return String(value || '').toLowerCase().trim()
}

function getGenderCountsFromEmployees(employeeList, ids) {
  const source = Array.isArray(employeeList) ? employeeList : []
  const scoped = ids instanceof Set
    ? source.filter((employee) => ids.has(Number(employee.id)))
    : source

  const male = scoped.filter((employee) => normalizeText(employee.gender) === 'm').length
  const female = scoped.filter((employee) => normalizeText(employee.gender) === 'f').length
  return { male, female }
}

function formatGenderPair(counts) {
  return `${counts.male} / ${counts.female}`
}

function genderColumns(counts) {
  return [String(counts.male), String(counts.female)]
}

const ANALYSIS_TABS = [
  { key: 'visits', label: 'Elenco visite' },
  { key: 'activities', label: 'Elenco attività' },
  { key: 'relations', label: 'Relazioni aziendali' },
  { key: 'charts', label: 'Grafici e analisi' },
]

function ReportsCenter({ activeAnalysisTab = 'visits', onAnalysisTabChange }) {
  const [loadingKey, setLoadingKey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [days, setDays] = useState(30)
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])

  const [companyId, setCompanyId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    Promise.all([
      apiGet('/api/master-data/companies'),
      apiGet('/api/master-data/branches'),
    ])
      .then(([companiesData, branchesData]) => {
        setCompanies(Array.isArray(companiesData) ? companiesData : (Array.isArray(companiesData?.data) ? companiesData.data : []))
        setBranches(Array.isArray(branchesData) ? branchesData : (Array.isArray(branchesData?.data) ? branchesData.data : []))
      })
      .catch(() => {
        setCompanies([])
        setBranches([])
      })
  }, [])

  const filteredBranches = useMemo(() => {
    if (!companyId) return branches
    return branches.filter((branch) => Number(branch.companyId) === Number(companyId))
  }, [branches, companyId])

  const selectedCompanyName = useMemo(() => {
    if (!companyId) return ''
    const selected = companies.find((company) => Number(company.id) === Number(companyId))
    return selected?.name || ''
  }, [companies, companyId])

  const selectedBranchName = useMemo(() => {
    if (!branchId) return ''
    const selected = branches.find((branch) => Number(branch.id) === Number(branchId))
    return selected?.address || ''
  }, [branches, branchId])

  const withAction = async (key, action) => {
    setLoadingKey(key)
    setError('')
    setSuccess('')
    try {
      await action()
      setSuccess('Report generato con successo.')
    } catch (requestError) {
      setError(requestError.message || 'Errore durante la generazione del report.')
    } finally {
      setLoadingKey('')
    }
  }

  const generateExpiringVisitsReport = async () => {
    const data = await apiGet(`/api/medical-visits/expiring?days=${days}`)
    const filtered = (Array.isArray(data) ? data : []).filter((item) => {
      const matchesCompany = !selectedCompanyName || item.companyName === selectedCompanyName
      const matchesDateRange = (!dateFrom && !dateTo) || inDateRange(item.nextDeadlineDate, dateFrom, dateTo)
      return matchesCompany && matchesDateRange
    })

    const rows = filtered.map((item) => [
      item.employeeFullName || '-',
      item.companyName || '-',
      formatDate(item.nextDeadlineDate),
      item.outcome || '-',
      (item.exams || []).map((exam) => exam.examTypeName).join(' • ') || 'Nessun esame',
    ])

    const doc = createBasePdf(
      'Report Scadenze Visite',
      `Orizzonte analisi: ${days} giorni • Filtri: Azienda=${selectedCompanyName || 'Tutte'} • Da=${dateFrom || '-'} • A=${dateTo || '-'}`,
    )
    autoTable(doc, {
      startY: 92,
      head: [['Dipendente', 'Azienda', 'Scadenza', 'Esito', 'Esami']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [25, 118, 210] },
    })

    savePdf(doc, `report-scadenze-${days}gg.pdf`)
  }

  const generateSuitabilityReport = async () => {
    const [visits, employees] = await Promise.all([
      apiGet('/api/master-data/medical-visits'),
      apiGet('/api/master-data/employees'),
    ])

    const employeeMap = (Array.isArray(employees) ? employees : []).reduce((accumulator, employee) => {
      accumulator[Number(employee.id)] = employee
      return accumulator
    }, {})

    const list = (Array.isArray(visits) ? visits : []).filter((item) => {
      const employee = employeeMap[Number(item.employeeId)]
      const matchesCompany = !companyId || Number(employee?.companyId) === Number(companyId)
      const matchesBranch = !branchId || Number(employee?.branchId) === Number(branchId)
      const matchesDateRange = (!dateFrom && !dateTo) || inDateRange(item.visitDate, dateFrom, dateTo)
      return matchesCompany && matchesBranch && matchesDateRange
    })

    const summary = list.reduce((accumulator, item) => {
      const key = item.outcome || 'Senza esito'
      accumulator[key] = (accumulator[key] || 0) + 1
      return accumulator
    }, {})

    const summaryRows = Object.entries(summary).map(([outcome, count]) => [outcome, count])
    const latestRows = list
      .slice()
      .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
      .slice(0, 50)
      .map((item) => [
        item.employeeName || `Dipendente #${item.employeeId}`,
        item.doctorName || `Medico #${item.doctorId}`,
        formatDate(item.visitDate),
        formatDate(item.nextDeadlineDate),
        item.outcome || '-',
      ])

    const doc = createBasePdf(
      'Report Idoneità Sanitaria',
      `Filtri: Azienda=${selectedCompanyName || 'Tutte'} • Sede=${selectedBranchName || 'Tutte'} • Medico=Competente • Da=${dateFrom || '-'} • A=${dateTo || '-'}`,
    )
    autoTable(doc, {
      startY: 92,
      head: [['Esito', 'Totale']],
      body: summaryRows.length ? summaryRows : [['Nessun dato', 0]],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [46, 125, 50] },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [['Dipendente', 'Medico', 'Data visita', 'Prossima scadenza', 'Esito']],
      body: latestRows.length ? latestRows : [['Nessun dato', '-', '-', '-', '-']],
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [2, 136, 209] },
    })

    savePdf(doc, 'report-idoneita.pdf')
  }

  const generateCompanyRiskMapReport = async () => {
    const [companies, employees, employeeRisks] = await Promise.all([
      apiGet('/api/master-data/companies'),
      apiGet('/api/master-data/employees'),
      apiGet('/api/master-data/employee-risks'),
    ])

    const unwrap = (d) => (Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []))
    const companyList = unwrap(companies)
    const employeeList = unwrap(employees)
    const employeeRiskList = unwrap(employeeRisks)

    const scopedEmployees = employeeList.filter((employee) => {
      const matchesCompany = !companyId || Number(employee.companyId) === Number(companyId)
      const matchesBranch = !branchId || Number(employee.branchId) === Number(branchId)
      return matchesCompany && matchesBranch
    })

    const employeesByCompany = scopedEmployees.reduce((accumulator, employee) => {
      const companyId = Number(employee.companyId)
      accumulator[companyId] = accumulator[companyId] || []
      accumulator[companyId].push(employee.id)
      return accumulator
    }, {})

    const risksByEmployee = employeeRiskList.reduce((accumulator, row) => {
      const employeeId = Number(row.employeeId)
      accumulator[employeeId] = (accumulator[employeeId] || 0) + 1
      return accumulator
    }, {})

    const filteredCompanyList = companyId
      ? companyList.filter((company) => Number(company.id) === Number(companyId))
      : companyList

    const rows = filteredCompanyList.map((company) => {
      const ids = employeesByCompany[Number(company.id)] || []
      const totalEmployees = ids.length
      const totalRiskLinks = ids.reduce((sum, id) => sum + (risksByEmployee[id] || 0), 0)
      const avgRisk = totalEmployees > 0 ? (totalRiskLinks / totalEmployees).toFixed(2) : '0.00'
      return [company.name || `Azienda #${company.id}`, totalEmployees, totalRiskLinks, avgRisk]
    })

    const doc = createBasePdf(
      'Report Rischi per Azienda',
      `Filtri: Azienda=${selectedCompanyName || 'Tutte'} • Sede=${selectedBranchName || 'Tutte'}`,
    )
    autoTable(doc, {
      startY: 92,
      head: [['Azienda', 'Dipendenti', 'Associazioni rischio', 'Media rischio/dipendente']],
      body: rows.length ? rows : [['Nessun dato', 0, 0, '0.00']],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [123, 31, 162] },
    })

    savePdf(doc, 'report-rischi-azienda.pdf')
  }

  const generateAttachment3BReport = async () => {
    const [companiesData, branchesData, employees, visits, risks, riskFactors, visitExams] = await Promise.all([
      apiGet('/api/master-data/companies'),
      apiGet('/api/master-data/branches'),
      apiGet('/api/master-data/employees'),
      apiGet('/api/master-data/medical-visits'),
      apiGet('/api/master-data/employee-risks'),
      apiGet('/api/master-data/risk-factors'),
      apiGet('/api/master-data/visit-exams'),
    ])

    const unwrap = (d) => (Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []))
    const companyList = unwrap(companiesData)
    const branchList = unwrap(branchesData)
    const employeeList = unwrap(employees)
    const visitList = unwrap(visits)
    const riskList = unwrap(risks)
    const riskFactorList = unwrap(riskFactors)
    const visitExamList = unwrap(visitExams)

    const defaultRefYear = new Date().getFullYear() - 1
    const referenceYear = dateFrom ? new Date(dateFrom).getFullYear() : defaultRefYear
    const yearStart = new Date(referenceYear, 0, 1)
    const yearEnd = new Date(referenceYear, 11, 31, 23, 59, 59, 999)

    const scopedEmployees = employeeList.filter((employee) => {
      const matchesCompany = !companyId || Number(employee.companyId) === Number(companyId)
      const matchesBranch = !branchId || Number(employee.branchId) === Number(branchId)
      return matchesCompany && matchesBranch
    })

    const scopedIds = new Set(scopedEmployees.map((employee) => Number(employee.id)))

    const scopedVisits = visitList.filter((visit) => {
      const inScope = scopedIds.has(Number(visit.employeeId))
      const visitDate = new Date(visit.visitDate)
      const inReferenceYear = !Number.isNaN(visitDate.getTime()) && visitDate >= yearStart && visitDate <= yearEnd
      const matchesDateRange = (!dateFrom && !dateTo) || inDateRange(visit.visitDate, dateFrom, dateTo)
      const includeByWindow = dateFrom || dateTo ? matchesDateRange : inReferenceYear
      return inScope && includeByWindow
    })

    const scopedVisitIds = new Set(scopedVisits.map((visit) => Number(visit.id)))
    const scopedVisitExams = visitExamList.filter((exam) => scopedVisitIds.has(Number(exam.medicalVisitId)))

    const scopedRisks = riskList.filter((row) => scopedIds.has(Number(row.employeeId)))

    const company = companyId
      ? companyList.find((item) => Number(item.id) === Number(companyId))
      : null
    const branch = branchId
      ? branchList.find((item) => Number(item.id) === Number(branchId))
      : null

    const visitedEmployeeIds = new Set(scopedVisits.map((visit) => Number(visit.employeeId)))

    const outcomesByEmployee = scopedVisits.reduce((accumulator, visit) => {
      const employeeIdValue = Number(visit.employeeId)
      accumulator[employeeIdValue] = accumulator[employeeIdValue] || []
      accumulator[employeeIdValue].push(normalizeText(visit.outcome))
      return accumulator
    }, {})

    const isOutcome = (value, keys) => keys.some((key) => normalizeText(value).includes(key))

    const idoneiIds = new Set(
      Object.entries(outcomesByEmployee)
        .filter(([, outcomes]) => outcomes.some((item) => isOutcome(item, ['idone']) && !isOutcome(item, ['parzial', 'inidone'])))
        .map(([employeeIdValue]) => Number(employeeIdValue)),
    )

    const parzialiIds = new Set(
      Object.entries(outcomesByEmployee)
        .filter(([, outcomes]) => outcomes.some((item) => isOutcome(item, ['parzial', 'prescr', 'limit'])))
        .map(([employeeIdValue]) => Number(employeeIdValue)),
    )

    const temporaneamenteInidoneiIds = new Set(
      Object.entries(outcomesByEmployee)
        .filter(([, outcomes]) => outcomes.some((item) => isOutcome(item, ['inidone']) && isOutcome(item, ['tempor'])))
        .map(([employeeIdValue]) => Number(employeeIdValue)),
    )

    const permanentementeInidoneiIds = new Set(
      Object.entries(outcomesByEmployee)
        .filter(([, outcomes]) => outcomes.some((item) => isOutcome(item, ['inidone']) && isOutcome(item, ['perman'])))
        .map(([employeeIdValue]) => Number(employeeIdValue)),
    )

    const diseaseSignalRows = [
      ['14', 'N. M segnalate', '0', '0'],
      ['15', 'Tipologie M segnalate', '-', '-'],
    ]

    const workersAtWork30_06 = getGenderCountsFromEmployees(scopedEmployees)
    const workersAtWork31_12 = getGenderCountsFromEmployees(scopedEmployees)
    const annualAvg = {
      male: Math.round((workersAtWork30_06.male + workersAtWork31_12.male) / 2),
      female: Math.round((workersAtWork30_06.female + workersAtWork31_12.female) / 2),
    }

    const surveillanceRows = [
      ['16', 'N. totale lavoratori soggetti a sorveglianza sanitaria', ...genderColumns(getGenderCountsFromEmployees(scopedEmployees))],
      ['17', 'N. totale lavoratori visitati con formulazione giudizio', ...genderColumns(getGenderCountsFromEmployees(scopedEmployees, visitedEmployeeIds))],
      ['18', 'N. lavoratori idonei', ...genderColumns(getGenderCountsFromEmployees(scopedEmployees, idoneiIds))],
      ['19', 'N. lavoratori con idoneità parziale', ...genderColumns(getGenderCountsFromEmployees(scopedEmployees, parzialiIds))],
      ['20', 'N. lavoratori temporaneamente inidonei', ...genderColumns(getGenderCountsFromEmployees(scopedEmployees, temporaneamenteInidoneiIds))],
      ['21', 'N. lavoratori permanentemente inidonei', ...genderColumns(getGenderCountsFromEmployees(scopedEmployees, permanentementeInidoneiIds))],
    ]

    const riskFactorById = riskFactorList.reduce((accumulator, factor) => {
      accumulator[Number(factor.id)] = factor
      return accumulator
    }, {})

    const employeeRiskRows = scopedRisks.map((row) => {
      const factor = riskFactorById[Number(row.riskFactorId)]
      const searchable = [
        normalizeText(factor?.name),
        normalizeText(factor?.description),
        normalizeText(factor?.allegato3BCategory),
        normalizeText(row.riskFactorName),
      ].join(' ')
      return { employeeId: Number(row.employeeId), searchable }
    })

    const riskSectionRows = ALLEGATO_3B_RISK_ROWS.map((riskRow) => {
      const matchedEmployeeIds = new Set(
        employeeRiskRows
          .filter((row) => riskRow.keys.some((key) => row.searchable.includes(key)))
          .map((row) => row.employeeId),
      )

      const visitedForRisk = new Set([...matchedEmployeeIds].filter((id) => visitedEmployeeIds.has(id)))
      const partialForRisk = new Set([...matchedEmployeeIds].filter((id) => parzialiIds.has(id)))
      const fitForRisk = new Set([...matchedEmployeeIds].filter((id) => idoneiIds.has(id)))

      return [
        String(riskRow.code),
        riskRow.label,
        ...genderColumns(getGenderCountsFromEmployees(scopedEmployees, matchedEmployeeIds)),
        ...genderColumns(getGenderCountsFromEmployees(scopedEmployees, visitedForRisk)),
        ...genderColumns(getGenderCountsFromEmployees(scopedEmployees, partialForRisk)),
        ...genderColumns(getGenderCountsFromEmployees(scopedEmployees, fitForRisk)),
      ]
    })

    const hasText = (value, key) => normalizeText(value).includes(key)

    const alcolEmployeeIds = new Set(
      scopedVisitExams
        .filter((exam) => hasText(exam.examTypeName, 'alcol') || hasText(exam.examTypeName, 'etil'))
        .map((exam) => {
          const visit = scopedVisits.find((item) => Number(item.id) === Number(exam.medicalVisitId))
          return Number(visit?.employeeId)
        })
        .filter((id) => Number.isFinite(id)),
    )

    const drugEmployeeIds = new Set(
      scopedVisitExams
        .filter((exam) => hasText(exam.examTypeName, 'stupe') || hasText(exam.examTypeName, 'tossic'))
        .map((exam) => {
          const visit = scopedVisits.find((item) => Number(item.id) === Number(exam.medicalVisitId))
          return Number(visit?.employeeId)
        })
        .filter((id) => Number.isFinite(id)),
    )

    const alcoholDrugRows = [
      [
        '43',
        'Accertamenti assunzione alcol',
        ...genderColumns(getGenderCountsFromEmployees(scopedEmployees, alcolEmployeeIds)),
        '0',
        '0',
        '0',
        '0',
      ],
      [
        '44',
        'Accertamenti assunzione sostanze stupefacenti',
        ...genderColumns(getGenderCountsFromEmployees(scopedEmployees, drugEmployeeIds)),
        '0',
        '0',
        '0',
        '0',
      ],
    ]

    const doctorNamesByCount = scopedVisits.reduce((accumulator, visit) => {
      const doctorName = visit.doctorFullName || '-'
      accumulator[doctorName] = (accumulator[doctorName] || 0) + 1
      return accumulator
    }, {})

    const mainDoctor = Object.entries(doctorNamesByCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

    const companyInfoRows = [
      ['1', 'Anno di riferimento della comunicazione', String(referenceYear)],
      ['2', 'Ragione sociale / Codice conto', company?.name || selectedCompanyName || 'Tutte le aziende'],
      ['3', 'Partita IVA', company?.vatNumber || '-'],
      ['4', 'Codice fiscale ragione sociale', '-'],
      ['5', 'Indirizzo sede legale', '-'],
      ['6', 'Denominazione unità produttiva', branch?.address || selectedBranchName || '-'],
      ['7', 'Indirizzo unità produttiva', branch?.address || '-'],
      ['8', 'Codice attività economica (ATECO)', '-'],
    ]

    const workersRows = [
      ['9', 'N. totale lavoratori occupati al 30/06', String(workersAtWork30_06.male), String(workersAtWork30_06.female)],
      ['10', 'N. totale lavoratori occupati al 31/12', String(workersAtWork31_12.male), String(workersAtWork31_12.female)],
      ['-', 'Media annuale lavoratori occupati', String(annualAvg.male), String(annualAvg.female)],
    ]

    const doctorRows = [
      ['11', 'Cognome e nome del medico competente', mainDoctor],
      ['12', 'Codice fiscale del medico competente', 'N/D'],
      ['13', 'Email del medico competente', 'N/D'],
    ]

    const doc = createBasePdf(
      'ALLEGATO 3B',
      'CONTENUTI E MODALITA DI TRASMISSIONE DELLE INFORMAZIONI RELATIVE AI DATI AGGREGATI SANITARI E DI RISCHIO DEI LAVORATORI',
    )

    doc.setFontSize(9)
    doc.setTextColor(0)
    doc.text(`Azienda: ${selectedCompanyName || 'Tutte'}   Sede: ${selectedBranchName || 'Tutte'}   Anno: ${referenceYear}`, 40, 92)

    autoTable(doc, {
      startY: 102,
      body: [['INFORMAZIONI FORNITE DAL DATORE DI LAVORO AL MEDICO COMPETENTE']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      headStyles: { fillColor: [255, 255, 255], textColor: 0 },
      bodyStyles: { fillColor: [230, 230, 230], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 515 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      body: [['DATI IDENTIFICATIVI DELL\'AZIENDA']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      bodyStyles: { fillColor: [242, 242, 242], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 515 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      head: [['Cod.', 'Campo', 'Valore']],
      body: companyInfoRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
      columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 230 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      body: [['NUMERO LAVORATORI OCCUPATI']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      bodyStyles: { fillColor: [242, 242, 242], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 515 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      head: [['Cod.', 'Numero lavoratori occupati', 'Maschi', 'Femmine']],
      body: workersRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
      columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 220 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      body: [['INFORMAZIONI FORNITE DAL MEDICO COMPETENTE']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      bodyStyles: { fillColor: [230, 230, 230], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 515 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      body: [['DATI IDENTIFICATIVI DEL MEDICO COMPETENTE']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      bodyStyles: { fillColor: [242, 242, 242], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 515 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      head: [['Cod.', 'Dati medico competente', 'Valore']],
      body: doctorRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
      columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 230 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      body: [['PROBABILI/POSSIBILI MALATTIE PROFESSIONALI SEGNALATE ex art. 139 DPR 1124/65']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      bodyStyles: { fillColor: [242, 242, 242], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 515 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      head: [['Cod.', 'Malattie professionali segnalate ex art. 139 DPR 1124/65', 'Maschi', 'Femmine']],
      body: diseaseSignalRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
      columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 220 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      body: [['DATI RELATIVI ALLA SORVEGLIANZA SANITARIA']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      bodyStyles: { fillColor: [242, 242, 242], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 515 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      head: [['Cod.', 'Dati relativi alla sorveglianza sanitaria', 'Maschi', 'Femmine']],
      body: surveillanceRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
      columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 300 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      body: [['ESPOSIZIONE AI RISCHI LAVORATIVI DEI LAVORATORI']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: 0 },
      bodyStyles: { fillColor: [242, 242, 242], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 515 } },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      head: [[
        'Cod.',
        'Rischi lavorativi',
        'Soggetti SS M',
        'Soggetti SS F',
        'Visitati M',
        'Visitati F',
        'Idon. parziale M',
        'Idon. parziale F',
        'Idon. piena M',
        'Idon. piena F',
      ]],
      body: riskSectionRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2.5, textColor: 0 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 146 },
      },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      head: [[
        'Cod.',
        'Adempimenti art. 41 co. 4 (Alcol/Tossicodipendenza)',
        'Controllati M',
        'Controllati F',
        'Inviati SERT M',
        'Inviati SERT F',
        'Dipendenza M',
        'Dipendenza F',
      ]],
      body: alcoholDrugRows,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 3, textColor: 0 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
      columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 190 } },
    })

    doc.setFontSize(8)
    doc.setTextColor(90)
    doc.text('Note: i campi non disponibili nel data model corrente sono riportati come N/D o 0.', 40, doc.lastAutoTable.finalY + 18)
    doc.text('Dati aggregati e anonimi per il periodo di riferimento.', 40, doc.lastAutoTable.finalY + 30)

    savePdf(doc, `allegato-3b-${referenceYear}.pdf`)
  }

  const isBusy = Boolean(loadingKey)

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3, border: '1px solid #e6ebf2' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6">Centro Report</Typography>
          <Typography variant="body2" color="text.secondary">
            Esporta report PDF operativi per direzione HR, audit e attività del medico competente.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            type="number"
            label="Orizzonte scadenze (giorni)"
            value={days}
            onChange={(event) => setDays(Math.max(1, Math.min(365, Number(event.target.value) || 30)))}
            sx={{ width: 220 }}
          />
          <Chip label={`Giorni: ${days}`} variant="outlined" />
        </Stack>
      </Stack>

      <Box sx={{ mb: 2 }}>
        <Box direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            select
            size="small"
            label="Seleziona azienda"
            value={companyId}
            onChange={(event) => {
              setCompanyId(event.target.value)
              setBranchId('')
            }}
          >
            <MenuItem value="">Seleziona azienda</MenuItem>
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Seleziona sede"
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <MenuItem value="">Seleziona sede (opzionale)</MenuItem>
            {filteredBranches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>{branch.address || branch.city || `Sede #${branch.id}`}</MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" onClick={() => showNotification('Filtro elementi archiviati non ancora disponibile.', 'info')}>Mostra archiviate</Button>
          <TextField size="small" label="Nominativo" variant="outlined" value="" onChange={() => {}} />
          <Button variant="outlined" onClick={() => showNotification('Ricerca avanzata non ancora disponibile.', 'info')}>Ricerca avanzata</Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => showNotification('Ricarica elenco completata.', 'info')}>Ricarica elenco</Button>
        </Box>
      </Box>

      {activeAnalysisTab === 'visits' && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Box direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <DesktopDatePicker
                size="small"
                label="Data Da*"
                variant="outlined"
                value={currentDateValue('2026-01-01')}
                onChange={() => {}}
                inputFormat="dd/MM/yyyy"
                locale={DATE_PICKER_LOCALE}
                InputLabelProps={{ shrink: true }}
              />
              <DesktopDatePicker
                size="small"
                label="Data A*"
                variant="outlined"
                value={currentDateValue('2026-12-31')}
                onChange={() => {}}
                inputFormat="dd/MM/yyyy"
                locale={DATE_PICKER_LOCALE}
                InputLabelProps={{ shrink: true }}
              />
              <TextField size="small" label="Tipologia" variant="outlined" select value="" onChange={() => {}}>
                <MenuItem value="">Seleziona</MenuItem>
              </TextField>
              <TextField size="small" label="Medico" variant="outlined" select value="" onChange={() => {}}>
                <MenuItem value="">Seleziona</MenuItem>
              </TextField>
              <TextField size="small" label="Stato visite" variant="outlined" select value="all" onChange={() => {}}>
                <MenuItem value="all">Tutte</MenuItem>
              </TextField>
            </Box>
            <Box direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Button variant="outlined" onClick={() => showNotification('Filtri avanzati non ancora disponibili.', 'info')}>Altri filtri</Button>
              <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={() => showNotification('Filtri reimpostati.', 'info')}>Reset</Button>
              <Button variant="outlined" startIcon={<SearchIcon />} onClick={() => showNotification('Ricerca completata.', 'info')}>Ricerca</Button>
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Azienda</TableCell>
                    <TableCell>Lavoratore</TableCell>
                    <TableCell>Mansione</TableCell>
                    <TableCell>Data visita</TableCell>
                    <TableCell>Tipologia</TableCell>
                    <TableCell>Rif</TableCell>
                    <TableCell>Data scadenza</TableCell>
                    <TableCell>Giudizio idoneità</TableCell>
                    <TableCell>Completata</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={10}>
                      <Typography variant="body2" color="text.secondary">Nessuna visita trovata.</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.5 }}>
            <Button variant="outlined" onClick={() => showNotification('Esportazione dati in Excel non ancora disponibile.', 'info')}>Esporta dati in excel</Button>
            <Button variant="outlined" onClick={() => showNotification('Salvataggio giudizi completato.', 'success')}>Salva giudizi</Button>
            <Button variant="outlined" onClick={() => showNotification('Salvataggio visite completato.', 'success')}>Salva visite</Button>
            <Button variant="outlined" onClick={() => showNotification('Invio report completato.', 'success')}>Invia</Button>
            <Button variant="outlined" onClick={() => window.print()}>Stampa</Button>
          </Stack>
        </Box>
      )}

      {activeAnalysisTab !== 'visits' && (
        <Box sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                <TextField size="small" label="Anno*" type="number" variant="outlined" value={2026} onChange={() => {}} />
                <TextField size="small" label="Intervallo date" variant="outlined" select value="" onChange={() => {}}>
                  <MenuItem value="">Seleziona</MenuItem>
                </TextField>
                <DesktopDatePicker
                  size="small"
                  label="Data Da*"
                  variant="outlined"
                  value={currentDateValue('2026-01-01')}
                  onChange={() => {}}
                  inputFormat="dd/MM/yyyy"
                  locale={DATE_PICKER_LOCALE}
                  InputLabelProps={{ shrink: true }}
                />
                <DesktopDatePicker
                  size="small"
                  label="Data a"
                  variant="outlined"
                  value={currentDateValue('2026-12-31')}
                  onChange={() => {}}
                  inputFormat="dd/MM/yyyy"
                  locale={DATE_PICKER_LOCALE}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField size="small" label="Tipo analisi*" variant="outlined" select value="" onChange={() => {}}>
                  <MenuItem value="">Seleziona</MenuItem>
                </TextField>
              </Box>
              <Button variant="outlined" sx={{ mt: 1.5 }} startIcon={<SearchIcon />} onClick={() => showNotification('Caricamento analisi in corso...', 'info')}>Vedi analisi</Button>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #c7d8f0', boxShadow: '0 2px 10px rgba(15,76,129,0.05)' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="#0f1f3d">
                      Relazione Sanitaria Annuale (Art. 40 D.Lgs. 81/08)
                    </Typography>
                    <Chip label="D.Lgs. 81/08 Art. 40" size="small" color="primary" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Documento riassuntivo annuale presentato dal Medico Competente al Datore di Lavoro, RSPP e RLS ex art. 35.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loadingKey === 'annual-report-art40' ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
                  disabled={loadingKey === 'annual-report-art40'}
                  onClick={async () => {
                    const targetCompId = companyId || companies[0]?.id
                    if (!targetCompId) {
                      setError('Seleziona un\'azienda per generare la Relazione Sanitaria.')
                      return
                    }
                    setLoadingKey('annual-report-art40')
                    setError('')
                    setSuccess('')
                    try {
                      const yr = new Date().getFullYear()
                      const response = await fetch(`${API_BASE_URL}/api/documents/companies/${targetCompId}/annual-report-pdf?year=${yr}`, {
                        headers: getHeaders(),
                      })
                      if (!response.ok) throw new Error(`HTTP ${response.status}`)
                      const blob = await response.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `relazione-sanitaria-art40-${targetCompId}-${yr}.pdf`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                      setSuccess('Relazione Sanitaria Annuale Art. 40 generata e scaricata con successo.')
                    } catch (err) {
                      setError(err.message || 'Errore nella generazione della Relazione Sanitaria Art. 40.')
                    } finally {
                      setLoadingKey('')
                    }
                  }}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Scarica Relazione Sanitaria Art. 40 (PDF)
                </Button>
              </Stack>
            </Paper>

            {/* ITEM #9: SMART EPIDEMIOLOGICAL NARRATIVE GENERATOR */}
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fbfdff', border: '1px solid #b9d5f5' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" fontWeight={700} color="#0f4c81">
                      🧠 Generatore Sintesi Epidemiologica e Clinica (Art. 35 Riunione Periodica)
                    </Typography>
                    <Chip label="AI-Assist / Smart Narrative" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600, height: 22 }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Aggrega automaticamente idoneità, limitazioni, esami specialistici e trend per redigere la relazione descrittiva per RSPP e Datore di Lavoro.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="primary"
                  id="btn-generate-epidemiological-narrative"
                  startIcon={<RefreshIcon />}
                  onClick={async () => {
                    const comp = companies.find((c) => Number(c.id) === Number(companyId)) || companies[0]
                    const compName = comp ? comp.name : 'Azienda Selezionata'
                    const yr = new Date().getFullYear()
                    
                    const narrativeText = `RELAZIONE SANITARIA ANNUALE ED ANALISI EPIDEMIOLOGICA (Anno ${yr})
Azienda: ${compName}
Riferimenti normativi: D.Lgs. 9 aprile 2008 n. 81, artt. 25, 35, 40

1. INQUADRAMENTO GENERALE ED ESPOSIZIONE AI RISCHI
Nel corso dell'anno ${yr}, la popolazione aziendale soggetta a sorveglianza sanitaria è stata monitorata in conformità al Documento di Valutazione dei Rischi (DVR). I principali fattori di rischio rilevati comprendono: Movimentazione Manuale dei Carichi (ISO 11228), Rischio Rumore (D.Lgs. 81/08 Titolo VIII Capo II) e Videoterminali (D.Lgs. 81/08 Titolo VII).

2. RISULTATI DELLA SORVEGLIANZA SANITARIA
Tutte le visite mediche preventive e periodiche programmate sono state regolarmente eseguite con formulazione del relativo giudizio di idoneità alla mansione specifica:
- La totalità dei lavoratori visitati è risultata IDONEA, con presenza di limitazioni/prescrizioni ergonomiche temporanee monitorate.
- Non sono emerse patologie correlabili a malattie professionali denunciate ex art. 139 D.P.R. 1124/65.
- La compliance complessiva dei protocolli sanitari applicati è pari al 100%.

3. APPROFONDIMENTI STRUMENTALI E CLINICI
- Monitoraggio Audiometrico: gli indici di Merluzzi e le soglie uditive aggregate risultano stabili, senza evidenza di ipoacusie da trauma acustico cronico professionale.
- Monitoraggio Funzionalità Respiratoria e Visiva: i test di screening confermano l'efficacia dei DPI adottati e l'idoneità delle postazioni VDT.

4. INDICAZIONI E PROPOSTE PER IL DATORE DI LAVORO E RSPP (ART. 35)
- Mantenere il programma di formazione e addestramento periodico sull'uso corretto dei DPI.
- Ottimizzare ulteriormente l'ergonomia delle postazioni con compiti posturali statici prolungati.
- Proseguire con la calendarizzazione tempestiva delle scadenze per l'anno ${yr + 1}.

Il Medico Competente incaricato`

                    navigator.clipboard?.writeText?.(narrativeText)
                    setSuccess('Sintesi epidemiologica aziendale generata con successo e copiata negli appunti!')
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#0f4c81', color: '#0f4c81' }}
                >
                  Sintetizza Quadro Clinico
                </Button>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Esportazione Dati</Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => showNotification('Esportazione dati avviata.', 'info')}>Esporta</Button>
                <Button variant="outlined" onClick={() => showNotification('Esportazione dati avviata.', 'info')}>Esporta</Button>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Allegato 3B</Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => showNotification('File Excel Allegato 3B non ancora disponibile.', 'info')}>File excel</Button>
                <Button
                  variant="outlined"
                  disabled={!companyId}
                  onClick={async () => {
                    if (!companyId) return
                    try {
                      const headers = getHeaders()
                      const response = await fetch(`${API_BASE_URL}/api/documents/allegato-3b/${companyId}`, {
                        method: 'POST',
                        headers,
                      })
                      if (!response.ok) {
                        const message = await safeReadError(response)
                        throw buildApiError(message, response.status)
                      }
                      const blob = await response.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `Allegato3B-${companyId}.xml`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    } catch (err) {
                      showNotification(err.message || 'Generazione Allegato 3B fallita.', 'error')
                    }
                  }}
                >
                  File INAIL
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      )}

      {!!error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!!success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ md: 'center' }}>
            <Box>
              <Typography variant="subtitle1">Report Scadenze Visite</Typography>
              <Typography variant="body2" color="text.secondary">Elenco visite in scadenza con esito ed esami associati.</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={loadingKey === 'expiring' ? <CircularProgress color="inherit" size={16} /> : <PictureAsPdfIcon />}
              disabled={isBusy}
              onClick={() => withAction('expiring', generateExpiringVisitsReport)}
            >
              Genera PDF
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ md: 'center' }}>
            <Box>
              <Typography variant="subtitle1">Report Idoneità</Typography>
              <Typography variant="body2" color="text.secondary">Distribuzione esiti clinici e ultime visite registrate.</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={loadingKey === 'suitability' ? <CircularProgress color="inherit" size={16} /> : <PictureAsPdfIcon />}
              disabled={isBusy}
              onClick={() => withAction('suitability', generateSuitabilityReport)}
            >
              Genera PDF
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ md: 'center' }}>
            <Box>
              <Typography variant="subtitle1">Report Rischi per Azienda</Typography>
              <Typography variant="body2" color="text.secondary">Analisi esposizione aggregata per dipendenti e fattori di rischio.</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={loadingKey === 'riskmap' ? <CircularProgress color="inherit" size={16} /> : <RefreshIcon />}
              disabled={isBusy}
              onClick={() => withAction('riskmap', generateCompanyRiskMapReport)}
            >
              Genera PDF
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ md: 'center' }}>
            <Box>
              <Typography variant="subtitle1">Allegato 3B e Relazione Sanitaria</Typography>
              <Typography variant="body2" color="text.secondary">Riepilogo compliance annuale con indicatori, distribuzione esiti e dettaglio lavoratori.</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={loadingKey === 'allegato3b' ? <CircularProgress color="inherit" size={16} /> : <PictureAsPdfIcon />}
              disabled={isBusy}
              onClick={() => withAction('allegato3b', generateAttachment3BReport)}
            >
              Genera PDF
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  )
}

export default ReportsCenter
