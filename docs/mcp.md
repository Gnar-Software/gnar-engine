# MCP service

Every new project is bootstrapped with an MCP service. It exposes service
commands as MCP tools and registered schemas as MCP resources, over Streamable
HTTP at `POST /mcp/`. MCP clients such as Claude Code and Codex sign a Gnar
user in through the portal and call tools as that user.

## How signing in works

The MCP service is its own OAuth 2.1 authorization server. Clients identify
themselves with a Client ID Metadata Document (CIMD): the client id is an https
URL serving the client's name and redirect uris, so there is nothing to
register.

1. The client calls `POST /mcp/` with no token and gets a `401` whose
   `WWW-Authenticate` header points at
   `/.well-known/oauth-protected-resource/mcp`.
2. It reads that document and `/.well-known/oauth-authorization-server/mcp`,
   then opens the browser at `/mcp/oauth/authorize/` with PKCE (S256).
3. The MCP service fetches the client's CIMD document, checks the redirect uri
   (loopback redirects may use any port), stores the request and redirects to
   the portal at `/portal/oauth/consent`.
4. The user signs in to the portal if needed, and clicks Allow or Deny. The
   portal sends them back to the client with a one-use code, valid for 60
   seconds.
5. The client exchanges the code at `/mcp/oauth/token/` for an MCP auth token.

The token lives one day and there are no refresh tokens: the client signs in
again when it expires. Each token is stored as a SHA-256 hash in
`mcp_db.mcp_auth_tokens`, with the user, the client id and name, and when it
was last used. Deleting the row revokes it.

An MCP auth token only works on `POST /mcp/`. A portal session token is refused
there, and an MCP token is not a portal session anywhere else.

| Table | Holds |
|-------|-------|
| `oauth_transactions` | One sign-in, from `/authorize` until its code is exchanged |
| `mcp_auth_tokens` | Issued tokens, linked to the user, the client and the transaction |

## Connecting a client

The local stack serves MCP at `http://localhost/mcp`.

Claude Code:

```bash
claude mcp add --transport http gnar http://localhost/mcp
```

Then run `/mcp` in Claude Code, choose `gnar` and Authenticate.

Codex:

```bash
codex mcp add gnar --url http://localhost/mcp
codex mcp login gnar
```

Both open the portal to approve the sign-in.

## Exposing a command as a tool

Keep the MCP definition out of the command handler. Each entity has an MCP
module in `src/mcp/`, named after the handler: `user.handler.js` has
`mcp/user.mcp.js`. It exports one object, named `<entity>Mcp`, with a property
for each command the entity exposes. The property name is the command name
without the service prefix (`userService.getSingleUser` is `getSingleUser`),
and its value holds everything MCP needs to know about the command: title,
description, input schema, annotations and policy.

The policy lives in `policies/<entity>.mcp.policy.js`, next to the HTTP
policy, and exports `authoriseMcp`. The input schemas live in
`schema/<entity>.input.schema.js`.

```
src/
  commands/user.handler.js          the command, with no MCP detail
  mcp/user.mcp.js                   userMcp: title, description, schema, annotations, policy
  policies/user.mcp.policy.js       authoriseMcp: who may call it
  schema/user.input.schema.js       the tool's input schemas
```

```js
// policies/notification.mcp.policy.js
export const authoriseMcp = {

    /**
     * Authorise get single notification over MCP
     */
    getSingle: async ({ user, payload }) => {
        if (user.role !== 'service_admin') {
            throw new error.unauthorised('not authorised');
        }
    }
}
```

```js
// mcp/notification.mcp.js
import { authoriseMcp } from '../policies/notification.mcp.policy.js';
import { getSingleNotificationInputSchema } from '../schema/notification.input.schema.js';

export const notificationMcp = {

    getSingleNotification: {
        title: 'Get notification',
        description: 'Get a single notification by id.',
        inputSchema: getSingleNotificationInputSchema,
        annotations: { readOnlyHint: true },
        policy: authoriseMcp.getSingle
    }
};
```

Each entry takes these fields:

| Field | Required | What it is |
|-------|----------|------------|
| `description` | Yes | What the tool does and what it returns. The model reads this to decide when to call it, so be specific. |
| `inputSchema` | Yes | JSON Schema for the tool's arguments, from `schema/<entity>.input.schema.js`. The arguments are passed to the command as its payload. |
| `policy` | Yes | The `authoriseMcp` function that guards the command. Core strips it from the manifest and marks the entry `hasPolicy: true`. |
| `title` | No | Short display name shown by MCP clients. |
| `outputSchema` | No | JSON Schema for the result. When set, the result is also returned as structured content. |
| `annotations` | No | MCP hints for clients: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`. |
| `timeout` | No | How long the MCP service waits for the command, in ms. Defaults to 10000. |

No other fields are allowed: the MCP service skips a tool whose entry does not
match.

A fuller entry, for a command that changes data:

```js
updateUser: {
    title: 'Update user',
    description: 'Update a user by id. Only the provided fields in newUserData are changed. Emails must be unique. Returns the updated user.',
    inputSchema: updateUserInputSchema,
    annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false
    },
    timeout: 15000,
    policy: authoriseMcp.update
}
```

```js
// commands/notification.handler.js
import { notificationMcp } from '../mcp/notification.mcp.js';

commands.register('notificationService.getSingleNotification', async ({ id }) => {
    // ...
}, {
    mcp: notificationMcp.getSingleNotification
});
```

The handler only points at its entry. Commands that are not exposed have no
entry and no `mcp` option.

`user` is the signed-in user (`{ id, role }`) and `payload` is the tool's
arguments. Throwing refuses the call, and the client sees the message as an
error result.

The policy runs in the service that owns the command, before the handler, and
only for calls coming from MCP. Commands the handler calls in turn are trusted
internal calls and are not checked again.

A service sends its manifest (commands and schemas) to the control service when
it connects, as part of auto-registration, and the MCP service builds its tool
list from those manifests. There is nothing to call in `app.js`.

## Fail closed

- A command registered with an `mcp` block and no `mcp.policy` function throws
  at startup.
- Core keeps the policy out of the manifest and marks the command with
  `mcp.hasPolicy: true`. The MCP service only lists tools that have the marker,
  so a service on a core without policy checks never has its commands exposed.
- Calling a command over MCP that has no policy is refused.

This needs `@gnar-engine/core` 1.0.29 or later in every service that exposes
tools, and in the MCP service.
