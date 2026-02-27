-- Тестовые данные для PolyEdu AI

-- Добавление тестового предмета (если еще нет)
INSERT INTO subjects (name, user_id) 
VALUES ('Математика', 1)
ON CONFLICT DO NOTHING;

-- Добавление тестовой группы
INSERT INTO groups (name, user_id) 
VALUES ('ИТ-301', 1)
ON CONFLICT DO NOTHING
RETURNING id;

-- Получаем ID группы
DO $$
DECLARE
    group_id integer;
    subject_id integer;
BEGIN
    SELECT id INTO group_id FROM groups WHERE name = 'ИТ-301' AND user_id = 1 LIMIT 1;
    SELECT id INTO subject_id FROM subjects WHERE name = 'Математика' AND user_id = 1 LIMIT 1;
    
    -- Добавление студентов (если еще нет)
    INSERT INTO students (full_name, group_id) 
    VALUES 
        ('Иванов Иван Иванович', group_id),
        ('Петрова Анна Сергеевна', group_id),
        ('Сидоров Петр Алексеевич', group_id)
    ON CONFLICT DO NOTHING;
    
    -- Добавление оценок
    INSERT INTO grades (student_id, subject_id, grade, topic, date) 
    SELECT s.id, subject_id, 85, 'Алгебра', '2026-01-15'
    FROM students s 
    WHERE s.full_name = 'Иванов Иван Иванович' AND s.group_id = group_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO grades (student_id, subject_id, grade, topic, date) 
    SELECT s.id, subject_id, 90, 'Геометрия', '2026-01-18'
    FROM students s 
    WHERE s.full_name = 'Иванов Иван Иванович' AND s.group_id = group_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO grades (student_id, subject_id, grade, topic, date) 
    SELECT s.id, subject_id, 75, 'Алгебра', '2026-01-15'
    FROM students s 
    WHERE s.full_name = 'Петрова Анна Сергеевна' AND s.group_id = group_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO grades (student_id, subject_id, grade, topic, date) 
    SELECT s.id, subject_id, 80, 'Геометрия', '2026-01-18'
    FROM students s 
    WHERE s.full_name = 'Петрова Анна Сергеевна' AND s.group_id = group_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO grades (student_id, subject_id, grade, topic, date) 
    SELECT s.id, subject_id, 92, 'Алгебра', '2026-01-15'
    FROM students s 
    WHERE s.full_name = 'Сидоров Петр Алексеевич' AND s.group_id = group_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO grades (student_id, subject_id, grade, topic, date) 
    SELECT s.id, subject_id, 88, 'Геометрия', '2026-01-18'
    FROM students s 
    WHERE s.full_name = 'Сидоров Петр Алексеевич' AND s.group_id = group_id
    ON CONFLICT DO NOTHING;
END $$;

-- Проверка добавленных данных
SELECT 'Группы:' as info;
SELECT id, name FROM groups WHERE user_id = 1;

SELECT 'Студенты:' as info;
SELECT s.id, s.full_name, g.name as group_name 
FROM students s 
JOIN groups g ON g.id = s.group_id 
WHERE g.user_id = 1;

SELECT 'Оценки:' as info;
SELECT s.full_name, sub.name as subject, gr.grade, gr.topic, gr.date
FROM grades gr
JOIN students s ON s.id = gr.student_id
JOIN subjects sub ON sub.id = gr.subject_id
JOIN groups g ON g.id = s.group_id
WHERE g.user_id = 1
ORDER BY s.full_name, gr.date;
