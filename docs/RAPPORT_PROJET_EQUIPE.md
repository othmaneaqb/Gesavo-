# Dossier de synthèse du projet — Application de gestion de cabinet d’avocat Aït El Hadj

Date de préparation : 24 mai 2026

## 1. Présentation générale

Le projet est une application web de gestion de cabinet d’avocat destinée au cabinet **Aït El Hadj Avocat**. Elle centralise les opérations quotidiennes d’un cabinet juridique : gestion des clients, dossiers, tâches, audiences, documents, notes, finances et comptes utilisateurs.

L’objectif principal est d’offrir une interface professionnelle, sécurisée et cohérente avec l’identité visuelle du cabinet : style juridique classique, palette noir / vert foncé / doré / beige, ambiance premium et sobre.

## 2. Objectifs fonctionnels

L’application permet principalement de :

- authentifier les utilisateurs selon leur rôle ;
- gérer les clients du cabinet ;
- gérer les dossiers juridiques liés aux clients ;
- organiser les tâches par dossier ;
- archiver automatiquement les tâches terminées après 48 heures ;
- gérer les audiences et événements du calendrier ;
- stocker et consulter les documents ;
- prendre des notes liées aux clients ou aux dossiers ;
- gérer les transactions financières ;
- séparer les accès entre avocat et assistant ;
- administrer les comptes depuis la page Settings.

## 3. Technologies utilisées

### Frontend

- React 19
- React DOM
- Create React App avec react-app-rewired
- Axios pour la communication HTTP avec le backend
- CSS personnalisé organisé dans `src/styles`
- Alias d’import configuré avec `jsconfig.json`

### Backend

- Django
- Django REST Framework
- SimpleJWT pour l’authentification par tokens JWT
- SQLite en base de données de développement
- CORS Headers pour autoriser la communication frontend/backend

## 4. Architecture générale

Le projet est séparé en deux grandes parties :

```text
law-firm-app/
├── src/                 Frontend React
├── backend/             Backend Django REST API
├── public/              Assets publics frontend
├── build/               Build frontend généré
├── docs/                Documents de synthèse du projet
├── package.json         Dépendances et scripts frontend
└── README.md            Documentation initiale CRA
```

### Architecture frontend

```text
src/
├── app/                 Configuration globale de l’application et routes
├── assets/              Images et ressources graphiques
├── components/          Composants UI réutilisables
├── features/            Modules fonctionnels par domaine
├── layouts/             Layout principal dashboard/sidebar
├── services/            Services API frontend
├── styles/              Variables CSS et styles globaux
└── utils/               Fonctions utilitaires
```

Les fonctionnalités sont organisées par domaine :

```text
src/features/
├── auth/                Login
├── dashboard/           Tableau de bord
├── clients/             Gestion clients
├── cases/               Gestion dossiers
├── tasks/               Gestion tâches
├── calendar/            Audiences et événements
├── documents/           Documents
├── notes/               Notes
├── finance/             Finance
└── settings/            Paramètres et comptes utilisateurs
```

### Architecture backend

```text
backend/
├── core/                Configuration Django principale
├── users/               Authentification, rôles, gestion utilisateurs
├── clients/             API clients
├── cases/               API dossiers
├── tasks/               API tâches et archivage
├── events/              API audiences / calendrier
├── notes/               API notes
├── finance/             API transactions financières
├── documents/           API documents uploadés
├── media/               Fichiers uploadés
└── db.sqlite3           Base SQLite de développement
```

## 5. Authentification et rôles

L’application utilise une authentification JWT via Django REST Framework SimpleJWT.

Deux rôles principaux existent :

### Avocat / Lawyer

L’avocat dispose d’un accès complet à l’application, notamment :

- Dashboard
- Clients
- Dossiers
- Documents
- Calendrier
- Tâches
- Notes
- Finance
- Settings
- Création et gestion des comptes utilisateurs

### Assistant

L’assistant dispose d’un accès limité. Il peut travailler sur les opérations de gestion courante, mais n’a pas accès à la partie finance.

Restrictions principales :

- pas d’accès au module Finance ;
- pas de chargement des données financières côté frontend ;
- interdiction côté backend via permissions API ;
- pas d’accès à la gestion des utilisateurs dans Settings.

## 6. Modules fonctionnels

### 6.1 Login

La page Login a été modernisée selon l’identité visuelle du cabinet :

- logo Aït El Hadj ;
- formulaire à gauche ;
- image juridique sombre à droite ;
- style beige, noir et doré ;
- champs email et mot de passe ;
- option “Se souvenir de moi” ;
- lien “Mot de passe oublié ?” ;
- bouton de connexion doré ;
- état de chargement ;
- validation frontend simple.

Fichier principal :

```text
src/features/auth/pages/LoginPage.jsx
```

Assets utilisés :

