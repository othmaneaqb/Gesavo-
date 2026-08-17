# Phase 8 — Sécurité documentaire

Date : 11 août 2026

## Résultat

L’upload multipart existant est conservé. La chaîne documentaire applique
désormais les contrôles suivants :

```text
Authentification
    ↓
Rôle, cabinet et périmètre objet
    ↓
Taille + extension autorisée
    ↓
Nom assaini + MIME déclaré + contenu réel
    ↓
Stockage privé sans URL publique
    ↓
Téléchargement protégé + audit
```

## Validation des uploads

La limite est configurée par `DOCUMENT_MAX_UPLOAD_SIZE_MB` et vaut 10 MB par
défaut. Les fichiers vides et ceux qui dépassent cette taille répondent HTTP
400 avant stockage.

Extensions autorisées :

- PDF : `.pdf` ;
- Word : `.doc`, `.docx` ;
- Excel : `.xls`, `.xlsx` ;
- PowerPoint : `.ppt`, `.pptx` ;
- documents texte : `.odt`, `.rtf`, `.txt`, `.csv` ;
- images : `.jpg`, `.jpeg`, `.png`.

L’extension seule n’est jamais suffisante. Le backend compare :

1. l’extension autorisée ;
2. le MIME déclaré par le client, sauf type binaire générique ;
3. la signature réelle du contenu ;
4. pour OOXML/ODT, la structure interne du conteneur ZIP.

Un PDF renommé en JPEG, une archive ordinaire renommée en DOCX ou un MIME
incompatible est refusé. Le fichier est relu depuis le début après validation,
ce qui préserve le comportement multipart de Django.

## Noms et métadonnées

Le nom original est normalisé en Unicode, débarrassé des chemins, caractères
de contrôle et caractères non sûrs. Les noms réservés Windows (`CON`, `NUL`,
`COM1` à `COM9`, etc.) sont neutralisés.

Chaque document conserve en lecture seule :

- `original_filename` assaini ;
- MIME détecté ;
- taille exacte ;
- empreinte SHA-256.

Le nom physique combine un UUID, un nom assaini et un chemin partitionné par
cabinet/année/mois. Le chemin physique et le champ `file` ne sont jamais
retournés par l’API.

## Stockage privé

`PrivateDocumentStorage` utilise `DJANGO_PRIVATE_DOCUMENT_ROOT` et refuse de
produire une URL publique. Les permissions demandées au système sont `0700`
pour les répertoires et `0600` pour les fichiers.

En développement Docker, Compose monte le volume nommé :

```text
gesavo_private_documents → /private-documents
```

Le volume est distinct du bind mount du code et du volume PostgreSQL. En
production, `DJANGO_PRIVATE_DOCUMENT_ROOT` est obligatoire et Django refuse
qu’il soit identique à l’ancien `MEDIA_ROOT`.

L’ancienne route publique `/media/` reste absente. Un reverse proxy ne doit
servir ni le stockage privé ni `backend/media`.

## Téléchargement et permissions objet

Route unique :

```text
GET /api/documents/{id}/download/
```

Le téléchargement passe par le même queryset filtré que la liste et le détail,
puis par `has_object_permission()`. Un utilisateur non authentifié reçoit HTTP
401. Une ressource hors cabinet ou hors affectation répond HTTP 404.

La réponse utilise le MIME détecté et le nom assaini, avec :

```text
Content-Disposition: attachment
Cache-Control: private, no-store
Pragma: no-cache
```

Un fichier manquant répond HTTP 404 sans divulguer son chemin.

## Audit documentaire

Les actions API suivantes créent un `DocumentAuditLog` :

- `CREATE` ;
- `UPDATE`, y compris le remplacement du fichier ;
- `DOWNLOAD` ;
- `DELETE`.

Une trace contient le cabinet, l’acteur, le client/dossier, l’identifiant
historique du document, le nom, le MIME, la taille, le SHA-256, les états avant
et après, l’adresse IP, l’agent utilisateur et la date.

