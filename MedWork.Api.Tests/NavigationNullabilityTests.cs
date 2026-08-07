using System.Reflection;
using MedWork.Api.Models;

namespace MedWork.Api.Tests;

public class NavigationNullabilityTests
{
    [Theory]
    [InlineData(typeof(Branch), nameof(Branch.Company))]
    [InlineData(typeof(Employee), nameof(Employee.Company))]
    [InlineData(typeof(Employee), nameof(Employee.Branch))]
    [InlineData(typeof(MedicalRecord), nameof(MedicalRecord.Employee))]
    [InlineData(typeof(MedicalVisit), nameof(MedicalVisit.Employee))]
    [InlineData(typeof(MedicalVisit), nameof(MedicalVisit.Doctor))]
    [InlineData(typeof(EmployeeRisk), nameof(EmployeeRisk.Employee))]
    [InlineData(typeof(EmployeeRisk), nameof(EmployeeRisk.RiskFactor))]
    [InlineData(typeof(VisitExam), nameof(VisitExam.MedicalVisit))]
    [InlineData(typeof(VisitExam), nameof(VisitExam.ExamType))]
    public void Navigation_Property_Is_Nullable(Type modelType, string propertyName)
    {
        var property = modelType.GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
        Assert.NotNull(property);

        var nullability = new NullabilityInfoContext().Create(property!);

        Assert.Equal(NullabilityState.Nullable, nullability.ReadState);
    }
}
