# Phase 0 — Audit et baseline GesAvo

Date de l'audit : 11 août 2026  
Branche : `main`  
Commit audité : `d41bc57`

> Mise à jour Phase 4 : les vulnérabilités de gestion des utilisateurs et des mots de passe consignées dans cet audit sont corrigées et couvertes par 11 tests de sécurité supplémentaires. Voir [`PHASE_4_AUTHENTICATION_USER_SECURITY.md`](./PHASE_4_AUTHENTICATION_USER_SECURITY.md). Les constats ci-dessous restent la photographie historique de la Phase 0.

> Mise à jour Phase 9 : les défauts calendrier, téléchargement documentaire, visibilité du mot de passe, Remember Me, encodage FR/EN/AR, archivage des tâches et contrôles Settings factices sont corrigés ou retirés lorsqu’aucune capacité réelle n’existe. Voir [`PHASE_9_FUNCTIONAL_BUGS.md`](./PHASE_9_FUNCTIONAL_BUGS.md).
>
> Mise à jour Phase 0.5 : les 10 scénarios critiques disposent désormais de tests de caractérisation réussis et une sauvegarde externe vérifiée de SQLite a été créée. Voir [`PHASE_0_5_BASELINE_SAFETY.md`](./PHASE_0_5_BASELINE_SAFETY.md). Les mentions « 0 test » ci-dessous décrivent l'état initial constaté pendant la Phase 0.

## 1. Décision de gate

**Gate Phase 0 : documenté, mais non validé pour une refonte immédiate.**

Le comportement principal du backend et le démarrage du frontend sont maintenant documentés. Toutefois, avant toute refonte, il faut décider comment traiter les éléments sensibles déjà suivis par Git (base SQLite, médias, secrets et virtualenv) et conserver ce rapport comme référence fonctionnelle.

Aucune logique applicative n'a été modifiée pendant cet audit. Les créations utilisées pour les tests CRUD ont été exécutées dans une transaction annulée et dans un répertoire média temporaire. Les compteurs de la base ont été vérifiés avant et après les tests.

## 2. Périmètre et limites

### Validé réellement

- démarrage du serveur Django ;
- démarrage du serveur React ;
- compilation React de production ;
- état et intégrité SQLite ;
- cohérence et application des migrations ;
- authentification JWT, profil et refresh par HTTP ;
- accès anonyme, avocat et assistant par HTTP ;
- CRUD backend des clients, dossiers, tâches, audiences, documents, notes et transactions ;
- règles actuelles d'accès à la finance et à la gestion des utilisateurs ;
- tests existants frontend et backend ;
- audit statique de `App.jsx`, des services, de l'authentification et des permissions ;
- fichiers sensibles ou générés suivis par Git.

### Limite d'environnement

Le navigateur automatisé intégré n'était pas disponible dans cette session. Les parcours visuels React n'ont donc pas été cliqués de bout en bout. React a néanmoins été validé par son serveur de développement (HTTP 200), sa compilation de production et l'analyse des handlers reliés aux services. Les statuts ci-dessous différencient explicitement les validations backend des validations UI.

## 3. Environnement de référence

| Élément | Valeur |
|---|---|
| Node.js | 22.16.0 |
| npm | 11.18.0 |
| Python | 3.12.12 |
| Django | 6.0.5 |
| Django REST Framework | 3.17.1 |
| Frontend | React 19.2.4 + Create React App/react-app-rewired |
| Base | SQLite, `backend/db.sqlite3`, 278 528 octets |
| Backend | `http://127.0.0.1:8000` |
| Frontend | `http://127.0.0.1:3000` |

## 4. Résultats d'exécution

### Django

- Le serveur démarre et répond.
- `GET /api/users/login/` retourne `405`, résultat attendu puisque la route accepte `POST`.
- `manage.py check` : aucune erreur.
- `manage.py check --deploy` : 7 avertissements de sécurité.
- Temps de lancement des tests observé : environ 60 secondes avec le virtualenv versionné, puis 0 test exécuté.

### React

- `npm ci` réussit avec le lockfile courant.
- Le serveur de développement compile et répond en HTTP 200.
- `npm run build` réussit en environ 176 secondes.
- Bundle gzip : JavaScript 103,65 kB ; CSS 6,15 kB.
- Deux avertissements webpack-dev-server dépréciés sont présents.
- `caniuse-lite` est signalé comme datant d'environ six mois.
- `npm ci` signale 51 vulnérabilités : 10 faibles, 12 modérées, 27 élevées et 2 critiques.

### Tests existants

- Backend : **0 test**, commande réussie mais `NO TESTS RAN`.
- Frontend : **0 test**, commande en échec avec `No tests found`.
- Les huit fichiers Django `tests.py` ne contiennent que le squelette généré.

