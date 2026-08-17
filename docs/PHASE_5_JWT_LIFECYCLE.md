# Phase 5 — Cycle de vie JWT

Date : 11 août 2026

## Résultat

Le mécanisme JWT existant a été complété sans réécrire l’authentification.
L’application utilise maintenant réellement le refresh token, sérialise les
refresh concurrents, révoque les refresh utilisés, appelle un logout backend et
termine automatiquement la session frontend lorsqu’elle ne peut plus être
renouvelée.

Le faux contrôle « Remember me » est devenu fonctionnel : il décide du stockage
de la session dans le navigateur.

## Baseline démontrée avant correction

Quatre tests de caractérisation ont d’abord échoué comme attendu :

| Comportement initial | Résultat constaté |
|---|---|
| Durée access token | 3 600 secondes au lieu de 900 |
| Rotation du refresh | aucun nouveau refresh retourné |
| Logout backend | endpoint absent, HTTP 404 |
| Révocation | ancien refresh encore réutilisable |

## Cycle backend final

| Élément | Comportement |
|---|---|
| Access token | 15 minutes par défaut |
| Refresh token | 1 jour par défaut |
| Refresh réussi | nouvel access + nouveau refresh |
| Ancien refresh après rotation | blacklisté, HTTP 401 |
| Logout | `POST /api/users/logout/`, HTTP 204 |
| Refresh après logout | HTTP 401 |
| Changement de mot de passe | access et refresh antérieurs rejetés |

Les durées sont configurables par :

- `JWT_ACCESS_TOKEN_MINUTES` ;
- `JWT_REFRESH_TOKEN_DAYS`.

Les valeurs doivent être des entiers strictement positifs. Les modèles et
migrations officiels `rest_framework_simplejwt.token_blacklist` sont activés.

Le logout accepte le refresh dans le corps sans exiger un access token encore
valide. Cela permet de fermer la session lorsque l’access vient d’expirer. Le
refresh est validé cryptographiquement avant d’être ajouté à la blacklist.

## Intégration Axios

Le flux final est :

```text
requête API
    ↓ HTTP 401
file de refresh partagée
    ↓ un seul POST /users/login/refresh/
rotation et stockage des nouveaux tokens
    ↓
rejeu de toutes les requêtes en attente
```

Si le refresh échoue :

1. toutes les requêtes en attente sont rejetées ;
2. les deux stockages navigateur sont nettoyés ;
3. un événement `gesavo:auth-session-ended` est émis ;
4. `App.jsx` supprime l’utilisateur et les sélections courantes ;
5. l’écran de connexion affiche que la session a expiré.

Le client utilisé pour le refresh est séparé du client Axios authentifié. Un
échec de refresh ne peut donc pas entrer récursivement dans l’interceptor. Une
requête n’est rejouée qu’une fois grâce au marqueur `_jwtRetry`.

Les endpoints publics de login et reset ainsi que le logout déclarent
explicitement qu’ils ne doivent pas déclencher de refresh automatique.

## « Remember me » réel

| Choix | Stockage | Effet |
|---|---|---|
| Décoché, valeur par défaut | `sessionStorage` | session limitée à la session navigateur |
| Coché | `localStorage` | session restaurable après redémarrage, jusqu’à expiration du refresh |

Le choix affecte access et refresh ensemble. La rotation remplace les tokens
dans le stockage d’origine et un nouveau login nettoie d’abord les deux
stockages pour éviter les sessions hybrides.

## Logout frontend

Le frontend capture le refresh courant, nettoie immédiatement les tokens
locaux, puis appelle le backend pour le blacklister. L’interface se ferme même
si le réseau est indisponible. Lorsque le backend répond, le refresh ne peut
plus être utilisé.

## Preuves de validation

### Backend PostgreSQL

Les 4 tests JWT dédiés valident :

1. durée d’access de 15 minutes avec tolérance d’une seconde ;
2. rotation et refus de réutilisation de l’ancien refresh ;
3. logout et blacklist du refresh ;
4. refus des payloads de logout absents ou invalides.

Suite Django complète :

```text
Found 25 test(s).
.........................
Ran 25 tests in 12.658s
OK
```

La base PostgreSQL `test_gesavo` a été créée puis détruite par Django.

### Frontend

```text
Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
Time:        1.386 s
```

Les tests vérifient :

- stockage session par défaut ;
- persistance avec Remember me ;
- remplacement atomique lors de la rotation ;
- nettoyage et événement de fin de session ;
- un seul refresh pour trois appels concurrents ;
- rejet groupé puis réutilisation possible de la file après un échec.

Le build React de production compile avec succès.

## Exploitation

Les tokens expirés restent dans les tables d’historique de SimpleJWT. Planifier
la commande suivante quotidiennement en production :

```powershell
python manage.py flushexpiredtokens
```

Cette commande supprime les entrées expirées ; elle ne déconnecte pas les
sessions encore valides.

## Limites explicitement conservées

- un access token déjà copié reste valide jusqu’à son expiration, au maximum
  15 minutes, même après logout ; le refresh correspondant est révoqué ;
- si le backend est inaccessible pendant le logout, la session locale est
  terminée mais le serveur ne peut pas recevoir la révocation ;
- Web Storage reste exposé à un éventuel JavaScript injecté par une faille XSS ;
  une migration future vers des cookies HttpOnly constituerait un changement
  d’architecture, volontairement hors de cette phase.

Ces limites sont compensées ici par des access tokens courts, des refresh
rotatifs, la blacklist et la révocation sur changement de mot de passe.

## Fichiers principaux modifiés ou ajoutés

- `backend/core/settings.py` ;
- `backend/users/serializers.py` ;
- `backend/users/views.py` ;
- `backend/users/urls.py` ;
- `backend/users/test_jwt_lifecycle.py` ;
- `.env.example` ;
- `.env.production.example` ;
- `src/services/api.js` ;
- `src/services/auth.service.js` ;
- `src/services/tokenStorage.js` ;
- `src/services/refreshQueue.js` ;
- `src/services/tokenStorage.test.js` ;
- `src/services/refreshQueue.test.js` ;
- `src/app/App.jsx` ;
- `src/features/auth/pages/LoginPage.jsx` ;
- `src/i18n/translations.js` ;
- `README.md`.

## Gate

**Validé.** L’expiration access, le refresh automatique, la file concurrente,
la rotation, la blacklist, le logout backend, la terminaison automatique et le
choix Remember me sont opérationnels sans remplacement du système JWT existant.
