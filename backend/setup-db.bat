@echo off
echo Создание базы данных polyedu_db для PolyEdu AI
echo.

set PGPASSWORD=postgres
set PSQL="C:\Program Files\PostgreSQL\18\bin\psql.exe"

echo Попытка создания базы данных...
%PSQL% -U postgres -c "CREATE DATABASE polyedu_db;" 2>nul

if %errorlevel% equ 0 (
    echo База данных создана успешно!
    echo.
    echo Выполнение схемы...
    %PSQL% -U postgres -d polyedu_db -f schema.sql
    echo.
    echo Готово! База данных настроена.
) else (
    echo.
    echo ВНИМАНИЕ: Не удалось подключиться через командную строку.
    echo.
    echo Пожалуйста, используйте pgAdmin 4:
    echo 1. Откройте pgAdmin 4
    echo 2. Создайте базу данных "polyedu_db"
    echo 3. Выполните файл schema.sql через Query Tool
    echo.
    pause
)
