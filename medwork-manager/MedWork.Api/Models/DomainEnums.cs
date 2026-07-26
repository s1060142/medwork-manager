namespace MedWork.Api.Models;

public enum MedicalRecordStatus
{
    Active = 1,
    Suspended = 2,
    Closed = 3
}

public enum MedicalVisitType
{
    Preventive = 1,
    Periodic = 2,
    RoleChange = 3,
    EmployeeRequest = 4,
    EndOfRelationship = 5
}

public enum ScheduledExamStatus
{
    Planned = 1,
    Completed = 2,
    Cancelled = 3
}

public enum NotificationChannel
{
    Sms = 1,
    Email = 2
}