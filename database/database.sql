-- ===================================================
-- HR Bulk Email Sender Portal - Multi-Tenant Schema
-- Database Name: hr_mailer_db
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- ===================================================

CREATE DATABASE IF NOT EXISTS `hr_mailer_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `hr_mailer_db`;

-- 1. Users Table (Multi-tenant user accounts with RBAC & Login Tracking)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `plain_password` VARCHAR(255) NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `last_login_at` DATETIME NULL,
  `last_login_ip` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User Settings & SMTP / WhatsApp Configuration (Per-user sender profile & App Password)
CREATE TABLE IF NOT EXISTS `user_settings` (
  `user_id` INT UNSIGNED PRIMARY KEY,
  `sender_name` VARCHAR(150) NULL,
  `sender_email` VARCHAR(191) NULL,
  `gmail_app_password` VARCHAR(255) NULL,
  `send_delay_seconds` INT UNSIGNED NOT NULL DEFAULT 2,
  `batch_size` INT UNSIGNED NOT NULL DEFAULT 5,
  `max_retries` INT UNSIGNED NOT NULL DEFAULT 2,
  `whatsapp_connected` TINYINT(1) NOT NULL DEFAULT 0,
  `whatsapp_phone` VARCHAR(50) NULL,
  `portfolio_url` VARCHAR(255) NULL,
  `github_url` VARCHAR(255) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. HR Contacts Table (Scoped per user: UNIQUE per user + email)
CREATE TABLE IF NOT EXISTS `hr_contacts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `title` VARCHAR(150) DEFAULT NULL,
  `company` VARCHAR(150) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_contact_email` (`user_id`, `email`),
  CONSTRAINT `fk_contacts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_contact_user_company` (`user_id`, `company`),
  INDEX `idx_contact_user_title` (`user_id`, `title`),
  INDEX `idx_contact_user_name` (`user_id`, `name`),
  INDEX `idx_contact_user_phone` (`user_id`, `phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Resumes Table (Scoped per user)
