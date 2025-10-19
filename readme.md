![Gnar Engine Logo](cli/assets/gnar-engine-logo-white.svg)

[![NPM Version](https://img.shields.io/npm/v/@gnar-engine/cli.svg)](https://www.npmjs.com/package/@gnar-engine/cli)
[![NPM Downloads](https://img.shields.io/npm/dt/@gnar-engine/cli.svg)](https://www.npmjs.com/package/@gnar-engine/cli)
[![License](https://img.shields.io/npm/l/@gnar-engine/cli.svg)](https://www.npmjs.com/package/@gnar-engine/cli)
[![Discord](https://img.shields.io/discord/1423275646804693012?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/VBh8QmU82X)

### What is Gnar Engine?

Gnar Engine is a micro-service, NodeJS, web-application development framework. Build modern, scalable & deeply AI integrated applications.

### Why Gnar Engine?

Ship microservices faster: Project bootstrap, prebuilt service templates with CLI scaffolding, database connections, logging, and migrations—so you spend less time wiring and more time building.

Built-in distributed power: Command bus, async RabbitMQ calls, and a real-time websocket mesh make multi-service communication effortless.

Inspectable & introspectable architecture: Our custom MCP protocol lets your agents see every command and schema, through service manifests at runtime—perfect for complex applications.

Modern container-first workflow: Local dev containers with ephemeral orchestration mean zero setup headaches. Works seamlessly with Docker, CI/CD, and cloud deployments.

AI-enabled for your users: Let end-users interact with your backend in natural language—no AI expertise required.

Opinionated, but flexible: Prescribed Node.js runtime, Fastify HTTP, MySQL/Mongo support, and command patterns mean conventions you can trust, with freedom where you need it.

### Get Started

Firstly install the Gnar Engine CLI using:
``` bash
curl -fsSL https://gnarengine.com/install.sh | bash
```

Create your first Gnar Engine project:
``` bash
gnar create project my-first-gnar-project
```

Ensure you have Docker & Docker Compose installed on your machine.
Start your Gnar Engine project:
``` bash
gnar dev up --build
```

