using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using MedWork.Api.Models;
using MedWork.Api.Data;
using MedWork.Api.Controllers;
using MedWork.Api.Services;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace MedWork.Api.Tests.Controllers;

public class AdminCrudControllerTests
{
    private static AdminCrudController CreateController(AppDbContext context, IPersonalProtocolAssignmentService protocolService)
    {
        var controller = new AdminCrudController(context, protocolService);
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim("tenant_id", "1"),
            new Claim(ClaimTypes.Role, AppRole.Admin),
        }, "test");
        var httpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        return controller;
    }

    [Fact]
    public async Task CreateCompanyGroup_WhenCalled_ReturnsOkWithGroup()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb1")
            .Options;

        var mockEncryptionService = Mock.Of<IFieldEncryptionService>();
        using var context = new AppDbContext(options, mockEncryptionService);
        var group = new CompanyGroup { Name = "Test Group", LegalName = "Test S.p.A." };
        context.CompanyGroups.Add(group);
        await context.SaveChangesAsync();

        var mockProtocolService = Mock.Of<IPersonalProtocolAssignmentService>();
        var controller = CreateController(context, mockProtocolService);

        // Act
        var result = await controller.CreateCompanyGroup(group);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedGroup = Assert.IsType<CompanyGroup>(okResult.Value);
        Assert.Equal("Test Group", returnedGroup.Name);
    }

    [Fact]
    public async Task UpdateCompanyGroup_ExistingGroup_ReturnsOk()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb2")
            .Options;

        var mockEncryptionService = Mock.Of<IFieldEncryptionService>();
        using var context = new AppDbContext(options, mockEncryptionService);
        var existing = new CompanyGroup { Id = 1, Name = "Original", LegalName = "Original S.p.A.", TenantId = 1 };
        context.CompanyGroups.Add(existing);
        await context.SaveChangesAsync();

        var mockProtocolService = Mock.Of<IPersonalProtocolAssignmentService>();
        var controller = CreateController(context, mockProtocolService);

        // Act
        var updated = new CompanyGroup { Id = 1, Name = "Updated", LegalName = "Updated S.p.A." };
        var result = await controller.UpdateCompanyGroup(1, updated);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedGroup = Assert.IsType<CompanyGroup>(okResult.Value);
        Assert.Equal("Updated", returnedGroup.Name);
    }

    [Fact]
    public async Task UpdateCompanyGroup_NonExistentGroup_ReturnsNotFound()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb3")
            .Options;

        var mockEncryptionService = Mock.Of<IFieldEncryptionService>();
        using var context = new AppDbContext(options, mockEncryptionService);

        var mockProtocolService = Mock.Of<IPersonalProtocolAssignmentService>();
        var controller = CreateController(context, mockProtocolService);

        // Act
        var result = await controller.UpdateCompanyGroup(99, new CompanyGroup { Id = 99, Name = "Nope" });

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task DeleteCompanyGroup_ExistingGroup_ReturnsNoContent()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb4")
            .Options;

        var mockEncryptionService = Mock.Of<IFieldEncryptionService>();
        using var context = new AppDbContext(options, mockEncryptionService);
        var existing = new CompanyGroup { Id = 1, Name = "ToDelete", TenantId = 1 };
        context.CompanyGroups.Add(existing);
        await context.SaveChangesAsync();

        var mockProtocolService = Mock.Of<IPersonalProtocolAssignmentService>();
        var controller = CreateController(context, mockProtocolService);

        // Act
        var result = await controller.DeleteCompanyGroup(1);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeleteCompanyGroup_NonExistentGroup_ReturnsNotFound()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb5")
            .Options;

        var mockEncryptionService = Mock.Of<IFieldEncryptionService>();
        using var context = new AppDbContext(options, mockEncryptionService);

        var mockProtocolService = Mock.Of<IPersonalProtocolAssignmentService>();
        var controller = CreateController(context, mockProtocolService);

        // Act
        var result = await controller.DeleteCompanyGroup(99);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }
}