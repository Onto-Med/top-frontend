# Quasar App (top-frontend)

A Quasar Framework app

[![Lint](https://github.com/Onto-Med/top-frontend/actions/workflows/lint.yml/badge.svg)](https://github.com/Onto-Med/top-frontend/actions/workflows/lint.yml)

## Development

### Install the dependencies

1. Install [npm](https://www.npmjs.com/package/npm), [Yarn](https://classic.yarnpkg.com/lang/en/docs/install) and [Quasar CLI](https://quasar.dev/start/quasar-cli/),
or use the `.devcontainer/devcontainer.json` configuration to build a [Development Container](https://containers.dev/).

2. The npm package `@onto-med/top-api` is hosted in the GitHub Packages registry, thus requires authentication.

    1. Create a [personal access token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) at <https://github.com/settings/tokens> and give it access to `read:packages`.
    2. Optionally, export your token to the environment variable `NPM_AUTH_TOKEN`.
    3. Alternatively to the step above, you can authenticate at GitHub via `npm login --scope=@onto-med --auth-type=legacy --registry=https://npm.pkg.github.com`
       (if you use npm version 8 or lower, remove the argument `--auth-type=legacy`).
       You will now be prompted for your username and "password" (enter your personal access token, *not* your GitHub account password).
    4. For the devcontainer setup, you need to create a `.devcontainer/.env` file containing your GitHub personal access token (see `.devcontainer/.env.dist`)

3. Run `yarn` (skip this step in the devcontainer setup)

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
