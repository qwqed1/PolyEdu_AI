-- PolyEdu AI Database Schema

-- Users table (преподаватели)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  institution VARCHAR(255),
  position VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subjects table (предметы)
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Groups table (группы)
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Students table (студенты)
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Grades table (оценки)
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  grade INTEGER CHECK (grade >= 0 AND grade <= 100),
  topic VARCHAR(255),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Schedules table (расписание)
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

-- Modules table (модули привязаны к группе)
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  module_type VARCHAR(20) NOT NULL DEFAULT 'theory',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Module subjects table (предметы внутри модуля)
CREATE TABLE IF NOT EXISTS module_subjects (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_students_group_id ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_modules_group_id ON modules(group_id);
CREATE INDEX IF NOT EXISTS idx_module_subjects_module_id ON module_subjects(module_id);
