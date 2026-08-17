# Phase 6 — RBAC et permissions objet

Date : 11 août 2026

## Résultat

La phase 6 est implémentée et son gate est validé. Les API juridiques ne
retournent plus un queryset global à tout utilisateur authentifié. Chaque
requête applique maintenant la chaîne suivante côté serveur :

```text
Authentification
    ↓
Rôle
    ↓
Cabinet
    ↓
Création / affectation
    ↓
Permission objet
    ↓
Règle métier et validation des relations
```

La protection ne dépend pas du frontend. L’interface masque les actions non
autorisées pour éviter des erreurs utilisateur, mais Django REST Framework
reste l’autorité de sécurité.

## Modèle de données

Un modèle `Cabinet` et une appartenance `CustomUser.cabinet` ont été ajoutés.
Tout compte non-superuser doit appartenir à un cabinet, ce qui est également
garanti par une contrainte PostgreSQL.

Le rattachement canonique est volontairement normalisé :

- un client possède un cabinet et un créateur ;
- un dossier hérite du cabinet de son client et possède un créateur ainsi que
  des avocats affectés ;
- une tâche ou audience hérite de son dossier, ou de son créateur lorsqu’elle
  est autonome ;
- une note ou un document hérite de son dossier, de son client ou de son
  auteur/uploader ;
- une facture, un paiement et une transaction héritent de leur client.

Cette structure évite de dupliquer une colonne `cabinet` sur chaque table et
donc d’introduire des rattachements contradictoires.

L’unicité de l’email client est maintenant limitée au cabinet, au lieu d’être
globale à toute l’installation.

## Matrice d’accès

| Domaine | ADMIN | LAWYER | ASSISTANT |
|---|---|---|---|
| Membres équipe | lecture du cabinet | lecture du cabinet | lecture du cabinet |
| Clients | tout son cabinet | créés ou liés à ses dossiers | contexte de ses affectations, lecture seule |
| Dossiers | tout son cabinet | créés ou affectés | contexte de ses tâches/audiences, lecture seule |
| Tâches | tout son cabinet | créées ou liées à ses dossiers | créées par lui ou affectées à lui |
| Audiences | tout son cabinet | créées, suivies ou liées à ses dossiers | créées par lui ou auxquelles il participe |
| Notes | tout son cabinet | ses notes et le contexte autorisé | contexte autorisé en lecture, modification de ses notes uniquement |
| Documents | tout son cabinet | ses documents et le contexte autorisé | contexte autorisé en lecture, modification de ses uploads uniquement |
| Finance | tout son cabinet | clients/dossiers autorisés | HTTP 403 |
| Administration utilisateurs | son cabinet | HTTP 403 | HTTP 403 |

Le superuser Django reste un compte de secours « break-glass » multi-cabinets.
Il ne doit pas être utilisé pour le travail quotidien.

## Querysets filtrés

Les fonctions centralisées de `backend/core/access.py` construisent les scopes
SQL pour :

- utilisateurs ;
- clients ;
- dossiers ;
- tâches ;
- audiences ;
- notes ;
- documents ;
- factures ;
- paiements ;
- transactions.

Tous les `ViewSet` concernés utilisent ces fonctions dans `get_queryset()`.
Une URL directe comme `/api/cases/123/` utilise donc le même périmètre que
`/api/cases/`. Un identifiant existant mais hors périmètre répond HTTP 404 et
ne confirme pas l’existence de l’objet.

## Permissions objet

`CabinetObjectPermission.has_object_permission()` vérifie explicitement :

1. le cabinet canonique de l’objet ;
2. sa présence dans le queryset autorisé de l’utilisateur ;
3. le droit de modification pour les méthodes non sûres.

Les notes et documents visibles grâce au contexte d’un dossier ne deviennent
pas automatiquement modifiables par un assistant. Il peut seulement modifier
les notes dont il est l’auteur et les documents qu’il a uploadés.

Les assistants reçoivent HTTP 403 lorsqu’ils tentent de créer, modifier ou
supprimer un client ou un dossier visible.

## Validation des relations

Les champs relationnels des serializers ont eux-mêmes des querysets limités au
périmètre courant. Les validations refusent notamment :

