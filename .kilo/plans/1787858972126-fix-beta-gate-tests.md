# Fix Beta Gate Tests - Implementation Plan

## Objective

Fix the failing Beta Gate tests by ensuring the backend API can start and connect to a database. The tests require:
- Backend API running at `http://localhost:5279`
- Frontend running at `http://127.0.0.1:5173`
- Working database connectivity for the backend

## Analysis

### Current Situation

1. **SQL Server Status**: NOT installed on this machine (only SQLWriter service exists, which is not the database engine)
2. **Backend Configuration**:
   - `appsettings.json` and `appsettings.Development.json` use SQL Server connection string: `Server=localhost;Database=MedWorkDb;User Id=sa;Password=sasa;TrustServerCertificate=True;`
   - `appsettings.Testing.json` exists but has no connection string
3. **Program.cs Logic** (lines 106-116):
   - When `ASPNETCORE_ENVIRONMENT=Testing`: Uses InMemory database
   - Otherwise: Uses SQL Server from DefaultConnection
4. **Launch Settings**: `Properties/launchSettings.json` has a "Testing" profile that:
   - Runs on `http://localhost:5279`
   - Sets `ASPNETCORE_ENVIRONMENT=Testing`
5. **Frontend Proxy**: `vite.config.js` proxies `/api` to `http://localhost:5279`

### Root Cause

The Beta Gate tests fail because:
1. SQL Server is not installed/running
2. The backend API cannot connect to the database when running in Development mode
3. Without a working backend, all API calls from tests fail

### Solution

**Use the existing Testing environment with InMemory database** - This is the fastest, most reliable approach since:
- The API already has InMemory database support configured
- The "Testing" profile in launchSettings.json is already set up
- No SQL Server installation required
- Tests can run immediately

## Impacted Files

| File | Purpose |
|------|---------|
| `MedWork.Api/Properties/launchSettings.json` | Contains Testing profile configuration |
| `MedWork.Api/Program.cs` | Has InMemory database configuration for Testing environment |
| `MedWork.Api/appsettings.Testing.json` | Testing environment settings |
| `medwork-frontend/vite.config.js` | Frontend proxy configuration to backend |
| `medwork-frontend/playwright.config.ts` | Playwright test configuration |

## Implementation Strategy

### Phase 1: Start Backend API with InMemory Database

1. Run the backend API using the "Testing" profile which uses InMemory database
2. Verify the API starts successfully on `http://localhost:5279`

### Phase 2: Start Frontend

1. Start the frontend development server
2. Verify it runs on `http://127.0.0.1:5173`

### Phase 3: Run Beta Gate Tests

1. Execute the Playwright Beta Gate tests
2. Verify all 13 P0 tests pass

## Risks

| Risk | Mitigation |
|------|------------|
| InMemory database doesn't have seeded data | Check `AppDbSeeder.SeedAsync` is called in Program.cs (line 167) - it runs on startup |
| Port 5279 already in use | Check for existing processes and stop them if needed |
| Port 5173 already in use | Check for existing processes and stop them if needed |
| Frontend proxy misconfiguration | Verify vite.config.js proxy settings |
| Test data persistence between tests | InMemory database is created fresh per test run |

## Validation Approach

1. **Backend Health Check**: `curl http://localhost:5279/swagger` should return Swagger UI
2. **API Login Test**: POST to `/api/auth/login` with admin credentials should return token
3. **Frontend Access**: `http://127.0.0.1:5173` should load the login page
4. **Beta Gate Tests**: All 13 P0 tests should pass

## Step-by-Step Implementation Plan

### Step 1: Start Backend API in Testing Mode

```bash
cd MedWork.Api
dotnet run --launch-profile Testing
```

This will:
- Use the "Testing" profile from launchSettings.json
- Set `ASPNETCORE_ENVIRONMENT=Testing`
- Use InMemory database (configured in Program.cs lines 106-111)
- Run on `http://localhost:5279`

### Step 2: Verify Backend is Running

```bash
curl http://localhost:5279/swagger
```

Expected: Swagger UI HTML response

### Step 3: Start Frontend Development Server

```bash
cd medwork-frontend
npm run dev
```

This will:
- Start Vite dev server on `http://127.0.0.1:5173`
- Proxy API requests to `http://localhost:5279`

### Step 4: Verify Frontend is Running

Open browser to `http://127.0.0.1:5173` - should see login page

### Step 5: Run Beta Gate Tests

```bash
cd medwork-frontend
npx playwright test tests/e2e/p0-beta-gate.spec.ts
```

Expected: All 13 P0 tests pass

### Step 6: Verify Test Results

Check Playwright output for:
- AUTH-01 through AUTH-05: Authentication tests
- COMP-01 through COMP-03: Company tests
- EMP-01, EMP-03, EMP-05: Employee tests
- VISIT-01, VISIT-02, VISIT-04: Medical visit tests
- MR-01, MR-03: Medical record tests
- PROTO-01, PROTO-02, PROTO-04: Protocol tests
- PAT-01, PAT-03: Patient portal tests
- PDF-01, PDF-03: PDF generation tests
- ADMIN-01, ADMIN-02, ADMIN-03: Administration tests

## Alternative: Install SQL Server (If InMemory is Not Suitable)

If InMemory database doesn't meet requirements:

1. **Install SQL Server Express**:
   - Download from https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - Or use Chocolatey: `choco install sql-server-express`

2. **Configure SQL Server**:
   - Enable SQL Server authentication
   - Set sa password to "sasa" (or update connection string)
   - Create database "MedWorkDb"

3. **Update Connection String** (if needed):
   - Modify `appsettings.Development.json` to match your SQL Server configuration

4. **Run Migrations** (if needed):
   ```bash
   cd MedWork.Api
   dotnet ef database update
   ```

## Notes

- The InMemory database approach is recommended for local testing and CI/CD
- For production, SQL Server (or another relational database) should be used
- The `AppDbSeeder.SeedAsync` method in Program.cs ensures test data is available
- The Testing environment uses a fixed secret key for JWT: `TEST_SECRET_KEY_FOR_UNIT_TESTS_ONLY_1234567890`
