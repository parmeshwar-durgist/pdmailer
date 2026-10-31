require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '4000', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' ? { rejectUnauthorized: true } : false,
  multipleStatements: true
};

async function migrate() {
  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    console.error('Missing DB configuration in .env. Please define DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.');
    process.exit(1);
  }

  console.log('Connecting to database:', dbConfig.host, dbConfig.database);
  const conn = await mysql.createConnection(dbConfig);
  console.log(' Connected to database successfully!');

  // Check foreign key checks
  await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

  const tables = [
    `CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(100) NOT NULL,
      \`email\` VARCHAR(191) NOT NULL UNIQUE,
      \`password_hash\` VARCHAR(255) NOT NULL,
      \`plain_password\` VARCHAR(255) NULL,
      \`role\` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
      \`last_login_at\` DATETIME NULL,
      \`last_login_ip\` VARCHAR(45) NULL,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_users_email\` (\`email\`),
      INDEX \`idx_users_role\` (\`role\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`user_settings\` (
      \`user_id\` INT UNSIGNED PRIMARY KEY,
      \`sender_name\` VARCHAR(150) NULL,
      \`sender_email\` VARCHAR(191) NULL,
      \`gmail_app_password\` VARCHAR(255) NULL,
      \`send_delay_seconds\` INT UNSIGNED NOT NULL DEFAULT 2,
      \`batch_size\` INT UNSIGNED NOT NULL DEFAULT 5,
      \`max_retries\` INT UNSIGNED NOT NULL DEFAULT 2,
      \`whatsapp_connected\` TINYINT(1) NOT NULL DEFAULT 0,
      \`whatsapp_phone\` VARCHAR(50) NULL,
      \`portfolio_url\` VARCHAR(255) NULL,
      \`github_url\` VARCHAR(255) NULL,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_user_settings_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`hr_contacts\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT UNSIGNED NOT NULL,
      \`name\` VARCHAR(150) NOT NULL,
      \`email\` VARCHAR(191) NOT NULL,
      \`phone\` VARCHAR(50) NULL,
      \`title\` VARCHAR(150) DEFAULT NULL,
      \`company\` VARCHAR(150) DEFAULT NULL,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY \`uk_user_contact_email\` (\`user_id\`, \`email\`),
      CONSTRAINT \`fk_contacts_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
      INDEX \`idx_contact_user_company\` (\`user_id\`, \`company\`),
      INDEX \`idx_contact_user_title\` (\`user_id\`, \`title\`),
      INDEX \`idx_contact_user_name\` (\`user_id\`, \`name\`),
      INDEX \`idx_contact_user_phone\` (\`user_id\`, \`phone\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`resumes\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT UNSIGNED NOT NULL,
      \`original_filename\` VARCHAR(255) NOT NULL,
      \`stored_filename\` VARCHAR(255) NOT NULL,
      \`storage_path\` VARCHAR(500) NOT NULL,
      \`file_size\` BIGINT UNSIGNED NOT NULL,
      \`mime_type\` VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
      \`is_active\` TINYINT(1) NOT NULL DEFAULT 0,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_resumes_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
      INDEX \`idx_resumes_user_active\` (\`user_id\`, \`is_active\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`email_templates\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT UNSIGNED NOT NULL,
      \`name\` VARCHAR(150) NOT NULL,
      \`subject\` VARCHAR(255) NOT NULL,
      \`body\` MEDIUMTEXT NOT NULL,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_templates_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
      INDEX \`idx_templates_user\` (\`user_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`email_suppressions\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT UNSIGNED NOT NULL,
      \`email\` VARCHAR(191) NOT NULL,
      \`reason\` VARCHAR(255) DEFAULT 'User requested suppression',
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY \`uk_user_suppression_email\` (\`user_id\`, \`email\`),
      CONSTRAINT \`fk_suppressions_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`campaigns\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT UNSIGNED NOT NULL,
      \`campaign_name\` VARCHAR(150) NOT NULL,
      \`template_id\` INT UNSIGNED NULL,
      \`resume_id\` INT UNSIGNED NULL,
      \`subject_template\` VARCHAR(255) NOT NULL,
      \`body_template\` MEDIUMTEXT NOT NULL,
      \`status\` ENUM('draft', 'queued', 'processing', 'paused', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'draft',
      \`total_recipients\` INT UNSIGNED NOT NULL DEFAULT 0,
      \`sent_count\` INT UNSIGNED NOT NULL DEFAULT 0,
      \`failed_count\` INT UNSIGNED NOT NULL DEFAULT 0,
      \`skipped_count\` INT UNSIGNED NOT NULL DEFAULT 0,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`started_at\` DATETIME NULL,
      \`completed_at\` DATETIME NULL,
      CONSTRAINT \`fk_campaigns_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_campaigns_template\` FOREIGN KEY (\`template_id\`) REFERENCES \`email_templates\` (\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`fk_campaigns_resume\` FOREIGN KEY (\`resume_id\`) REFERENCES \`resumes\` (\`id\`) ON DELETE SET NULL,
      INDEX \`idx_campaigns_user_status\` (\`user_id\`, \`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`campaign_recipients\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`campaign_id\` INT UNSIGNED NOT NULL,
      \`contact_id\` INT UNSIGNED NULL,
      \`recipient_email\` VARCHAR(191) NOT NULL,
      \`recipient_name\` VARCHAR(150) NOT NULL,
      \`recipient_title\` VARCHAR(150) DEFAULT NULL,
      \`recipient_company\` VARCHAR(150) DEFAULT NULL,
      \`rendered_subject\` VARCHAR(255) NOT NULL,
      \`rendered_body\` MEDIUMTEXT NOT NULL,
      \`status\` ENUM('pending', 'processing', 'sent', 'failed', 'skipped', 'cancelled') NOT NULL DEFAULT 'pending',
      \`attempt_count\` INT UNSIGNED NOT NULL DEFAULT 0,
      \`last_error\` TEXT NULL,
      \`next_attempt_at\` DATETIME NULL,
      \`sent_at\` DATETIME NULL,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_recipients_campaign\` FOREIGN KEY (\`campaign_id\`) REFERENCES \`campaigns\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_recipients_contact\` FOREIGN KEY (\`contact_id\`) REFERENCES \`hr_contacts\` (\`id\`) ON DELETE SET NULL,
      INDEX \`idx_recipients_status\` (\`status\`),
      INDEX \`idx_recipients_campaign_status\` (\`campaign_id\`, \`status\`),
      INDEX \`idx_recipients_email\` (\`recipient_email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`whatsapp_templates\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT UNSIGNED NOT NULL,
      \`name\` VARCHAR(150) NOT NULL,
      \`body\` MEDIUMTEXT NOT NULL,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_wa_templates_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
      INDEX \`idx_wa_templates_user\` (\`user_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`whatsapp_campaigns\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT UNSIGNED NOT NULL,
      \`campaign_name\` VARCHAR(150) NOT NULL,
      \`template_id\` INT UNSIGNED NULL,
      \`resume_id\` INT UNSIGNED NULL,
      \`body_template\` MEDIUMTEXT NOT NULL,
      \`status\` ENUM('draft', 'queued', 'processing', 'paused', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'draft',
      \`total_recipients\` INT UNSIGNED NOT NULL DEFAULT 0,
      \`sent_count\` INT UNSIGNED NOT NULL DEFAULT 0,
      \`failed_count\` INT UNSIGNED NOT NULL DEFAULT 0,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`started_at\` DATETIME NULL,
      \`completed_at\` DATETIME NULL,
      CONSTRAINT \`fk_wa_campaigns_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_wa_campaigns_template\` FOREIGN KEY (\`template_id\`) REFERENCES \`whatsapp_templates\` (\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`fk_wa_campaigns_resume\` FOREIGN KEY (\`resume_id\`) REFERENCES \`resumes\` (\`id\`) ON DELETE SET NULL,
      INDEX \`idx_wa_campaigns_user_status\` (\`user_id\`, \`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`whatsapp_recipients\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`campaign_id\` INT UNSIGNED NOT NULL,
      \`contact_id\` INT UNSIGNED NULL,
      \`recipient_phone\` VARCHAR(50) NOT NULL,
      \`recipient_name\` VARCHAR(150) NOT NULL,
      \`recipient_title\` VARCHAR(150) DEFAULT NULL,
      \`recipient_company\` VARCHAR(150) DEFAULT NULL,
      \`rendered_body\` MEDIUMTEXT NOT NULL,
      \`status\` ENUM('pending', 'processing', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
      \`last_error\` TEXT NULL,
      \`sent_at\` DATETIME NULL,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_wa_recipients_campaign\` FOREIGN KEY (\`campaign_id\`) REFERENCES \`whatsapp_campaigns\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_wa_recipients_contact\` FOREIGN KEY (\`contact_id\`) REFERENCES \`hr_contacts\` (\`id\`) ON DELETE SET NULL,
      INDEX \`idx_wa_recipients_status\` (\`status\`),
      INDEX \`idx_wa_recipients_campaign\` (\`campaign_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  for (const sql of tables) {
    await conn.query(sql);
  }
  console.log('All 11 tables verified/created successfully!');

  // Seed Admin User
  const passwordHash = await bcrypt.hash('Admin@12345', 10);
  await conn.query(`
    INSERT INTO \`users\` (\`id\`,\`name\`, \`email\`, \`password_hash\`, \`plain_password\`, \`role\`)
    VALUES (1, 'Parmeshwar Durgist', 'admin@hrmailer.com', ?, 'Admin@12345', 'admin')
    ON DUPLICATE KEY UPDATE \`password_hash\` = VALUES(\`password_hash\`), \`plain_password\` = VALUES(\`plain_password\`), \`role\` = 'admin'
  `, [passwordHash]);
  console.log('Admin user seeded: admin@hrmailer.com');

  // Seed User Settings
  await conn.query(`
    INSERT INTO \`user_settings\` (\`user_id\`, \`sender_name\`, \`sender_email\`, \`send_delay_seconds\`, \`batch_size\`, \`max_retries\`, \`portfolio_url\`, \`github_url\`)
    VALUES (1, 'Parmeshwar Durgist', 'durgistparmeshwar@gmail.com', 2, 5, 2, 'https://parmeshwar-the-series.vercel.app/', 'https://github.com/parmeshwar-durgist')
    ON DUPLICATE KEY UPDATE \`sender_email\` = VALUES(\`sender_email\`)
  `);

  // Restore foreign key checks
  await conn.query('SET FOREIGN_KEY_CHECKS = 1;');

  const [tableList] = await conn.query('SHOW TABLES');
  console.log('\n--- VERIFICATION: All tables in database ---');
  tableList.forEach(t => console.log(' -', Object.values(t)[0]));

  await conn.end();
  console.log('\n All migrations and seedings completed successfully!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
