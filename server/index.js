import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import entriesRoutes from './routes/entries.js';
import calendarRoutes from './routes/calendar.js';
import friendsRoutes from './routes/friends.js';
import dayMetaRoutes from './routes/dayMeta.js';
import { initDb } from './config/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: env.clientUrl }));
app.use(express.json());

// Uploads protégés : vérification du token via query param ou header
app.use('/uploads', (req, res, next) => {
  // Accepter le token en query ?token= (pour les balises img/video)
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  authMiddleware(req, res, next);
}, express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/day-meta', dayMetaRoutes);

await initDb();
app.listen(env.port, () => {
  console.log(`Serveur MyLife démarré sur http://localhost:${env.port}`);
});
