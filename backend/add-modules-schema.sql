-- Modules table (модули привязаны к группе)
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,        -- e.g. "КМ1", "КМ2"
  name TEXT NOT NULL,                -- e.g. "Электроника және электротехника зандарын..."
  module_type VARCHAR(20) NOT NULL DEFAULT 'theory',  -- 'theory' or 'practice'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Module subjects table (предметы/ОН внутри модуля)
CREATE TABLE IF NOT EXISTS module_subjects (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,        -- e.g. "ОН1.1", "ОН1.2"
  name TEXT NOT NULL,                -- e.g. "Электрондық техниканың әртүрлі түрлерінің..."
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_modules_group_id ON modules(group_id);
CREATE INDEX IF NOT EXISTS idx_module_subjects_module_id ON module_subjects(module_id);
