# Скрипт для включения TCP/IP в PostgreSQL
# Запустите от имени Администратора!

Write-Host "Настройка PostgreSQL для TCP/IP подключений..." -ForegroundColor Cyan
Write-Host ""

# Остановить службу
Write-Host "Остановка PostgreSQL..." -ForegroundColor Yellow
Stop-Service postgresql-x64-18 -ErrorAction SilentlyContinue

# Путь к конфигурации
$configPath = "C:\Program Files\PostgreSQL\18\data\postgresql.conf"

# Читаем конфиг
$config = Get-Content $configPath

# Ищем и заменяем listen_addresses
$newConfig = $config -replace "#listen_addresses = 'localhost'", "listen_addresses = '*'"
$newConfig = $newConfig -replace "listen_addresses = 'localhost'", "listen_addresses = '*'"

# Сохраняем
$newConfig | Set-Content $configPath

Write-Host "✓ Конфигурация обновлена" -ForegroundColor Green

# Запускаем службу
Write-Host "Запуск PostgreSQL..." -ForegroundColor Yellow
Start-Service postgresql-x64-18

Write-Host "✓ PostgreSQL запущен" -ForegroundColor Green
Write-Host ""
Write-Host "Теперь запустите backend: npm run dev" -ForegroundColor Cyan
