const resumeService = require('../services/resumeService');

async function list(req, res, next) {
  try {
    const resumes = await resumeService.listResumes(req.user.id);
    return res.json({ success: true, data: resumes });
  } catch (err) {
    next(err);
  }
}

async function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a valid PDF resume file.' });
    }
    const makeActive = req.body.make_active !== 'false';
    const resume = await resumeService.uploadResumeFile(req.user.id, req.file, makeActive);
    return res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully.',
      data: resume
    });
  } catch (err) {
    next(err);
  }
}

async function activate(req, res, next) {
  try {
    const resume = await resumeService.activateResume(req.user.id, req.params.id);
    return res.json({
      success: true,
      message: 'Resume set as active for email campaigns.',
      data: resume
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await resumeService.deleteResume(req.user.id, req.params.id);
    return res.json({
      success: true,
      message: 'Resume deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

async function download(req, res, next) {
  try {
    const fileData = await resumeService.getResumeDownloadData(req.user.id, req.params.id);
    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.filename)}"`);
    return res.sendFile(fileData.filePath);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  upload,
  activate,
  remove,
  download
};
