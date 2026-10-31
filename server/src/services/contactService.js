const contactRepository = require('../repositories/contactRepository');
const { normalizeEmail, isValidEmail, sanitizeCsvCell } = require('../utils/sanitize');

async function listContacts(userId, params) {
  return await contactRepository.getContacts(userId, params);
}

async function getContactById(userId, id) {
  const contact = await contactRepository.findById(userId, id);
  if (!contact) {
    throw new Error('Contact not found');
  }
  return contact;
}

async function createContact(userId, data) {
  const email = normalizeEmail(data.email);
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address format');
  }

  const existing = await contactRepository.findByEmail(userId, email);
  if (existing) {
    throw new Error(`A contact with email "${email}" already exists in your contacts.`);
  }

  const id = await contactRepository.createContact(userId, {
    name: data.name,
    email,
    phone: data.phone,
    title: data.title,
    company: data.company
  });

  return await contactRepository.findById(userId, id);
}

async function updateContact(userId, id, data) {
  const existing = await contactRepository.findById(userId, id);
  if (!existing) {
    throw new Error('Contact not found');
  }

  const email = normalizeEmail(data.email);
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address format');
  }

  const duplicate = await contactRepository.findByEmail(userId, email);
  if (duplicate && duplicate.id !== parseInt(id, 10)) {
    throw new Error(`Another contact is already using the email "${email}".`);
  }

  await contactRepository.updateContact(userId, id, {
    name: data.name,
    email,
    phone: data.phone,
    title: data.title,
    company: data.company
  });

  return await contactRepository.findById(userId, id);
}

async function deleteContact(userId, id) {
  const existing = await contactRepository.findById(userId, id);
  if (!existing) {
    throw new Error('Contact not found');
  }
  return await contactRepository.deleteContact(userId, id);
}

async function getFilters(userId) {
  const [companies, titles] = await Promise.all([
    contactRepository.getDistinctCompanies(userId),
    contactRepository.getDistinctTitles(userId)
  ]);
  return { companies, titles };
}

async function exportContactsCsv(userId) {
  const contacts = await contactRepository.getAllForExport(userId);
  const headers = ['ID', 'Name', 'Email', 'Title', 'Company', 'Created At'];
  const rows = contacts.map(c => [
    sanitizeCsvCell(c.id),
    sanitizeCsvCell(c.name),
    sanitizeCsvCell(c.email),
    sanitizeCsvCell(c.title || ''),
    sanitizeCsvCell(c.company || ''),
    sanitizeCsvCell(c.created_at)
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

module.exports = {
  listContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getFilters,
  exportContactsCsv
};
