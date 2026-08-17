# Phase 4 — Sécurité de l’authentification et des utilisateurs

Date : 11 août 2026

> Mise à jour Phase 5 : le logout backend, la rotation et la blacklist des
> refresh tokens sont maintenant opérationnels. Voir
> [`PHASE_5_JWT_LIFECYCLE.md`](./PHASE_5_JWT_LIFECYCLE.md).

## Résultat

Les vulnérabilités critiques identifiées dans la gestion des comptes sont
corrigées. La suite complète contient désormais 21 tests PostgreSQL : les 10
tests de caractérisation historiques et 11 tests de sécurité supplémentaires.
Les 21 tests réussissent.

Le rôle `ADMIN` est désormais distinct du rôle métier `LAWYER`. Un avocat
ordinaire conserve l’accès Finance mais ne peut plus lister, créer, modifier,
promouvoir, désactiver, supprimer ou réinitialiser le mot de passe d’un autre
compte.

## Vulnérabilité `ManagedUserSerializer.update()`

### Avant

Le serializer ne redéfinissait pas `update()`. DRF affectait donc directement
la chaîne reçue au champ `password`. L’API répondait HTTP 200, mais la valeur
n’était pas transformée en hash Django. Le nouveau mot de passe ne pouvait
ensuite pas authentifier l’utilisateur.

### Après

`ManagedUserSerializer.update()` :

1. retire `password` des champs écrits par le serializer générique ;
2. met à jour les autres champs ;
3. appelle `user.set_password(password)` ;
4. sauvegarde uniquement le hash produit.

Le test d’exploitation vérifie que la valeur brute n’est pas stockée, que
`check_password()` accepte le nouveau secret, que l’ancien login échoue et que
le nouveau login réussit.

## Matrice des rôles

| Capacité | ADMIN | LAWYER | ASSISTANT |
|---|---:|---:|---:|
| Fonctions juridiques existantes | Oui | Oui | Oui |
| Finance | Oui | Oui | Non, HTTP 403 |
| Lister les comptes | Oui | Non, HTTP 403 | Non, HTTP 403 |
| Créer un compte | Oui | Non, HTTP 403 | Non, HTTP 403 |
| Modifier un compte | Oui | Non, HTTP 403 | Non, HTTP 403 |
| Modifier un rôle | Oui | Non, HTTP 403 | Non, HTTP 403 |
| Réinitialiser un mot de passe tiers | Oui | Non, HTTP 403 | Non, HTTP 403 |
| Supprimer un compte | Oui | Non, HTTP 403 | Non, HTTP 403 |

Le superutilisateur Django reste un compte d’urgence. Il est toujours représenté
avec le rôle `ADMIN`. Un administrateur applicatif qui n’est pas superutilisateur
ne voit pas et ne peut pas cibler un superutilisateur via l’API.

Un administrateur ne peut pas se rétrograder, se désactiver ou supprimer son
propre compte via l’API, ce qui évite un verrouillage accidentel immédiat.

## Migration des rôles

La migration `users.0002_add_admin_role` :

- ajoute `ADMIN` aux choix du modèle ;
- conserve `LAWYER` et `ASSISTANT` ;
- promeut vers `ADMIN` les comptes existants `is_staff` ou `is_superuser`.

Résultat observé sur PostgreSQL :

| Compte historique | Avant | Après |
|---|---|---|
| Superutilisateur/staff | `LAWYER` | `ADMIN` |
| Avocat ordinaire | `LAWYER` | `LAWYER` |
| Assistant | `ASSISTANT` | `ASSISTANT` |

La migration ne modifie ni les mots de passe, ni les données clients, dossiers,
tâches, audiences, documents ou finance.

## Validation des mots de passe

Toutes les voies applicatives utilisent maintenant
`django.contrib.auth.password_validation.validate_password()` avec le compte
cible ou un utilisateur candidat :

- création via `/api/users/manage/` ;
- création via `/api/users/register/` ;
- modification via `ManagedUserSerializer` ;
- reset administratif `/api/users/manage/{id}/reset-password/` ;
- confirmation publique `/api/users/password-reset/confirm/` ;
- commande locale `seed_demo`.

Les validateurs actifs sont :

