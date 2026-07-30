using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class PrintOptions
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string ReportName { get; set; } = string.Empty;

    [StringLength(50)]
    public string PaperSize { get; set; } = "A4";

    [StringLength(20)]
    public string Orientation { get; set; } = "Portrait";

    public int MarginTop { get; set; } = 20;
    public int MarginBottom { get; set; } = 20;
    public int MarginLeft { get; set; } = 20;
    public int MarginRight { get; set; } = 20;

    public bool ShowHeader { get; set; } = true;
    public bool ShowFooter { get; set; } = true;
    public bool ShowPageNumbers { get; set; } = true;

    [StringLength(500)]
    public string? CustomHeader { get; set; }
    [StringLength(500)]
    public string? CustomFooter { get; set; }
}
