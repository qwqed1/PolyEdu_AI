# Инструкция по деплою AIZERT (Vercel + Supabase)

Данный проект состоит из Frontend (Vite/React) и Backend (Express).
Обе части теперь деплоятся **вместе** как один проект на **Vercel** (без использования WebSockets, сервер работает как Serverless Functions). 
В качестве базы данных используется **Supabase**.

---

## Шаг 1: Настройка Базы Данных в Supabase

1. Перейдите на [Supabase](https://supabase.com/) и создайте новый проект.
2. После создания перейдите в левом меню в раздел **SQL Editor**.
3. Откройте файл `supabase-init.sql` из корня проекта.
4. Скопируйте весь его код, вставьте в окно SQL Editor на Supabase и нажмите **Run** (Выполнить).
5. (Настройки подключения): 
   - Зайдите в **Project Settings -> Database**.
   - Скопируйте **Connection string** (URI). По умолчанию оно выглядит так:
     `postgresql://postgres.[ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - Замените `[PASSWORD]` на ваш пароль от базы данных. 

---

## Шаг 2: Деплой на Vercel

1. Залейте весь код проекта в ваш репозиторий GitHub/GitLab:
   ```bash
   git add .
   git commit -m "Подготовка к Vercel + Supabase"
   git push origin main
   ```

2. Авторизуйтесь на сайте [Vercel](https://vercel.com/) и нажмите **Add New -> Project**.
3. Выберите ваш репозиторий.
4. Оставьте **Framework Preset** по умолчанию (Vercel сам определит его, если не определит — выберите Vite).
5. **Настройки Root Directory**:
   - Оставьте корень `/` (или не меняйте ничего, так как Vercel сам прочитает файл `vercel.json`).
6. **В разделе Environment Variables (Переменные окружения)** добавьте значения вашего бэкенда:
   - `JWT_SECRET` = `(любая длинная случайная строка)`
   - `OPENROUTER_API_KEY` = `(ваш ключ OpenRouter)`
   - `OPENROUTER_TEXT_MODEL` = `openai/gpt-oss-120b:free`
   - `OPENROUTER_CODER_MODEL` = `arcee-ai/trinity-large-preview:free`
   - `OPENROUTER_LESSON_MODEL` = `google/gemma-3-27b-it:free`
   - `DATABASE_URL` = `(строка подключения из Supabase из Шага 1. Убедитесь что она начинается с postgresql:// ...)`
   *Примечание: `VITE_API_URL` добавлять **НЕ НУЖНО**, так как мы создали файл `.env.production`, который использует локальный `/api` (Vercel сам проксирует запросы).*
7. Нажмите **Deploy**.
8. Дождитесь окончания сборки. В случае успеха ваше приложение будет доступно по ссылке от Vercel. Бэкенд и Фронтенд будут жить на одном домене!

---

## Шаг 3 (Опционально): Обновление данных из n8n (если используется)

Если вы используете n8n-воркфлоу для генерации тестов, вам нужно поменять ссылку на Webhook. 
Ваш продакшн API теперь живет по адресу: `https://[ВАШ_VERCEL_ДОМЕН].vercel.app/api`.
Обновите настройки API URL во внешних приложениях на этот адрес.
