# MedWork Manager - Company Groups Context

## Domain Terminology

**Company Group** - A logical grouping of companies that share economic control, common ownership, or belong to the same corporate holding/consortium. Used for:
- Consolidated reporting and analytics
- Shared medical protocols and health surveillance programs  
- Common risk factors and prevention measures
- Unified billing and administrative processes
- Group-wide health and safety policies

**Company** - A legal entity with its own VAT number, tax code, and legal registration that conducts business activities. A company can belong to zero or one company group.

**Tenant** - The multi-tenant isolation boundary (typically a corporate client or service provider using MedWork Manager).

## Ubiquitous Language

- **CompanyGroup.Name** - Commercial name of the group (e.g., "Gruppo Acme")
- **CompanyGroup.LegalName** - Official legal name of the group entity
- **CompanyGroup.SingleArchive** - Flag indicating if the group uses a single centralized document archive
- **CompanyGroup.VATNumber/TaxCode** - Fiscal identifiers of the group (if it has its own legal personality)
- **CompanyGroup.Address/City/etc.** - Legal/operational address of the group headquarters

## Key Invariants

1. **Multi-tenant scoping**: Every CompanyGroup belongs to exactly one Tenant
2. **Company membership**: A Company can belong to zero or one CompanyGroup (within the same tenant)
3. **Circular reference prevention**: CompanyGroups cannot contain other CompanyGroups
4. **Data consistency**: When a company is assigned to a group, inheritance rules may apply for certain attributes (protocols, risk factors, etc.)

## Architectural Decision Records (ADRs)

See `docs/adr/` for detailed decisions.

## Open Questions

- Should CompanyGroup have its own independent fiscal/VAT number, or only inherit from parent companies?
- What attributes should be inheritable from CompanyGroup to Company (protocols, risk factors, medical visit frequencies)?
- How should reporting work across Company vs CompanyGroup vs Tenant levels?