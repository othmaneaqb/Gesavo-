# Phase 1 — Emergency security cleanup

Date : 11 août 2026  
Baseline source : commit `d41bc57`

## Résultat

Le nettoyage d'urgence est appliqué dans l'index Git et la configuration locale, sans supprimer les fichiers de travail présents sur la machine.

| Catégorie | Avant | Après dans l'index Git |
|---|---:|---:|
| Fichiers suivis totaux | 6 958 | 190 |
| `backend/venv/**` | 6 672 | 0 |
| `backend/media/**` | 3 | 0 |
| `backend/db.sqlite3` | 1 | 0 |
| Logs | 4 | 0 |
| `__pycache__` / `.pyc` | 1 582 | 0 |
| `.env` | 0 | 0 |

Les compteurs de pycache chevauchaient largement ceux du virtualenv et ne doivent donc pas être additionnés.

## Éléments retirés du suivi

Les suppressions sont effectuées avec `git rm --cached` :

- `backend/db.sqlite3` ;
- `backend/media/**` ;
- `backend/venv/**` ;
- tous les fichiers `*.log` ;
- tous les répertoires `__pycache__` ;
- tous les fichiers `*.pyc` ;
- tout fichier `.env`.

Les copies locales de la base, des médias, du virtualenv et des logs sont toujours présentes. Un commit reste nécessaire pour enregistrer définitivement ces suppressions dans la branche.

## Rotation des secrets et identifiants

### Django SECRET_KEY

- L'ancienne valeur `django-insecure-...` a été supprimée de `settings.py`.
- Django lit maintenant `DJANGO_SECRET_KEY` depuis l'environnement ou le `.env` local ignoré.
- Hors tests, Django refuse de démarrer si la variable manque.
- Aucun nouveau secret réel n'est écrit dans le dépôt.
- Le changement de clé invalidera les anciens JWT signés avec la clé exposée.

### Comptes de démonstration

- Les mots de passe codés en dur ont été retirés de `seed_demo.py`.
- La commande exige désormais `GESAVO_DEMO_PASSWORD` et `GESAVO_ASSISTANT_PASSWORD`.
- Les mots de passe connus des comptes locaux `demo` et `assistant` ont été rendus inutilisables dans la base courante.
- Ces comptes devront recevoir de nouveaux mots de passe via un canal d'administration sécurisé s'ils doivent être réutilisés.

### Recherche complémentaire

Aucune clé API ou clé privée supplémentaire n'a été trouvée dans l'arbre de travail après exclusion des dépendances, médias, base et lockfile.
Les deux rapports de projet qui reproduisaient les anciens mots de passe ont été
expurgés et référencent maintenant uniquement les variables d'environnement.

## Configuration créée

### `.gitignore`

Le fichier couvre désormais :

- dépendances et builds JavaScript ;
- environnements Python ;
- bytecode et caches Python ;
- SQLite et fichiers auxiliaires ;
- médias Django ;
- `.env` et variantes, avec exception pour `.env.example` ;
- logs et PID ;
- fichiers d'éditeur et de système d'exploitation.

### `.env.example`

Le modèle documente :

- `DJANGO_SECRET_KEY` ;
- debug, hosts et origines CORS ;
- configuration email ;
- paramètres de sécurité HTTPS/HSTS ;
- mots de passe nécessaires à `seed_demo`.

### Dépendances backend

`backend/requirements.txt` contient les dépendances directes et versions observées :

- Django 6.0.5 ;
- django-cors-headers 4.9.0 ;
- djangorestframework 3.17.1 ;
- djangorestframework-simplejwt 5.5.1 ;
- python-dotenv 1.2.2.

## Durcissement de configuration

- `DEBUG` est désactivé par défaut et piloté par `DJANGO_DEBUG`.
- `ALLOWED_HOSTS` est piloté par `DJANGO_ALLOWED_HOSTS`.
- CORS n'accepte plus toutes les origines ; la liste vient de `DJANGO_CORS_ALLOWED_ORIGINS`.
- Hors debug et tests, HTTPS redirect, cookies sécurisés, HSTS et sous-domaines HSTS sont activés par défaut.
- HSTS preload reste volontairement désactivé : Django conserve un avertissement `security.W021`, car l'inscription à la preload list ne doit pas être activée sans décision de déploiement et domaine stable.

## Sauvegardes externes

### Avant retrait de Git

- chemin : `C:\Users\pc\Documents\Gesavo-backups\db.sqlite3.20260811-185054.bak` ;
- taille : 278 528 octets ;
- SHA-256 : `15B0A7E7F65CB10DBDC30A537692022AAE945FF30AD0739169C72DEFFDBD6C40` ;
- copie identique à la source au moment de la sauvegarde.

### Après invalidation des identifiants exposés

- chemin : `C:\Users\pc\Documents\Gesavo-backups\db.sqlite3.post-rotation.20260811-185940.bak` ;
- taille : 278 528 octets ;
- SHA-256 : `1CB5235C19C0EDC6855A2B3E7F85AD696ECAF3B1EB5A945089C6D8C3500D7D07` ;
- copie identique à la base sécurisée courante.

La première sauvegarde contient encore l'état antérieur à la rotation et doit être protégée comme une donnée sensible.

## Validation

- `manage.py check` : OK ;
- `manage.py test` : 10 tests trouvés, 10 réussis ;
- `manage.py check --deploy` : un seul avertissement restant, HSTS preload volontairement désactivé ;
- aucune ancienne valeur active dans la configuration, la commande de seed ou les rapports prêts à commiter ;
- fichiers locaux base/médias/venv conservés ;
- index Git : aucun virtualenv, média, SQLite, log, pycache, `.pyc` ou `.env` suivi.

## Limite importante : historique Git

Le retrait de l'index protège les prochains commits, mais les anciennes versions restent dans l'historique Git existant. Si ce dépôt a été publié ou partagé, il faut considérer la clé, les identifiants, la base et les documents comme compromis même après ce commit.

Une réécriture d'historique avec `git filter-repo` ou BFG est une opération séparée, destructive pour les clones et qui doit être coordonnée avec tous les collaborateurs avant exécution. Elle n'est pas effectuée dans cette phase.

## Gate

Le gate de nettoyage du suivi Git et de rotation des secrets applicatifs est validé dans l'arbre de travail. Il sera définitif dans la branche après commit des changements indexés et des nouveaux fichiers de configuration.