CREATE TABLE IF NOT EXISTS `resumes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `stored_filename` VARCHAR(255) NOT NULL,
  `storage_path` VARCHAR(500) NOT NULL,
  `file_size` BIGINT UNSIGNED NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_resumes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_resumes_user_active` (`user_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Email Templates Table (Scoped per user)
CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_templates_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_templates_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Email Suppressions Table (Opt-outs scoped per user)
CREATE TABLE IF NOT EXISTS `email_suppressions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `reason` VARCHAR(255) DEFAULT 'User requested suppression',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_suppression_email` (`user_id`, `email`),
  CONSTRAINT `fk_suppressions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Campaigns Table (Scoped per user)
CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `campaign_name` VARCHAR(150) NOT NULL,
  `template_id` INT UNSIGNED NULL,
  `resume_id` INT UNSIGNED NULL,
  `subject_template` VARCHAR(255) NOT NULL,
  `body_template` MEDIUMTEXT NOT NULL,
  `status` ENUM('draft', 'queued', 'processing', 'paused', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'draft',
  `total_recipients` INT UNSIGNED NOT NULL DEFAULT 0,
  `sent_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `failed_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `skipped_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  CONSTRAINT `fk_campaigns_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_campaigns_template` FOREIGN KEY (`template_id`) REFERENCES `email_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_campaigns_resume` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`) ON DELETE SET NULL,
  INDEX `idx_campaigns_user_status` (`user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Campaign Recipients Table
CREATE TABLE IF NOT EXISTS `campaign_recipients` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT UNSIGNED NOT NULL,
  `contact_id` INT UNSIGNED NULL,
  `recipient_email` VARCHAR(191) NOT NULL,
  `recipient_name` VARCHAR(150) NOT NULL,
  `recipient_title` VARCHAR(150) DEFAULT NULL,
  `recipient_company` VARCHAR(150) DEFAULT NULL,
  `rendered_subject` VARCHAR(255) NOT NULL,
  `rendered_body` MEDIUMTEXT NOT NULL,
  `status` ENUM('pending', 'processing', 'sent', 'failed', 'skipped', 'cancelled') NOT NULL DEFAULT 'pending',
  `attempt_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `last_error` TEXT NULL,
  `next_attempt_at` DATETIME NULL,
  `sent_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_recipients_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recipients_contact` FOREIGN KEY (`contact_id`) REFERENCES `hr_contacts` (`id`) ON DELETE SET NULL,
  INDEX `idx_recipients_status` (`status`),
  INDEX `idx_recipients_campaign_status` (`campaign_id`, `status`),
  INDEX `idx_recipients_email` (`recipient_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. WhatsApp Templates Table (Scoped per user)
CREATE TABLE IF NOT EXISTS `whatsapp_templates` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `body` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_wa_templates_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_wa_templates_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. WhatsApp Campaigns Table (Scoped per user)
CREATE TABLE IF NOT EXISTS `whatsapp_campaigns` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `campaign_name` VARCHAR(150) NOT NULL,
  `template_id` INT UNSIGNED NULL,
  `resume_id` INT UNSIGNED NULL,
  `body_template` MEDIUMTEXT NOT NULL,
  `status` ENUM('draft', 'queued', 'processing', 'paused', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'draft',
  `total_recipients` INT UNSIGNED NOT NULL DEFAULT 0,
  `sent_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `failed_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  CONSTRAINT `fk_wa_campaigns_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wa_campaigns_template` FOREIGN KEY (`template_id`) REFERENCES `whatsapp_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_wa_campaigns_resume` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`) ON DELETE SET NULL,
  INDEX `idx_wa_campaigns_user_status` (`user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. WhatsApp Recipients Table
CREATE TABLE IF NOT EXISTS `whatsapp_recipients` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT UNSIGNED NOT NULL,
  `contact_id` INT UNSIGNED NULL,
  `recipient_phone` VARCHAR(50) NOT NULL,
  `recipient_name` VARCHAR(150) NOT NULL,
  `recipient_title` VARCHAR(150) DEFAULT NULL,
  `recipient_company` VARCHAR(150) DEFAULT NULL,
  `rendered_body` MEDIUMTEXT NOT NULL,
  `status` ENUM('pending', 'processing', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  `last_error` TEXT NULL,
  `sent_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_wa_recipients_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `whatsapp_campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wa_recipients_contact` FOREIGN KEY (`contact_id`) REFERENCES `hr_contacts` (`id`) ON DELETE SET NULL,
  INDEX `idx_wa_recipients_status` (`status`),
  INDEX `idx_wa_recipients_campaign` (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- Seed Initial User & Data
-- ===================================================

-- Initial Administrator:
-- Email: admin@hrmailer.com
-- Password: Admin@12345
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `plain_password`, `role`) 
VALUES (1, 'Parmeshwar Durgist', 'admin@hrmailer.com', '$2a$10$WZ1eUzAo/yKY5x2KSylBKeo/LQCaFdX/Y5Bajc/2xP9eX0SKfy8QG', 'Admin@12345', 'admin')
ON DUPLICATE KEY UPDATE `password_hash`=VALUES(`password_hash`), `plain_password`=VALUES(`plain_password`), `role`=VALUES(`role`);

-- Settings for User 1
INSERT INTO `user_settings` (`user_id`, `sender_name`, `sender_email`, `send_delay_seconds`, `batch_size`, `max_retries`, `portfolio_url`, `github_url`)
VALUES (1, 'Parmeshwar Durgist', 'durgistparmeshwar@gmail.com', 2, 5, 2, 'https://parmeshwar-the-series.vercel.app/', 'https://github.com/parmeshwar-durgist')
ON DUPLICATE KEY UPDATE `sender_email`=VALUES(`sender_email`);

-- Default Template for User 1
INSERT INTO `email_templates` (`id`, `user_id`, `name`, `subject`, `body`) VALUES
(1, 1, 'Software Engineer Job Application (Executive Format)', 
'Application for {{Title}} Position – Parmeshwar Durgist', 
'<p>Dear {{Name}},</p>
<p>I hope this email finds you well.</p>
<p>I am writing to express my strong interest in exploring software engineering opportunities at <strong>{{Company}}</strong> for the <strong>{{Title}}</strong> position.</p>
<p>I am a Software Engineer with <strong>2+ years of professional experience</strong> in developing scalable web applications, backend APIs, and database solutions. My core technical proficiencies include:</p>
<ul style="margin: 0 0 16px 20px; padding: 0;">
  <li><strong>Frontend:</strong> React.js, JavaScript, Responsive UI, Bootstrap</li>
  <li><strong>Backend:</strong> Node.js, Express.js, RESTful APIs, Microservices</li>
  <li><strong>Databases:</strong> MySQL, MongoDB, Query Optimization</li>
  <li><strong>Other Skills:</strong> Java, Android Development, Git & GitHub</li>
</ul>
<p>I am actively seeking new engineering opportunities where I can apply my problem-solving skills, contribute to challenging projects, and deliver clean, maintainable code.</p>
<p>Please find my updated resume attached for your kind review. I would welcome the opportunity for a brief conversation to discuss how my skill set can add value to your engineering team.</p>
<p>Thank you very much for your time and consideration.</p>
<p style="margin-bottom: 4px;">Best regards,</p>
<div style="margin-top: 18px; padding-top: 14px; border-top: 2px solid #e5e7eb;">
  <div style="font-size: 16px; font-weight: 700; color: #111827;">Parmeshwar Durgist</div>
  <div style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">Software Engineer | Full-Stack Developer</div>
  <div style="font-size: 13px; color: #4b5563; line-height: 1.6;">
    <div>📧 <strong>Email:</strong> <a href="mailto:durgistparmeshwar@gmail.com" style="color: #1d4ed8; text-decoration: underline;">durgistparmeshwar@gmail.com</a></div>
    <div>🌐 <strong>Portfolio:</strong> <a href="https://parmeshwar-the-series.vercel.app/" target="_blank" style="color: #1d4ed8; text-decoration: underline;">https://parmeshwar-the-series.vercel.app/</a></div>
    <div>💻 <strong>GitHub:</strong> <a href="https://github.com/parmeshwar-durgist" target="_blank" style="color: #1d4ed8; text-decoration: underline;">https://github.com/parmeshwar-durgist</a></div>
  </div>
</div>')
ON DUPLICATE KEY UPDATE `user_id`=VALUES(`user_id`);

-- Sample Contacts for User 1
INSERT INTO `hr_contacts` (`user_id`, `name`, `email`, `phone`, `title`, `company`) VALUES
(1, 'Amit Sharma', 'amit.sharma@example.com', '+919876543210', 'Technical Recruiter', 'ABC Technologies'),
(1, 'Priya Patil', 'priya.patil@example.com', '+919876543211', 'Senior HR Manager', 'XYZ Solutions'),
(1, 'Rohan Verma', 'rohan.verma@example.com', '+919876543212', 'Lead Talent Acquisition', 'Innovatech Labs'),
(1, 'Sneha Nair', 'sneha.nair@example.com', '+919876543213', 'HR Business Partner', 'CloudScale Systems'),
(1, 'Vikram Mehta', 'vikram.mehta@example.com', '+919876543214', 'Recruiting Specialist', 'NextGen Soft')
ON DUPLICATE KEY UPDATE `user_id`=VALUES(`user_id`);

-- Default WhatsApp Template for User 1
INSERT INTO `whatsapp_templates` (`id`, `user_id`, `name`, `body`) VALUES
(1, 1, 'Software Engineer Pitch (WhatsApp)', 
'Hello {{Name}},

I hope you are doing well!

I came across hiring opportunities for the *{{Title}}* position at *{{Company}}* and wanted to connect directly. I am a Full-Stack Software Engineer with 2+ years of professional experience in React.js, Node.js, Express, MySQL, and REST APIs.

I have attached my updated resume for your kind review.

🌐 *Portfolio:* https://parmeshwar-the-series.vercel.app/
💻 *GitHub:* https://github.com/parmeshwar-durgist
📧 *Email:* durgistparmeshwar@gmail.com

Looking forward to hearing from you. Thank you for your time!

Best regards,
*Parmeshwar Durgist*')
ON DUPLICATE KEY UPDATE `user_id`=VALUES(`user_id`);
