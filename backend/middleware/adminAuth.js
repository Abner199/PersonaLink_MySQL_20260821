const { pool } = require('../db');
const { getAdminSession } = require('../utils/adminSessions');

const adminAuth = async (req, res, next) => {
  try {
    const authorization = req.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const session = getAdminSession(token);
    if (!session) return res.status(401).json({ message: '管理员登录已失效，请重新登录' });

    const [rows] = await pool.execute('SELECT id, email, role FROM users WHERE email = ?', [session.email]);
    const admin = rows[0];
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: '管理员身份验证失败' });
    }
    req.admin = admin;
    return next();
  } catch (error) {
    console.error('管理员鉴权失败:', error);
    return res.status(500).json({ message: '管理员身份验证服务不可用' });
  }
};

module.exports = adminAuth;
