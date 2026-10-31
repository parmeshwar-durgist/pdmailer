const userRepository = require('../repositories/userRepository');

async function getUsers(req, res, next) {
  try {
    const users = await userRepository.getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await userRepository.getPlatformStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be "admin" or "user".'
      });
    }

    if (req.user.id === targetUserId && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot demote your own administrator account.'
      });
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    await userRepository.updateUserRole(targetUserId, role);

    const updatedUser = await userRepository.findById(targetUserId);
    res.json({
      success: true,
      message: `User "${updatedUser.name}" role updated to ${role}.`,
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    if (req.user.id === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrator account.'
      });
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    await userRepository.deleteUser(targetUserId);

    res.json({
      success: true,
      message: `User account "${targetUser.name}" (${targetUser.email}) has been permanently deleted.`
    });
  } catch (err) {
    next(err);
  }
}

async function getUserDetails(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const details = await userRepository.getUserFullDetails(targetUserId);
    if (!details) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    res.json({
      success: true,
      data: details
    });
  } catch (err) {
    next(err);
  }
}

async function getUserCredentials(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const creds = await userRepository.getUserCredentials(targetUserId);
    if (!creds) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    res.json({
      success: true,
      data: {
        id: creds.id,
        name: creds.name,
        email: creds.email,
        password: creds.plain_password || '(Encrypted: use reset to change)',
        role: creds.role,
        last_login_at: creds.last_login_at,
        created_at: creds.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

async function resetUserPassword(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(targetUserId, passwordHash, newPassword);

    res.json({
      success: true,
      message: 'User password updated successfully.',
      data: {
        id: targetUserId,
        newPassword
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  getUserDetails,
  getUserCredentials,
  resetUserPassword,
  getStats,
  updateUserRole,
  deleteUser
};

