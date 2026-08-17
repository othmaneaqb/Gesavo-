# Phase 7 — Finance et validation métier

Date : 11 août 2026

## Résultat

La restriction de rôle existante a été conservée : seuls `ADMIN` et `LAWYER`
accèdent à Finance, tandis que `ASSISTANT` reçoit HTTP 403 sur transactions,
factures, paiements et audit.

Le domaine Finance applique maintenant les contrôles suivants :

```text
Rôle ADMIN / LAWYER
    ↓
Cabinet et client autorisés
    ↓
Propriétaire de l’écriture
    ↓
Relations client ↔ dossier
    ↓
Montant et règle de transaction
    ↓
Écriture atomique + journal d’audit
```

## Ownership et isolation cabinet

`Invoice`, `Payment` et `Transaction` enregistrent désormais `created_by` ainsi
que leurs timestamps techniques de création et modification.

- un administrateur peut consulter et corriger les écritures de son cabinet ;
- un avocat peut consulter les écritures des clients/dossiers auxquels il a
  accès ;
- un avocat ne peut modifier ou supprimer que les écritures dont il est le
  créateur ;
- une ressource d’un autre cabinet reste absente des listes et répond HTTP 404
  en accès direct ;
- un assistant conserve HTTP 403.

Le backfill a déterminé le propriétaire historique depuis le dossier ou le
créateur du client.

## Montants strictement positifs

Les trois ressources monétaires imposent `amount >= 0.01` dans le serializer et
`amount > 0` dans PostgreSQL :

- facture ;
- paiement ;
- transaction.

Les montants nuls ou négatifs répondent HTTP 400. Une écriture contournant
l’API est également refusée par une contrainte `CHECK` de la base.

Avant migration, la base réelle a été contrôlée : aucun montant non positif
n’était présent. La migration refuse explicitement de s’exécuter sur une autre
base contenant des montants invalides au lieu de les convertir silencieusement.

## Cohérence client et dossier

Pour une facture ou une transaction, le dossier sélectionné doit appartenir au
client sélectionné. Le contrôle existe :

- dans le queryset des relations du serializer ;
- dans la validation métier du serializer ;
- dans `clean()` sur le modèle ;
- dans le contrôle de pré-migration des données historiques.

Une relation étrangère au cabinet ou un couple client/dossier incohérent répond
HTTP 400 sans créer d’écriture.

## Transactions

Les règles de statut sont désormais déterministes et également garanties par
une contrainte PostgreSQL :

| Type | Statut autorisé |
|---|---|
| `invoice` | `outstanding` ou `paid` |
| `payment` | toujours `paid` |
| `expense` | aucun statut de paiement (`NULL`) |

Le type d’une transaction devient immuable après création. Une correction de
type doit se faire par annulation/suppression contrôlée puis nouvelle écriture,
afin de conserver une trace d’audit compréhensible.

## Factures et paiements

Un paiement ne peut pas faire dépasser le total payé au-dessus du montant de
la facture. La vérification conviviale du serializer est répétée sous verrou
PostgreSQL `SELECT … FOR UPDATE` dans une transaction atomique, ce qui protège
aussi contre deux paiements concurrents.

Le statut d’une facture est calculé depuis ses paiements :

- aucun paiement : `UNPAID` ;
- paiement partiel : `PENDING` ;
- montant entièrement payé : `PAID`.

Une facture ne peut pas être diminuée sous le total déjà payé. La création,
modification ou suppression d’un paiement recalcule le statut et audite le
changement induit sur la facture.

## Numérotation unique des factures

La numérotation suit le format :

```text
SLUG-CABINET-AAAA-00001
```

Exemple réel après migration :

```text
CABINET-PRINCIPAL-2026-00001
```

Une séquence `InvoiceSequence` existe pour chaque couple cabinet/année. La
génération verrouille la ligne de séquence et s’exécute dans la même transaction
que la création. Elle est partagée par :

- les objets `Invoice` ;
- les transactions de type `invoice` utilisées par l’interface actuelle.

Les champs `Invoice.number` et `Transaction.invoice_number` sont non éditables
et uniques. Deux appels ne peuvent donc ni réutiliser ni choisir arbitrairement
un numéro.

## Journal d’audit

