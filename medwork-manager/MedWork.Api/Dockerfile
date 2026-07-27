# Immagine runtime per MedWork.Api (ASP.NET Core 8)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY MedWork.Api/MedWork.Api.csproj MedWork.Api/
RUN dotnet restore MedWork.Api/MedWork.Api.csproj
COPY MedWork.Api/ MedWork.Api/
RUN dotnet publish MedWork.Api/MedWork.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "MedWork.Api.dll"]
