using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Data;

/// <summary>
/// DbContext dedicato esclusivamente agli AuditLog, separato dal contesto principale
/// (che usa la cifratura a livello di colonna) così il registro di audit resta
/// non cifrato, immutabile e sempre leggibile per l'RSPP/amministratore.
/// </summary>
public class AuditDbContext : DbContext
{
    public AuditDbContext(DbContextOptions<AuditDbContext> options) : base(options)
    {
    }

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Username).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Role).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Action).HasMaxLength(40).IsRequired();
            entity.Property(x => x.EntityName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Source).HasMaxLength(80);
            entity.HasIndex(x => x.TimestampUtc);
            entity.HasIndex(x => new { x.EntityName, x.EntityId });
        });
    }
}
