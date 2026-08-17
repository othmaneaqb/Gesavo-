# Phase 10 — Tests complets sécurité/backend

Date : 11 août 2026

## Résultat

La petite suite de caractérisation est devenue une suite backend de 70 tests,
exécutée sur une base de test PostgreSQL 17 créée puis détruite par Django.
Elle vérifie à la fois les refus de sécurité et la conservation des parcours
métier autorisés.

```text
Requête
    ↓
Authentification (401)
    ↓
Rôle (403)
    ↓
Cabinet + ownership + affectation (404 hors périmètre)
    ↓
Validation métier (400)
    ↓
CRUD autorisé (2xx)
    ↓
Contraintes PostgreSQL + audit
```

## Matrice de couverture

| Domaine | Contrats automatisés |
|---|---|
| 401 | Listes, détails, téléchargement, audit, gestion des comptes et actions d’écriture refusés sans JWT |
| 403 | Assistant refusé sur Finance et administration ; mutations clients/dossiers refusées ; rôles administratifs contrôlés |
| IDOR inter-avocats | GET, PATCH et DELETE masqués sur clients, dossiers, tâches, audiences, notes et documents ; restauration et téléchargement masqués |
| Isolation inter-cabinets | Même un administrateur de cabinet reçoit 404 sur les ressources et comptes d’un autre cabinet |
| Assistant Finance | Transactions, factures, paiements et audit répondent tous 403 |
| Administration utilisateurs | Création, rôle, mot de passe, auto-protection admin, superuser, cabinet et mots de passe faibles |
| JWT | Durée d’accès, rotation, blacklist, logout, types non interchangeables, signature altérée et compte désactivé |
| Uploads | Taille, fichier vide, extension, MIME, contenu réel, nom, stockage privé, relations, téléchargement, audit et nettoyage |
| Validation métier | Montants, client ↔ dossier, statuts, surpaiement, ownership, numérotation et relations juridiques |
| PostgreSQL | Moteur/version, migrations, contraintes/index et colonnes JSONB natives |
| Régression CRUD | Clients, dossiers, tâches, audiences, documents, notes et transactions Finance |

## 401, 403 et non-divulgation

La matrice anonyme couvre les principales collections, leurs détails, le
téléchargement documentaire, les journaux d’audit et les actions d’écriture.
Une requête sans authentification reçoit HTTP 401 avant toute validation de
payload.

Les refus de rôle explicites reçoivent HTTP 403. C’est notamment le cas de
l’Assistant sur les quatre surfaces Finance et sur la gestion des comptes.

Les objets hors périmètre reçoivent HTTP 404 afin de ne pas révéler leur
existence. Les tests tentent GET, PATCH et DELETE avec des identifiants réels :

- autre avocat du même cabinet, mais sans ownership/affectation ;
- autre cabinet, y compris avec un compte `ADMIN` authentifié ;
- actions secondaires `restore`, `download` et réinitialisation de mot de
  passe.

Ils vérifient ensuite que les objets ciblés et le compte étranger n’ont pas été
modifiés.

## Administration utilisateurs et JWT

Les onze tests d’administration prouvent qu’un avocat ordinaire ne peut ni
administrer les comptes ni promouvoir un utilisateur. Seul un administrateur
du cabinet peut créer, modifier ou réinitialiser un compte de son périmètre.
L’administrateur ne peut pas se désactiver, se rétrograder ou se supprimer, et
un non-superuser ne peut pas administrer un superuser.

La création, la modification et les deux parcours de reset utilisent les
validateurs Django. Les mots de passe faibles sont refusés et les mots de passe
acceptés restent utilisables pour une authentification réelle.

Les sept tests JWT vérifient :

- expiration de l’access token à 15 minutes ;
- rotation du refresh et blacklist de l’ancien token ;
- révocation du refresh au logout ;
- refus des tokens invalides ou manquants ;
- impossibilité d’utiliser un refresh comme access, ou l’inverse ;
- refus d’une signature JWT modifiée ;
- arrêt d’une session existante après désactivation du compte.

## Uploads et documents

Neuf tests dédiés couvrent la chaîne documentaire complète. Un rejet de
fichier vide, trop grand, déguisé, au MIME incompatible ou lié à un couple
client/dossier incohérent ne crée ni objet, ni audit, ni fichier résiduel.

Les parcours valides vérifient le SHA-256, le nom assaini, les métadonnées, le
stockage privé, les permissions de téléchargement, les en-têtes anti-cache et
les audits `CREATE`, `UPDATE`, `DOWNLOAD`, `DELETE`. Le remplacement et la
suppression prouvent également le nettoyage physique après commit.

## Validation métier et régression CRUD

Finance conserve ses neuf tests spécialisés : montants strictement positifs
dans l’API et PostgreSQL, cohérence client/dossier, isolation cabinet,
ownership, type/statut, surpaiement, statut facture, numérotation unique et
audit immuable.

Les relations juridiques sont aussi testées : un client étranger, un assigné
ou participant d’un autre cabinet, et un document/note associé au mauvais
client sont refusés sans effet de bord.

Les tests de caractérisation exercent désormais le cycle complet
création/lecture/modification/suppression pour clients, dossiers, audiences,
documents, notes et transactions. Les tâches couvrent création, complétion,
restauration puis suppression. Les connexions Avocat/Assistant et la
restriction Finance restent des régressions explicites.

## Contrat PostgreSQL

Quatre tests empêchent un faux succès sous SQLite :

1. le moteur doit être `django.db.backends.postgresql` et le serveur au moins
   PostgreSQL 17 ;
2. tous les nœuds terminaux du graphe de migrations doivent être appliqués ;
3. les contraintes critiques et index d’audit doivent exister réellement ;
4. les snapshots documentaires `before` et `after` doivent être des colonnes
   PostgreSQL `jsonb`.

La suite utilise exclusivement la base temporaire Django. Elle ne modifie pas
la base de développement `gesavo`.

## Preuves automatisées

Commande exécutée dans le backend Docker connecté à PostgreSQL 17 :

```text
docker compose exec -T backend python manage.py test -v 1

Found 70 test(s).
......................................................................
Ran 70 tests in 19.790s
OK
```

Le contrôle système Django ne signale aucun problème. La base de test est
créée avant la suite et détruite après succès.

## Fichiers principaux

- `backend/users/test_rbac.py` ;
- `backend/users/test_security.py` ;
- `backend/users/test_jwt_lifecycle.py` ;
- `backend/users/test_postgresql.py` ;
- `backend/users/tests.py` ;
- `backend/documents/tests.py` ;
- `backend/finance/tests.py` ;
- `backend/tasks/tests.py`.

## Gate

**Validé.** Les contrats 401, 403, IDOR, inter-avocats, inter-cabinets,
Assistant Finance, administration utilisateurs, JWT, uploads, validation
métier, PostgreSQL et régression CRUD passent ensemble : **70/70 tests**.
