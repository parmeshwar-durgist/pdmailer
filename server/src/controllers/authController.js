const authService = require('../services/authService');
const { loginSchema, registerSchema } = require('../validators/schemas');

async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || null;
    const result = await authService.register({ ...validated, ip });

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to HR Bulk Email Sender.',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || null;
    const result = await authService.login(validated.email, validated.password, ip);
    
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('token');
    return res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (err) {
    next(err);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return res.json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};
