import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
      [username, email, hash, displayName || username]
    );
    const user = { id: result.insertId, username };
    res.json({ token: generateToken(user), user: { id: user.id, username, displayName: displayName || username, email } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Nom d\'utilisateur ou email déjà pris' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    res.json({
      token: generateToken(user),
      user: { id: user.id, username: user.username, displayName: user.display_name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, username, email, display_name, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const u = rows[0];
    res.json({ id: u.id, username: u.username, email: u.email, displayName: u.display_name, avatarUrl: u.avatar_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const { displayName } = req.body;
    if (!displayName?.trim()) return res.status(400).json({ error: 'Nom requis' });
    await pool.execute('UPDATE users SET display_name = ? WHERE id = ?', [displayName.trim(), req.user.id]);
    res.json({ success: true, displayName: displayName.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
