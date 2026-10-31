const { pool } = require('../config/db');

async function getAllSuppressions(userId) {
  const [rows] = await pool.execute('SELECT * FROM email_suppressions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows;
}

async function isSuppressed(userId, email) {
  const [rows] = await pool.execute(
    'SELECT id FROM email_suppressions WHERE user_id = ? AND email = ? LIMIT 1',
    [userId, email.toLowerCase().trim()]
  );
  return rows.length > 0;
}

async function findSuppressedEmails(userId, emails) {
  if (!emails || emails.length === 0) return [];
  const placeholders = emails.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT email FROM email_suppressions WHERE user_id = ? AND email IN (${placeholders})`,
    [userId, ...emails.map(e => e.toLowerCase().trim())]
  );
  return rows.map(r => r.email.toLowerCase());
}

async function addSuppression(userId, email, reason = 'User requested suppression') {
  const [result] = await pool.execute(
    `INSERT INTO email_suppressions (user_id, email, reason) 
     VALUES (?, ?, ?) 
     ON DUPLICATE KEY UPDATE reason = VALUES(reason)`,
    [userId, email.toLowerCase().trim(), reason]
  );
  return result.insertId;
}

async function removeSuppression(userId, id) {
  const [result] = await pool.execute(
    'DELETE FROM email_suppressions WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getAllSuppressions,
  isSuppressed,
  findSuppressedEmails,
  addSuppression,
  removeSuppression
};
