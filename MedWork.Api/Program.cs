using MedWork.Api.Data;
using MedWork.Api.Security;
using MedWork.Api.Services;
using MedWork.Api.Compliance;
using MedWork.Api.Integrations;
using MedWork.Api.Analytics;
using MedWork.Api.Enterprise;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.Configure<AuthSettings>(builder.Configuration.GetSection("Auth"));
builder.Services.Configure<SPIDAuthOptions>(builder.Configuration.GetSection("Auth:SPID"));
builder.Services.Configure<CIEAuthOptions>(builder.Configuration.GetSection("Auth:CIE"));
builder.Services.Configure<KeycloakAuthOptions>(builder.Configuration.GetSection("Auth:Keycloak"));

builder.Services.AddHttpClient();
builder.Services.AddHttpContextAccessor();

builder.Services.AddControllers(options =>
    {
        options.Filters.Add<TenantContextFilter>(order: int.MinValue);
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        // Avoid fatal 500s when serializing entities with bidirectional navigation
        // properties (e.g. VisitExam <-> ExamType).
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "MedWork API", Version = "v1" });

        // Register the custom operation filter to handle IFormFile parameters
        // This fixes the SwaggerGeneratorException: "Error reading parameter(s) for action ... as [FromForm] attribute used with IFormFile"
        options.OperationFilter<MedWork.Api.Swagger.FormFileOperationFilter>();

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Insert JWT token"
    };

    options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, securityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = JwtBearerDefaults.AuthenticationScheme
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDataProtection();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IFieldEncryptionService, FieldEncryptionService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// Multi-tenant & Auth services
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IExternalAuthService, ExternalAuthService>();

// Domain services
builder.Services.AddScoped<IPersonalProtocolAssignmentService, PersonalProtocolAssignmentService>();
builder.Services.AddScoped<IAlertService, AlertMultiChannelService>();
builder.Services.AddScoped<INotificationService, AlertMultiChannelService>();
builder.Services.AddScoped<INotificationTransport, ConsoleNotificationTransport>();
builder.Services.AddScoped<ISignatureService, SignatureService>();
builder.Services.AddScoped<IDocumentGenerationService, DocumentGenerationService>();
builder.Services.AddScoped<IAIChartingService, AIChartingService>();
builder.Services.AddScoped<IQuestionnaireScoringService, QuestionnaireScoringService>();
builder.Services.AddScoped<IComplianceRuleEngine, ComplianceRuleEngine>();
builder.Services.AddScoped<IRegulatoryChangelogParser, RegulatoryChangelogParser>();
builder.Services.AddScoped<IDpiaAssistant, DpiaAssistant>();
builder.Services.AddScoped<IConsentManager, ConsentManager>();
builder.Services.AddScoped<HrImportExportService>();
builder.Services.AddScoped<IAnomalyDetectionService, AnomalyDetectionService>();
builder.Services.AddScoped<INoShowPredictionService, NoShowPredictionService>();
builder.Services.AddScoped<ISlotOptimizationService, SlotOptimizationService>();
builder.Services.AddScoped<IBenchmarkService, BenchmarkService>();
builder.Services.AddScoped<IWhiteLabelResolver, WhiteLabelResolver>();
builder.Services.AddScoped<IDeadlineCalculationService, DeadlineCalculationService>();

    if (builder.Environment.IsEnvironment("Testing"))
    {
        var testDbName = Environment.GetEnvironmentVariable("TEST_DB_NAME") ?? "MedWorkTestDb";
        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(testDbName)
                   .ConfigureWarnings(w => { })
        );
    }
else
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
}

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
                  ?? throw new InvalidOperationException("JWT configuration is missing.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("forgot-password", opt =>
    {
        opt.PermitLimit = 3;
        opt.Window = TimeSpan.FromHours(1);
    });
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) 
                         ?? new[] { "http://localhost:5173", "http://127.0.0.1:5173" };
    
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!app.Environment.IsEnvironment("Testing"))
    {
        dbContext.Database.Migrate();
    }
    await AppDbSeeder.SeedAsync(dbContext, app.Environment.IsEnvironment("Testing"));
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program;
