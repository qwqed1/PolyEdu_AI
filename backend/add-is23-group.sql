-- Добавление тестовых данных для userId = 1
-- Запустите этот SQL в PostgreSQL

-- Создаём группу ИС23-3В для userId = 1
INSERT INTO groups (name, user_id) VALUES ('ИС23-3В', 1) ON CONFLICT DO NOTHING;

-- Получаем ID группы
DO $$
DECLARE
  group_id INTEGER;
BEGIN
  SELECT id INTO group_id FROM groups WHERE name = 'ИС23-3В' AND user_id = 1 LIMIT 1;
  
  IF group_id IS NOT NULL THEN
    -- Добавляем студентов
    INSERT INTO students (full_name, group_id) VALUES ('Иванов Иван Иванович', group_id);
    INSERT INTO students (full_name, group_id) VALUES ('Петрова Анна Сергеевна', group_id);
    INSERT INTO students (full_name, group_id) VALUES ('Сидоров Петр Алексеевич', group_id);
    INSERT INTO students (full_name, group_id) VALUES ('Козлова Мария Петровна', group_id);
    INSERT INTO students (full_name, group_id) VALUES ('Николаев Дмитрий Владимирович', group_id);
    
    RAISE NOTICE 'Добавлено 5 студентов в группу ИС23-3В';
  ELSE
    RAISE NOTICE 'Группа не найдена';
  END IF;
END $$;

-- Добавляем оценки студентам
INSERT INTO grades (student_id, subject_id, grade, date)
SELECT s.id, 1, 85, CURRENT_DATE
FROM students s
JOIN groups g ON g.id = s.group_id
WHERE g.name = 'ИС23-3В'
ON CONFLICT DO NOTHING;

-- Проверка
SELECT g.name, COUNT(s.id) as students 
FROM groups g 
LEFT JOIN students s ON s.group_id = g.id 
WHERE g.user_id = 1
GROUP BY g.id, g.name;
