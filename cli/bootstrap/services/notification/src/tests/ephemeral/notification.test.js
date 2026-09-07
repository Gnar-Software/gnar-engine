import { commands, test } from '@gnar-engine/core';
import { notification } from '../../services/notification.service.js';

/**
 * Notification command tests
 *
 * Every test prepares and clears its own data, so the order they run in and
 * whatever a previous test left behind make no difference to any of them.
 */

let createdNotificationIds = [];

test.beforeEach(async () => {
    createdNotificationIds = [];
});

test.afterEach(async () => {
    for (const id of createdNotificationIds) {
        await commands.execute('notificationService.deleteNotification', { id });
    }
});

/**
 * An email notification is stored as a parent row carrying the kind and a child
 * row carrying the address, the subject and the body. What comes back is the
 * two of them together, so the child's id is on 'id' and the parent's is on
 * 'notificationId'.
 */
test.run('createNotifications stores an email notification', async () => {
    const [created] = await commands.execute('notificationService.createNotifications', {
        notifications: [{
            type: 'email',
            emailAddress: 'someone@example.com',
            fromEmail: 'no-reply@example.com',
            subjectLine: 'Test notification',
            content: '<p>Test</p>'
        }]
    });

    test.assert(created, 'A notification should be returned');
    test.assert(created.notificationId, 'The email row should be stored against a parent notification');

    createdNotificationIds.push(created.notificationId);

    const parent = await notification.getById({ id: created.notificationId });

    test.assert(parent, 'The parent notification should be stored');
    test.assert(parent.type === 'email', 'The parent notification should be of type email');
});

/**
 * The same notification raised twice under one key is stored once. Nothing is
 * returned for the repeat, because a send that had already gone through is not
 * one to act on again.
 */
test.run('createNotifications does not store a repeat under the same key', async () => {
    const idempotencyKey = `test:${Date.now()}`;

    const notificationData = {
        type: 'email',
        idempotencyKey,
        emailAddress: 'someone@example.com',
        fromEmail: 'no-reply@example.com',
        subjectLine: 'Repeated notification',
        content: '<p>Test</p>'
    };

    const [first] = await commands.execute('notificationService.createNotifications', {
        notifications: [{ ...notificationData }]
    });

    test.assert(first, 'The first notification should be returned');

    createdNotificationIds.push(first.notificationId);

    const repeated = await commands.execute('notificationService.createNotifications', {
        notifications: [{ ...notificationData }]
    });

    test.assert(repeated.length === 0, 'A repeat should not be stored a second time');

    const stored = await notification.getByIdempotencyKey({ idempotencyKey });

    test.assert(stored, 'The first notification should still be stored under the key');
    test.assert(stored.id === first.notificationId, 'The key should still hold the first notification');
});

/**
 * A notification of a kind the service does not know is refused by the schema
 * rather than stored as something nothing can read back.
 */
test.run('createNotifications refuses an unknown notification type', async () => {
    let refused = false;

    try {
        await commands.execute('notificationService.createNotifications', {
            notifications: [{ type: 'carrier-pigeon' }]
        });
    } catch (err) {
        refused = true;
    }

    test.assert(refused, 'An unknown notification type should be refused');
});

/**
 * A template slug names a file in src/templates. A slug with no file behind it
 * throws rather than compiling to an empty body and sending a blank email.
 */
test.run('compileTemplate throws for a slug with no template behind it', async () => {
    let threw = false;

    try {
        await commands.execute('notificationService.compileTemplate', {
            templateSlug: 'a-template-that-does-not-exist',
            data: {}
        });
    } catch (err) {
        threw = true;
    }

    test.assert(threw, 'A missing template should throw rather than compile to nothing');
});
