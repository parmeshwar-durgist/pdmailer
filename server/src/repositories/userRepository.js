const { pool } = require('../config/db');

async function findByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute('SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash, plainPassword = null, role = 'user' }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userRes] = await connection.execute(
      'INSERT INTO users (name, email, password_hash, plain_password, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), passwordHash, plainPassword, role]
    );

    const userId = userRes.insertId;

    // Initialize default user settings
    await connection.execute(
      `INSERT INTO user_settings (user_id, sender_name, sender_email, send_delay_seconds, batch_size, max_retries) 
       VALUES (?, ?, ?, 2, 5, 2)`,
      [userId, name.trim(), email.toLowerCase().trim()]
    );

    // Seed default starter template for new user
    const defaultTemplateBody = `<p>Dear {{Name}},</p>
<p>I hope this email finds you well.</p>
<p>I am writing to express my strong interest in exploring software engineering opportunities at <strong>{{Company}}</strong> for the <strong>{{Title}}</strong> position.</p>
<p>I am a Software Engineer with professional experience developing scalable web applications, RESTful microservices, and modern database solutions.</p>
<p>Please find my resume attached for your kind review. I would welcome the opportunity for a conversation to discuss how my skill set can benefit your team.</p>
<p>Thank you very much for your time and consideration.</p>
<p style="margin-bottom: 4px;">Best regards,</p>
<div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
  <div style="font-size: 15px; font-weight: 700; color: #111827;">${name.trim()}</div>
  <div style="font-size: 13px; color: #4b5563;">Software Engineer</div>
  <div style="font-size: 13px; color: #4b5563;">📧 <a href="mailto:${email.toLowerCase().trim()}">${email.toLowerCase().trim()}</a></div>
</div>`;

    await connection.execute(
      `INSERT INTO email_templates (user_id, name, subject, body) 
       VALUES (?, 'Default Job Application', 'Application for {{Title}} Position – ${name.trim()}', ?)`,
      [userId, defaultTemplateBody]
    );

    await connection.commit();
    return userId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function updatePassword(id, passwordHash, plainPassword = null) {
  const [result] = await pool.execute(
    'UPDATE users SET password_hash = ?, plain_password = ? WHERE id = ?',
    [passwordHash, plainPassword, id]
  );
  return result.affectedRows > 0;
}

async function getUserCredentials(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, plain_password, role, created_at, last_login_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function recordLogin(userId, ip = null) {
  try {
    await pool.execute('UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?', [ip, userId]);
  } catch (err) {
    // Non-blocking log failure
    console.error('Failed to record user login timestamp:', err.message);
  }
}

async function getAllUsers() {
  const query = `
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.role, 
      u.last_login_at,
      u.last_login_ip,
      u.created_at,
      s.sender_name,
      s.sender_email,
      s.send_delay_seconds,
      s.portfolio_url,
      s.github_url,
      CASE WHEN s.gmail_app_password IS NOT NULL AND s.gmail_app_password != '' THEN 1 ELSE 0 END AS has_smtp,
      (SELECT r.original_filename FROM resumes r WHERE r.user_id = u.id AND r.is_active = 1 LIMIT 1) AS active_resume,
      (SELECT COUNT(*) FROM hr_contacts c WHERE c.user_id = u.id) AS total_contacts,
      (SELECT COUNT(*) FROM campaigns camp WHERE camp.user_id = u.id) AS total_campaigns,
      COALESCE((SELECT SUM(camp.sent_count) FROM campaigns camp WHERE camp.user_id = u.id), 0) AS total_sent_emails,
      COALESCE((SELECT SUM(camp.failed_count) FROM campaigns camp WHERE camp.user_id = u.id), 0) AS total_failed_emails
    FROM users u
    LEFT JOIN user_settings s ON s.user_id = u.id
    ORDER BY u.id ASC
  `;
  const [rows] = await pool.query(query);
  return rows;
}

async function getUserFullDetails(userId) {
  const [userRows] = await pool.execute(`
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.role, 
      u.last_login_at,
      u.last_login_ip,
      u.created_at,
      u.updated_at,
      s.sender_name,
      s.sender_email,
      s.send_delay_seconds,
      s.batch_size,
      s.max_retries,
      s.portfolio_url,
      s.github_url,
      CASE WHEN s.gmail_app_password IS NOT NULL AND s.gmail_app_password != '' THEN 1 ELSE 0 END AS has_smtp,
      (SELECT r.original_filename FROM resumes r WHERE r.user_id = u.id AND r.is_active = 1 LIMIT 1) AS active_resume,
      (SELECT COUNT(*) FROM hr_contacts c WHERE c.user_id = u.id) AS total_contacts,
      (SELECT COUNT(*) FROM email_templates t WHERE t.user_id = u.id) AS total_templates,
      (SELECT COUNT(*) FROM resumes r WHERE r.user_id = u.id) AS total_resumes,
      (SELECT COUNT(*) FROM campaigns camp WHERE camp.user_id = u.id) AS total_campaigns,
      COALESCE((SELECT SUM(camp.sent_count) FROM campaigns camp WHERE camp.user_id = u.id), 0) AS total_sent_emails,
      COALESCE((SELECT SUM(camp.failed_count) FROM campaigns camp WHERE camp.user_id = u.id), 0) AS total_failed_emails
    FROM users u
    LEFT JOIN user_settings s ON s.user_id = u.id
    WHERE u.id = ?
    LIMIT 1
  `, [userId]);

  if (userRows.length === 0) return null;
  const user = userRows[0];

  // Fetch user's recent campaigns
  const [campaigns] = await pool.execute(`
    SELECT id, campaign_name, status, total_recipients, sent_count, failed_count, created_at, completed_at
    FROM campaigns
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 10
  `, [userId]);

  // Fetch user's recent recipient email dispatch logs
  const [recentLogs] = await pool.execute(`
    SELECT 
      r.id,
      r.recipient_email,
      r.recipient_name,
      r.recipient_company,
      r.rendered_subject,
      r.status,
      r.attempt_count,
      r.last_error,
      r.sent_at,
      r.created_at,
      c.campaign_name
    FROM campaign_recipients r
    INNER JOIN campaigns c ON c.id = r.campaign_id
    WHERE c.user_id = ?
    ORDER BY r.id DESC
    LIMIT 25
  `, [userId]);

  return {
    user,
    campaigns,
    recentLogs
  };
}

async function updateUserRole(userId, role) {
  if (!['admin', 'user'].includes(role)) {
    throw new Error('Invalid role specified. Must be "admin" or "user".');
  }
  const [result] = await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  return result.affectedRows > 0;
}

async function deleteUser(userId) {
  const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
  return result.affectedRows > 0;
}

async function getPlatformStats() {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM users WHERE role = 'admin') AS total_admins,
      (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_standard_users,
      (SELECT COUNT(*) FROM hr_contacts) AS total_contacts,
      (SELECT COUNT(*) FROM campaigns) AS total_campaigns,
      COALESCE((SELECT SUM(sent_count) FROM campaigns), 0) AS total_sent_emails,
      COALESCE((SELECT SUM(failed_count) FROM campaigns), 0) AS total_failed_emails
  `;
  const [rows] = await pool.query(query);
  return rows[0] || {};
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  updatePassword,
  recordLogin,
  getAllUsers,
  getUserDetails: getUserFullDetails,
  getUserFullDetails,
  getUserCredentials,
  updateUserRole,
  deleteUser,
  getPlatformStats
};
