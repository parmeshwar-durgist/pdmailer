const templateRepository = require('../repositories/templateRepository');
const { renderTemplate, cleanHtml, formatEmailHtml } = require('../utils/sanitize');

async function listTemplates(userId) {
  return await templateRepository.getAllTemplates(userId);
}

async function getTemplateById(userId, id) {
  const template = await templateRepository.findById(userId, id);
  if (!template) {
    throw new Error('Template not found');
  }
  return template;
}

async function createTemplate(userId, data) {
  const cleanBody = cleanHtml(data.body);
  const id = await templateRepository.createTemplate(userId, {
    name: data.name,
    subject: data.subject,
    body: cleanBody
  });
  return await templateRepository.findById(userId, id);
}

async function updateTemplate(userId, id, data) {
  const existing = await templateRepository.findById(userId, id);
  if (!existing) {
    throw new Error('Template not found');
  }
  const cleanBody = cleanHtml(data.body);
  await templateRepository.updateTemplate(userId, id, {
    name: data.name,
    subject: data.subject,
    body: cleanBody
  });
  return await templateRepository.findById(userId, id);
}

async function deleteTemplate(userId, id) {
  const existing = await templateRepository.findById(userId, id);
  if (!existing) {
    throw new Error('Template not found');
  }
  return await templateRepository.deleteTemplate(userId, id);
}

function previewRender({ subject, body, contact }) {
  const renderedSubject = renderTemplate(subject, contact);
  const renderedBody = renderTemplate(body, contact);
  return {
    renderedSubject,
    renderedBody: formatEmailHtml(cleanHtml(renderedBody))
  };
}

module.exports = {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewRender
};
