# Notification service

Every new project is bootstrapped with a notification service. It stores what
was raised, sends it, and records whether it went.

## The shape of a notification

A notification is a parent row saying what kind it is, and a child row per kind
holding the rest. The kinds a project stores are listed in
`config.notificationTypes`; `email` is the one shipped.

Splitting it this way means a second kind — an sms, a push, a message on a
websocket — is a child table, a schema, a service and a branch in
`createNotifications`, and nothing already stored has to change to make room.

| Table | Holds |
|-------|-------|
| `notifications` | The kind, the user it belongs to, and the idempotency key |
| `email_notifications` | The address, the subject, the compiled body and the send status |

## Raising one

```js
await commands.execute('notificationService.createNotifications', {
    notifications: [{
        type: 'email',
        idempotencyKey: emailNotification.idempotencyKeyFor({
            prefix: 'welcome',
            emailAddress: user.emailAddress,
            message: user.id
        }),
        emailAddress: user.emailAddress,
        fromEmail: config.email.from,
        subjectLine: 'Welcome',
        templateSlug: 'welcome',
        templateData: { firstName: user.firstName }
    }]
});
```

`type`, `userId` and `idempotencyKey` go on the parent row. Everything else is
handed to the handler for that kind. An email carries either its own `content`
or a `templateSlug` naming a template to compile it from.

What comes back is the two rows together: the child's id on `id`, the parent's
on `notificationId`.

## Repeats

A notification carrying an `idempotencyKey` that is already stored is not
written a second time. What happens instead depends on what became of the first
one: an email that failed is sent again on the record already stored, and one
that is pending or already gone is left alone.

`emailNotification.idempotencyKeyFor` builds a key from who the email goes to,
what it says, and which window of the clock it was raised in
(`config.idempotencyWindowMs`). The same email raised twice inside the window
lands on the same key, so a reader who clicks submit twice is sent one email.

The `prefix` separates two emails raised from the same source: a request and its
acknowledgement carry the same address and words but are not the same email.

## Sending

The send is a scheduled task on the control service rather than part of the
request that raised it, so a slow mail transport cannot hold up the form the
notification came from and a failed send can be retried centrally.

With the control service unreachable there is nothing left to carry the email,
so it is sent inline instead: a notification going missing because a second
service is down is worse than a slow reply to the form it came from.

## Transports

`config.email.transport` is `log` or `ses`.

- **log** writes the whole email to the service log and sends nothing. This is
  the default and is what a developer machine wants.
- **ses** sends through Amazon SES, and needs `AWS_REGION`,
  `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in the global block of the
  secrets file. A key that is present but empty counts as missing and is
  refused at start-up rather than at the first send.

Off production, `NOTIFICATION_EMAIL_OVERRIDE_TO` sends every email to one
address instead of its real recipient.

## Settings

Per service, in the `notification` block of `secrets.localdev.yml`:

| Key | Description |
|-----|-------------|
| `NODE_ENV` | `dev`, `test` or `production`. The recipient override is ignored on production |
| `EMAIL_TRANSPORT` | `log` or `ses` |
| `EMAIL_FROM` | The address emails are sent from |
| `EMAIL_OVERRIDE_TO` | Off production, the address every email goes to instead |

## Templates

Handlebars files in `src/templates`, named by the `templateSlug` on an email
notification and documented in `src/templates/docs.md`.

Handlebars escapes everything it prints, so a template never takes markup from a
caller. Anything with line breaks in it is passed as an array of lines and
walked with `{{#each}}` — a caller that can put markup into an email can put
markup into an email sent to someone else.

## A public route

The routes shipped are all behind a `service_admin` check. A project that opens
one to the public — an enquiry form, an unsubscribe link — has nobody to
authenticate, so everything an authorisation check would have done has to live
somewhere else:

- a rate limit of its own in `config.http`, named in the route's `config.rateLimit`
- a schema bounding every field, refusing anything it does not know
- no way for the request to change where the result goes: the recipient comes
  from the config, never from the body
