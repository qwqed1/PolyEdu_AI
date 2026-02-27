import pool from '../config/db.js';

export const ScheduleUploadModel = {
  async initTable() {
    await pool.query(`
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

      CREATE INDEX IF NOT EXISTS idx_schedule_entries_upload_id ON schedule_entries(upload_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_entries_group_name ON schedule_entries(group_name);
    `);
  },

  async createUpload(userId, title, shift, weekType) {
    const result = await pool.query(
      `INSERT INTO schedule_uploads (user_id, title, shift, week_type) VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, title, shift, weekType]
    );
    return result.rows[0];
  },

  async createEntries(entries) {
    if (!entries.length) return [];
    
    const values = [];
    const placeholders = [];
    let idx = 1;
    
    for (const entry of entries) {
      placeholders.push(`($${idx}, $${idx+1}, $${idx+2}, $${idx+3}, $${idx+4}, $${idx+5})`);
      values.push(entry.upload_id, entry.room, entry.lesson_number, entry.lesson_time, entry.teacher, entry.subject, entry.group_name);
      idx += 7;
      // Fix: we have 7 fields
    }
    
    // Use proper batch insert
    const insertPromises = entries.map(entry => 
      pool.query(
        `INSERT INTO schedule_entries (upload_id, room, lesson_number, lesson_time, teacher, subject, group_name) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [entry.upload_id, entry.room, entry.lesson_number, entry.lesson_time, entry.teacher, entry.subject, entry.group_name]
      )
    );
    
    const results = await Promise.all(insertPromises);
    return results.map(r => r.rows[0]);
  },

  async getAllUploads(userId) {
    const result = await pool.query(
      `SELECT su.*, 
        (SELECT COUNT(*) FROM schedule_entries WHERE upload_id = su.id) as entries_count,
        (SELECT COUNT(DISTINCT group_name) FROM schedule_entries WHERE upload_id = su.id) as groups_count
       FROM schedule_uploads su 
       WHERE su.user_id = $1 
       ORDER BY su.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getAllGroups() {
    const result = await pool.query(
      `SELECT DISTINCT group_name FROM schedule_entries WHERE group_name IS NOT NULL AND group_name != '' ORDER BY group_name`
    );
    return result.rows.map(r => r.group_name);
  },

  async getByGroup(groupName) {
    const result = await pool.query(
      `SELECT se.*, su.title as upload_title, su.shift, su.week_type, su.upload_date
       FROM schedule_entries se
       JOIN schedule_uploads su ON se.upload_id = su.id
       WHERE se.group_name = $1
       ORDER BY su.upload_date DESC, se.lesson_number ASC`,
      [groupName]
    );
    return result.rows;
  },

  async getLatestByGroup(groupName) {
    // Get latest upload that has this group
    const latestUpload = await pool.query(
      `SELECT DISTINCT su.id, su.title, su.shift, su.week_type, su.upload_date
       FROM schedule_uploads su
       JOIN schedule_entries se ON se.upload_id = su.id
       WHERE se.group_name = $1
       ORDER BY su.upload_date DESC, su.id DESC`,
      [groupName]
    );
    
    if (!latestUpload.rows.length) return { uploads: [], entries: [] };
    
    const uploadIds = latestUpload.rows.map(u => u.id);
    
    const entries = await pool.query(
      `SELECT se.*, su.title as upload_title, su.shift, su.week_type, su.upload_date
       FROM schedule_entries se
       JOIN schedule_uploads su ON se.upload_id = su.id
       WHERE se.upload_id = ANY($1) AND se.group_name = $2
       ORDER BY su.shift ASC, se.lesson_number ASC`,
      [uploadIds, groupName]
    );
    
    return { uploads: latestUpload.rows, entries: entries.rows };
  },

  async deleteUpload(id, userId) {
    const result = await pool.query(
      `DELETE FROM schedule_uploads WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  }
};
