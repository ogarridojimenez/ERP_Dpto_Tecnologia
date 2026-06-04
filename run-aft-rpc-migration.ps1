$supabaseUrl = "https://bbznwxreyqswhgtdihxe.supabase.co"
$serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem53eHJleXFzd2hndGRpaHhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNjg0OTI0NSwiZXhwIjoyMDIyNDI1MjQ1fQ.dummy_key_placeholder_will_be_read_from_env"

# Read the service role key from .env
$envFile = "E:\Mis proyectos\ERP_Dpto_Tecnologia\.env"
$envContent = Get-Content $envFile -Raw

if ($envContent -match 'SUPABASE_SERVICE_ROLE_KEY=(.+)') {
    $serviceKey = $matches[1].Trim()
    Write-Host "Service key loaded from .env"
} else {
    Write-Host "ERROR: Could not find SUPABASE_SERVICE_ROLE_KEY in .env"
    exit 1
}

$sql = Get-Content "E:\Mis proyectos\ERP_Dpto_Tecnologia\supabase\migrations\2026-06-01-aft-sync-rpc.sql" -Raw

$body = @{
    query = $sql
} | ConvertTo-Json

$headers = @{
    "apikey" = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type" = "application/json"
}

Write-Host "Executing RPC migration..."
try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body
    Write-Host "Success: $response"
} catch {
    Write-Host "Error: $_"
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode.value__)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}