- similarité avec les attributs utilisateur ;
- longueur minimale de 12 caractères ;
- liste Django des mots de passe courants ;
- refus des mots de passe entièrement numériques.

La confirmation publique vérifie d’abord la concordance des deux champs, puis
la validité du compte et du token, puis la force du nouveau mot de passe. Un
échec ne modifie pas le hash existant.

## Révocation des sessions JWT

SimpleJWT inclut maintenant une empreinte du hash de mot de passe dans les
tokens. Après une modification ou une réinitialisation :

- un access token émis avant le changement retourne HTTP 401 ;
- un refresh token émis avant le changement retourne HTTP 401 ;
- seul un nouveau login avec le nouveau mot de passe crée une session valide.

Un serializer de refresh dédié effectue le contrôle avant d’émettre un nouvel
access token.

## Interface React

- Finance est visible pour `ADMIN` et `LAWYER` ;
- Settings/gestion d’équipe est visible uniquement pour `ADMIN` ;
- `ADMIN` est disponible dans les sélecteurs de rôle administratifs ;
- les contrôles de rôle et d’activation du compte courant sont désactivés ;
- les formulaires de reset exigent au moins 12 caractères côté client ;
- les erreurs détaillées des validateurs backend sont affichées sur la page de
  confirmation du reset.

Ces contrôles frontend améliorent l’expérience, mais les décisions de sécurité
restent imposées par Django.

## Preuves de validation

### Tests de sécurité

11 tests PostgreSQL réussis couvrent :

1. refus complet de l’administration pour un avocat ;
2. refus de l’administration pour un assistant ;
3. création ADMIN avec hash correct et login fonctionnel ;
4. refus d’un mot de passe faible sur les deux endpoints de création ;
5. correction de `ManagedUserSerializer.update()` ;
6. modification de rôle par ADMIN et accès Finance ADMIN ;
7. protection contre auto-rétrogradation, auto-désactivation et auto-suppression ;
8. protection du superutilisateur contre un ADMIN ordinaire ;
9. refus d’un mot de passe faible lors du reset administratif ;
10. refus d’un mot de passe faible lors du reset public ;
11. reset fort fonctionnel avec révocation des anciens JWT.

### Suite complète

```text
Found 21 test(s).
.....................
Ran 21 tests in 10.915s
OK
```

La base `test_gesavo` a été créée puis détruite par Django sur PostgreSQL.

### Frontend

`npm run build` compile avec succès. Le seul message restant concerne les
données locales Browserslist âgées de six mois ; il ne bloque pas le build.

## Fichiers principaux modifiés ou ajoutés

- `backend/users/models.py` ;
- `backend/users/migrations/0002_add_admin_role.py` ;
- `backend/users/permissions.py` ;
- `backend/users/serializers.py` ;
- `backend/users/views.py` ;
- `backend/users/urls.py` ;
- `backend/users/test_security.py` ;
- `backend/users/management/commands/seed_demo.py` ;
- `backend/finance/permissions.py` ;
- `backend/finance/views.py` ;
- `backend/core/settings.py` ;
- `src/app/App.jsx` ;
- `src/app/routes.jsx` ;
- `src/features/auth/pages/ResetPasswordPage.jsx` ;
- `src/features/settings/pages/SettingsPage.jsx` ;
- `src/i18n/translations.js` ;
- `README.md`.

## Risques restant hors Phase 4

- le login et la demande d’e-mail de reset n’ont pas encore de throttling
  applicatif dédié ;
- l’adresse e-mail n’est pas encore contrainte comme identifiant unique ;
- ~~le logout supprimait uniquement les tokens côté navigateur~~ — résolu en
  Phase 5 par rotation, blacklist et endpoint backend ;
- le contrôle 2FA visible dans Settings reste une maquette sans backend.

Ces points doivent être traités dans une phase d’authentification avancée. Ils
ne réintroduisent pas la faille de hash, l’escalade LAWYER ou l’acceptation de
mots de passe faibles corrigées ici.

## Gate

**Validé.** Les rôles cibles sont actifs, les mots de passe sont correctement
hashés et validés, les anciens JWT sont révoqués après changement, et un avocat
ordinaire ne peut plus administrer ou promouvoir des utilisateurs.
