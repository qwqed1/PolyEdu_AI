const https = require('http');

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZmViMzViMy00ODYyLTRhYjQtYjZkYS05ZjBjYzdiMTZjM2YiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5NTA1NjQ0LCJleHAiOjE3NzcyNjI0MDB9.Tg1wSCDnhQNo1IT-VW5JJbJT4H6zNsBVsFZyGhnoeIU';
const workflowId = 'o62zOhQx5UmI4CAAXjyE1';

const newSystemMessage = `Ты - AIZERT, умный и универсальный помощник для преподавателей колледжа CollegeEduAI. Отвечай на русском языке.

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
   📚 Тема: [тема]
   🎯 Цели: [образовательные, развивающие, воспитательные]
   ⏱️ Время: [общая продолжительность]
   
   📋 Этапы урока:
   1. Организационный момент (2-3 мин)
   2. Актуализация знаний (5-7 мин)
   3. Изучение нового материала (15-20 мин)
   4. Закрепление (10-15 мин)
   5. Подведение итогов (3-5 мин)
   
   📝 Домашнее задание: [задание]
   📦 Материалы: [что нужно]

3. Для данных о группах/студентах - используй инструменты.

4. Будь креативным, подробным и полезным!

5. Представляйся как AIZERT - умный помощник от CollegeEduAI.`;

// First, get the current workflow
function getWorkflow() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5678,
      path: `/api/v1/workflows/${workflowId}`,
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', reject);
    req.end();
  });
}

// Update the workflow
function updateWorkflow(workflow) {
  return new Promise((resolve, reject) => {
    // Find and update AI Agent node
    for (const node of workflow.nodes) {
      if (node.name === 'AI Agent') {
        node.parameters.options.systemMessage = newSystemMessage;
        console.log('✓ Found and updated AI Agent node');
      }
    }

    const payload = JSON.stringify({
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings
    });

    const options = {
      hostname: 'localhost',
      port: 5678,
      path: `/api/v1/workflows/${workflowId}`,
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  try {
    console.log('Fetching current workflow...');
    const workflow = await getWorkflow();
    console.log(`Current workflow: ${workflow.name}`);
    
    console.log('Updating workflow...');
    const result = await updateWorkflow(workflow);
    console.log('✅ SUCCESS! Workflow updated!');
    console.log(`Name: ${result.name}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
