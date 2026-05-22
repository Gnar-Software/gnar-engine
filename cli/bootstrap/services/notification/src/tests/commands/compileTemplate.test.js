import assert from 'node:assert/strict';
import { compileNotificationTemplate } from '../../services/template.service.js';

const html = await compileNotificationTemplate({
    templateSlug: 'account-password-reset',
    data: {
        resetUrl: 'https://example.com/reset?token=abc',
        expiryHours: 24
    }
});

assert.equal(typeof html, 'string');
assert.ok(html.includes('Reset your password'));
assert.ok(html.includes('https://example.com/reset?token&#x3D;abc'));
assert.ok(!html.includes('undefined'));