L’audit est consultable en lecture seule :

```text
GET /api/documents/audit/
GET /api/documents/audit/{id}/
```

L’administrateur voit son cabinet, l’avocat son périmètre juridique et
l’assistant uniquement ses propres actions. Les méthodes `save()` et `delete()`
refusent de modifier une trace existante, et l’administration Django est en
lecture seule. Comme pour l’audit Finance, il s’agit d’un journal applicatif :
les accès PostgreSQL privilégiés doivent rester strictement limités.

Les écritures documentaires et leur audit sont atomiques. En cas d’échec, un
nouveau fichier déjà écrit est nettoyé. Un remplacement ou une suppression ne
retire l’ancien fichier qu’après validation de la transaction PostgreSQL.

## Migration des documents historiques

Migration appliquée :

```text
documents.0003_private_document_security
```

Avant migration, les 2 fichiers réels ont été contrôlés :

| Document | Taille | Contenu détecté |
|---|---:|---|
| `AIT_ELHADJ_Ala_Eddine.pdf` | 79 187 octets | PDF |
| `2_الفن_و_الثقافة.pptx` | 58 971 octets | PowerPoint OOXML |

La migration est reprise-sûre et non atomique pour coordonner base et système
de fichiers. Pour chaque document elle :

1. valide le contenu historique ;
2. détermine le cabinet canonique ;
3. copie vers le stockage privé ;
4. vérifie le SHA-256 de la copie ;
5. met à jour PostgreSQL ;
6. supprime ensuite seulement la source héritée.

Après migration, les 2 fichiers existent dans le volume privé, leurs hashes
correspondent aux métadonnées PostgreSQL et aucun fichier ne reste sous
`backend/media/documents`. Les anciennes copies supprimées ne sont plus
récupérables depuis ce répertoire ; les deux documents métier restent
disponibles dans `gesavo_private_documents`.

## Frontend

Le service transforme maintenant `original_filename`, `mime_type`, `size`,
`sha256` et surtout `download_url`. Le bouton de la liste générale comme ceux
des fiches client/dossier :

- appelle explicitement l’URL protégée avec Axios et le JWT ;
- reçoit un Blob ;
- utilise le nom original assaini ;
- désactive le bouton pendant le téléchargement ;
- affiche une erreur localisée si le téléchargement échoue ;
- révoque l’URL Blob temporaire après le clic.

## Preuves automatisées

Suite Django complète sur PostgreSQL :

```text
Found 52 test(s).
....................................................
Ran 52 tests in 17.427s
OK
```

Frontend :

```text
Test Suites: 3 passed, 3 total
Tests:       9 passed, 9 total
```

Le test frontend vérifie précisément que `fileUrl` est appelé, que la réponse
est demandée en Blob et que l’attribut `download` reçoit le nom assaini.

## Fichiers principaux

- `backend/documents/security.py` ;
- `backend/documents/storage.py` ;
- `backend/documents/models.py` ;
- `backend/documents/serializers.py` ;
- `backend/documents/services.py` ;
- `backend/documents/views.py` ;
- `backend/documents/tests.py` ;
- `backend/documents/migrations/0003_private_document_security.py` ;
- `backend/core/settings.py` ;
- `backend/core/access.py` ;
- `compose.yaml` ;
- `.env.example` et `.env.production.example` ;
- `src/services/documents.service.js` ;
- `src/services/documents.service.test.js` ;
- `src/features/documents/components/DocumentDownloadButton.jsx` ;
- `src/features/documents/components/DocRow.jsx` ;
- `src/features/documents/pages/DocumentsPage.jsx`.

## Gate

**Validé.** Upload multipart, limites, validation du contenu, stockage privé,
permissions objet, téléchargements, audit et frontend sont opérationnels sur
PostgreSQL. Les documents historiques ont été migrés avec vérification de leur
intégrité.
