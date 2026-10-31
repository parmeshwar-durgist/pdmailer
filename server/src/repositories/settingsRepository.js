const { pool } = require('../config/db');

async function getUserSettings(userId) {
  const [rows] = await pool.execute('SELECT * FROM user_settings WHERE user_id = ? LIMIT 1', [userId]);
  if (rows.length === 0) {
    // Default fallback
    return {
      user_id: userId,
      sender_name: 'Administrator',
      sender_email: '',
      gmail_app_password: null,
      send_delay_seconds: 2,
      batch_size: 5,
      max_retries: 2,
      portfolio_url: '',
      github_url: ''
    };
  }
  return rows[0];
}

async function updateUserSettings(userId, data) {
  const fields = [];
  const params = [];

  if (data.sender_name !== undefined) {
    fields.push('sender_name = ?');
    params.push(data.sender_name);
  }
  if (data.sender_email !== undefined) {
    fields.push('sender_email = ?');
    params.push(data.sender_email);
  }
  if (data.gmail_app_password !== undefined && data.gmail_app_password.trim() !== '') {
    fields.push('gmail_app_password = ?');
    params.push(data.gmail_app_password.trim().replace(/\s+/g, ''));
  }
  if (data.send_delay_seconds !== undefined) {
    fields.push('send_delay_seconds = ?');
    params.push(parseInt(data.send_delay_seconds, 10));
  }
  if (data.batch_size !== undefined) {
    fields.push('batch_size = ?');
    params.push(parseInt(data.batch_size, 10));
  }
  if (data.max_retries !== undefined) {
    fields.push('max_retries = ?');
    params.push(parseInt(data.max_retries, 10));
  }
  if (data.portfolio_url !== undefined) {
    fields.push('portfolio_url = ?');
    params.push(data.portfolio_url);
  }
  if (data.github_url !== undefined) {
    fields.push('github_url = ?');
    params.push(data.github_url);
  }

  if (fields.length === 0) return true;

  params.push(userId);
  const sql = `UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`;
  await pool.execute(sql, params);
  return true;
}

module.exports = {
  getUserSettings,
  updateUserSettings
};
