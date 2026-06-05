# Gnar Engine Project

This project was scaffolded with the Gnar Engine CLI.

## Getting Started

Start the local development environment:

```bash
gnar dev up --build
```

Stop the local development environment:

```bash
gnar dev down
```

## Project Structure

- `deploy.localdev.yml` defines the local development services.
- `secrets.localdev.yml` stores local service secrets.
- `services/` contains the scaffolded application services.
- `data/` stores local development data.

## Creating Services

Create a new service:

```bash
gnar create service my-service
```

Create a new entity in an existing service:

```bash
gnar create entity my-entity --in-service my-service
```