```text
src/assets/logo-ait-el-hadj.png
src/assets/logo-ait-el-hadj-cropped.png
src/assets/login-background.png
```

### 6.2 Dashboard

Le Dashboard donne une vue d’ensemble du cabinet :

- statistiques clients ;
- statistiques dossiers ;
- tâches ;
- audiences ;
- activités récentes ;
- résumé financier uniquement pour l’avocat.

Fichier principal :

```text
src/features/dashboard/pages/Dashboard.jsx
```

### 6.3 Clients

Le module Clients permet un CRUD complet :

- créer un client ;
- afficher les détails ;
- modifier les informations ;
- supprimer un client ;
- consulter ses dossiers, documents et notes ;
- afficher les informations financières si l’utilisateur est avocat.

Backend :

```text
backend/clients/
```

Frontend :

```text
src/features/clients/
src/services/clients.service.js
```

Champs principaux :

- prénom ;
- nom ;
- numéro national / CIN ;
- email ;
- téléphone ;
- adresse ;
- notes.

### 6.4 Dossiers / Cases

Le module Dossiers permet un CRUD complet des affaires juridiques :

- création d’un dossier ;
- modification ;
- suppression ;
- affichage détail ;
- rattachement à un client ;
- association avec audiences, documents et tâches.

Champs principaux :

- titre ;
- numéro de dossier ;
- type de dossier ;
- tribunal ;
- juge ;
- description ;
- statut ;
- prochaine audience ;
- client concerné ;
- avocats assignés.

Backend :

```text
backend/cases/
```

Frontend :

```text
src/features/cases/
src/services/cases.service.js
```

### 6.5 Tâches

Le module Tâches permet d’organiser le travail opérationnel :

- création de tâches ;
- modification du statut ;
- rattachement optionnel à un dossier ;
- priorité ;
- date limite ;
- archivage automatique.

Règle métier importante :

> Toute tâche terminée depuis plus de 48 heures passe automatiquement dans l’archive.

L’interface contient :

- tâches actives ;
- tâches archivées ;
- filtre par dossier ;
- restauration depuis l’archive.

Backend :

```text
backend/tasks/
```

Frontend :

```text
src/features/tasks/
src/services/tasks.service.js
```

### 6.6 Calendrier / Audiences

Le module Calendar gère les événements et audiences :

- titre ;
- description ;
- tribunal ;
- résultat ;
- statut ;
- date et heure de début ;
- date et heure de fin ;
- dossier lié ;
- participants.

Backend :

```text
backend/events/
```

Frontend :

```text
src/features/calendar/
src/services/hearings.service.js
```

### 6.7 Documents

Le module Documents permet l’upload et la consultation des fichiers liés au cabinet :

- titre ;
- fichier uploadé ;
- description ;
- client lié ;
- dossier lié ;
- utilisateur ayant uploadé ;
- date d’upload.

Les fichiers sont stockés côté backend dans :

```text
backend/media/documents/
```

Backend :

```text
backend/documents/
```

Frontend :

```text
src/features/documents/
src/services/documents.service.js
```

### 6.8 Notes

Le module Notes permet de conserver des notes internes :

- titre ;
- contenu ;
- auteur ;
- client lié ;
- dossier lié ;
- date de création ;
- date de mise à jour.

Backend :

```text
backend/notes/
```

Frontend :

```text
src/features/notes/
src/services/notes.service.js
```

### 6.9 Finance

Le module Finance est réservé au rôle avocat.

Fonctionnalités :

- transactions ;
- factures ;
- paiements ;
- dépenses ;
- statut payé / impayé ;
- rattachement à un client ou dossier.

Protection :

- route frontend visible uniquement pour LAWYER ;
- API backend protégée par permission ;
- assistant reçoit une interdiction d’accès à la finance.

Backend :

```text
backend/finance/
```

Frontend :

```text
src/features/finance/
src/services/finance.service.js
```

### 6.10 Settings

La page Settings sert à la configuration et à l’administration.

Sections principales :

- Profil cabinet ;
- Apparence ;
- Sécurité ;
- Notifications ;
- Gestion des comptes équipe ;
- Actions : sauvegarder, réinitialiser, logout.

La création de nouveaux comptes est réservée à l’avocat ou à l’administrateur.

Fichiers principaux :

```text
src/features/settings/pages/SettingsPage.jsx
src/features/settings/components/SettingsSection.jsx
src/features/settings/components/Toggle.jsx
src/services/users.service.js
```

## 7. Connexion frontend/backend

Le frontend communique avec le backend via les fichiers présents dans :

```text
src/services/
```

Services principaux :

- `auth.service.js`
- `clients.service.js`
- `cases.service.js`
- `tasks.service.js`
- `hearings.service.js`
- `notes.service.js`
- `documents.service.js`
- `finance.service.js`
- `users.service.js`

Le backend expose les routes API sous le préfixe `/api/` :

