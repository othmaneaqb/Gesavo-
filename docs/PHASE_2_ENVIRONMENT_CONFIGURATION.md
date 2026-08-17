# Phase 2 — Environment configuration

Date : 11 août 2026

## Result

Django and React no longer depend on hardcoded development configuration for
deployment. The application now has explicit development and production
profiles, environment validation, secure production defaults, and a
build-time frontend API contract.

The production profile passes `python manage.py check --deploy` with no
warnings.

## Environment profiles

| Setting | Development | Production |
|---|---|---|
| `DJANGO_ENVIRONMENT` | `development` | `production` |
| `DEBUG` default | enabled | disabled and cannot be enabled |
| Secret | required outside tests | required, minimum 50 characters, rejects placeholders and `django-insecure-` |
| Allowed hosts | explicit local list | required non-empty list |
| CORS | explicit local origins | explicit production origins |
| CSRF trusted origins | explicit local origins | explicit HTTPS origins |
| HTTPS redirect | disabled | enabled |
| Session cookie secure | disabled | enabled |
| CSRF cookie secure | disabled | enabled |
| HSTS | disabled | 31,536,000 seconds |
| HSTS subdomains | disabled | enabled |
| HSTS preload | disabled | enabled |
| Frontend reset URL | local default | required |
| Email backend | console | SMTP |

Tests use their isolated test key and do not inherit production HTTPS redirects.

## Django configuration contract

### Required in production

- `DJANGO_ENVIRONMENT=production`
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=false`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `FRONTEND_URL`
- production SMTP values when password reset email is enabled

### HTTPS and proxy settings

Production defaults enable HTTPS redirect, secure cookies, one-year HSTS,
subdomains, and preload. These values can be overridden through the documented
`DJANGO_SECURE_*` variables.

`DJANGO_TRUST_X_FORWARDED_PROTO=true` must only be used behind a trusted reverse
proxy that strips client-provided forwarding headers and sets
`X-Forwarded-Proto` itself. Otherwise, it remains disabled.

HSTS preload should be deployed only after HTTPS is confirmed for every current
and future subdomain. The explicit production profile makes this decision
visible in `.env.production.example`.

## CORS and CSRF

- wildcard CORS remains disabled;
- CORS origins come only from `DJANGO_CORS_ALLOWED_ORIGINS`;
- trusted CSRF origins come only from `DJANGO_CSRF_TRUSTED_ORIGINS`;
- cross-origin credential cookies are disabled because the API currently uses
  bearer JWT authentication.

## Frontend API URL

`src/services/api.js` reads `REACT_APP_API_URL` at build time.

- if defined, the value is normalized with a trailing slash;
- if omitted, React uses the same-origin `/api/` path;
- localhost is no longer embedded in the JavaScript source;
- split-domain deployments must set the variable before `npm run build`.

## Templates

- `.env.example`: local development values;
- `.env.production.example`: production checklist with placeholders only;
- real `.env` variants remain ignored by Git.

No real secret is stored in either template.

## Validation evidence

### Django production profile

`manage.py check --deploy` returned:

```text
System check identified no issues (0 silenced).
```

The inspected effective production values were:

- `DEBUG=False`;
- wildcard CORS disabled;
- explicit hosts, CORS and CSRF origin lists;
- HTTPS redirect enabled;
- session and CSRF secure cookies enabled;
- HSTS 31,536,000 seconds;
- HSTS subdomains and preload enabled.

### Regression safety

- Django characterization tests: 10 found, 10 passed;
- frontend production build: compiled successfully;
- frontend default API path during the build: `/api/`.

## Deployment checklist

1. Put production values in the deployment secret manager, not in Git.
2. Replace every placeholder from `.env.production.example`.
3. Confirm DNS and HTTPS for all hosts and subdomains before enabling HSTS
   preload in the live environment.
4. Set `REACT_APP_API_URL` before building when Django is not served under the
   frontend origin.
5. Run `python manage.py check --deploy` in the exact deployment environment.
6. Run the 10 characterization tests and `npm run build` before release.
