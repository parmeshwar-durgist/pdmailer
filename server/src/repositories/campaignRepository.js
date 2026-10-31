const { pool } = require('../config/db');

async function createCampaignWithRecipients(userId, { campaignName, templateId, resumeId, subjectTemplate, bodyTemplate, recipients }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [campaignResult] = await connection.execute(
      `INSERT INTO campaigns 
       (user_id, campaign_name, template_id, resume_id, subject_template, body_template, status, total_recipients, sent_count, failed_count, skipped_count) 
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, 0, 0, 0)`,
      [userId, campaignName, templateId || null, resumeId || null, subjectTemplate, bodyTemplate, recipients.length]
    );

    const campaignId = campaignResult.insertId;

    if (recipients.length > 0) {
      const values = [];
      const recipientSql = `
        INSERT INTO campaign_recipients 
        (campaign_id, contact_id, recipient_email, recipient_name, recipient_title, recipient_company, rendered_subject, rendered_body, status) 
        VALUES ?
      `;

      for (const r of recipients) {
        values.push([
          campaignId,
          r.contact_id || null,
          r.recipient_email.toLowerCase().trim(),
          r.recipient_name,
          r.recipient_title || null,
          r.recipient_company || null,
          r.rendered_subject,
          r.rendered_body,
          'pending'
        ]);
      }

      await connection.query(recipientSql, [values]);
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

async function getCampaignById(userId, id) {
  const [rows] = await pool.execute(
    `SELECT c.*, 
            r.original_filename AS resume_filename, r.storage_path AS resume_path,
            t.name AS template_name
     FROM campaigns c
     LEFT JOIN resumes r ON c.resume_id = r.id
     LEFT JOIN email_templates t ON c.template_id = t.id
     WHERE c.id = ? AND c.user_id = ? LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
}

// Internal lookup without user constraint for active queue worker
async function getCampaignByIdInternal(id) {
  const [rows] = await pool.execute(
    `SELECT c.*, 
            r.original_filename AS resume_filename, r.storage_path AS resume_path,
            t.name AS template_name
     FROM campaigns c
     LEFT JOIN resumes r ON c.resume_id = r.id
     LEFT JOIN email_templates t ON c.template_id = t.id
     WHERE c.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function getAllCampaigns(userId, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM campaigns WHERE user_id = ?', [userId]);
  const total = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT c.*, 
            r.original_filename AS resume_filename,
            t.name AS template_name
     FROM campaigns c
     LEFT JOIN resumes r ON c.resume_id = r.id
     LEFT JOIN email_templates t ON c.template_id = t.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC
     LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`,
    [userId]
  );

  return {
    campaigns: rows,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit)
  };
}

async function updateCampaignStatus(id, status, { startedAt = null, completedAt = null } = {}) {
  const updates = ['status = ?'];
  const params = [status];

  if (startedAt !== null) {
    updates.push('started_at = ?');
    params.push(startedAt);
  }
  if (completedAt !== null) {
    updates.push('completed_at = ?');
    params.push(completedAt);
  }

  params.push(id);
  await pool.execute(`UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`, params);
}

async function refreshCampaignCounters(campaignId) {
  const [counts] = await pool.execute(
    `SELECT 
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
       SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing
     FROM campaign_recipients 
     WHERE campaign_id = ?`,
    [campaignId]
  );

  const row = counts[0];
  const sentCount = row.sent || 0;
  const failedCount = row.failed || 0;
  const skippedCount = row.skipped || 0;
  const pendingCount = (row.pending || 0) + (row.processing || 0);

  let newStatus = undefined;
  let completedAt = null;

  if (pendingCount === 0) {
    newStatus = 'completed';
    completedAt = new Date();
    await pool.execute(
      `UPDATE campaigns 
       SET sent_count = ?, failed_count = ?, skipped_count = ?, status = ?, completed_at = ?
       WHERE id = ?`,
      [sentCount, failedCount, skippedCount, newStatus, completedAt, campaignId]
    );
  } else {
    await pool.execute(
      `UPDATE campaigns 
       SET sent_count = ?, failed_count = ?, skipped_count = ?
       WHERE id = ?`,
      [sentCount, failedCount, skippedCount, campaignId]
    );
  }

  return {
    total: row.total || 0,
    sent: sentCount,
    failed: failedCount,
    skipped: skippedCount,
    pending: pendingCount,
    status: newStatus
  };
}

async function getNextPendingRecipient(campaignId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, campaign_id, contact_id, recipient_email, recipient_name, recipient_title, recipient_company,
              rendered_subject, rendered_body, attempt_count
       FROM campaign_recipients
       WHERE campaign_id = ? AND status = 'pending'
       ORDER BY id ASC
       LIMIT 1
       FOR UPDATE`,
      [campaignId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return null;
    }

    const recipient = rows[0];
    await connection.execute(
      `UPDATE campaign_recipients 
       SET status = 'processing', attempt_count = attempt_count + 1 
       WHERE id = ?`,
      [recipient.id]
    );

    await connection.commit();
    return recipient;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function markRecipientSuccess(recipientId) {
  await pool.execute(
    `UPDATE campaign_recipients 
     SET status = 'sent', sent_at = NOW(), last_error = NULL 
     WHERE id = ?`,
    [recipientId]
  );
}

async function markRecipientFailure(recipientId, errorMessage) {
  await pool.execute(
    `UPDATE campaign_recipients 
     SET status = 'failed', last_error = ? 
     WHERE id = ?`,
    [errorMessage ? String(errorMessage).substring(0, 1000) : 'Unknown error', recipientId]
  );
}

async function markRecipientSkipped(recipientId, reason) {
  await pool.execute(
    `UPDATE campaign_recipients 
     SET status = 'skipped', last_error = ? 
     WHERE id = ?`,
    [reason ? String(reason).substring(0, 500) : 'Skipped due to policy or suppression', recipientId]
  );
}

async function cancelRemainingRecipients(campaignId) {
  await pool.execute(
    `UPDATE campaign_recipients 
     SET status = 'cancelled' 
     WHERE campaign_id = ? AND status IN ('pending', 'processing')`,
    [campaignId]
  );
}

async function getRecipientsByCampaign(userId, campaignId, { page = 1, limit = 50, status = '', search = '' } = {}) {
  const offset = (page - 1) * limit;
  const conditions = ['r.campaign_id = ?', 'c.user_id = ?'];
  const params = [campaignId, userId];

  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push('(r.recipient_name LIKE ? OR r.recipient_email LIKE ? OR r.recipient_company LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM campaign_recipients r 
    JOIN campaigns c ON r.campaign_id = c.id 
    ${whereClause}
  `;
  const [countRows] = await pool.execute(countQuery, params);
  const total = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT r.* 
     FROM campaign_recipients r
     JOIN campaigns c ON r.campaign_id = c.id
     ${whereClause} 
     ORDER BY r.id ASC 
     LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`,
    params
  );

  return {
    recipients: rows,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit)
  };
}

async function getAllRecipientLogs(userId, { page = 1, limit = 50, status = '', campaignId = '', company = '', search = '' } = {}) {
  const offset = (page - 1) * limit;
  const conditions = ['c.user_id = ?'];
  const params = [userId];

  if (campaignId) {
    conditions.push('r.campaign_id = ?');
    params.push(campaignId);
  }

  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
  }

  if (company) {
    conditions.push('r.recipient_company = ?');
    params.push(company);
  }

  if (search) {
    conditions.push('(r.recipient_name LIKE ? OR r.recipient_email LIKE ? OR r.recipient_company LIKE ? OR r.recipient_title LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total 
     FROM campaign_recipients r
     JOIN campaigns c ON r.campaign_id = c.id
     ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT r.*, c.campaign_name 
     FROM campaign_recipients r
     JOIN campaigns c ON r.campaign_id = c.id
     ${whereClause}
     ORDER BY r.updated_at DESC 
     LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`,
    params
  );

  return {
    logs: rows,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit)
  };
}

async function retryFailedRecipients(userId, campaignId) {
  const [result] = await pool.execute(
    `UPDATE campaign_recipients r
     JOIN campaigns c ON r.campaign_id = c.id
     SET r.status = 'pending', r.last_error = NULL 
     WHERE r.campaign_id = ? AND c.user_id = ? AND r.status = 'failed'`,
    [campaignId, userId]
  );

  if (result.affectedRows > 0) {
    await pool.execute(
      `UPDATE campaigns 
       SET status = 'queued', completed_at = NULL 
       WHERE id = ? AND user_id = ?`,
      [campaignId, userId]
    );
  }

  await refreshCampaignCounters(campaignId);
  return result.affectedRows;
}

async function recoverStaleJobs() {
  const [res] = await pool.execute(
    `UPDATE campaign_recipients 
     SET status = 'pending' 
     WHERE status = 'processing'`
  );
  if (res.affectedRows > 0) {
    console.log(`[Queue Recovery] Recovered ${res.affectedRows} jobs back to pending state.`);
  }

  const [campRes] = await pool.execute(
    `UPDATE campaigns 
     SET status = 'queued' 
     WHERE status = 'processing'`
  );
  if (campRes.affectedRows > 0) {
    console.log(`[Queue Recovery] Recovered ${campRes.affectedRows} campaigns back to queued state.`);
  }
}

// Per-User Dashboard statistics
async function getDashboardStats(userId) {
  const [contactRows] = await pool.execute('SELECT COUNT(*) AS total FROM hr_contacts WHERE user_id = ?', [userId]);
  const [campaignRows] = await pool.execute('SELECT COUNT(*) AS total FROM campaigns WHERE user_id = ?', [userId]);

  const [emailStatusRows] = await pool.execute(
    `SELECT 
       SUM(CASE WHEN r.status = 'sent' THEN 1 ELSE 0 END) AS sent_total,
       SUM(CASE WHEN r.status = 'failed' THEN 1 ELSE 0 END) AS failed_total,
       SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) AS pending_total
     FROM campaign_recipients r
     JOIN campaigns c ON r.campaign_id = c.id
     WHERE c.user_id = ?`,
    [userId]
  );

  const [recentCampaigns] = await pool.execute(
    `SELECT id, campaign_name, status, total_recipients, sent_count, failed_count, created_at, completed_at
     FROM campaigns 
     WHERE user_id = ?
     ORDER BY created_at DESC 
     LIMIT 5`,
    [userId]
  );

  const [recentHistory] = await pool.execute(
    `SELECT r.id, r.recipient_name, r.recipient_email, r.recipient_company, r.status, r.sent_at, r.last_error, c.campaign_name
     FROM campaign_recipients r
     JOIN campaigns c ON r.campaign_id = c.id
     WHERE c.user_id = ?
     ORDER BY r.updated_at DESC 
     LIMIT 10`,
    [userId]
  );

  return {
    totalContacts: contactRows[0]?.total || 0,
    validEmails: contactRows[0]?.total || 0,
    invalidEmails: 0,
    totalCampaigns: campaignRows[0]?.total || 0,
    emailsSent: emailStatusRows[0]?.sent_total || 0,
    emailsFailed: emailStatusRows[0]?.failed_total || 0,
    emailsPending: emailStatusRows[0]?.pending_total || 0,
    recentCampaigns,
    recentHistory
  };
}

module.exports = {
  createCampaignWithRecipients,
  getCampaignById,
  getCampaignByIdInternal,
  getAllCampaigns,
  updateCampaignStatus,
  refreshCampaignCounters,
  getNextPendingRecipient,
  markRecipientSuccess,
  markRecipientFailure,
  markRecipientSkipped,
  cancelRemainingRecipients,
  getRecipientsByCampaign,
  getAllRecipientLogs,
  retryFailedRecipients,
  recoverStaleJobs,
  getDashboardStats
};
