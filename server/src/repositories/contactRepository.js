const { pool } = require('../config/db');

async function getContacts(userId, { search = '', company = '', title = '', page = 1, limit = 20, sort = 'created_at', order = 'DESC' }) {
  const offset = (page - 1) * limit;
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (search) {
    conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR title LIKE ? OR company LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (company) {
    conditions.push('company = ?');
    params.push(company);
  }

  if (title) {
    conditions.push('title = ?');
    params.push(title);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const allowedSorts = ['id', 'name', 'email', 'phone', 'title', 'company', 'created_at'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
  const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const countQuery = `SELECT COUNT(*) AS total FROM hr_contacts ${whereClause}`;
  const [countRows] = await pool.execute(countQuery, params);
  const total = countRows[0].total;

  const dataQuery = `
    SELECT id, name, email, phone, title, company, created_at, updated_at 
    FROM hr_contacts 
    ${whereClause} 
    ORDER BY ${sortCol} ${sortDir} 
    LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}
  `;
  const [rows] = await pool.execute(dataQuery, params);

  return {
    contacts: rows,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit)
  };
}

async function getAllForExport(userId) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, title, company, created_at FROM hr_contacts WHERE user_id = ? ORDER BY id ASC',
    [userId]
  );
  return rows;
}

async function findById(userId, id) {
  const [rows] = await pool.execute(
    'SELECT * FROM hr_contacts WHERE id = ? AND user_id = ? LIMIT 1',
    [id, userId]
  );
  return rows[0] || null;
}

async function findByEmail(userId, email) {
  const [rows] = await pool.execute(
    'SELECT * FROM hr_contacts WHERE email = ? AND user_id = ? LIMIT 1',
    [email.toLowerCase().trim(), userId]
  );
  return rows[0] || null;
}

async function findByEmails(userId, emails) {
  if (!emails || emails.length === 0) return [];
  const placeholders = emails.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id, email, name, title, company FROM hr_contacts WHERE user_id = ? AND email IN (${placeholders})`,
    [userId, ...emails.map(e => e.toLowerCase().trim())]
  );
  return rows;
}

async function createContact(userId, { name, email, phone = null, title = null, company = null }) {
  const [result] = await pool.execute(
    'INSERT INTO hr_contacts (user_id, name, email, phone, title, company) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, name.trim(), email.toLowerCase().trim(), phone ? phone.trim() : null, title ? title.trim() : null, company ? company.trim() : null]
  );
  return result.insertId;
}

async function updateContact(userId, id, { name, email, phone = null, title = null, company = null }) {
  const [result] = await pool.execute(
    'UPDATE hr_contacts SET name = ?, email = ?, phone = ?, title = ?, company = ? WHERE id = ? AND user_id = ?',
    [name.trim(), email.toLowerCase().trim(), phone ? phone.trim() : null, title ? title.trim() : null, company ? company.trim() : null, id, userId]
  );
  return result.affectedRows > 0;
}

async function deleteContact(userId, id) {
  const [result] = await pool.execute(
    'DELETE FROM hr_contacts WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}

async function getDistinctCompanies(userId) {
  const [rows] = await pool.execute(
    'SELECT DISTINCT company FROM hr_contacts WHERE user_id = ? AND company IS NOT NULL AND company != "" ORDER BY company ASC',
    [userId]
  );
  return rows.map(r => r.company);
}

async function getDistinctTitles(userId) {
  const [rows] = await pool.execute(
    'SELECT DISTINCT title FROM hr_contacts WHERE user_id = ? AND title IS NOT NULL AND title != "" ORDER BY title ASC',
    [userId]
  );
  return rows.map(r => r.title);
}

module.exports = {
  getContacts,
  getAllForExport,
  findById,
  findByEmail,
  findByEmails,
  createContact,
  updateContact,
  deleteContact,
  getDistinctCompanies,
  getDistinctTitles
};