Chaque création, modification et suppression effectuée par l’API crée un
`FinanceAuditLog` contenant :

- cabinet ;
- acteur ;
- client et dossier ;
- type et identifiant de la ressource ;
- action `CREATE`, `UPDATE` ou `DELETE` ;
- état JSON avant et après ;
- date technique.

Les écritures de paiement qui changent le statut d’une facture produisent aussi
une trace `UPDATE` de la facture. La suppression d’une facture journalise ses
paiements avant leur suppression en cascade.

Le journal est consultable en lecture seule sur :

```text
GET /api/finance/audit/
GET /api/finance/audit/{id}/
```

Il applique le rôle, le cabinet et le périmètre client. Les méthodes `save()`
et `delete()` refusent toute modification d’un enregistrement existant et
l’administration Django l’expose en lecture seule.

Le journal démarre avec cette phase : les données historiques sont backfillées
mais ne reçoivent pas de faux événements rétroactifs. Il s’agit d’un journal
applicatif immuable, pas encore d’un dispositif cryptographique append-only ;
les accès directs privilégiés à PostgreSQL doivent rester strictement limités.

## Migration PostgreSQL

Migration appliquée :

```text
finance.0004_finance_business_integrity
```

Elle réalise :

1. ajout des propriétaires et timestamps ;
2. ajout des séquences et numéros ;
3. validation des données existantes ;
4. normalisation des statuts de transaction ;
5. backfill des propriétaires et numéros ;
6. activation des contraintes `CHECK` ;
7. création du journal et de ses index.

Le backfill est une opération atomique séparée des DDL afin de respecter les
triggers différés PostgreSQL. La première tentative, entièrement annulée par
PostgreSQL, a permis d’identifier ce besoin avant l’application réussie.

État réel après migration :

```text
transaction historique:
  amount: 100.00
  type: invoice
  status: outstanding
  invoice_number: CABINET-PRINCIPAL-2026-00001
  created_by_id: 2

séquence 2026:
  next_value: 2
```

Les contraintes `finance_invoice_amount_positive`,
`finance_payment_amount_positive`, `finance_transaction_amount_positive` et
`finance_transaction_status_matches_type` sont présentes dans PostgreSQL.

## Frontend

Le formulaire Finance :

- impose un montant minimal de `0.01` avec deux décimales ;
- exige un client ;
- ne propose que les dossiers du client sélectionné ;
- force `paid` pour un paiement ;
- supprime le statut pour une dépense ;
- conserve le choix `outstanding/paid` uniquement pour une facture.

Les PDF de transactions de type facture affichent maintenant le numéro généré
par le backend, et non plus un numéro dérivé de l’identifiant React.

## Preuves automatisées

Neuf tests Finance dédiés couvrent :

- maintien du HTTP 403 assistant ;
- montants négatifs et nuls refusés par API et PostgreSQL ;
- isolation cabinet et cohérence client/dossier ;
- numérotation unique partagée et séquences séparées par cabinet ;
- lecture partagée mais modification limitée au propriétaire ;
- règles type/statut et immutabilité du type ;
- prévention des surpaiements ;
- recalcul du statut facture ;
- journal complet, immuable et isolé par cabinet.

Suite Django complète :

```text
Found 45 test(s).
.............................................
Ran 45 tests in 16.310s
OK
```

Frontend :

```text
Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
```

Le build React de production compile avec succès et `git diff --check` ne
signale aucune erreur de contenu.

## Fichiers principaux

- `backend/finance/models.py` ;
- `backend/finance/services.py` ;
- `backend/finance/serializers.py` ;
- `backend/finance/views.py` ;
- `backend/finance/tests.py` ;
- `backend/finance/migrations/0004_finance_business_integrity.py` ;
- `backend/core/access.py` ;
- `src/services/finance.service.js` ;
- `src/features/finance/modals/AddExpenseModal.jsx` ;
- `src/features/finance/pages/FinancePage.jsx`.

## Gate

**Validé.** Le contrôle de rôle existant est préservé. Ownership, isolation
cabinet, montants positifs, cohérence client/dossier, règles de transaction,
numérotation unique, paiements atomiques et audit fonctionnent sur PostgreSQL
et sont couverts par la suite automatisée.
