using MedWork.Api.Models;

namespace MedWork.Api.Services;

public interface ITenantService
{
    Task<Tenant?> GetByIdAsync(int id);
    Task<Tenant?> GetBySlugAsync(string slug);
    Task<IEnumerable<Tenant>> GetAllAsync();
    Task<Tenant> CreateAsync(Tenant tenant);
    Task<Tenant> UpdateAsync(Tenant tenant);
    Task<bool> DeleteAsync(int id);
    Task<TenantSettings?> GetSettingAsync(int tenantId, string key);
    Task<TenantSettings> SetSettingAsync(int tenantId, string key, string? value, string? description = null);
}

public interface IUserService
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(int tenantId, string email);
    Task<User?> GetByExternalIdAsync(int tenantId, string externalId, string provider);
    Task<IEnumerable<User>> GetByTenantAsync(int tenantId);
    Task<User> CreateAsync(User user, string password);
    Task<User> UpdateAsync(User user);
    Task<bool> ValidatePasswordAsync(int tenantId, string email, string password);
    Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    Task<IEnumerable<string>> GetUserPermissionsAsync(int userId);
    Task<bool> HasPermissionAsync(int userId, string permissionName);
}

public interface IRoleService
{
    Task<Role?> GetByIdAsync(int id);
    Task<Role?> GetByNameAsync(int tenantId, string name);
    Task<IEnumerable<Role>> GetByTenantAsync(int tenantId);
    Task<Role> CreateAsync(Role role);
    Task<Role> UpdateAsync(Role role);
    Task<bool> DeleteAsync(int id);
    Task AssignPermissionAsync(int roleId, int permissionId);
    Task RevokePermissionAsync(int roleId, int permissionId);
    Task<IEnumerable<Permission>> GetRolePermissionsAsync(int roleId);
}

public interface IPermissionService
{
    Task<Permission?> GetByIdAsync(int id);
    Task<Permission?> GetByNameAsync(string name);
    Task<IEnumerable<Permission>> GetAllAsync();
    Task<Permission> CreateAsync(Permission permission);
    Task SeedDefaultPermissionsAsync();
}