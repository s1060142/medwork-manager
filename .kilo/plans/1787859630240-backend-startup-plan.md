# Backend Startup Fix for Beta Gate Tests

## 1. Objective

Ensure the .NET backend API is running and reachable at `http://127.0.0.1:5279` before Playwright E2E tests execute, so that `test-fixtures.ts` API calls and UI login flows can succeed.

## 2. Analysis

**Current state:**
- `medwork-frontend/playwright.config.ts` defines a single `webServer` that only starts the Vite frontend (`npm run dev` on port 5173).
- The backend API (port 5279) is never started by Playwright. Tests that call `${API_URL}/api/auth/login` immediately fail with connection refused.
- `start-backend.ps1` exists but is not wired into the test workflow. It uses `dotnet run --environment Testing`, which is not a reliable way to set `ASPNETCORE_ENVIRONMENT`; `launchSettings.json` can override it. The logs show prior backend runs used SQL Server (Development mode), not the InMemory database expected in Testing mode.
- Backend logs (`backend2.log`, `backend3.log`, `backend4.log`) prove the application runs correctly when started properly, but `backend.log` shows a run that never reached the "Now listening on" message.

**Root cause:**
The test runner has no automated backend startup. Even when `start-backend.ps1` is used, the environment flag is not reliably applied, and the script is not invoked by Playwright.

**Desired state:**
Playwright should start the backend in Testing mode (InMemory database) on port 5279, wait for it to be ready, then start the frontend and run the tests.

## 3. Impacted Files

- `medwork-frontend/playwright.config.ts` — add backend `webServer` entry
- `start-backend.ps1` — fix environment variable handling for manual runs

## 4. Implementation Strategy

1. Convert the single `webServer` in `playwright.config.ts` into an array of two servers: backend first, then frontend. Playwright starts them in order and waits for each readiness URL.
2. Backend command: set `ASPNETCORE_ENVIRONMENT=Testing` explicitly, run `dotnet run --urls http://127.0.0.1:5279` from the `MedWork.Api` directory. This bypasses `launchSettings.json` environment overrides and forces the InMemory database path defined in `Program.cs` lines 106-111.
3. Fix `start-backend.ps1` to use the same explicit environment variable approach so manual runs also use the Testing profile.
4. Keep `reuseExistingServer: true` (non-CI) so developers do not restart a healthy backend on every test run.

## 5. Risks

- **Backend startup time**: First run may restore NuGet packages and compile. The existing 120s timeout is sufficient but should be monitored.
- **Port conflicts**: If another process occupies 5279, startup fails. The `reuseExistingServer` flag helps when the port is already in use by a valid backend.
- **PowerShell quoting**: Inline environment variables in `webServer.command` must be quoted correctly for Windows `cmd.exe` or PowerShell. Using `cmd /c "cd ... && set ... && dotnet run ..."` avoids PowerShell quoting pitfalls.
- **CORS**: The Testing environment uses `appsettings.Testing.json`, which does not define `AllowedOrigins`. `Program.cs` falls back to `http://localhost:5173` and `http://127.0.0.1:5173`, matching the frontend URL. No CORS changes needed.

## 6. Validation Approach

1. Run `npx playwright test` from `medwork-frontend`.
2. Verify Playwright output shows both backend and frontend web servers starting.
3. Verify the backend log shows `ASPNETCORE_ENVIRONMENT` resolving to `Testing` and the InMemory database being used.
4. Confirm tests can reach `http://127.0.0.1:5279/api/auth/login` and the dashboard loads.

## 7. Step-by-Step Implementation Plan

### Step 1: Update `playwright.config.ts`
- Replace the single `webServer` object with a `webServer` array containing two entries:
  - **Backend server**:
    - `command`: `cmd /c "cd MedWork.Api && set ASPNETCORE_ENVIRONMENT=Testing && dotnet run --urls http://127.0.0.1:5279"`
    - `url`: `http://127.0.0.1:5279`
    - `reuseExistingServer`: `!process.env.CI`
    - `timeout`: `120 * 1000`
  - **Frontend server** (existing):
    - `command`: `npm run dev`
    - `url`: `http://127.0.0.1:5173`
    - `reuseExistingServer`: `!process.env.CI`
    - `timeout`: `120 * 1000`

### Step 2: Fix `start-backend.ps1`
- Replace the unreliable `--environment Testing` flag with an explicit environment variable assignment.
- New content:
  ```powershell
  $env:ASPNETCORE_ENVIRONMENT = 'Testing'
  Set-Location MedWork.Api
  & "C:\Program Files\dotnet\dotnet" run --urls http://127.0.0.1:5279 2>&1 | Tee-Object -File backend.log -Append
  ```

### Step 3: Verify
- Execute Playwright tests and confirm the backend starts in Testing mode and tests pass the login/API stage.
