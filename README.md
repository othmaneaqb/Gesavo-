# GesAvo

## Local setup

The repository does not contain runtime secrets, the SQLite database, uploaded
media, Python environments, or logs. Create those locally after cloning.

### Environment

Copy `.env.example` to `.env`, then replace every `replace-with-...` value.
Generate a unique Django key with:

```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Django intentionally refuses to start outside the test suite when
`DJANGO_SECRET_KEY` is missing.

Use `.env.example` for local development and `.env.production.example` as the
deployment checklist. Production requires `DJANGO_ENVIRONMENT=production`, a
unique secret, explicit hosts, explicit CORS/CSRF origins, and `FRONTEND_URL`.
It enables HTTPS redirect, secure cookies, and one-year HSTS with subdomains
and preload by default.

Only enable `DJANGO_TRUST_X_FORWARDED_PROTO` when the application is behind a
trusted proxy that removes client-supplied `X-Forwarded-Proto` headers.

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

The optional `seed_demo` command also requires unique
`GESAVO_DEMO_PASSWORD` and `GESAVO_ASSISTANT_PASSWORD` values in `.env`.

### Frontend

`REACT_APP_API_URL` controls the Django API origin. If it is omitted, the
frontend uses the same-origin `/api/` path. Create React App embeds this value
at build time, so production must set it before `npm run build` when the API is
hosted on another origin.

```powershell
npm ci
npm start
```

### Characterization tests

```powershell
cd backend
python manage.py test
```

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
