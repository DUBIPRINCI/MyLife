import pool from './db.js';

export async function initDb() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS day_meta (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      entry_date DATE NOT NULL,
      weather    VARCHAR(30) DEFAULT NULL,
      UNIQUE KEY unique_day_meta (user_id, entry_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Tables vérifiées (day_meta)');
}
