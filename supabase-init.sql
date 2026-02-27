-- Полный SQL-дамп для инициализации Supabase базы данных
-- Просто скопируйте этот код и выполните в SQL Editor в Supabase

-- 1. Users table (преподаватели)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  institution VARCHAR(255),
  position VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'teacher',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Если таблица старая, добавим колонку role
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'teacher';
UPDATE users SET role = 'teacher' WHERE role IS NULL;

-- 2. Subjects table (предметы)
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Groups table (группы)
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Students table (студенты)
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Grades table (оценки)
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  grade INTEGER CHECK (grade >= 0 AND grade <= 100),
  topic VARCHAR(255),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Schedules table (расписание)
CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Modules table (модули привязаны к группе)
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  module_type VARCHAR(20) NOT NULL DEFAULT 'theory',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Module subjects table (предметы внутри модуля)
CREATE TABLE IF NOT EXISTS module_subjects (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Lesson Plans table
CREATE TABLE IF NOT EXISTS lesson_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject_name VARCHAR(255) NOT NULL,
  module_code VARCHAR(100),
  group_name VARCHAR(100),
  course INTEGER,
  lesson_number INTEGER,
  topic VARCHAR(500),
  lesson_date DATE,
  lesson_type VARCHAR(100),
  teacher_name VARCHAR(255),
  goals TEXT,
  objectives TEXT,
  expected_results TEXT,
  resources_methods TEXT,
  resources_technical TEXT,
  stage_organization TEXT,
  stage_knowledge TEXT,
  stage_new_skills TEXT,
  stage_consolidation TEXT,
  stage_assessment TEXT,
  stage_homework TEXT,
  stage_reflection TEXT,
  semester_hours INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'kahoot',
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  questions JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{
    "timePerQuestion": 30,
    "shuffleQuestions": false,
    "shuffleAnswers": false,
    "showCorrectAnswers": true,
    "pointsPerQuestion": 100
  }'::jsonb,
  is_active BOOLEAN DEFAULT false,
  game_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Game Results table
CREATE TABLE IF NOT EXISTS game_results (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]'::jsonb,
  time_spent INTEGER DEFAULT 0,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. AI Games table
CREATE TABLE IF NOT EXISTS ai_games (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  html_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 13. Schedule Uploads tables
CREATE TABLE IF NOT EXISTS schedule_uploads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  shift VARCHAR(50),
  week_type VARCHAR(50),
  upload_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_entries (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER REFERENCES schedule_uploads(id) ON DELETE CASCADE,
  room VARCHAR(100),
  lesson_number INTEGER,
  lesson_time VARCHAR(50),
  teacher VARCHAR(255),
  subject VARCHAR(255),
  group_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 14. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_students_group_id ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_modules_group_id ON modules(group_id);
CREATE INDEX IF NOT EXISTS idx_module_subjects_module_id ON module_subjects(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_user_id ON lesson_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_games_user_id ON ai_games(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_upload_id ON schedule_entries(upload_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_group_name ON schedule_entries(group_name);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_quiz_id ON game_results(quiz_id);
