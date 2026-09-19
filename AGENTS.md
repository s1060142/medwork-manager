# AGENTS.md

# MedWork Manager
Occupational Health Platform (D.Lgs. 81/08)

This file is the single source of truth for ALL coding agents:

- Kilo Code
- Antigravity
- Hermes
- Gemini
- Claude Code
- Codex
- Any future coding agent

---

# PRIMARY MISSION

Your objective is NOT to generate reports.

Your objective is to improve MedWork.

Every activity must result in one of the following:

- bug fixed
- workflow improved
- technical debt reduced
- performance improved
- security improved
- physician productivity improved

Avoid theoretical work whenever possible.

---

# CURRENT PRODUCT STATUS

Completed:

- Major UI Verification Campaign
- Product Masterplan
- P0 Productivity Improvements
- P1 Productivity Improvements
- Legal Documents Sprint
- Critical Improvements Sprint
- ECC Technical Review (partial remediation)

The project is now in:

BETA HARDENING PHASE

---

# ROLE HIERARCHY

When making decisions, follow this order:

1. Occupational Health Domain Expert
2. Product Owner
3. UX Lead
4. QA Lead
5. Technical Lead
6. Developer

Never optimize code at the expense of physician productivity.

---

# PRODUCT PRINCIPLES

MedWork must be:

- Faster than CartSan
- Faster than Winasped
- Faster than 81ML

Always prefer:

- fewer clicks
- less typing
- more automation
- legal compliance
- physician productivity

Every workflow should be optimized for:

- Medico Competente
- Segreteria
- Datore di Lavoro
- RSPP

---

# DO NOT DO

Never:

- create reports without action
- propose TODOs without implementation
- implement mock workflows
- implement placeholder buttons
- create dead UI
- redesign already completed modules without evidence

Reject:

- theoretical architecture exercises
- speculative refactoring
- cosmetic-only improvements

---

# ALWAYS DO

For every change:

1. Analyze
2. Implement
3. Build
4. Test
5. Validate
6. Re-test

No exceptions.

---

# TESTING REQUIREMENTS

Every feature must have:

- build validation
- UI validation
- workflow validation

When applicable:

- Playwright tests
- integration tests
- regression tests

No feature is considered complete until validated.

---

# ECC REVIEW RULES

Whenever ECC is available:

Prioritize:

1. Critical issues
2. High issues
3. Security
4. Multi-tenancy
5. Data integrity
6. Performance

Never introduce new functionality during ECC remediation unless strictly required.

---

# MULTI-TENANCY RULES

Tenant isolation is mandatory.

Assume every query is production-sensitive.

Verify:

- TenantId filtering
- authorization boundaries
- data leakage risks

Every change affecting queries must be reviewed for tenant isolation.

---

# MEDICAL LEGAL PRIORITIES

Highest-value modules:

1. Medical Visits
2. Fitness Judgments
3. Medical Records (Allegato 3A)
4. Allegato 3B
5. Relazione Art. 40
6. Compliance
7. Scheduling

Changes affecting these areas require extra validation.

---

# ACCEPTANCE TESTING RULE

Agents must behave as:

- Competent Physician
- Medical Secretary
- Employer
- RSPP

Whenever a workflow is validated:

Measure:

- clicks
- friction
- typing effort
- navigation effort

The goal is workflow excellence.

---

# CODE QUALITY RULES

Frontend:

- avoid duplicated React state
- avoid stale UI state
- avoid unnecessary rerenders
- avoid dead components
- avoid duplicated API calls

Backend:

- avoid N+1 queries
- avoid sync-over-async
- avoid hardcoded secrets
- avoid duplicated claims
- avoid transaction inconsistencies

Always prefer maintainability.

---

# PRODUCTION READINESS CHECKLIST

Before declaring anything complete:

- Build passes
- No new warnings
- UI tested
- Critical workflows tested
- No tenant leakage
- No regressions
- Playwright passes
- Documentation updated

---

# DOCUMENTATION RULE

If implementation changes behavior:

Update documentation.

Required files:

- product_bible.md
- backlog.md
- flussi_utente.md
- ux_physician_analysis.md

Keep documentation aligned with the actual product.

Never allow documentation drift.

---

# CURRENT PRIORITY

Phase:
BETA HARDENING

Primary objectives:

1. ECC remediation
2. Production readiness
3. Workflow optimization
4. Edge-case testing
5. Regression prevention

NOT:

- feature explosion
- speculative rewrites
- architecture theatre

---

# SUCCESS METRIC

Success is NOT:

- reports generated
- code written
- files modified

Success is:

- physicians complete tasks faster
- fewer clicks
- fewer errors
- better compliance
- better legal protection
- stable production behavior

Every decision must support these outcomes.