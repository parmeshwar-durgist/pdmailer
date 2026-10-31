const contactService = require('../services/contactService');
const importService = require('../services/importService');
const { contactSchema } = require('../validators/schemas');

async function list(req, res, next) {
  try {
    const userId = req.user.id;
    const { page, limit, search, company, title, sort, order } = req.query;
    const result = await contactService.listContacts(userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search: search || '',
      company: company || '',
      title: title || '',
      sort: sort || 'created_at',
      order: order || 'DESC'
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const contact = await contactService.getContactById(req.user.id, req.params.id);
    return res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const validated = contactSchema.parse(req.body);
    const newContact = await contactService.createContact(req.user.id, validated);
    return res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: newContact
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const validated = contactSchema.parse(req.body);
    const updatedContact = await contactService.updateContact(req.user.id, req.params.id, validated);
    return res.json({
      success: true,
      message: 'Contact updated successfully',
      data: updatedContact
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await contactService.deleteContact(req.user.id, req.params.id);
    return res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}

async function getFilters(req, res, next) {
  try {
    const filters = await contactService.getFilters(req.user.id);
    return res.json({ success: true, data: filters });
  } catch (err) {
    next(err);
  }
}

async function previewImport(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.' });
    }
    const preview = await importService.previewImport(req.user.id, req.file.buffer);
    return res.json({ success: true, data: preview });
  } catch (err) {
    next(err);
  }
}

async function confirmImport(req, res, next) {
  try {
    const { contacts, duplicateAction } = req.body;
    const result = await importService.confirmImport(req.user.id, {
      contacts,
      duplicateAction: duplicateAction || 'skip'
    });
    return res.json({
      success: true,
      message: `Successfully processed ${result.totalProcessed} contacts. (Inserted: ${result.insertedCount}, Updated: ${result.updatedCount}, Skipped: ${result.skippedCount})`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function downloadSampleTemplate(req, res, next) {
  try {
    const buffer = importService.generateSampleTemplateBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="HR_Contacts_Sample_Template.xlsx"');
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
}

async function exportContacts(req, res, next) {
  try {
    const csvContent = await contactService.exportContactsCsv(req.user.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="HR_Contacts_Export.csv"');
    return res.send(csvContent);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  getFilters,
  previewImport,
  confirmImport,
  downloadSampleTemplate,
  exportContacts
};
