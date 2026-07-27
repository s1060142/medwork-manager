@echo off
set Jwt__SecretKey=MedWorkDevSecretKey12345678901234567890123456789012
set Jwt__Issuer=MedWork.Api
set Jwt__Audience=MedWork.Client
set Jwt__ExpirationMinutes=120
set ASPNETCORE_ENVIRONMENT=Development
cd /d C:\Users\rober\Desktop\medwork-manager\medwork-manager\MedWork.Api\publish
MedWork.Api.exe --urls "http://localhost:5279"