## 5. Base et migrations

### Intégrité

- `PRAGMA integrity_check` : `ok`.
- `PRAGMA foreign_key_check` : 0 violation.
- `makemigrations --check --dry-run` : aucun changement non migré.
- Toutes les migrations listées sont appliquées.

### Compteurs avant et après l'audit transactionnel

| Modèle | Nombre |
|---|---:|
| Utilisateurs | 3 |
| Clients | 1 |
| Dossiers | 1 |
| Tâches | 1 |
| Audiences | 2 |
| Notes | 0 |
| Documents | 2 |
| Factures | 0 |
| Paiements | 0 |
| Transactions | 1 |

Les mêmes compteurs ont été retrouvés après les tests CRUD.

## 6. Matrice fonctionnelle

Légende : **OK** = comportement exécuté et conforme au comportement attendu actuel ; **Partiel** = une partie fonctionne mais une limite fonctionnelle ou de sécurité empêche de considérer le module complet ; **Cassé** = action visible ou annoncée qui ne fonctionne pas.

| Fonctionnalité | Statut | Baseline observée |
|---|---|---|
| Démarrage Django | OK | Serveur accessible sur le port 8000. |
| Démarrage React | OK | Compilation dev réussie, page racine HTTP 200. |
| Build React | OK | Build de production réussi, mais lent (~176 s). |
| Base SQLite | OK | Intégrité et clés étrangères valides. |
| Migrations | OK | Toutes appliquées, aucun drift détecté. |
| Login avocat | OK | JWT access + refresh reçus ; profil retourné avec rôle `LAWYER`. |
| Login assistant | OK | JWT reçu ; restrictions finance observées. |
| Protection anonyme | OK | Clients retourne 401 sans jeton. |
| Refresh JWT backend | OK | La route de refresh retourne un nouvel access token. |
| Refresh JWT frontend | Partiel | Le refresh token est stocké mais jamais utilisé par l'intercepteur. |
| Logout frontend | Partiel | Supprime les jetons du navigateur uniquement. |
| Logout/révocation backend | Cassé | Aucune route de logout ; l'access token reste accepté après le logout client. |
| Clients backend | OK technique | Création, modification, lecture et suppression passent. Permissions trop larges. |
| Clients frontend | Partiel | Handlers create/edit/delete présents ; validation visuelle non exécutée. |
| Dossiers backend | OK technique | Création, modification, lecture et suppression passent. |
| Dossiers frontend | Partiel | Create/edit/delete câblés ; validation visuelle non exécutée. |
| Tâches backend | OK technique | Create, changement de statut, `completed_at`, restore et delete passent. |
| Archivage tâches | Partiel | Archivage déclenché pendant un GET après 48 h, pas par job planifié. |
| Tâches frontend | Partiel | Kanban et restore câblés ; pas d'édition/suppression depuis l'UI. |
| Audiences backend | OK technique | Create/read/delete passent. |
| Audiences frontend | Partiel | Création et liste seulement ; le calendrier compare uniquement le jour du mois. |
| Documents backend | OK technique | Upload multipart, lecture et suppression passent. |
| Documents frontend | Cassé/partiel | Upload et liste présents, mais les boutons de téléchargement n'ont aucun handler. |
| Finance avocat | OK technique | Lecture, création et suppression d'une transaction passent. |
| Finance assistant | OK | API retourne 403 et la route UI est masquée. |
| Finance métier | Partiel | Montants négatifs et relations client/dossier incohérentes acceptés. |
| Notes backend | OK technique | Création et suppression passent ; auteur attribué automatiquement. |
| Paramètres | Partiel | Gestion des comptes connectée ; profil cabinet, thème, alertes et 2FA sont seulement locaux/factices. |
| Mot de passe oublié | Partiel | Implémentation backend présente ; email console par défaut, pas de test SMTP réel. |
| Internationalisation | Partiel | FR/EN/AR présents, mais plusieurs chaînes montrent des symptômes d'encodage incorrect. |
| Bouton afficher le mot de passe | Cassé | Icône présente sans action de bascule. |
| Option « se souvenir de moi » | Cassé | Valeur capturée mais jamais utilisée. |

## 7. Résultats CRUD détaillés

Tous les tests ci-dessous ont utilisé les ViewSets réels avec authentification et rollback final :

- client : create 201, patch 200, delete 204 ;
- dossier : create 201, patch 200, delete 204 ;
- tâche : create 201, complete 200, `completed_at` renseigné, restore 200, delete 204 ;
- audience : create 201, delete 204 ;
- document : upload 201, read 200, delete 204 ;
- transaction : create 201, delete 204 ;
- note : create 201, delete 204 ;
- finance avec assistant : 403 attendu.

