import assert from 'node:assert/strict';
import { sesService } from '../../services/ses.service.js';
import { config } from '../../config.js';

assert.notEqual(config.environment, 'production');

const result = await sesService.sendEmail({
    from: 'no-reply@example.com',
    to: 'test-recipient@example.com',
    subject: 'Guard test',
    html: '<p>test</p>',
    text: 'test'
});

assert.equal(result?.messageId, 'log-dev-id');
