const fs = require('fs');
const path = require('path');
const resumeRepository = require('../repositories/resumeRepository');

async function listResumes(userId) {
  return await resumeRepository.getAllResumes(userId);
}

async function getActiveResume(userId) {
  return await resumeRepository.getActiveResume(userId);
}

async function uploadResumeFile(userId, file, makeActive = true) {
  if (!file) {
    throw new Error('No file was provided for upload.');
  }

  const id = await resumeRepository.createResume(userId, {
    originalFilename: file.originalname,
    storedFilename: file.filename,
    storagePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    isActive: makeActive
  });

  return await resumeRepository.findById(userId, id);
}

async function activateResume(userId, id) {
  const existing = await resumeRepository.findById(userId, id);
  if (!existing) {
    throw new Error('Resume not found');
  }
  await resumeRepository.setActiveResume(userId, id);
  return await resumeRepository.findById(userId, id);
}

async function deleteResume(userId, id) {
  const resume = await resumeRepository.findById(userId, id);
  if (!resume) {
    throw new Error('Resume not found');
  }

  if (fs.existsSync(resume.storage_path)) {
    try {
      fs.unlinkSync(resume.storage_path);
    } catch (e) {
      console.warn(`[Resume Service] Could not remove physical file at ${resume.storage_path}:`, e.message);
    }
  }

  await resumeRepository.deleteResume(userId, id);

  if (resume.is_active) {
    const all = await resumeRepository.getAllResumes(userId);
    if (all.length > 0) {
      await resumeRepository.setActiveResume(userId, all[0].id);
    }
  }

  return true;
}

async function getResumeDownloadData(userId, id) {
  const resume = await resumeRepository.findById(userId, id);
  if (!resume) {
    throw new Error('Resume not found');
  }
  if (!fs.existsSync(resume.storage_path)) {
    throw new Error('Resume file is missing from physical storage.');
  }
  return {
    filePath: resume.storage_path,
    filename: resume.original_filename,
    mimeType: resume.mime_type
  };
}

module.exports = {
  listResumes,
  getActiveResume,
  uploadResumeFile,
  activateResume,
  deleteResume,
  getResumeDownloadData
};
