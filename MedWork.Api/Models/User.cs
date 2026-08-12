using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class User
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Email { get; set; } = string.Empty;

    [StringLength(256)]
    public string? PasswordHash { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string LastName { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Role { get; set; }

    [StringLength(100)]
    public string? ExternalId { get; set; }

    [StringLength(50)]
    public string? ExternalProvider { get; set; }

    public bool IsActive { get; set; } = true;

    public bool EmailConfirmed { get; set; } = false;

    public DateTime? LastLoginAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
}

public class Role
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Description { get; set; }

    public bool IsSystem { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class Permission
{
    public int Id { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Description { get; set; }

    [StringLength(50)]
    public string? Category { get; set; }

    public bool IsSystem { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    public ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
}

public class UserRole
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int UserId { get; set; }

    [Range(1, int.MaxValue)]
    public int RoleId { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    [Range(1, int.MaxValue)]
    public int? AssignedByUserId { get; set; }

    // Navigation properties
    public User? User { get; set; }
    public Role? Role { get; set; }
}

public class RolePermission
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int RoleId { get; set; }

    [Range(1, int.MaxValue)]
    public int PermissionId { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Role? Role { get; set; }
    public Permission? Permission { get; set; }
}

public class UserPermission
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int UserId { get; set; }

    [Range(1, int.MaxValue)]
    public int PermissionId { get; set; }

    public bool IsGranted { get; set; } = true;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    [Range(1, int.MaxValue)]
    public int? AssignedByUserId { get; set; }

    // Navigation properties
    public User? User { get; set; }
    public Permission? Permission { get; set; }
}