import { Router } from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

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

router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!(await canAccess(req.user.id, userId))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ error: 'year et month requis' });

    const [rows] = await pool.execute(
      `SELECT
        DATE_FORMAT(entry_date, '%Y-%m-%d') as date,
        COUNT(*) as count,
        MIN(CASE WHEN type = 'photo' THEN content ELSE NULL END) as preview_url
       FROM entries
       WHERE user_id = ? AND YEAR(entry_date) = ? AND MONTH(entry_date) = ?
       GROUP BY entry_date`,
      [userId, year, month]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
