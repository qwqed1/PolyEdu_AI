# Инструкция по деплою PolyEdu AI

## 1. Настройка GitHub
1. Инициализируйте git в корневой папке (`git init`), если еще этого не сделали.
2. Закоммитьте все изменения:
   ```bash
   git add .
   git commit -m "Подготовка к полному деплою: Backend + n8n + DB"
   ```
3. Запушьте (push) код в ваш репозиторий GitHub.

## 2. Деплой на Render.com (Бэкенд + База + n8n)
1. Зайдите на Render.com -> Dashboard -> **New +** -> **Blueprint**.
2. Подключите ваш репозиторий GitHub.
3. Render автоматически обнаружит файл `render.yaml` и предложит создать **3 сервиса**:
   - **polyedu-db** (Общая База данных)
   - **polyedu-backend** (Бэкенд API)
   - **polyedu-n8n** (Сервис ИИ агентов)
4. Нажмите **Apply** (Применить).
5. **Важно:** После деплоя зайдите в настройки сервиса `polyedu-n8n` на сайте Render и поменяйте пароль (`N8N_BASIC_AUTH_PASSWORD`) на свой собственный!

## 3. Настройка n8n
1. Перейдите по ссылке вашего n8n (например, `https://polyedu-n8n.onrender.com`).
2. Введите логин/пароль (по умолчанию: `admin` / `password123` или то, что вы поставили).
3. **Импорт Воркфлоу**:
   - Зайдите в меню Workflows -> Import.
   - Загрузите файл `n8n-gemini-workflow.json` из корня проекта.
   - Активируйте его (Active).

## 4. Деплой Фронтенда (Vercel)
1. Зайдите на Vercel -> **Add New...** -> **Project**.
2. Импортируйте тот же репозиторий.
3. **Настройки**:
   - **Root Directory**: `frontend`.
   - **Environment Variables**:
     - `VITE_API_URL`: Ссылка на ваш `polyedu-backend` (из шага 2) + `/api` в конце.
4. Deploy.
