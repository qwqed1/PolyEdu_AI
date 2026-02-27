import pool from '../config/db.js';

export const UserModel = {
  async create(userData) {
    const { full_name, email, password_hash, institution, position } = userData;
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, institution, position) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, full_name, email, institution, position, created_at`,
      [full_name, email, password_hash, institution, position]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, full_name, email, institution, position, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async update(id, userData) {
    const { full_name, institution, position, avatar_url } = userData;
    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           institution = COALESCE($2, institution),
           position = COALESCE($3, position),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, full_name, email, institution, position, avatar_url`,
      [full_name, institution, position, avatar_url, id]
    );
    return result.rows[0];
  },
};
