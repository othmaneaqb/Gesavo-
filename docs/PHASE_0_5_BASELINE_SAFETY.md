# Phase 0.5 — Baseline safety

Date : 11 août 2026  
Baseline source : commit `d41bc57`

## Résultat

Le filet de sécurité minimal est en place sans modification du code applicatif ni de ses contrats.

- 10 tests de caractérisation découverts ;
- 10 tests réussis ;
- durée observée : 2,741 secondes ;
- base de test : SQLite en mémoire créée et détruite par Django ;
- aucune donnée de `backend/db.sqlite3` utilisée ou modifiée par la suite de tests ;
- médias de test écrits dans un répertoire temporaire puis supprimés.

Commande de référence :

```powershell
cd backend
.\venv\bin\python.exe manage.py test --verbosity 2
```

## Scénarios couverts

Les tests sont regroupés dans `backend/users/tests.py` sous la classe `BaselineCharacterizationTests`.

| Scénario | Résultat |
|---|---|
| Login avocat et lecture du profil `LAWYER` | OK |
| Login assistant et lecture du profil `ASSISTANT` | OK |
| Clients : create, read, update, delete | OK |
| Dossiers : create, read, update, delete | OK |
| Tâche : création, complétion, `completed_at`, restauration | OK |
| Audience : création | OK |
| Document : upload multipart, contenu et auteur | OK |
| Notes : création, auteur automatique et mise à jour | OK |
| Accès Finance avocat | HTTP 200 |
| Accès Finance assistant | HTTP 403 |

Ces tests caractérisent volontairement le comportement actuel. Ils ne corrigent pas encore les failles et limitations consignées dans le rapport de Phase 0.

## Sauvegarde externe de SQLite

Une copie binaire de la base courante a été créée hors du dépôt Git avant toute future suppression de `db.sqlite3` du suivi.

| Élément | Valeur |
|---|---|
| Source | `C:\Users\pc\Documents\pip\Gesavo-\backend\db.sqlite3` |
| Sauvegarde | `C:\Users\pc\Documents\Gesavo-backups\db.sqlite3.20260811-185054.bak` |
| Taille | 278 528 octets |
| SHA-256 | `15B0A7E7F65CB10DBDC30A537692022AAE945FF30AD0739169C72DEFFDBD6C40` |
| Correspondance source/copie | Oui |

La sauvegarde se trouve dans `C:\Users\pc\Documents\Gesavo-backups`, qui est extérieur à la racine du projet.

## Gate

Le sous-gate Phase 0.5 est validé : les comportements essentiels demandés disposent maintenant d'un filet de sécurité automatisé et la base locale possède une sauvegarde externe vérifiée.

Avant de commencer les changements d'architecture, il reste prudent de :

1. conserver la sauvegarde externe jusqu'à validation complète de la migration ;
2. exécuter ces 10 tests avant et après chaque lot de modifications ;
3. ajouter chaque nouveau test de non-régression avant de corriger une faille identifiée ;
4. ne retirer `db.sqlite3` de Git qu'après validation explicite du plan de nettoyage.
