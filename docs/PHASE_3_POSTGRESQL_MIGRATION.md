# Phase 3 — Migration PostgreSQL

Date : 11 août 2026

## Résultat

La migration SQLite vers PostgreSQL est terminée. PostgreSQL est désormais le
moteur par défaut de Django en développement comme en production. Le backend
Django fonctionne sur la base migrée et le gate fonctionnel est validé : les
10 tests de caractérisation réussissent sur PostgreSQL.

## Sauvegardes avant migration

Deux sauvegardes ont été créées hors du dépôt avant toute écriture PostgreSQL.

| Type | Chemin | SHA-256 | Contrôle |
|---|---|---|---|
| Copie SQLite binaire | `C:\Users\pc\Documents\Gesavo-backups\db.sqlite3.pre-postgresql.20260811-191122.bak` | `1CB5235C19C0EDC6855A2B3E7F85AD696ECAF3B1EB5A945089C6D8C3500D7D07` | Identique à la source |
| Export Django UTF-8 | `C:\Users\pc\Documents\Gesavo-backups\gesavo-app-data.pre-postgresql.20260811-191203.json` | `0135B62758F3EE011891B1E6BAB29CE29A39DC95E63FCE174DA1F02C6D6574BF` | JSON valide, 11 objets |

L’export contient des données applicatives et des hashes de mots de passe. Il
doit être protégé comme une sauvegarde sensible et ne doit pas être ajouté à
Git.

## Environnement PostgreSQL

| Élément | Valeur validée |
|---|---|
| Serveur | PostgreSQL 17.10 |
| Base | `gesavo` |
| Utilisateur applicatif local | `gesavo` |
| Volume Docker | `gesavo_postgres_data` |
| Port interne Docker | 5432 |
| Port hôte de cette machine | `127.0.0.1:5433` |
| Pilote Django | `psycopg[binary] 3.3.4` |
| Backend Django | CPython 3.12 dans `gesavo-backend` |

Le port hôte 5432 était déjà utilisé par un autre projet. Ce conteneur n’a pas
été modifié ; GesAvo utilise localement 5433. Le modèle `.env.example` garde
5432 comme valeur standard et permet de le remplacer.

Le Python historique de la machine est une distribution MinGW. Ses tags de
plateforme ne sont pas compatibles avec les wheels officiels
`psycopg-binary`. Le service backend Docker fournit donc un CPython standard et
reproductible. Une installation native reste possible avec CPython 3.12+.

## Procédure exécutée

1. Validation de SQLite et des migrations existantes.
2. Sauvegarde binaire externe et vérification SHA-256.
3. Export Django UTF-8 des applications métier.
4. Création d’un volume PostgreSQL neuf et vérification de zéro table.
5. Application de toutes les migrations Django.
6. Vérification du schéma : 21 tables publiques et 158 contraintes.
7. Import des 11 objets depuis l’export externe monté en lecture seule.
8. Comparaison des volumes et vérification des médias.
9. Exécution du gate de caractérisation sur une base de test PostgreSQL.
10. Démarrage du backend permanent connecté à PostgreSQL.

## Contrôle des données

| Modèle | SQLite avant | PostgreSQL après | État |
|---|---:|---:|---|
| Utilisateurs | 3 | 3 | Identique |
| Clients | 1 | 1 | Identique |
| Dossiers | 1 | 1 | Identique |
| Tâches | 1 | 1 | Identique |
| Audiences/événements | 2 | 2 | Identique |
| Notes | 0 | 0 | Identique |
| Documents | 2 | 2 | Identique |
| Factures | 0 | 0 | Identique |
| Paiements | 0 | 0 | Identique |
| Transactions | 1 | 1 | Identique |

Les deux fichiers associés aux documents sont présents dans le stockage média
local. PostgreSQL stocke leurs chemins, pas leur contenu. Les deux comptes dont
les mots de passe avaient été invalidés en Phase 1 restent invalidés après
l’import ; un seul compte importé possède encore un mot de passe utilisable.

## Gate fonctionnel PostgreSQL

Commande exécutée :

```powershell
docker compose run --rm backend python manage.py test users.tests --verbosity 2
```

Résultat : 10 tests trouvés, 10 réussis en 3,089 secondes. Django a créé puis
détruit la base PostgreSQL `test_gesavo`.

| Scénario | Résultat |
|---|---|
| Login avocat | OK |
| Login assistant | OK |
| CRUD clients | OK |
| CRUD dossiers | OK |
| Complétion et restauration de tâche | OK |
| Création d’audience | OK |
| Upload de document | OK |
| Notes | OK |
| Finance avocat | HTTP 200 |
| Finance assistant | HTTP 403 |

Le backend de développement a aussi démarré sur `127.0.0.1:8000`. Une requête
anonyme vers `/api/clients/` a reçu HTTP 401, résultat attendu qui confirme que
le serveur répond et que l’authentification reste obligatoire.

`python manage.py check --deploy` en profil production PostgreSQL retourne
également zéro avertissement.

## Configuration permanente

- `DJANGO_DB_ENGINE` vaut `postgresql` par défaut ;
- le mot de passe PostgreSQL est obligatoire ;
- les paramètres production de nom, utilisateur et hôte sont obligatoires ;
- la production exige un mot de passe non-placeholder d’au moins 16 caractères ;
- `DJANGO_DB_SSLMODE` doit imposer TLS en production ;
- SQLite est refusé en production et n’est disponible qu’en mode explicite de
  récupération/export ;
- PostgreSQL et Django sont décrits dans `compose.yaml` ;
- le port PostgreSQL est lié à la boucle locale uniquement ;
- les secrets réels restent dans `.env`, ignoré par Git.

## Exploitation locale

```powershell
docker compose up -d postgres
docker compose run --rm backend python manage.py migrate
docker compose up -d backend
docker compose run --rm backend python manage.py test
docker compose down
```

`docker compose down` conserve le volume. Ne pas utiliser l’option `--volumes`
tant que la sauvegarde et la migration ne sont pas archivées et validées.

## Rollback

En cas de rollback applicatif :

1. arrêter le backend sans supprimer le volume PostgreSQL ;
2. conserver les deux sauvegardes externes ci-dessus ;
3. définir temporairement `DJANGO_DB_ENGINE=sqlite` ;
4. définir `DJANGO_SQLITE_PATH` vers une copie de la sauvegarde binaire ;
5. lancer `manage.py check` puis les tests avant toute reprise ;
6. revenir à PostgreSQL après diagnostic.

Le fichier SQLite du dépôt n’a pas été écrasé ni supprimé localement pendant
cette phase. Il demeure ignoré par Git et ne constitue plus la base active.

## Fichiers modifiés ou ajoutés

- `backend/core/settings.py` ;
- `backend/requirements.txt` ;
- `backend/Dockerfile` ;
- `backend/.dockerignore` ;
- `compose.yaml` ;
- `.env.example` ;
- `.env.production.example` ;
- `README.md` ;
- `docs/PHASE_3_POSTGRESQL_MIGRATION.md`.

## Gate

**Validé.** Login, CRUD principaux et restriction Finance fonctionnent contre
PostgreSQL. La Phase 4 peut commencer sans dépendance active à SQLite.
