const templateService = require('../services/templateService');
const { templateSchema, previewEmailSchema } = require('../validators/schemas');

async function list(req, res, next) {
  try {
    const templates = await templateService.listTemplates(req.user.id);
    return res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const template = await templateService.getTemplateById(req.user.id, req.params.id);
    return res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const validated = templateSchema.parse(req.body);
    const template = await templateService.createTemplate(req.user.id, validated);
    return res.status(201).json({
      success: true,
      message: 'Email template created successfully.',
      data: template
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const validated = templateSchema.parse(req.body);
    const template = await templateService.updateTemplate(req.user.id, req.params.id, validated);
    return res.json({
      success: true,
      message: 'Email template updated successfully.',
      data: template
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await templateService.deleteTemplate(req.user.id, req.params.id);
    return res.json({
      success: true,
      message: 'Email template deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

async function preview(req, res, next) {
  try {
    const validated = previewEmailSchema.parse(req.body);
    const rendered = templateService.previewRender(validated);
    return res.json({
      success: true,
      data: rendered
    });
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
  preview
};
