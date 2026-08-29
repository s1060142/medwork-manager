import { type Page, type APIRequestContext, type TestInfo } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { CompaniesPage } from '../pages/CompaniesPage'
import { EmployeesPage } from '../pages/EmployeesPage'
import { MedicalVisitsPage } from '../pages/MedicalVisitsPage'
import { ProtocolsPage } from '../pages/ProtocolsPage'
import { PatientPortalPage } from '../pages/PatientPortalPage'
import { AdministrationPage } from '../pages/AdministrationPage'
import { PdfViewerPage } from '../pages/PdfViewerPage'

const BASE_URL = 'http://127.0.0.1:5173'
export const API_URL = 'http://127.0.0.1:5279'

export type TestUser = {
  username: string
  password: string
  role: 'Admin' | 'Doctor' | 'Patient'
  tenantSlug: string
}

export const USERS = {
  admin: { username: 'admin', password: 'Admin123!', role: 'Admin' as const, tenantSlug: 'default' },
  doctor: { username: 'doctor', password: 'Doctor123!', role: 'Doctor' as const, tenantSlug: 'default' },
  patient: { username: 'patient', password: 'Patient123!', role: 'Patient' as const, tenantSlug: 'default' },
}

export class TestFixtures {
  readonly page: Page
  readonly request: APIRequestContext
  readonly context: any
  readonly loginPage: LoginPage
  readonly dashboard: DashboardPage
  readonly companies: CompaniesPage
  readonly employees: EmployeesPage
  readonly visits: MedicalVisitsPage
  readonly protocols: ProtocolsPage
  readonly patientPortal: PatientPortalPage
  readonly administration: AdministrationPage
  readonly pdfViewer: PdfViewerPage

  constructor(page: Page, request: APIRequestContext, context: any, private readonly expect: any) {
    this.page = page
    this.request = request
    this.context = context
    this.loginPage = new LoginPage(page)
    this.dashboard = new DashboardPage(page)
    this.companies = new CompaniesPage(page)
    this.employees = new EmployeesPage(page)
    this.visits = new MedicalVisitsPage(page)
    this.protocols = new ProtocolsPage(page)
    this.patientPortal = new PatientPortalPage(page)
    this.administration = new AdministrationPage(page)
    this.pdfViewer = new PdfViewerPage(page, expect)
  }

  async loginAsAdmin() {
    await this.loginPage.ensureLoginPage()
    await this.loginPage.login(USERS.admin.username, USERS.admin.password)
    await this.dashboard.waitForDashboard()
  }

  async loginAsDoctor() {
    await this.loginPage.ensureLoginPage()
    await this.loginPage.login(USERS.doctor.username, USERS.doctor.password)
    await this.dashboard.waitForDashboard()
  }

  async getAuthToken(user: TestUser): Promise<string> {
    const response = await this.request.post(`${API_URL}/api/auth/login`, {
      data: {
        username: user.username,
        password: user.password,
        tenantSlug: user.tenantSlug,
      },
    })
    this.expect(response.ok()).toBe(true)
    const body = await response.json()
    return body.accessToken
  }

  async apiGet(endpoint: string, token: string) {
    const response = await this.request.get(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    console.log(`[DEBUG] GET ${API_URL}${endpoint} => ${response.status()}`)
    if (!response.ok()) {
      const text = await response.text().catch(() => 'no body')
      console.log(`[DEBUG] Response body: ${text}`)
    }
    this.expect(response.ok()).toBe(true)
    return response.json()
  }

  async apiPost(endpoint: string, token: string, data: any) {
    const response = await this.request.post(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data,
    })
    console.log(`[DEBUG] POST ${API_URL}${endpoint} => ${response.status()}`)
    if (!response.ok()) {
      const text = await response.text().catch(() => 'no body')
      console.log(`[DEBUG] Response body: ${text}`)
    }
    this.expect(response.ok()).toBe(true)
    return response.json()
  }

  async apiPut(endpoint: string, token: string, data: any) {
    const response = await this.request.put(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data,
    })
    this.expect(response.ok()).toBe(true)
    return response.json()
  }

  async apiDelete(endpoint: string, token: string) {
    const response = await this.request.delete(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    this.expect(response.ok()).toBe(true)
    return response.json()
  }

  async createTestCompany(token: string) {
    const unique = `TEST-${Date.now()}`
    return this.apiPost('/api/admin-data/companies', token, {
      name: unique,
      legalName: `${unique} SRL`,
      vatNumber: `IT${Date.now().toString().slice(-11)}`,
      email: 'test@example.com',
      phone: '0000000000',
    })
  }

  async createTestEmployee(token: string, companyId: number, branchId?: number) {
    const unique = `TEST-${Date.now()}`
    const rand = Math.random().toString(36).slice(2, 9).toUpperCase().padEnd(7, 'X').slice(0, 7)
    const taxCode = `RSSMRA${rand}F205X`.slice(0, 16)
    return this.apiPost('/api/admin-data/employees', token, {
      companyId,
      branchId: branchId || 0,
      firstName: 'Prova',
      lastName: unique,
      birthDate: '1990-01-01',
      gender: 'M',
      birthCity: 'Milano',
      birthCityCode: 'F205',
      taxCode,
      jobRole: 'Operaio',
    })
  }

  async createTestProtocol(token: string) {
    const unique = `TEST-PROTO-${Date.now()}`
    return this.apiPost('/api/doctor-data/protocols', token, {
      name: unique,
      cadenceDays: 365,
      objective: 'Test protocol',
      description: 'Created by Playwright E2E',
      lawReference: 'D.Lgs. 81/08',
    })
  }

  async createTestVisit(token: string, employeeId: number, doctorId: number) {
    const unique = `TEST-VISIT-${Date.now()}`
    return this.apiPost('/api/doctor-data/medical-visits', token, {
      employeeId,
      doctorId,
      visitDate: new Date().toISOString().split('T')[0],
      nextDeadlineDate: new Date().toISOString().split('T')[0],
      visitType: 'Periodic',
      targetOrgans: 'Test',
      outcome: 'Idoneo senza limitazioni',
      clinicalNotes: unique,
    })
  }

  async waitForApiReady() {
    const maxAttempts = 30
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.request.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${await this.getAuthToken(USERS.admin)}` },
        })
        if (response.ok()) return
      } catch {
        // ignore
      }
      await this.page.waitForTimeout(2000)
    }
  }
}
