const { pool } = require('../config/db');

async function getAllTemplates(userId) {
  const [rows] = await pool.execute('SELECT * FROM email_templates WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
  return rows;
}

async function findById(userId, id) {
  const [rows] = await pool.execute('SELECT * FROM email_templates WHERE id = ? AND user_id = ? LIMIT 1', [id, userId]);
  return rows[0] || null;
}

async function createTemplate(userId, { name, subject, body }) {
  const [result] = await pool.execute(
    'INSERT INTO email_templates (user_id, name, subject, body) VALUES (?, ?, ?, ?)',
    [userId, name.trim(), subject.trim(), body.trim()]
  );
  return result.insertId;
}

async function updateTemplate(userId, id, { name, subject, body }) {
  const [result] = await pool.execute(
    'UPDATE email_templates SET name = ?, subject = ?, body = ? WHERE id = ? AND user_id = ?',
    [name.trim(), subject.trim(), body.trim(), id, userId]
  );
  return result.affectedRows > 0;
}

async function deleteTemplate(userId, id) {
  const [result] = await pool.execute('DELETE FROM email_templates WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllTemplates,
  findById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
