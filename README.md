# GesAvo

## Local setup

The repository does not contain runtime secrets, database data, uploaded media,
Python environments, or logs. PostgreSQL is the permanent development and
production database. Docker Compose is the recommended local runtime.

### Environment

Copy `.env.example` to `.env`, then replace every `replace-with-...` value.
Generate a unique Django key with:

```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Django intentionally refuses to start when its secret or PostgreSQL password
is missing. The two local database password variables in `.env` must contain
the same value. If port 5432 is already occupied, change both `POSTGRES_PORT`
and `DJANGO_DB_PORT` to the same free host port.

Use `.env.example` for local development and `.env.production.example` as the
deployment checklist. Production requires `DJANGO_ENVIRONMENT=production`, a
unique secret, explicit hosts, explicit CORS/CSRF origins, and `FRONTEND_URL`.
It enables HTTPS redirect, secure cookies, and one-year HSTS with subdomains
and preload by default.

Only enable `DJANGO_TRUST_X_FORWARDED_PROTO` when the application is behind a
trusted proxy that removes client-supplied `X-Forwarded-Proto` headers.

### PostgreSQL and backend with Docker

```powershell
docker compose up -d postgres
docker compose run --rm backend python manage.py migrate
docker compose up -d backend
```

PostgreSQL listens only on `127.0.0.1`. Django is available at
`http://127.0.0.1:8000`. `docker compose down` stops the services without
deleting the named `gesavo_postgres_data` volume.

The optional `seed_demo` command also requires unique
`GESAVO_DEMO_PASSWORD` and `GESAVO_ASSISTANT_PASSWORD` values in `.env`.
These passwords are checked with the same Django validators as API passwords.

To apply migrations and fill the configured database with the idempotent demo
dataset in one command, run from the project root:

```powershell
.\scripts\fill_db.ps1
```

Use `.\scripts\fill_db.ps1 -Mode local` when Django and PostgreSQL run directly
on the host. Pass `-SkipMigrations` only when the schema is already current.

### User roles and passwords

- `ADMIN` manages its cabinet, user accounts, legal records, and Finance;
- `LAWYER` accesses records it created or was assigned to, plus the related
  clients and Finance data, but cannot manage accounts;
- `ASSISTANT` sees assigned tasks/hearings and their authorized client/case
  context, cannot mutate clients/cases, and receives HTTP 403 for Finance and
  user management.

Every non-superuser belongs to exactly one cabinet. List endpoints use filtered
querysets and detail endpoints apply object permissions, so guessing another
cabinet's or another lawyer's object ID returns HTTP 404. Cross-cabinet foreign
keys and assignments are rejected by serializer validation. The Django
superuser is the only multi-cabinet break-glass account.

`GET /api/users/team/` provides a read-only, minimal directory of active members
in the current cabinet so tasks and hearings can be assigned without granting
user-administration access.

### Document security

Documents are stored outside public media in `DJANGO_PRIVATE_DOCUMENT_ROOT`.
Docker Compose persists them in the `gesavo_private_documents` volume with
restrictive file/directory permissions. Do not expose that directory or
`MEDIA_ROOT` through a reverse proxy, and do not run `docker compose down -v`
unless both PostgreSQL and private documents have been backed up.

Multipart uploads are limited to `DOCUMENT_MAX_UPLOAD_SIZE_MB` (10 MB by
default). The backend sanitizes filenames and validates the extension, browser
MIME declaration, and actual file signature/package before storing the file.
The supported formats are PDF, Word, Excel, PowerPoint, ODT, RTF, text, CSV,
JPEG, and PNG.

File paths are never exposed by the API. Authenticated downloads use
`GET /api/documents/{id}/download/`, which applies filtered querysets and object
permissions and returns non-cacheable attachments. Create, update, download,
and delete events are recorded in the immutable, cabinet-scoped journal at
`GET /api/documents/audit/`.

### Functional behavior

