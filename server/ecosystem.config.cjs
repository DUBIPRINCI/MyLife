// Fichier de configuration PM2 — format CommonJS obligatoire (.cjs)
// Lancé depuis : /var/www/mylife.dubiprinci.fr/api/
// Commande initiale : pm2 start ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name:       'mylife-api',
      script:     'index.js',         // ESM supporté grâce à "type":"module" dans package.json
      instances:  1,
      exec_mode:  'fork',             // fork = compatible ESM natif (pas cluster)
      autorestart: true,
      watch:      false,
      max_memory_restart: '300M',

      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
