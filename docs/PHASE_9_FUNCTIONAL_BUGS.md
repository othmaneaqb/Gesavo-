# Phase 9 — Corrections fonctionnelles

Date : 11 août 2026

## Résultat

Les défauts fonctionnels secondaires consignés en Phase 0 sont corrigés avant
toute amélioration visuelle. Aucun contrôle ne prétend désormais offrir une
fonction qui n’existe pas réellement.

| Défaut audité | Résultat Phase 9 |
|---|---|
| Calendrier comparant seulement le jour | Corrigé : année, mois et jour |
| Téléchargement documentaire sans action UI | Déjà corrigé en Phase 8, régression conservée |
| Œil du mot de passe inerte | Corrigé et accessible |
| Remember Me sans effet | Cycle Phase 5 confirmé depuis le formulaire |
| Encodage FR/EN/AR | Nettoyé et testé |
| Archivage déclenché pendant GET | Remplacé par un scheduler dédié |
| Settings locaux/factices | Contrôles factices retirés |

## Calendrier

L’ancien code extrayait uniquement le dernier segment `DD` de chaque date. Une
audience du 15 janvier produisait donc un point sur le 15 février, mars, etc.

`getHearingDaysForMonth()` valide maintenant le format `YYYY-MM-DD` et ne garde
que les audiences dont l’année et le mois correspondent à la vue courante. Le
marquage « aujourd’hui » compare également l’année ; août 2025 ne peut plus
être marqué comme août 2026.

La comparaison est volontairement faite sur les segments de date civile, sans
conversion UTC susceptible de décaler le jour.

## Téléchargement documentaire

La Phase 8 avait déjà complété ce point avant l’ouverture de cette phase :

- `download_url` est transformé en `fileUrl` ;
- Axios demande le fichier protégé avec le JWT et `responseType: "blob"` ;
- le nom original assaini est utilisé ;
- le bouton gère chargement et erreur ;
- le backend applique cabinet, affectation et permission objet.

Le test `documents.service.test.js` reste dans la suite Phase 9 et empêche le
retour du bouton sans handler observé dans l’audit.

## Visibilité du mot de passe

L’icône décorative de la page de connexion est devenue un bouton :

- `type="button"`, donc aucun submit accidentel ;
- bascule réelle `password` ↔ `text` ;
- `aria-label` localisé Afficher/Masquer ;
- `aria-pressed` ;
- focus clavier visible ;
- comportement RTL correct.

Un test de composant manipule le bouton et vérifie directement le type de
l’input.

## Remember Me

L’intégration réalisée en Phase 5 est maintenant couverte depuis l’interface :

```text
LoginPage checkbox
    ↓
App.login(..., remember)
    ↓
authService.login(..., remember)
    ↓
false → sessionStorage
true  → localStorage
```

Le refresh conserve le stockage choisi et le logout supprime les deux
emplacements puis révoque le refresh côté backend. Le libellé n’est donc plus
un contrôle factice.

## FR / EN / AR

Les libellés Settings en français ont retrouvé leurs accents et apostrophes
correctes. Les marqueurs de mojibake présents dans les commentaires CSS ont été
nettoyés. Le document HTML déclare déjà UTF-8.

Trois protections automatisées ont été ajoutées :

1. parité de toutes les clés entre français, anglais et arabe ;
2. absence des marqueurs courants `Ã`, `Â`, séquences `â€…` et caractère de
   remplacement ;
3. vérification que l’arabe est RTL tandis que FR/EN restent LTR.

Le changement de langue continue d’appliquer `lang`, `dir`, la classe RTL et
de sauvegarder `app_language` dans le navigateur.

## Archivage des tâches

Un GET ne modifie plus la base. `TaskViewSet.get_queryset()` est redevenu une
lecture pure.

La commande suivante archive de manière atomique les tâches terminées depuis
au moins 48 heures :

```text
python manage.py archive_completed_tasks
```

Elle est idempotente et accepte :

```text
--older-than-hours N
--watch
--interval-seconds N
```

Docker Compose exécute en permanence le service `task-archiver`, avec une passe
au démarrage puis une passe horaire. Configuration :

```text
TASK_ARCHIVE_AFTER_HOURS=48
TASK_ARCHIVE_INTERVAL_SECONDS=3600
```

Le service est actif dans l’environnement local. Avant activation, aucune tâche
réelle n’était nouvellement éligible ; la première passe a donc archivé zéro
tâche. L’action existante `/api/tasks/{id}/restore/` reste inchangée et remet
statut, dates et drapeau d’archive dans un état cohérent.

Un déploiement sans Compose doit planifier la commande avec son ordonnanceur
système plutôt que lancer `--watch` dans le processus web.

## Settings : suppression des fonctions factices

Les sections suivantes ont été retirées de l’interface car elles ne possèdent
aucun modèle, endpoint ou effet applicatif réel :

- profil du cabinet local ;
- thème sombre et couleur principale ;
- faux changement de mot de passe courant ;
- faux interrupteur 2FA ;
- préférences de notifications non appliquées ;
- boutons Enregistrer/Reset qui ne persistaient rien.

Settings conserve uniquement :

- la langue, appliquée immédiatement et persistée dans le navigateur ;
- la gestion réelle des comptes via l’API administrateur ;
- la réinitialisation réelle des mots de passe avec validation Django ;
- le logout réel avec révocation JWT.

Cette décision évite de créer une fausse impression de sécurité. Une future
2FA devra être une phase dédiée avec enrôlement, secrets protégés, codes de
récupération et vérification au login.

## Preuves automatisées

Backend PostgreSQL :

```text
Found 56 test(s).
........................................................
Ran 56 tests in 17.511s
OK
```

Les quatre nouveaux tests backend prouvent :

- aucune écriture d’archive pendant GET ;
- archivage ciblé après 48 heures ;
- idempotence ;
- restauration API ;
- rejet d’une rétention invalide.

Frontend :

```text
Test Suites: 7 passed, 7 total
Tests:       17 passed, 17 total
```

La suite couvre calendrier, visibilité du mot de passe, propagation Remember
Me, stockage des JWT, téléchargement protégé, Settings réel, parité et encodage
FR/EN/AR. Le build React de production compile sans avertissement applicatif.

`python manage.py check`, `makemigrations --check --dry-run` et
`git diff --check` réussissent.

## Fichiers principaux

- `src/features/calendar/pages/CalendarPage.jsx` ;
- `src/features/calendar/pages/CalendarPage.test.js` ;
- `src/features/auth/pages/LoginPage.jsx` ;
- `src/features/auth/pages/LoginPage.test.jsx` ;
- `src/features/settings/pages/SettingsPage.jsx` ;
- `src/features/settings/pages/SettingsPage.test.jsx` ;
- `src/i18n/translations.js` ;
- `src/i18n/translations.test.js` ;
- `src/services/tokenStorage.js` ;
- `src/services/documents.service.test.js` ;
- `backend/tasks/views.py` ;
- `backend/tasks/management/commands/archive_completed_tasks.py` ;
- `backend/tasks/tests.py` ;
- `backend/core/settings.py` ;
- `compose.yaml` ;
- `.env.example` et `.env.production.example`.

## Gate

**Validé.** Les sept défauts de la Phase 9 sont corrigés, déjà couverts par une
phase de sécurité antérieure, ou retirés lorsqu’ils simulaient une capacité
inexistante. Le backend, le scheduler PostgreSQL et le frontend compilé sont
opérationnels.