- un client ou dossier d’un autre cabinet ;
- un utilisateur affecté depuis un autre cabinet ;
- un dossier associé au mauvais client ;
- un assistant qui réaffecte une tâche à une autre personne ;
- un assistant qui ajoute arbitrairement d’autres participants ;
- un avocat qui s’attribue des droits sur un dossier en affectant un autre
  avocat ; seuls les administrateurs peuvent gérer des affectations arbitraires.

Ces tentatives répondent HTTP 400 sans modifier les données.

## Affectations frontend

L’ancien formulaire de tâche proposait des intitulés fictifs et envoyait
toujours `assigned_to: null`. L’ancien formulaire d’audience envoyait toujours
une liste de participants vide.

L’endpoint en lecture seule `GET /api/users/team/` retourne désormais le strict
minimum pour les membres actifs du même cabinet : identifiant, nom, username et
rôle. Il n’expose pas l’email et ne permet aucune mutation.

Les formulaires React Tâche et Audience utilisent cet annuaire et envoient de
vrais identifiants. Une affectation créée par un avocat donne ainsi à
l’assistant le contexte prévu par les règles RBAC.

## Documents protégés

Le champ fichier brut n’est plus retourné par le serializer. Il est remplacé
par une URL `download_url` vers :

```text
GET /api/documents/{id}/download/
```

Cette action repasse par le queryset filtré et la permission objet avant de
streamer le fichier. La route Django publique `/media/` a été supprimée, y
compris en mode DEBUG. Le frontend télécharge le blob avec son client Axios
authentifié.

En production, le reverse proxy ne doit donc pas publier directement
`MEDIA_ROOT`; il doit laisser les téléchargements passer par cette action ou
par un stockage privé générant des URL signées.

## Migration des données PostgreSQL

Les migrations suivantes ont été appliquées :

- `users.0003_cabinet_and_membership` ;
- `clients.0003_client_cabinet_and_owner` ;
- `cases.0003_case_owner` ;
- `tasks.0004_task_owner` ;
- `events.0003_event_owner`.

Le backfill a créé le cabinet principal, rattaché les utilisateurs et clients
existants, puis déterminé les propriétaires à partir des affectations
existantes.

Vérification sur la base PostgreSQL réelle après migration :

```text
cabinets: 1
users_without_cabinet: 0
clients_without_cabinet: 0
clients_without_owner: 0
cases_without_owner: 0
tasks_without_owner: 0
events_without_owner: 0
```

`makemigrations --check --dry-run` retourne `No changes detected`.

## Preuves automatisées

La suite Django contient désormais 36 tests, dont 11 scénarios RBAC dédiés à
deux cabinets distincts :

- authentification obligatoire ;
- isolation ADMIN par cabinet ;
- isolation LAWYER par création/affectation ;
- listes ASSISTANT limitées aux affectations et à leur contexte ;
- accès directs hors scope en HTTP 404 ;
- écritures Client/Dossier assistant en HTTP 403 ;
- `has_object_permission()` sur une note visible mais non possédée ;
- rejet des relations et affectations inter-cabinets ;
- téléchargement documentaire authentifié ;
- Finance limitée par rôle et par objet ;
- gestion utilisateurs et annuaire équipe limités au cabinet.

Résultat :

```text
Found 36 test(s).
....................................
Ran 36 tests in 14.383s
OK
```

Frontend :

```text
Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
```

Le build React de production compile avec succès.

## Limites conservées

- un utilisateur appartient à un seul cabinet ;
- l’historique immuable des changements de permissions et des consultations
  n’est pas encore implémenté ;
- le stockage documentaire reste local ; un stockage objet privé est conseillé
  avant un déploiement distribué ;
- le superuser possède volontairement un accès de secours global.

## Fichiers principaux

- `backend/core/access.py` ;
- `backend/core/permissions.py` ;
- `backend/core/validation.py` ;
- `backend/users/models.py` ;
- `backend/users/serializers.py` ;
- `backend/users/views.py` ;
- `backend/users/test_rbac.py` ;
- modèles, serializers et views de `clients`, `cases`, `tasks`, `events`,
  `notes`, `documents` et `finance` ;
- migrations 0003/0004 des applications concernées ;
- `src/app/App.jsx` et `src/app/routes.jsx` ;
- services et formulaires React des tâches, audiences et documents.

## Gate

**Validé.** Login, CRUD avocat, restriction Finance, isolation cabinet,
filtrage des listes, protection des détails, affectations assistant et
téléchargements documentaires fonctionnent sur PostgreSQL et sont couverts par
la suite automatisée.
