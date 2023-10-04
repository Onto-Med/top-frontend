# Quasar App (top-frontend)

A Quasar Framework app

[![Lint](https://github.com/Onto-Med/top-frontend/actions/workflows/lint.yml/badge.svg)](https://github.com/Onto-Med/top-frontend/actions/workflows/lint.yml)

## Install the dependencies
The npm package `@onto-med/top-api` is currently located in a private GitHub Packages registry, thus requires authentication.

You can authenticate at GitHub via `npm login --scope=@onto-med --registry=https://npm.pkg.github.com` (if you use npm version 9 or higher, you must add the argument `--auth-type=legacy`).
You will be prompted for your username and password (personal access token).

```bash
yarn
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

You can specify the following environment variables via `.env` file or command line:

| variable name                     | default value          | description                                    |
| --------------------------------- | ---------------------- | ---------------------------------------------- |
| OAUTH2_ENABLED                    | false                  | Enable or disable authentication via Keycloak  |
| OAUTH2_URL                        | http://127.0.0.1:8081/ | Keycloak URL                                   |
| OAUTH2_REALM                      | top-realm              | Keycloak realm name                            |
| OAUTH2_CLIENT_ID                  | top-frontend           | Keycloak client id                             |
| API_URL                           | http://127.0.0.1:8080  | URL of top-backend                             |
| GDPR_NOTICE                       | false                  | Show GDPR notice                               |
| GDPR_POLICY_URL                   |                        | Policy URL that is linked from the GDPR notice |
| SYSTEM_NOTICE                     |                        | Text that should be displayed as system notice |
| DOCUMENTS_ENABLED                 | false                  | Enable or disable document search              |
| TOP_PHENOTYPIC_QUERY_DOC_BASE_URL | https://onto-med.github.io/top-phenotypic-query/care/smith/top/top_phenotypic_query/c2reasoner | This URL is used to generate deep links to functions and constants documentation |

### Lint the files
```bash
yarn run lint
```

### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).
