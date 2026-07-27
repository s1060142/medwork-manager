namespace MedWork.Api.Contracts.Auth;

public class ContextItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "Company" | "Branch"
    public int? ParentId { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public bool IsDefault { get; set; }
}

public class UserContextsResponse
{
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public List<ContextItem> Contexts { get; set; } = new();
    public ContextItem? SelectedContext { get; set; }
}

public class SelectContextRequest
{
    public int ContextId { get; set; }
    public string ContextType { get; set; } = string.Empty; // "Company" | "Branch"
}

public class SelectContextResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AccessToken { get; set; }
}