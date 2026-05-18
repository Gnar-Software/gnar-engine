# Notification Service Documentation

## Overview

The notification service uses a parent-child model.

- The parent `notifications` record stores the shared notification fields.
- The notification `type` determines which child handler receives the remaining payload.
- Callers should create notifications through `notificationService.createNotifications`, not by creating the child record first.

Supported notification types:

| Type | Child table | Child create command |
|---|---|---|
| `email` | `email_notifications` | `notificationService.createEmailNotifications` |
| `stored` | `stored_notifications` | `notificationService.createStoredNotifications` |

## Main Create Flow

Every notification should be created from the parent command:

```javascript
const notifications = await commands.execute('notificationService.createNotifications', {
    notifications: [
        {
            type: 'email',
            userId: user.id,
            emailAddress: 'exampleToEmail@gnar.co.uk',
            fromEmail: 'example@gnar.co.uk',
            subjectLine: 'This is a Subject Line',
            templateSlug: 'template-slug',
            templateData: {
                exampleData
            },
        }
    ],
});
```

### What `createNotifications` does

For each item in `notifications`:

1. Extracts the parent fields:
   - `type`
   - `userId`
2. Treats every other field as child notification data.
3. Validates the parent notification payload.
4. Creates the parent `notifications` row.
5. Maps the remaining data to the child command based on `type`.
6. Passes the child payload together with the generated `notificationId`.
7. Returns the created parent and child data merged into one response item.

### Type routing

```text
email  -> notificationService.createEmailNotifications
stored -> notificationService.createStoredNotifications
```

### Important usage note

When creating a notification, send the full payload to the parent command. The parent handler is responsible for splitting the shared fields from the type-specific fields and dispatching to the correct child notification command.

## Parent Commands

### `notificationService.createNotifications`

Creates one or more notifications from the parent level.

Payload:

```javascript
{
    notifications: [
        {
            type: 'email'  | 'stored',
            userId: 'uuid',

            // child-specific fields follow here
        }
    ]
}
```

Behavior:

- Parent validation errors are collected across all items.
- Valid items can still be created before the aggregated validation error is thrown.
- If an item only includes `type` and `userId`, only the parent record is created.

Returns:

- An array of merged notification objects.

### `notificationService.updateNotification`

Updates the parent notification and optionally forwards child data to the correct child update command based on the existing notification `type`.

Payload:

```javascript
{
    id: 'notification-id',
    data: {
        archived: true,

        // optional child update fields
    }
}
```

Behavior:

- The existing notification is loaded first.
- The handler updates the parent notification fields.
- Any remaining fields are forwarded to the child update command for the current notification type.

### `notificationService.archiveNotifications`

Archives multiple parent notifications by IDs.

Payload:

```javascript
{
    ids: ['notification-id-1', 'notification-id-2']
}
```

### `notificationService.deleteNotification`

Deletes a notification by parent ID.

## Email Notification Flow

Email notifications are currently created by the parent `createNotifications` command routing into `notificationService.createEmailNotifications`.

### Expected parent-level email payload

```javascript
{
    type: 'email',
    userId: 'uuid',
    emailAddress: ['user@example.com'],
    fromEmail: 'no-reply@example.com',
    subjectLine: 'Subject',
    content: '<p>HTML content</p>',
    templateSlug: 'template-slug',
    templateData: {
        any: 'data'
    },
    ccEmailAddresses: ['cc@example.com'],
    bccEmailAddresses: ['bcc@example.com'],
    toUserId: 'uuid'
}
```

### Current create behavior

`notificationService.createEmailNotifications` currently does the following:

1. Validates the email notification payload.
2. Requires either:
   - `content`, or
   - `templateSlug`
3. If `templateSlug` is supplied, it attempts to compile the template content using `templateData`.
4. Schedules `notificationService.sendEmailNotification` through `controlService.scheduleTask`.
5. Stores the email notification row in `email_notifications`.

### Current send behavior

`notificationService.sendEmailNotification`:

1. Loads the email notification by `id` or by latest `notificationId`.
2. Skips sending if the status is already `sent`.
3. Validates required email fields before sending.
4. Sends the email through the SES service.
5. Marks the record as:
   - `sent` on success
   - `failed` on error

### Email status lifecycle

```text
pending -> sent
pending -> failed
```

