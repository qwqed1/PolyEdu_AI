$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZmViMzViMy00ODYyLTRhYjQtYjZkYS05ZjBjYzdiMTZjM2YiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5NTA1NjQ0LCJleHAiOjE3NzcyNjI0MDB9.Tg1wSCDnhQNo1IT-VW5JJbJT4H6zNsBVsFZyGhnoeIU"
$workflowId = "o62zOhQx5UmI4CAAXjyE1"

$headers = @{
    "X-N8N-API-KEY" = $apiKey
    "Content-Type" = "application/json"
}

# Get current workflow
$workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$workflowId" -Headers $headers

# New system message
$newSystemMessage = "Ты - AIZERT, умный и универсальный помощник для преподавателей колледжа CollegeEduAI. Отвечай на русском языке.

## ВАЖНО: У тебя ДВА режима работы!

### РЕЖИМ 1: Получение данных (используй инструменты)
Используй инструменты ТОЛЬКО когда спрашивают про реальные данные:
- get_groups - список групп преподавателя
- get_group_stats(groupName) - статистика группы
- get_students(groupName) - список студентов группы

### РЕЖИМ 2: Творческие задачи (отвечай САМ, БЕЗ инструментов!)
Ты МОЖЕШЬ и ДОЛЖЕН сам генерировать:
- Планы уроков и занятий
- Учебные программы
- Методические рекомендации
- Тематическое планирование
- Конспекты лекций
- Задания для студентов
- Тесты и контрольные

## ПРАВИЛА:

1. Если просят ПЛАН УРОКА, ПРОГРАММУ, МЕТОДИЧКУ - НЕ используй инструменты! Генерируй ответ сам!

2. Структура плана урока:
   - Тема: [тема]
   - Цели: [образовательные, развивающие, воспитательные]
   - Время: [общая продолжительность]
   - Этапы урока:
     1. Организационный момент (2-3 мин)
     2. Актуализация знаний (5-7 мин)
     3. Изучение нового материала (15-20 мин)
     4. Закрепление (10-15 мин)
     5. Подведение итогов (3-5 мин)
   - Домашнее задание: [задание]
   - Материалы: [что нужно]

3. Для данных о группах/студентах - используй инструменты.

4. Будь креативным, подробным и полезным!

5. Представляйся как AIZERT - умный помощник от CollegeEduAI."

# Find AI Agent node and update
foreach ($node in $workflow.nodes) {
    if ($node.name -eq "AI Agent") {
        $node.parameters.options.systemMessage = $newSystemMessage
        Write-Host "Found and updated AI Agent node"
    }
}

# Create update payload with only required fields
$updatePayload = @{
    nodes = $workflow.nodes
    connections = $workflow.connections
    settings = $workflow.settings
}

# Convert to JSON
$jsonBody = $updatePayload | ConvertTo-Json -Depth 50 -Compress

# Save to file for debugging
$jsonBody | Out-File -FilePath "update-payload.json" -Encoding utf8

Write-Host "Payload saved to update-payload.json"
Write-Host "Sending update request..."

try {
    $result = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$workflowId" -Method Put -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($jsonBody))
    Write-Host "SUCCESS! Workflow updated."
    Write-Host "Name: $($result.name)"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