```text
/api/users/
/api/clients/
/api/cases/
/api/tasks/
/api/events/
/api/notes/
/api/finance/
/api/documents/
```

## 8. Base de données

La base actuelle de développement est SQLite :

```text
backend/db.sqlite3
```

Les principales entités sont :

- User / CustomUser
- Client
- Case
- Task
- Event
- Note
- Document
- Invoice
- Payment
- Transaction

## 9. Sécurité

Mesures présentes :

- authentification JWT ;
- routes protégées ;
- permissions selon rôle ;
- séparation avocat / assistant ;
- restriction du module finance ;
- création des comptes réservée à l’avocat ou admin ;
- validation frontend sur le login ;
- permissions DRF côté backend.

Points à renforcer pour une version production :

- désactiver `CORS_ALLOW_ALL_ORIGINS` ;
- configurer des variables d’environnement ;
- sécuriser `SECRET_KEY` ;
- configurer un serveur mail pour la récupération de mot de passe ;
- passer à PostgreSQL ou MySQL ;
- ajouter logs, sauvegardes et audit trail ;
- améliorer la gestion des permissions fines par module.

## 10. Instructions d’exécution

### Backend

```powershell
cd C:\Users\pc\Documents\pip\law-firm-app\backend
.\venv\bin\python.exe manage.py migrate
.\venv\bin\python.exe manage.py seed_demo
.\venv\bin\python.exe manage.py runserver 127.0.0.1:8000
```

### Frontend

Dans un autre terminal :

```powershell
cd C:\Users\pc\Documents\pip\law-firm-app
npm.cmd start
```

L’application frontend est ensuite accessible sur :

```text
http://localhost:3000
```

Le backend est accessible sur :

```text
http://127.0.0.1:8000
```

### Build production frontend

```powershell
npm.cmd run build
```

## 11. Comptes de démonstration

Comptes utilisés pour les tests :

### Avocat

```text
Username : demo
Password : Demo12345!
Role     : LAWYER
```

### Assistant

```text
Username : assistant
Password : Assistant12345!
Role     : ASSISTANT
```

## 12. Travail réalisé récemment

Principales améliorations réalisées :

- connexion frontend/backend ;
- CRUD clients ;
- CRUD dossiers ;
- organisation des tâches par dossier ;
- archivage automatique des tâches terminées après 48 heures ;
- séparation des rôles avocat / assistant ;
- restriction du module finance ;
- page Settings plus complète ;
- gestion des comptes équipe ;
- page Login modernisée avec visuels du cabinet ;
- vraie récupération de mot de passe par email avec lien sécurisé ;
- centre de notifications réel pour tâches, audiences et documents récents ;
- export PDF imprimable des dossiers juridiques ;
- génération de factures PDF depuis Finance ;
- corrections de compilation ;
- intégration des documents, notes, audiences et finance avec backend.

## 13. Structure proposée pour le rapport final

L’équipe peut organiser le rapport comme suit :

1. Introduction
   - contexte du cabinet ;
   - problématique ;
   - objectifs du projet.

2. Analyse des besoins
   - besoins fonctionnels ;
   - besoins non fonctionnels ;
   - acteurs du système.

3. Conception
   - architecture générale ;
   - diagramme des modules ;
   - modèle de données ;
   - rôles et permissions.

4. Réalisation technique
   - frontend React ;
   - backend Django REST ;
   - authentification JWT ;
   - connexion API ;
   - organisation du code.

5. Fonctionnalités développées
   - Login ;
   - Dashboard ;
   - Clients ;
   - Dossiers ;
   - Tâches ;
   - Calendrier ;
   - Documents ;
   - Notes ;
   - Finance ;
   - Settings.

6. Sécurité
   - authentification ;
   - rôles ;
   - limitation finance ;
   - points d’amélioration.

7. Tests et validation
   - tests de connexion ;
   - tests CRUD ;
   - tests de permissions ;
   - build frontend ;
   - vérification backend.

8. Conclusion
   - résultats obtenus ;
   - limites ;
   - perspectives d’amélioration.

## 14. Perspectives d’amélioration

Idées pour continuer le projet :

- tableau de bord analytique plus avancé ;
- recherche globale ;
- historique/audit des actions ;
- stockage cloud sécurisé des documents ;
- déploiement sur serveur distant ;
- migration vers PostgreSQL ;
- tests automatisés frontend et backend.

## 15. Conclusion synthétique

L’application Aït El Hadj Avocat constitue une solution complète de gestion de cabinet juridique. Elle combine une interface professionnelle adaptée au domaine juridique avec un backend structuré en API REST. Le projet couvre les besoins essentiels d’un cabinet : clients, dossiers, tâches, documents, notes, audiences, finances et gestion des utilisateurs. La séparation des rôles avocat / assistant renforce la sécurité et rend l’application plus réaliste pour un contexte professionnel.







