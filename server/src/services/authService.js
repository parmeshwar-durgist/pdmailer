const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

async function register({ name, email, password, ip = null }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new Error(`An account with email "${email}" already exists. Please log in.`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await userRepository.createUser({
    name,
    email,
    passwordHash,
    plainPassword: password
  });

  await userRepository.recordLogin(userId, ip);
  const newUser = await userRepository.findById(userId);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role || 'user' },
    process.env.JWT_SECRET || 'hr_mailer_bulk_secret_change_in_production_jwt_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || 'user'
    },
    token
  };
}

async function login(email, password, ip = null) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  await userRepository.recordLogin(user.id, ip);

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role || 'user' },
    process.env.JWT_SECRET || 'hr_mailer_bulk_secret_change_in_production_jwt_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user'
    },
    token
  };
}

async function getCurrentUser(id) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

module.exports = {
  register,
  login,
  getCurrentUser
};
