import { Router } from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const VALID_WEATHER = ['sunny','partly_cloudy','cloudy','rainy','stormy','snowy','foggy','windy'];

/* Vérifie si le demandeur peut consulter les données d'un utilisateur */
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

/* GET /api/day-meta/:userId/:date */
router.get('/:userId/:date', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!(await canAccess(req.user.id, userId))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const [rows] = await pool.execute(
      'SELECT weather FROM day_meta WHERE user_id = ? AND entry_date = ?',
      [userId, req.params.date]
    );
    res.json(rows[0] || { weather: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/day-meta  { date, weather } */
router.post('/', async (req, res) => {
  try {
    const { date, weather } = req.body;
    if (!date) return res.status(400).json({ error: 'Date requise' });
    if (weather && !VALID_WEATHER.includes(weather)) {
      return res.status(400).json({ error: 'Météo invalide' });
    }
    await pool.execute(
      `INSERT INTO day_meta (user_id, entry_date, weather)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE weather = VALUES(weather)`,
      [req.user.id, date, weather || null]
    );
    res.json({ success: true, weather: weather || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
