import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, env.jwt.secret);
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}