## 8. Permissions observées

| Ressource | Avocat | Assistant | Anonyme |
|---|---:|---:|---:|
| Clients | 200 | 200 | 401 |
| Dossiers | 200 | 200 | 401 |
| Tâches | 200 | 200 | 401 |
| Audiences | 200 | 200 | 401 |
| Notes | 200 | 200 | 401 |
| Documents | 200 | 200 | 401 |
| Gestion utilisateurs | 200 | 403 | 401 |
| Finance | 200 | 403 | 401 |

Il n'existe aucun filtrage par cabinet, propriétaire, utilisateur affecté ou objet. Un assistant authentifié dispose donc actuellement du CRUD global sur l'essentiel des données juridiques.

## 9. Failles et risques sécurité

### Critiques

1. **Clé Django codée en dur**, préfixée `django-insecure-` et suivie par Git.
2. **Base et médias juridiques suivis par Git**, avec risque de fuite de données et persistance dans l'historique.
3. **Mise à jour de mot de passe incorrecte** : `ManagedUserSerializer.update()` n'appelle pas `set_password()`. Le test confirme un statut 200, une valeur non hachée et l'impossibilité de s'authentifier avec le nouveau mot de passe.
4. **Aucune révocation au logout** : le jeton d'accès reste valide après suppression côté client.
5. **Absence d'isolation des dossiers** : tous les utilisateurs authentifiés lisent et modifient les mêmes clients, dossiers, notes et documents.

### Élevées

1. `DEBUG=True`, `CORS_ALLOW_ALL_ORIGINS=True` et `ALLOWED_HOSTS=[]` dans la configuration principale.
2. Absence de HTTPS forcé, HSTS, cookies session/CSRF sécurisés ; confirmée par 7 avertissements `check --deploy`.
3. Un mot de passe d'un seul caractère est accepté par l'endpoint de gestion des comptes ; test confirmé avec 201.
4. Un avocat peut créer ou promouvoir d'autres avocats, modifier leur rôle et désactiver des comptes ; aucun rôle Admin métier distinct.
5. Jetons access et refresh stockés dans `localStorage`, augmentant l'impact d'une XSS.
6. Upload sans limite de taille, liste d'extensions, validation MIME, analyse antivirus ni stratégie de stockage privé.
7. 51 vulnérabilités npm signalées, dont 2 critiques et 27 élevées.
8. Identifiants de démonstration en clair dans la commande de seed suivie par Git.
9. Endpoint de demande de reset sans throttling applicatif visible, permettant l'abus d'envoi d'emails.

### Moyennes

1. Les validations métier suivantes manquent et ont été confirmées par des réponses 201 : montant financier négatif, audience finissant avant son début et note client/dossier incohérente.
2. Un dossier financier ou document peut référencer un client différent de celui du dossier.
3. `case_number` et `national_id` ne sont pas uniques.
4. Le statut des audiences est une chaîne libre.
5. Pas de pagination, filtrage serveur ou limitation explicite du débit API.
6. Le serveur de développement sert directement les médias lorsque `DEBUG=True`.
7. L'URL API frontend est codée en dur en HTTP sur `127.0.0.1:8000`.
8. Les erreurs 401 sont seulement écrites dans la console ; pas de file de refresh ni de déconnexion centralisée.

## 10. Analyse Git et artefacts suivis

| Catégorie | Nombre suivi |
|---|---:|
| Fichiers Git totaux | 6 958 |
| Fichiers sous `backend/venv` | 6 672 |
| Entrées pycache/pyc | 1 582 |
| Médias | 3 |
| Logs | 4 |
| Base SQLite | 1 |

Artefacts sensibles ou générés confirmés :

- `backend/db.sqlite3` ;
- `backend/media/documents/AIT_ELHADJ_Ala_Eddine.pdf` ;
- `backend/media/documents/AIT_ELHADJ_Ala_Eddine_UHC0yyM.pdf` ;
- `backend/media/documents/integration.txt` ;
- `backend/venv/**` ;
- nombreux `__pycache__` et `.pyc` ;
- `frontend-run.log`, `frontend-run.err.log` ;
- `backend/backend-run.log`, `backend/backend-run.err.log`.

Le `.gitignore` ne couvre pas actuellement Python, SQLite, les médias backend, les logs génériques ni les fichiers `.env` génériques.

## 11. Analyse architecture actuelle

### `src/app/App.jsx`

- Environ 500 lignes et presque tout l'état métier dans un composant.
- Charge en parallèle toutes les ressources après login.
- Une erreur sur une seule ressource fait échouer le chargement global.
- Les routes sont une table interne et un état `page`, pas des routes URL réelles.
- Pas de deep-link, historique navigateur ou reprise directe d'une fiche.
- Autorisation frontend limitée au masquage de Finance et Settings.

