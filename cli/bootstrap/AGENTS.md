# Repository Guidelines

## Project Structure & Module Organization

This repository is a Gnar Engine application. Service code lives in `services/<service>/src`, with a common shape across backend services:

- `app.js` boots the service.
- `config.js` contains service configuration.
- `commands/`, `controllers/`, `services/`, `schema/`, `policies/`, and `db/` hold business logic, HTTP/message entry points, validation/schema code, authorization, migrations, and seeders.
- `src/tests/` contains Jest tests, usually grouped by command or environment.

The React/Vite frontend, when present, usually lives in `services/portal`. Root files such as `deploy.localdev.yml`, `secrets.localdev.yml`, and environment files drive local and deployment configuration. Avoid committing real secrets.

The Gnar Engine core provides backend services with the following exports:

```js
export const { commands, http, message, db, schema, logger, error, utils, registerService, webSockets, test, storage, rabbit } = GnarEngine;
```

## Build, Test, and Development Commands

Use the Gnar Engine CLI to run the development environment:

- `gnar profile set-active`
- `gnar dev up --core-dev`

Use `deploy.localdev.yml` as the source of truth for local service ports and dependencies.

Do not write or execute tests unless specifically requested.

## Coding Style & Naming Conventions

Use ES modules (`"type": "module"`) and keep the existing four-space indentation style in backend JavaScript. Prefer `camelCase` in JavaScript and API payloads. Use `snake_case` only for MySQL column names inside SQL queries. Keep CRUD handlers database-architecture agnostic; relationship handling belongs in service/database interface code.

Name handlers, controllers, services, schemas, and policies after the entity or concern they implement, for example `account.handler.js`, `report.service.js`, or `project.policy.js`.

Use object encapsulation where appropriate.

Do not add helper functions in the file. Favor inline logic unless it is clearly reusable, then place it in a utils file.

Always add inline comments in handlers for key blocks.

Use the command bus pattern for business logic functions:

```js
commands.register('serviceName.commandName', callback() {});
commands.execute('serviceName.commandName', payload);
```

HTTP controller routes should be hyphenated and lowercase.

For JSX components, ensure helper functions are encapsulated in the component function, utilities are defined in separate utils files, and where possible state is implemented directly in the markup rather than aliased locally.

## Commit & Pull Request Guidelines

Use short, imperative or descriptive commit summaries. Keep commits focused on one service or feature where possible.

Pull requests should include a brief change summary, affected services, test results, and screenshots for portal UI changes. Link related issues or tasks when available and call out migrations, seeders, or configuration changes explicitly.
