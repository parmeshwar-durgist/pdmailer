const xlsx = require('xlsx');
const contactRepository = require('../repositories/contactRepository');
const { pool } = require('../config/db');
const { normalizeEmail, isValidEmail } = require('../utils/sanitize');

function generateSampleTemplateBuffer() {
  const wb = xlsx.utils.book_new();
  const sampleData = [
    { Name: 'Amit Sharma', Emails: 'amit.sharma@example.com', Phone: '+919876543210', Title: 'React Developer', Company: 'ABC Technologies' },
    { Name: 'Priya Patil', Emails: 'priya.patil@example.com', Phone: '+919876543211', Title: 'Software Engineer', Company: 'XYZ Solutions' },
    { Name: 'Rohan Verma', Emails: 'rohan.verma@example.com', Phone: '+919876543212', Title: 'Technical Recruiter', Company: 'Innovatech Labs' },
    { Name: 'Sneha Nair', Emails: 'sneha.nair@example.com', Phone: '+919876543213', Title: 'Lead HR Partner', Company: 'CloudScale Systems' }
  ];
  const ws = xlsx.utils.json_to_sheet(sampleData, { header: ['Name', 'Emails', 'Phone', 'Title', 'Company'] });
  
  ws['!cols'] = [
    { wch: 22 },
    { wch: 32 },
    { wch: 18 },
    { wch: 25 },
    { wch: 25 }
  ];

  xlsx.utils.book_append_sheet(wb, ws, 'HR_Contacts');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function parseFileRows(fileBuffer) {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded spreadsheet does not contain any sheets.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  if (rawRows.length === 0) {
    throw new Error('The spreadsheet is empty. Please add rows with Name, Emails, Title, Company.');
  }

  return rawRows;
}

function extractContactFields(rawRow, rowIndex) {
  const normalizedKeys = {};
  for (const [key, val] of Object.entries(rawRow)) {
    normalizedKeys[key.trim().toLowerCase()] = String(val).trim();
  }

  const name = normalizedKeys['name'] || normalizedKeys['full name'] || normalizedKeys['candidate name'] || normalizedKeys['hr name'] || '';
  const emailRaw = normalizedKeys['emails'] || normalizedKeys['email'] || normalizedKeys['e-mail'] || normalizedKeys['contact email'] || '';
  const phone = normalizedKeys['phone'] || normalizedKeys['mobile'] || normalizedKeys['whatsapp'] || normalizedKeys['whatsapp number'] || normalizedKeys['contact number'] || normalizedKeys['cell'] || '';
  const title = normalizedKeys['title'] || normalizedKeys['job title'] || normalizedKeys['designation'] || normalizedKeys['position'] || '';
  const company = normalizedKeys['company'] || normalizedKeys['company name'] || normalizedKeys['organization'] || '';

  const email = normalizeEmail(emailRaw);

  const errors = [];
  if (!name) {
    errors.push('Name is required');
  }
  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push(`Invalid email format: "${emailRaw}"`);
  }

  return {
    rowNumber: rowIndex + 2,
    name,
    email,
    phone,
    title,
    company,
    isValid: errors.length === 0,
    errors
  };
}

async function previewImport(userId, fileBuffer) {
  const rawRows = parseFileRows(fileBuffer);
  const parsedRows = [];
  const seenEmailsInFile = new Set();
  const fileDuplicateRows = [];
  const invalidRows = [];
  const validCandidates = [];

  rawRows.forEach((row, index) => {
    const item = extractContactFields(row, index);
    if (!item.isValid) {
      invalidRows.push(item);
    } else if (seenEmailsInFile.has(item.email)) {
      item.isDuplicateInFile = true;
      item.errors.push(`Duplicate email "${item.email}" found multiple times in uploaded file.`);
      fileDuplicateRows.push(item);
    } else {
      seenEmailsInFile.add(item.email);
      validCandidates.push(item);
    }
    parsedRows.push(item);
  });

  // Check how many exist in user's contacts in MySQL
  const candidateEmails = validCandidates.map(c => c.email);
  const existingInDb = await contactRepository.findByEmails(userId, candidateEmails);
  const existingEmailSet = new Set(existingInDb.map(e => e.email.toLowerCase()));

  const finalValidRows = [];
  const existingInDbRows = [];

  for (const item of validCandidates) {
    if (existingEmailSet.has(item.email)) {
      item.existsInDb = true;
      existingInDbRows.push(item);
    } else {
      item.existsInDb = false;
      finalValidRows.push(item);
    }
  }

  return {
    totalRows: rawRows.length,
    validNewCount: finalValidRows.length,
    existingInDbCount: existingInDbRows.length,
    fileDuplicateCount: fileDuplicateRows.length,
    invalidCount: invalidRows.length,
    previewItems: parsedRows.slice(0, 100),
    validRows: finalValidRows,
    existingRows: existingInDbRows,
    invalidRows,
    fileDuplicateRows
  };
}

async function confirmImport(userId, { contacts, duplicateAction = 'skip' }) {
  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    throw new Error('No contacts provided for import.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of contacts) {
      const email = normalizeEmail(item.email);
      if (!isValidEmail(email) || !item.name) {
        skippedCount++;
        continue;
      }

      const name = item.name.trim();
      const phone = item.phone ? String(item.phone).trim() : null;
      const title = item.title ? item.title.trim() : null;
      const company = item.company ? item.company.trim() : null;

      if (duplicateAction === 'update') {
        const [result] = await connection.execute(
          `INSERT INTO hr_contacts (user_id, name, email, phone, title, company) 
           VALUES (?, ?, ?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE 
             name = VALUES(name), 
             phone = VALUES(phone),
             title = VALUES(title), 
             company = VALUES(company)`,
          [userId, name, email, phone, title, company]
        );
        if (result.affectedRows === 1) insertedCount++;
        else if (result.affectedRows === 2) updatedCount++;
        else skippedCount++;
      } else {
        const [result] = await connection.execute(
          `INSERT IGNORE INTO hr_contacts (user_id, name, email, phone, title, company) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, name, email, phone, title, company]
        );
        if (result.affectedRows > 0) {
          insertedCount++;
        } else {
          skippedCount++;
        }
      }
    }

    await connection.commit();

    return {
      success: true,
      insertedCount,
      updatedCount,
      skippedCount,
      totalProcessed: contacts.length
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  generateSampleTemplateBuffer,
  previewImport,
  confirmImport
};
