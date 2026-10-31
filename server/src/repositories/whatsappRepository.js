const { pool } = require('../config/db');

// ==========================================
// WhatsApp Templates
// ==========================================

async function getTemplates(userId) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, name, body, created_at, updated_at FROM whatsapp_templates WHERE user_id = ? ORDER BY id DESC',
    [userId]
  );
  return rows;
}

async function getTemplateById(userId, id) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, name, body, created_at, updated_at FROM whatsapp_templates WHERE user_id = ? AND id = ? LIMIT 1',
    [userId, id]
  );
  return rows[0] || null;
}

async function createTemplate(userId, { name, body }) {
  const [res] = await pool.execute(
    'INSERT INTO whatsapp_templates (user_id, name, body) VALUES (?, ?, ?)',
    [userId, name.trim(), body.trim()]
  );
  return res.insertId;
}

async function updateTemplate(userId, id, { name, body }) {
  const [res] = await pool.execute(
    'UPDATE whatsapp_templates SET name = ?, body = ? WHERE user_id = ? AND id = ?',
    [name.trim(), body.trim(), userId, id]
  );
  return res.affectedRows > 0;
}

async function deleteTemplate(userId, id) {
  const [res] = await pool.execute(
    'DELETE FROM whatsapp_templates WHERE user_id = ? AND id = ?',
    [userId, id]
  );
  return res.affectedRows > 0;
}

// ==========================================
// WhatsApp Campaigns & Direct Dispatch
// ==========================================

async function createCampaign(userId, { campaign_name, template_id, resume_id, body_template, recipients }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [campRes] = await connection.execute(
      `INSERT INTO whatsapp_campaigns (user_id, campaign_name, template_id, resume_id, body_template, status, total_recipients)
       VALUES (?, ?, ?, ?, ?, 'queued', ?)`,
      [userId, campaign_name.trim(), template_id || null, resume_id || null, body_template, recipients.length]
    );

    const campaignId = campRes.insertId;

    if (recipients.length > 0) {
      const values = [];
      const placeholders = recipients.map(r => {
        values.push(
          campaignId,
          r.contact_id || null,
          r.recipient_phone,
          r.recipient_name,
          r.recipient_title || null,
          r.recipient_company || null,
          r.rendered_body,
          'pending'
        );
        return '(?, ?, ?, ?, ?, ?, ?, ?)';
      }).join(', ');

      await connection.execute(
        `INSERT INTO whatsapp_recipients 
         (campaign_id, contact_id, recipient_phone, recipient_name, recipient_title, recipient_company, rendered_body, status)
         VALUES ${placeholders}`,
        values
      );
    }

    await connection.commit();
    return campaignId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function getCampaigns(userId) {
  const [rows] = await pool.execute(
    `SELECT c.*, t.name as template_name, r.original_filename as resume_name
     FROM whatsapp_campaigns c
     LEFT JOIN whatsapp_templates t ON t.id = c.template_id
     LEFT JOIN resumes r ON r.id = c.resume_id
     WHERE c.user_id = ?
     ORDER BY c.id DESC`,
    [userId]
  );
  return rows;
}

async function getCampaignById(userId, id) {
  const [rows] = await pool.execute(
    `SELECT c.*, t.name as template_name, r.original_filename as resume_name
     FROM whatsapp_campaigns c
     LEFT JOIN whatsapp_templates t ON t.id = c.template_id
     LEFT JOIN resumes r ON r.id = c.resume_id
     WHERE c.user_id = ? AND c.id = ?
     LIMIT 1`,
    [userId, id]
  );
  return rows[0] || null;
}

async function getCampaignRecipients(campaignId) {
  const [rows] = await pool.execute(
    'SELECT * FROM whatsapp_recipients WHERE campaign_id = ? ORDER BY id ASC',
    [campaignId]
  );
  return rows;
}

async function updateRecipientStatus(recipientId, status, lastError = null) {
  await pool.execute(
    'UPDATE whatsapp_recipients SET status = ?, last_error = ?, sent_at = CASE WHEN ? = "sent" THEN NOW() ELSE sent_at END WHERE id = ?',
    [status, lastError, status, recipientId]
  );
}

async function updateCampaignCounts(campaignId) {
  await pool.execute(
    `UPDATE whatsapp_campaigns c
     SET 
       sent_count = (SELECT COUNT(*) FROM whatsapp_recipients r WHERE r.campaign_id = c.id AND r.status = 'sent'),
       failed_count = (SELECT COUNT(*) FROM whatsapp_recipients r WHERE r.campaign_id = c.id AND r.status = 'failed')
     WHERE c.id = ?`,
    [campaignId]
  );
}

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createCampaign,
  getCampaigns,
  getCampaignById,
  getCampaignRecipients,
  updateRecipientStatus,
  updateCampaignCounts
};

