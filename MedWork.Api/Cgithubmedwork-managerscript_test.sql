C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1608: Detected package version outside of dependency constraint: Microsoft.CodeAnalysis.Workspaces.MSBuild 5.0.0 requires Microsoft.CodeAnalysis.Workspaces.Common (= 5.0.0) but version Microsoft.CodeAnalysis.Workspaces.Common 5.6.0 was resolved.
C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1904: Package 'System.Drawing.Common' 4.7.0 has a known critical severity vulnerability, https://github.com/advisories/GHSA-rxg9-xrhp-64gj
C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1608: Detected package version outside of dependency constraint: Microsoft.CodeAnalysis.Workspaces.MSBuild 5.0.0 requires Microsoft.CodeAnalysis.Workspaces.Common (= 5.0.0) but version Microsoft.CodeAnalysis.Workspaces.Common 5.6.0 was resolved.
C:\github\medwork-manager\MedWork.Api\MedWork.Api.csproj : warning NU1904: Package 'System.Drawing.Common' 4.7.0 has a known critical severity vulnerability, https://github.com/advisories/GHSA-rxg9-xrhp-64gj
Build started...
Build succeeded.
System.InvalidOperationException: The migration '20260827211131' was not found.
   at Microsoft.EntityFrameworkCore.Migrations.MigrationsAssemblyExtensions.GetMigrationId(IMigrationsAssembly assembly, String nameOrId)
   at Microsoft.EntityFrameworkCore.Migrations.Internal.Migrator.GenerateScript(String fromMigration, String toMigration, MigrationsSqlGenerationOptions options)
   at Microsoft.EntityFrameworkCore.Design.Internal.MigrationsOperations.ScriptMigration(String fromMigration, String toMigration, MigrationsSqlGenerationOptions options, String contextType)
   at Microsoft.EntityFrameworkCore.Design.OperationExecutor.ScriptMigrationImpl(String fromMigration, String toMigration, Boolean idempotent, Boolean noTransactions, String contextType)
   at Microsoft.EntityFrameworkCore.Design.OperationExecutor.ScriptMigration.<>c__DisplayClass0_0.<.ctor>b__0()
   at Microsoft.EntityFrameworkCore.Design.OperationExecutor.OperationBase.<>c__DisplayClass3_0`1.<Execute>b__0()
   at Microsoft.EntityFrameworkCore.Design.OperationExecutor.OperationBase.Execute(Action action)
The migration '20260827211131' was not found.
