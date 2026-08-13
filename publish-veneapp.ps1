param(
  [string]$Repo = "https://github.com/jukazilli/veneapp.git",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root "source"
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("veneapp-publish-" + [guid]::NewGuid().ToString("N"))

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git não encontrado. Instale o Git for Windows e execute o script novamente."
}

Write-Host "[1/6] Validando pacote Veneapp..."
if (-not (Test-Path (Join-Path $source "package.json"))) { throw "source/package.json não encontrado." }
if (Test-Path (Join-Path $source ".env.local")) { throw ".env.local não pode ser publicado." }

Write-Host "[2/6] Clonando repositório oficial..."
git clone --branch $Branch --single-branch $Repo $temp

Write-Host "[3/6] Substituindo conteúdo do projeto (preservando .git)..."
Get-ChildItem -Force $temp | Where-Object { $_.Name -ne ".git" } | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $source "*") -Destination $temp -Recurse -Force
Get-ChildItem -Force $source | Where-Object { $_.Name -like ".*" } | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $temp -Recurse -Force
}

Push-Location $temp
try {
  Write-Host "[4/6] Conferindo arquivos que entrarão no commit..."
  if (Test-Path ".env.local") { throw ".env.local detectado antes do commit." }
  git add -A
  $tracked = git diff --cached --name-only
  if ($tracked -match "(^|/)\.env\.local$") { throw ".env.local entrou no staging; publicação cancelada." }
  git status --short

  Write-Host "[5/6] Criando commit..."
  git commit -m "release: Veneapp 0.2.2"

  Write-Host "[6/6] Enviando main para GitHub..."
  git push origin $Branch
  Write-Host ""
  Write-Host "SUCESSO: Veneapp 0.2.2 publicado em $Repo ($Branch)."
}
finally {
  Pop-Location
}
