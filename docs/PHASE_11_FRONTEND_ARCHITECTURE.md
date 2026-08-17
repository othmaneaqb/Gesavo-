# Phase 11 — Nettoyage de l’architecture frontend

Date : 17 août 2026

## Résultat

Le frontend existant a été restructuré sans reconstruction et sans changement
du design. `App.jsx` est passé d’environ 550 lignes à **17 lignes** : il ne fait
plus que composer les providers et le routeur.

```text
App.jsx
  └─ AppProviders (BrowserRouter)
      └─ AppRouter
          ├─ Login / Reset password
          ├─ ProtectedRoute
          └─ Workspace
              ├─ hooks par feature
              ├─ routes centralisées
              ├─ DashboardLayout existant
              └─ modales existantes
```

Les pages, composants, classes CSS et modales existants sont conservés. La
phase déplace l’orchestration et les appels API, elle ne remplace pas
l’application.

## React Router

React Router `7.18.2` fournit désormais les URL applicatives réelles :

| Écran | URL |
|---|---|
| Dashboard | `/dashboard` |
| Clients | `/clients` |
| Détail client | `/clients/:clientId` |
| Dossiers | `/cases` |
| Détail dossier | `/cases/:caseId` |
| Documents | `/documents` |
| Calendrier | `/calendar` |
| Finance | `/finance` |
| Tâches | `/tasks` |
| Notes | `/notes` |
| Paramètres | `/settings` |
| Connexion | `/login` |
| Reset mot de passe | `/reset-password?uid=…&token=…` |

Les sélections `selectedClient` et `selectedCase` ne pilotent plus la
navigation. Elles sont dérivées des paramètres URL. Le bouton retour, le menu,
les notifications et les lignes client/dossier utilisent tous `navigate()`.
Un refresh ou un lien direct conserve donc l’écran demandé.

`ProtectedRoute` renvoie les visiteurs anonymes vers `/login` tout en mémorisant
l’URL demandée. Après authentification, cette URL est restaurée. `RoleGuard`
redirige un Assistant qui saisit directement `/finance` ou `/settings`. Ces
gardes restent une aide UX ; le backend demeure l’autorité de sécurité.

En production, le serveur statique ou reverse proxy doit réécrire les URL SPA
inconnues vers `index.html`, tout en laissant `/api/` au backend.

## Hooks par feature

Chaque domaine possède maintenant son hook et son service :

- Auth : `useAuth` + `authService` ;
- Clients : `useClients` + `clientsService` ;
- Dossiers : `useCases` + `casesService` ;
- Tâches : `useTasks` + `tasksService` ;
- Audiences : `useHearings` + `hearingsService` ;
- Documents : `useDocuments` + `documentsService` ;
- Finance : `useFinance` + `financeService` ;
- Notes : `useNotes` + `notesService` ;
- Équipe : `useTeam` + `usersService` ;
- Dashboard et notifications : hooks de calcul dédiés.

Les anciens services métier sous `src/services/` ont été supprimés. Ce dossier
ne conserve que l’infrastructure partagée : instance Axios, stockage JWT et
file de refresh.

`useApiCollection` centralise seulement la mécanique commune : activation,
chargement, cache local, rafraîchissement et état de requête. Les mutations et
messages métier restent dans chaque hook de feature.

## Chargements indépendants

L’ancien `Promise.all` après login a été supprimé. Une route active uniquement
les domaines nécessaires :

| Route | Données chargées |
|---|---|
| Dashboard | clients, dossiers, tâches, audiences, documents, notes et Finance si autorisée |
| Clients | clients, compteurs dossiers et Finance si autorisée |
| Détail client | ajoute documents et notes |
| Dossiers | dossiers et clients |
| Détail dossier | ajoute audiences, documents et tâches |
| Documents | documents, dossiers et clients |
| Calendrier | audiences, dossiers et équipe |
| Finance | Finance, clients et dossiers |
| Tâches | tâches, dossiers et équipe |
| Notes | notes et clients |
| Paramètres | aucun préchargement métier global |

Chaque hook expose son propre état `{ loading, loaded, error }`. Une panne
Finance n’annule plus une réponse Clients ou Tâches. `RouteDataBoundary` affiche
les erreurs par domaine et laisse les données déjà disponibles s’afficher.
Les données restent en mémoire lorsque l’utilisateur change de page, ce qui
évite de recharger une feature déjà visitée pendant la même session.

## Compatibilité CRA

La branche React Router 6 a été testée puis écartée car l’audit npm signale un
avis de sécurité sans correctif sur cette branche. React Router 7 est conservé.
Create React App 5 embarque toutefois Jest 27, qui ne comprend pas son sous-chemin
package `react-router/dom`. Un mapping Jest ciblé dans `config-overrides.js`
résout uniquement ce sous-chemin vers l’export CommonJS officiel. Un petit
polyfill `TextEncoder/TextDecoder` complète l’environnement jsdom ancien.

Aucun `npm audit fix --force` n’a été appliqué : npm proposerait des changements
majeurs invalides sur `react-scripts`. L’audit global continue de signaler la
dette historique de CRA 5 et certaines dépendances existantes ; sa résolution
nécessite une phase séparée de modernisation de l’outillage, pas une réécriture
cachée dans cette phase d’architecture.

## Preuves automatisées

Suite frontend :

```text
Test Suites: 11 passed, 11 total
Tests:       24 passed, 24 total
Snapshots:   0 total
```

Les nouveaux tests prouvent :

- redirection d’une URL métier directe vers `/login` sans session ;
- résolution de `/clients/:id` et `/cases/:id` ;
- redirection de rôle Assistant sur Finance ;
- besoins de données limités à chaque route ;
- absence de requête avant activation d’une feature ;
- isolation des erreurs entre deux API ;
- `/tasks` appelle uniquement Tasks, Cases et Team.

Build production :

```text
Creating an optimized production build...
Compiled successfully.

120.37 kB  build/static/js/main.d1796e8e.js
6.13 kB    build/static/css/main.a18ffe44.css
```

Le message Browserslist sur l’âge de `caniuse-lite` est informatif et ne vient
pas du code applicatif. `git diff --check` réussit.

## Fichiers principaux

- `src/app/App.jsx` ;
- `src/app/AppRouter.jsx` ;
- `src/app/Workspace.jsx` ;
- `src/app/AppModals.jsx` ;
- `src/app/RouteDataBoundary.jsx` ;
- `src/app/guards.jsx` ;
- `src/app/routes.jsx` ;
- `src/shared/hooks/useApiCollection.js` ;
- `src/features/*/hooks/` ;
- `src/features/*/services/` ;
- `src/layouts/DashboardLayout.jsx` ;
- `config-overrides.js` ;
- `src/setupTests.js` ;
- `package.json` et `package-lock.json`.

## Gate

**Validé.** L’application utilise des URL réelles, `App.jsx` est réduit à la
composition, les domaines chargent indépendamment leurs données, les services
API sont rangés par feature, les 24 tests passent et le bundle de production
compile sans avertissement applicatif.
