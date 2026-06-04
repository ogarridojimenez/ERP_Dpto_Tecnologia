# ============================================================================
# SITRADE — Setup Supabase
# ============================================================================
# Este script:
#   1. Pide la contraseña de la BD de Supabase
#   2. Busca el UUID del admin en auth.users
#   3. Reemplaza 'SEED_USER_ID' en el schema
#   4. Ejecuta el schema completo en Supabase
#
# Uso: .\setup-supabase.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        SITRADE — Setup Supabase Cloud          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$PGPASSWORD = Read-Host "Contraseña de Supabase (proyecto bbznwxreyqswhgtdihxe)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($PGPASSWORD)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$HostName = "aws-1-us-east-2.pooler.supabase.com"
$User = "postgres.bbznwxreyqswhgtdihxe"
$Port = "6543"
$ConnString = "postgresql://${User}:$( [System.Web.HttpUtility]::UrlEncode($PlainPassword) )@${HostName}:${Port}/postgres?sslmode=require"
$PsqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $PsqlPath)) {
    Write-Host "ERROR: psql no encontrado en $PsqlPath" -ForegroundColor Red
    exit 1
}

# 1. Test connection
Write-Host "[1/4] Probando conexión..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = $PlainPassword
    $result = & $PsqlPath -h $HostName -p 6543 -U $User -d "postgres" -c "SELECT 1 AS conexion_ok;" -v "sslmode=require"
    Write-Host "  ✅ Conexión exitosa" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Error de conexión: $_" -ForegroundColor Red
    exit 1
}

# 2. Get admin user UUID from auth.users
Write-Host "[2/4] Buscando usuarios en auth.users..." -ForegroundColor Yellow
$Users = & $PsqlPath -h $HostName -p 6543 -U $User -d "postgres" -t -A -c "SELECT id, email FROM auth.users ORDER BY created_at LIMIT 5;" -v "sslmode=require"

if (-not $Users) {
    Write-Host "  ⚠️  No hay usuarios en auth.users." -ForegroundColor Yellow
    Write-Host "  Debes crear un usuario admin EN EL NAVEGADOR:" -ForegroundColor Yellow
    Write-Host "    1. Ve a https://app.supabase.com/project/bbznwxreyqswhgtdihxe/auth/users" -ForegroundColor White
    Write-Host "    2. Crea un usuario con email y contraseña" -ForegroundColor White
    Write-Host "    3. Vuelve a ejecutar este script" -ForegroundColor White
    exit 1
}

Write-Host "  Usuarios encontrados:" -ForegroundColor Green
$UserList = $Users -split "`n" | Where-Object { $_ -ne "" }
$UserTable = @()
$i = 0
foreach ($u in $UserList) {
    $parts = $u -split "\|"
    if ($parts.Count -ge 2) {
        $i++
        $UserTable += [PSCustomObject]@{ Id = $i; UUID = $parts[0].Trim(); Email = $parts[1].Trim() }
        Write-Host "     [$i] $($parts[1].Trim())  ($($parts[0].Trim()))" -ForegroundColor White
    }
}

if ($UserTable.Count -eq 1) {
    $SelectedUUID = $UserTable[0].UUID
    Write-Host "  → Usando: $($UserTable[0].Email)" -ForegroundColor Green
} else {
    $Selection = Read-Host "Selecciona el número del usuario admin"
    $SelectedUUID = $UserTable[$Selection - 1].UUID
}

# 3. Replace SEED_USER_ID and run schema
Write-Host "[3/4] Preparando schema..." -ForegroundColor Yellow
$SchemaPath = "E:\Mis proyectos\CRM_Dpto_Tecnologia\supabase-schema.sql"
$TempSchema = [System.IO.Path]::GetTempFileName() + ".sql"

# Read schema, replace placeholder, write temp file
(Get-Content $SchemaPath -Raw) -replace "'SEED_USER_ID'", "'$SelectedUUID'" | Set-Content $TempSchema -Encoding UTF8

Write-Host "  ✅ Placeholder reemplazado con UUID: $SelectedUUID" -ForegroundColor Green

# 4. Execute schema
Write-Host "[4/4] Ejecutando schema en Supabase..." -ForegroundColor Yellow
Write-Host "  Esto puede tomar 1-2 minutos..." -ForegroundColor Gray

$env:PGPASSWORD = $PlainPassword
$env:PGSSLMODE = "require"
& $PsqlPath -h $HostName -p 6543 -U $User -d "postgres" -f $TempSchema -v "sslmode=require" 2>&1 | Tee-Object -Variable Output

# Check for critical errors (ignore "already exists" notices)
$Errors = $Output | Select-String "ERROR:"
$CriticalErrors = $Errors | Where-Object { $_ -notmatch "already exists" -and $_ -notmatch "permission denied for schema auth" }

if ($CriticalErrors) {
    Write-Host ""
    Write-Host "⚠️  Se encontraron errores (revisa arriba):" -ForegroundColor Yellow
    $CriticalErrors | ForEach-Object { Write-Host "  ❌ $_" -ForegroundColor Red }
} else {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║        ✅  SCHEMA SUBIDO EXITOSAMENTE           ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Ve al SQL Editor de Supabase y verifica las tablas" -ForegroundColor White
    Write-Host "  2. Crea los profiles para cada usuario:" -ForegroundColor White
    Write-Host "     INSERT INTO profiles (id, role) VALUES" -ForegroundColor Gray
    Write-Host "       ('UUID_DEL_ADMIN', 'admin')," -ForegroundColor Gray
    Write-Host "       ('UUID_DEL_JEFE', 'jefe')," -ForegroundColor Gray
    Write-Host "       ('UUID_DE_RRHH', 'rrhh')," -ForegroundColor Gray
    Write-Host "       ('UUID_DEL_TECNICO', 'tecnico');" -ForegroundColor Gray
    Write-Host "  3. Corre: npx prisma generate" -ForegroundColor White
}

# Cleanup
Remove-Item $TempSchema -Force -ErrorAction SilentlyContinue
Write-Host ""
Read-Host "Presiona Enter para salir"
