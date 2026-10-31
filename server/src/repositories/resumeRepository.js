const { pool } = require('../config/db');

async function getAllResumes(userId) {
  const [rows] = await pool.execute('SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows;
}

async function getActiveResume(userId) {
  const [rows] = await pool.execute('SELECT * FROM resumes WHERE user_id = ? AND is_active = 1 LIMIT 1', [userId]);
  return rows[0] || null;
}

async function findById(userId, id) {
  const [rows] = await pool.execute('SELECT * FROM resumes WHERE id = ? AND user_id = ? LIMIT 1', [id, userId]);
  return rows[0] || null;
}

async function createResume(userId, { originalFilename, storedFilename, storagePath, fileSize, mimeType = 'application/pdf', isActive = false }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (isActive) {
      await connection.execute('UPDATE resumes SET is_active = 0 WHERE user_id = ?', [userId]);
    }
    const [result] = await connection.execute(
      `INSERT INTO resumes (user_id, original_filename, stored_filename, storage_path, file_size, mime_type, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, originalFilename, storedFilename, storagePath, fileSize, mimeType, isActive ? 1 : 0]
    );
    await connection.commit();
    return result.insertId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function setActiveResume(userId, id) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('UPDATE resumes SET is_active = 0 WHERE user_id = ?', [userId]);
    const [result] = await connection.execute('UPDATE resumes SET is_active = 1 WHERE id = ? AND user_id = ?', [id, userId]);
    await connection.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function deleteResume(userId, id) {
  const [result] = await pool.execute('DELETE FROM resumes WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllResumes,
  getActiveResume,
  findById,
  createResume,
  setActiveResume,
  deleteResume
};
