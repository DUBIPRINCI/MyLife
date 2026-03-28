import { Router } from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, f.id as friendship_id,
        EXISTS(SELECT 1 FROM entries e WHERE e.user_id = u.id AND e.entry_date = CURDATE()) as posted_today
       FROM friendships f
       JOIN users u ON (u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END)
       WHERE f.status = 'accepted' AND (f.requester_id = ? OR f.addressee_id = ?)`,
      [req.user.id, req.user.id, req.user.id]
    );
    res.json(rows.map(r => ({ id: r.id, username: r.username, displayName: r.display_name, avatarUrl: r.avatar_url, friendshipId: r.friendship_id, postedToday: !!r.posted_today })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/requests', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT f.id as friendship_id, u.id, u.username, u.display_name
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
       WHERE f.addressee_id = ? AND f.status = 'pending'`,
      [req.user.id]
    );
    res.json(rows.map(r => ({ friendshipId: r.friendship_id, id: r.id, username: r.username, displayName: r.display_name })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/request', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Nom d\'utilisateur requis' });

    const [users] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const targetId = users[0].id;
    if (targetId === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas vous ajouter vous-même' });

    const [existing] = await pool.execute(
      `SELECT id, status FROM friendships
       WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
      [req.user.id, targetId, targetId, req.user.id]
    );
    if (existing.length > 0) {
      if (existing[0].status === 'accepted') return res.status(400).json({ error: 'Déjà amis' });
      if (existing[0].status === 'pending') return res.status(400).json({ error: 'Demande déjà envoyée' });
    }

    await pool.execute('INSERT INTO friendships (requester_id, addressee_id) VALUES (?, ?)', [req.user.id, targetId]);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Demande déjà envoyée' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/accept/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = ?',
      [req.params.id, req.user.id, 'pending']
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Demande non trouvée' });
    await pool.execute('UPDATE friendships SET status = ? WHERE id = ?', ['accepted', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reject/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = ?',
      [req.params.id, req.user.id, 'pending']
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Demande non trouvée' });
    await pool.execute('DELETE FROM friendships WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM friendships WHERE id = ? AND (requester_id = ? OR addressee_id = ?)',
      [req.params.id, req.user.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Amitié non trouvée' });
    await pool.execute('DELETE FROM friendships WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