### Services API

- Bonne séparation initiale entre composants et appels Axios.
- Adaptateurs snake_case/camelCase explicites.
- Base URL codée en dur.
- Refresh token stocké mais inutilisé.
- Intercepteur 401 incomplet.
- Aucun timeout, annulation, normalisation d'erreur ou retry contrôlé.
- Le service document produit un `fileUrl`, mais l'UI ne l'utilise pas.

### Authentification

- Login et profil fonctionnent.
- Refresh backend fonctionne mais n'est pas intégré au frontend.
- Logout purement local, sans blacklist ni rotation.
- « Remember me » sans effet.
- Réinitialisation de mot de passe présente, mais validation Django complète non appelée.

### Permissions

- Finance correctement refusée à l'assistant.
- Gestion d'utilisateurs refusée à l'assistant.
- Toutes les autres ressources sont globales pour tout utilisateur authentifié.
- `IsLawyer` n'accorde pas automatiquement l'accès à un superuser dont le champ rôle n'est pas `LAWYER`, contrairement à `IsAdminOrLawyer`.
- Aucun `has_object_permission()` ni filtrage de queryset.

## 12. Fichiers à modifier lors des phases suivantes

Cette liste est un inventaire ; aucune de ces modifications n'est effectuée en Phase 0.

### Hygiène du dépôt et configuration

- `.gitignore`
- `backend/core/settings.py`
- ajouter `backend/requirements.txt` ou `pyproject.toml`
- ajouter `.env.example`
- `README.md`
- retirer du suivi Git `backend/venv/**`, `backend/db.sqlite3`, `backend/media/**`, les logs et pycache
- traiter l'historique Git séparément si les documents ou la base ont déjà été publiés

### Authentification et utilisateurs

- `backend/users/models.py`
- `backend/users/permissions.py`
- `backend/users/serializers.py`
- `backend/users/views.py`
- `backend/users/urls.py`
- `backend/users/management/commands/seed_demo.py`
- `src/services/api.js`
- `src/services/auth.service.js`
- `src/features/auth/pages/LoginPage.jsx`
- `src/features/settings/pages/SettingsPage.jsx`

### Permissions et validation métier

- `backend/clients/models.py`, `serializers.py`, `views.py`
- `backend/cases/models.py`, `serializers.py`, `views.py`
- `backend/tasks/models.py`, `serializers.py`, `views.py`
- `backend/events/models.py`, `serializers.py`, `views.py`
- `backend/notes/models.py`, `serializers.py`, `views.py`
- `backend/documents/models.py`, `serializers.py`, `views.py`
- `backend/finance/models.py`, `serializers.py`, `permissions.py`, `views.py`

### Frontend fonctionnel

- `src/app/App.jsx`
- `src/app/routes.jsx`
- `src/services/*.service.js`
- `src/features/documents/pages/DocumentsPage.jsx`
- `src/features/documents/components/DocRow.jsx`
- `src/features/calendar/pages/CalendarPage.jsx`
- `src/features/settings/pages/SettingsPage.jsx`
- `package.json` et `package-lock.json`

### Tests à créer

- remplacer le contenu des huit `backend/*/tests.py` par de vrais tests ;
- ajouter des tests frontend pour auth, services, rôles et parcours CRUD ;
- ajouter des tests de permissions objet et de non-régression des transformations API ;
- ajouter un test de build et les checks Django dans la CI.

## 13. Baseline à préserver avant refonte

Une refonte ne devra pas casser les comportements confirmés suivants :

1. login JWT avocat et assistant ;
2. profil utilisateur après restauration de session ;
3. CRUD clients et dossiers ;
4. création et progression des tâches ;
5. timestamp de complétion et restauration d'une tâche archivée ;
6. création d'audiences ;
7. upload multipart de documents avec auteur automatique ;
8. auteur automatique des notes ;
9. transactions accessibles aux avocats et refusées aux assistants ;
10. transformations actuelles entre champs Django et objets React ;
11. interface et identité visuelle actuelles.

## 14. Gate de sortie recommandé

Avant de commencer une refonte structurelle :

1. conserver ce rapport au commit de référence ;
2. ajouter des tests de caractérisation automatisant la baseline ci-dessus ;
3. décider du nettoyage des données sensibles et renouveler la clé Django ;
4. définir la matrice RBAC cible et le périmètre d'isolation des données ;
5. sauvegarder la base actuelle hors Git si elle doit être conservée ;
6. seulement ensuite ouvrir la Phase 1 avec changements incrémentaux.
