import { Router } from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();
router.use(authMiddleware);

async function canAccess(requesterId, targetUserId) {
  if (requesterId === targetUserId) return true;
  const [rows] = await pool.execute(
    `SELECT id FROM friendships
     WHERE status = 'accepted'
     AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
    [requesterId, targetUserId, targetUserId, requesterId]
  );
  return rows.length > 0;
}

router.get('/:userId/:date', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!(await canAccess(req.user.id, userId))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const [rows] = await pool.execute(
      'SELECT * FROM entries WHERE user_id = ? AND entry_date = ? ORDER BY created_at ASC',
      [userId, req.params.date]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { date, type, content, caption } = req.body;
    if (!date || !type) return res.status(400).json({ error: 'Date et type requis' });

    let finalContent = content || '';
    if (req.file) {
      finalContent = '/uploads/' + req.file.filename;
    }

    const [result] = await pool.execute(
      'INSERT INTO entries (user_id, entry_date, type, content, caption) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, date, type, finalContent, caption || null]
    );

    const [rows] = await pool.execute('SELECT * FROM entries WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM entries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Entrée non trouvée' });
    await pool.execute('DELETE FROM entries WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { content, caption } = req.body;
    const [rows] = await pool.execute('SELECT * FROM entries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Entrée non trouvée' });

    const updates = [];
    const values = [];
    if (content !== undefined) { updates.push('content = ?'); values.push(content); }
    if (caption !== undefined) { updates.push('caption = ?'); values.push(caption); }
    if (updates.length === 0) return res.json(rows[0]);

    values.push(req.params.id);
    await pool.execute(`UPDATE entries SET ${updates.join(', ')} WHERE id = ?`, values);
    const [updated] = await pool.execute('SELECT * FROM entries WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