## Stored Notifications

Stored notifications are created through `notificationService.createNotifications`, then routed by `type: 'stored'` into `notificationService.createStoredNotifications`.

Typical parent payload:

```javascript
{
    type: 'stored',
    userId: 'uuid',
    content: {
        title: 'Notification title',
        body: 'Notification body'
    }
}
```

## HTTP Endpoints

The main parent notification endpoints are:

| Method | URL | Command |
|---|---|---|
| `GET` | `/notifications/:id` | `notificationService.getSingleNotification` |
| `GET` | `/notifications/` | `notificationService.getManyNotifications` |
| `POST` | `/notifications/` | `notificationService.createNotifications` |
| `POST` | `/notifications/:id` | `notificationService.updateNotification` |
| `POST` | `/notifications/archive/` | `notificationService.archiveNotifications` |
| `DELETE` | `/notifications/:id` | `notificationService.deleteNotification` |

## Summary

The current implementation expectation is:

- create notifications from the parent command
- send the full notification payload to the parent
- let the parent map remaining fields to the correct child notification type
- use `type` to decide whether the notification becomes an email or stored notification

For email notifications specifically, template-driven creation is expected to be initiated from the parent payload in the same way as direct-content creation.
```json
{
    "notifications": {
        "data": [],
        "pagination": {
            "pageSize": 20,
            "pageNum": 1,
            "total": 42
        }
    }
}
```

> `filters` must be passed as a JSON string — the controller calls `JSON.parse()` on it. `ids` is a comma-separated string — the controller calls `.split(',')` on it.

---

### POST `/notifications/`

Creates a single notification and its child record.

**Request Body:**
```json
{
    "notification": {
        "type": "email | stored",
        "userId": "uuid",
        "...typeSpecificFields": "..."
    }
}
```

> The controller wraps the single `notification` object into an array before passing to `createNotifications`, which accepts a batch. One record is created per HTTP call.

**Response `200`:**
```json
{
    "notifications": []
}
```

---

### POST `/notifications/:id`

Updates a notification and optionally its child record.

**URL Params:**

| Param | Type | Required |
|---|---|---|
| `id` | string (UUID) | yes |

**Request Body:**
```json
{
    "type": "email | stored",
    "userId": "uuid",
    "...typeSpecificFields": "..."
}
```

> The full request body is passed as `newNotificationData` to the `updateNotification` command.

**Response `200`:**
```json
{
    "notification": { }
}
```

---

### POST `/notifications/archive`

Archives multiple notifications by ID in a single call.

**Request Body:**
```json
{
    "ids": ["uuid-1", "uuid-2"]
}
```

> `ids` defaults to `[]` if not provided — passing an empty array is a no-op.

**Response `200`:**
```json
{
    "notifications": []
}
```

---

### DELETE `/notifications/:id`

Deletes a single notification and its child record (cascades via FK constraint).

**URL Params:**

| Param | Type | Required |
|---|---|---|
| `id` | string (UUID) | yes |

**Response `200`:**
```json
{
    "message": "Notification deleted"
}
```

---

## Validation Summary

| Handler | Validator | Required Fields |
|---|---|---|
| `createNotifications` (parent) | `validateNotification` | `type`, `userId` |
| `updateNotification` (parent) | `validateNotificationUpdate` | — |
| `createEmailNotifications` | `validateEmailNotification` | `notificationId`, `emailAddress`, `fromEmail`, `subjectLine`, `content` |
| `updateEmailNotification` | `validateEmailNotificationUpdate` | `status` |
| `createStoredNotifications` | `validateStoredNotification` | `notificationId`, `content` |
| `updateStoredNotification` | `validateStoredNotificationUpdate` | `status` |

---

## Error Handling

| Scenario | Error | Thrown at |
|---|---|---|
| Missing `id` on update | `400 Bad Request` | Top of handler |
| Record not found | `404 Not Found` | After DB lookup |
| Validation failure (create) | `400 Bad Request` | After loop completes (batched) |
| Validation failure (update) | `400 Bad Request` | Immediately |
| Unknown notification type | `logger.warn` | Switch default (no throw) |

---

## Status Enums Reference

| Type | Statuses |
|---|---|
| `email_notifications` | `pending`, `sent`, `failed` |
| `stored_notifications` | `unread`, `read`, `archived` |
