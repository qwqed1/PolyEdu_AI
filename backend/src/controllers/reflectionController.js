import pool from '../config/db.js';

export const submitReflection = async (req, res) => {
  const { lesson_topic, reflection_text } = req.body;
  const student_user_id = req.user.id;

  if (!lesson_topic || !reflection_text) {
    return res.status(400).json({ success: false, message: 'Тема урока и текст рефлексии обязательны' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO student_reflections (student_user_id, lesson_topic, reflection_text) VALUES ($1, $2, $3) RETURNING *',
      [student_user_id, lesson_topic, reflection_text]
    );

    res.status(201).json({ success: true, reflection: result.rows[0] });
  } catch (error) {
    console.error('Submit reflection error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const getStudentReflections = async (req, res) => {
  const student_user_id = req.user.id;

  try {
    const result = await pool.query(
      'SELECT id, lesson_topic, reflection_text, created_at FROM student_reflections WHERE student_user_id = $1 ORDER BY created_at DESC',
      [student_user_id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get reflections error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};
