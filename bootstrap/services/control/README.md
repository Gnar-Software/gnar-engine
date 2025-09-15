# Gnar Engine Control Service

- Used for scheduling and running tasks
- Used for service registry
- Used by the CLI

### Commands

Start dev server           npm start:dev
Start production server    npm start
Run tests                  npm test

### notes

Cron job runs:

Fetch due tasks from SQL (status = pending).
Push them to RabbitMQ.
Update the database status to queued.
Worker service processes tasks:

Listens for tasks in RabbitMQ.
Executes the task (e.g., calling another microservice).
On success, updates SQL status to completed.
On failure, updates SQL status to failed and may retry.