Completed tasks are archived after 48 hours by the dedicated `task-archiver`
Compose service. The retention and scheduler interval use
`TASK_ARCHIVE_AFTER_HOURS` and `TASK_ARCHIVE_INTERVAL_SECONDS`. API GET requests
never mutate task state; production environments that do not use Compose must
schedule `python manage.py archive_completed_tasks` themselves.

The login password visibility control is functional and accessible. Unchecked
**Remember me** keeps JWTs in `sessionStorage`; checked stores them in
`localStorage`. Calendar markers compare the complete year/month/day rather
than the day number alone.

The Settings screen exposes only working behavior: persisted browser language,
real user administration/password reset, and authenticated logout. Placeholder
firm profile, theme, notification preference, password-change, and 2FA controls
were removed until corresponding backend capabilities exist.

### Finance integrity

Finance keeps its `ADMIN`/`LAWYER` role gate and adds object ownership: lawyers
may read authorized client finance records but only modify records they created;
administrators can correct records within their cabinet. Amounts are strictly
positive in both serializers and PostgreSQL constraints, and a selected case
must belong to the selected client.

Invoice numbers are generated atomically from a per-cabinet, per-year sequence
using the format `CABINET-SLUG-YYYY-00001`. The same sequence is used by Invoice
records and ledger transactions of type `invoice`. Payments cannot overpay an
invoice and automatically move its status between `UNPAID`, `PENDING`, and
`PAID`.

Every Finance API create, update, and delete produces an immutable audit record.
Authorized administrators and lawyers can inspect their scoped history through
`GET /api/finance/audit/`; the endpoint is read-only and assistants receive
HTTP 403.

All API password creation and reset paths use Django's password validators.
Passwords must contain at least 12 characters and must also pass the common,
numeric, and user-similarity checks. Changing a password invalidates previously
issued access and refresh tokens.

### JWT lifecycle

- access tokens expire after 15 minutes by default;
- refresh tokens expire after one day, rotate on every use, and blacklist the
  token they replace;
- `/api/users/logout/` blacklists the active refresh token;
- Axios refreshes once for concurrent HTTP 401 responses, retries queued
  requests, and terminates the UI session if refresh fails;
- unchecked **Remember me** stores tokens in `sessionStorage`; checked stores
  them in `localStorage` for persistence across browser restarts.

The durations are configurable through `JWT_ACCESS_TOKEN_MINUTES` and
`JWT_REFRESH_TOKEN_DAYS`. Run Django's `flushexpiredtokens` command regularly
in production to remove expired blacklist records.

For a native backend instead of Docker, use a standard CPython 3.12+
installation, install `backend/requirements.txt`, start PostgreSQL, and run
`python manage.py migrate`. The historical MinGW Python environment is not
compatible with the official `psycopg-binary` wheels.

### Frontend

`REACT_APP_API_URL` controls the Django API origin. If it is omitted, the
frontend uses the same-origin `/api/` path. Create React App embeds this value
at build time, so production must set it before `npm run build` when the API is
hosted on another origin.

The application uses React Router with protected, role-aware routes and real
detail URLs such as `/clients/:clientId` and `/cases/:caseId`. API services and
stateful hooks live inside their features; only the data required by the active
route is loaded. Production hosting must serve `index.html` as the fallback for
frontend paths while keeping `/api/` routed to Django. See the
[Phase 11 architecture report](docs/PHASE_11_FRONTEND_ARCHITECTURE.md).

```powershell
npm ci
npm start
```

### Backend security and regression tests

```powershell
docker compose run --rm backend python manage.py test
```

The 70-test suite covers authentication, authorization, IDOR/cabinet
isolation, user administration, JWT lifecycle, uploads, business validation,
PostgreSQL contracts, and CRUD regressions. It creates and destroys a
PostgreSQL `test_gesavo` database. SQLite is available only for an explicit
non-production recovery/export operation by setting `DJANGO_DB_ENGINE=sqlite`
and `DJANGO_SQLITE_PATH`. See
[`docs/PHASE_10_FULL_SECURITY_BACKEND_TESTS.md`](docs/PHASE_10_FULL_SECURITY_BACKEND_TESTS.md)
for the coverage matrix and gate evidence.

## Create React App reference

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
