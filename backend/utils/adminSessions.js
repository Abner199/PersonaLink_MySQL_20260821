const crypto = require('crypto');

const SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MS || 8 * 60 * 60 * 1000);
const sessions = new Map();

const createAdminSession = (email) => {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { email, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
};

const getAdminSession = (token) => {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
};

const revokeAdminSessions = (email) => {
  for (const [token, session] of sessions.entries()) {
    if (session.email === email) sessions.delete(token);
  }
};

module.exports = { createAdminSession, getAdminSession, revokeAdminSessions };
