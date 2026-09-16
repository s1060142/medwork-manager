FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY MedWork.Api/MedWork.Api.csproj MedWork.Api/
COPY MedWork.Api/appsettings*.json MedWork.Api/
RUN dotnet restore MedWork.Api/MedWork.Api.csproj
COPY . .
WORKDIR /src/MedWork.Api
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_ENVIRONMENT=Docker
ENV ConnectionStrings__DefaultConnection="Server=sqlserver,1433;Database=MedWorkDb;User ID=sa;Password=sasa;TrustServerCertificate=True;Pooling=False;MultipleActiveResultSets=False;"
EXPOSE 80
ENTRYPOINT ["dotnet", "MedWork.Api.dll"]