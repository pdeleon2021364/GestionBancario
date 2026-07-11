FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY . .

RUN dotnet restore src/AuthService.Api/AuthService.Api.csproj
RUN dotnet publish src/AuthService.Api/AuthService.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 5917

ENV ASPNETCORE_URLS=http://+:${PORT:-5917}

ENTRYPOINT ["dotnet", "AuthService.Api.dll"]
