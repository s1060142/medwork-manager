import re
import os

admin_path = r'c:\github\medwork-manager\MedWork.Api\Controllers\AdminCrudController.cs'
with open(admin_path, 'r', encoding='utf-8') as f:
    admin_content = f.read()

# Add GetTenantId() at the end
if 'int GetTenantId()' not in admin_content:
    tenant_id_method = """
    private int GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value;
        return int.TryParse(tenantClaim, out var tenantId) ? tenantId : 0;
    }
}"""
    admin_content = admin_content.rstrip()
    if admin_content.endswith('}'):
        admin_content = admin_content[:-1] + tenant_id_method

# Fix FirstOrDefaultAsync(x => x.Id == id) in PUT and DELETE
# We only want to inject var tenantId = GetTenantId(); and && x.TenantId == tenantId
# Since almost every PUT/DELETE starts with:
# var entity = await _dbContext.<Entity>.FirstOrDefaultAsync(x => x.Id == id);
# We can regex replace that.

# 1. Standard FirstOrDefaultAsync
# Note: Since there are many, we can capture the DbSet name.
admin_content = re.sub(
    r'(var entity = await _dbContext\.[A-Za-z]+\.FirstOrDefaultAsync\(x => x\.Id == id\);)',
    lambda m: f'var tenantId = GetTenantId();\n        {m.group(1).replace("x.Id == id", "x.Id == id && x.TenantId == tenantId")}',
    admin_content
)

# 2. company-doctors
admin_content = re.sub(
    r'(var companyExists = await _dbContext\.Companies\.AnyAsync\(x => x\.Id == request\.CompanyId)\);',
    r'var tenantId = GetTenantId();\n        \g<1> && x.TenantId == tenantId);',
    admin_content
)

# 3. employee-risks
admin_content = re.sub(
    r'(var entity = await _dbContext\.EmployeeRisks\s*\.\s*FirstOrDefaultAsync\(x => x\.EmployeeId == employeeId && x\.RiskFactorId == riskFactorId)\);',
    r'var tenantId = GetTenantId();\n        \g<1> && x.TenantId == tenantId);',
    admin_content
)

# 4. employee-risks targetExists
admin_content = re.sub(
    r'(var targetExists = await _dbContext\.EmployeeRisks\s*\.\s*AnyAsync\(x => x\.EmployeeId == request\.EmployeeId && x\.RiskFactorId == request\.RiskFactorId)\);',
    r'\g<1> && x.TenantId == tenantId);',
    admin_content
)

with open(admin_path, 'w', encoding='utf-8') as f:
    f.write(admin_content)

ai_path = r'c:\github\medwork-manager\MedWork.Api\Controllers\MedicalVisitAIController.cs'
with open(ai_path, 'r', encoding='utf-8') as f:
    ai_content = f.read()

if 'using Microsoft.AspNetCore.Authorization;' not in ai_content:
    ai_content = ai_content.replace('using Microsoft.AspNetCore.Mvc;', 'using Microsoft.AspNetCore.Mvc;\nusing Microsoft.AspNetCore.Authorization;\nusing MedWork.Api.Security;\nusing Microsoft.EntityFrameworkCore;')

ai_content = ai_content.replace('[ApiController]', '[ApiController]\n[Authorize(Roles = AppRole.Doctor + "," + AppRole.Admin)]')

transcribe_code = """var tenantClaim = User.FindFirst("TenantId")?.Value;
        if (!int.TryParse(tenantClaim, out var tenantId) || tenantId < 1)
        {
            return Unauthorized();
        }

        var visit = await _dbContext.MedicalVisits.FirstOrDefaultAsync(v => v.Id == visitId && v.TenantId == tenantId);"""

ai_content = ai_content.replace('var visit = await _dbContext.MedicalVisits.FindAsync(visitId);', transcribe_code)

with open(ai_path, 'w', encoding='utf-8') as f:
    f.write(ai_content)

print("Fixed both controllers.")
