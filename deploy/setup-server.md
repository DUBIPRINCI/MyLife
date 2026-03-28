# Mise en place serveur — MyLife

## 1. Générer la clé SSH (sur ta machine locale)

```bash
# Génère une paire de clés Ed25519 dédiée au déploiement
ssh-keygen -t ed25519 -C "github-actions-mylife" -f mylife_deploy_key -N ""
```

Cela crée deux fichiers dans le dossier courant :
- `mylife_deploy_key`      → **clé privée** → à copier dans GitHub Secrets
- `mylife_deploy_key.pub`  → **clé publique** → à coller sur le serveur

---

## 2. Autoriser la clé sur le serveur

```bash
# Copie automatiquement la clé publique sur le serveur
ssh-copy-id -i mylife_deploy_key.pub user@ton-serveur.fr

# OU manuellement :
cat mylife_deploy_key.pub | ssh user@ton-serveur.fr "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

---

## 3. Ajouter les secrets dans GitHub

Aller sur **GitHub → ton repo → Settings → Secrets and variables → Actions → New repository secret**

| Nom du secret   | Valeur                              |
|-----------------|-------------------------------------|
| `HOST`          | IP ou domaine du serveur            |
| `USERNAME`      | Utilisateur SSH (ex: `ubuntu`)      |
| `SSH_KEY`       | Contenu complet de `mylife_deploy_key` (privée) |
| `PORT`          | Port SSH (par défaut `22`)          |
| `JWT_SECRET`    | Chaîne aléatoire longue (32+ chars) |
| `DB_USER`       | `root` (ou autre)                   |
| `DB_PASSWORD`   | Mot de passe MySQL                  |

Pour générer un JWT_SECRET sécurisé :
```bash
openssl rand -base64 48
```

---

## 4. Préparer le serveur (1ère fois uniquement)

### Installer Node.js 20, PM2, MySQL

```bash
# Node.js 20 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20 && nvm use 20 && nvm alias default 20

# PM2
npm install -g pm2
pm2 startup   # suivre les instructions affichées

# MySQL
sudo apt update && sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### Créer la base de données

```bash
sudo mysql -u root -p
```
```sql
CREATE DATABASE mylife CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mylife'@'localhost' IDENTIFIED BY 'ton_mot_de_passe';
GRANT ALL PRIVILEGES ON mylife.* TO 'mylife'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Importer le schéma

```bash
# Depuis le repo cloné ou copié manuellement
mysql -u mylife -p mylife < server/schema.sql
```

---

## 5. Configurer Nginx

```bash
# Copier le fichier de config
sudo cp deploy/nginx.mylife.conf /etc/nginx/sites-available/mylife.dubiprinci.fr

# Activer le site
sudo ln -s /etc/nginx/sites-available/mylife.dubiprinci.fr \
           /etc/nginx/sites-enabled/mylife.dubiprinci.fr

# Vérifier la syntaxe
sudo nginx -t

# Générer le certificat SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d mylife.dubiprinci.fr

# Recharger nginx
sudo systemctl reload nginx
```

---

## 6. Premier déploiement

Pusher sur `main` ou lancer manuellement depuis :
**GitHub → Actions → Deploy MyLife → Run workflow**

La CI va :
1. Builder le frontend Vite
2. Copier `dist/` → `/var/www/mylife.dubiprinci.fr/html/`
3. Copier `server/` → `/var/www/mylife.dubiprinci.fr/api/`
4. Créer le `.env` depuis tes secrets
5. `npm install --omit=dev` + `pm2 restart mylife-api`

---

## 7. Commandes PM2 utiles

```bash
pm2 status              # état de tous les process
pm2 logs mylife-api     # logs en temps réel
pm2 restart mylife-api  # redémarrer
pm2 stop mylife-api     # arrêter
```
