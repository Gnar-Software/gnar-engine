import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { config, logger } from '@gnar-engine/core';

let sesClient = null;

export const sesService = {

    /**
     * A setting that is present but says nothing counts as absent. An unset key
     * in a yaml secrets file arrives as the four character string 'null', which
     * is perfectly truthy: the guard below waved it through, a client was built
     * on it, and the first anyone knew was a 403 from AWS saying the security
     * token was invalid. Fail here instead, naming what is missing.
     */
    isBlank(value) {
        const text = String(value ?? '').trim().toLowerCase();
        return text === '' || text === 'null' || text === 'undefined';
    },

    init() {
        try {
            const transport = config.email?.transport || 'log';
            const aws = config.aws || {};

            if (transport === 'log') {
                logger.info('Email transport initialised in log mode. Real email delivery disabled.');
                return;
            }

            if (transport !== 'ses') {
                throw new Error(`Unsupported email transport: ${transport}`);
            }

            const missing = ['accessKeyId', 'secretAccessKey', 'region']
                .filter((key) => this.isBlank(aws[key]));

            if (missing.length) {
                throw new Error(`SES transport selected but AWS ${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} missing`);
            }

            sesClient = new SESClient({
                region: aws.region,
                credentials: {
                    accessKeyId: aws.accessKeyId,
                    secretAccessKey: aws.secretAccessKey,
                    sessionToken: aws.sessionToken,
                },
            });

            logger.info('Email transport initialised in SES mode');
        } catch (error) {
            logger.error(error, 'Error initializing SES client');
        }
    },

    async sendEmail({ from, to, replyTo, subject, html, text, cc = [], bcc = [], attachments = [] }) {
        const transport = config.email?.transport || 'log';
        const environment = config.environment || 'development';
        const isProduction = environment === 'production';
        const overrideTo = config.email?.overrideTo?.trim();
        const originalTo = this.normalizeAddresses(to);
        const finalTo = (!isProduction && overrideTo) ? [overrideTo] : originalTo;
        const finalCc = (!isProduction && overrideTo) ? [] : this.normalizeAddresses(cc);
        const finalBcc = (!isProduction && overrideTo) ? [] : this.normalizeAddresses(bcc);

        if (transport === 'log') {
            logger.info({
                from,
                to: finalTo,
                cc: finalCc,
                bcc: finalBcc,
                replyTo,
                subject,
                html,
                text,
                attachments: attachments.map((attachment) => ({
                    fileName: attachment.fileName,
                    contentType: attachment.contentType,
                    size: attachment.size || attachment.content?.length || 0,
                })),
                originalTo: finalTo.join(',') !== originalTo.join(',') ? originalTo : undefined,
            }, 'DEV EMAIL (NOT SENT)');

            return { messageId: 'log-dev-id' };
        }

        if (!sesClient) {
            throw new Error('SES transport selected but SES client is not initialised');
        }

        const command = attachments.length
            ? new SendRawEmailCommand({
                Source: from,
                Destinations: [...finalTo, ...finalCc, ...finalBcc],
                RawMessage: {
                    Data: Buffer.from(this.buildRawEmail({
                        from,
                        to: finalTo,
                        cc: finalCc,
                        bcc: finalBcc,
                        replyTo,
                        subject,
                        html,
                        text,
                        attachments,
                    }))
                },
            })
            : new SendEmailCommand({
                Source: from,
                Destination: {
                    ToAddresses: finalTo,
                    CcAddresses: finalCc,
                    BccAddresses: finalBcc,
                },
                // A reply goes wherever the notification asked, not to the
                // address it was sent from, which nobody reads
                ReplyToAddresses: this.normalizeAddresses(replyTo),
                Message: {
                    Subject: { Data: subject },
                    Body: {
                        Html: { Data: html },
                        Text: { Data: text || '' },
                    },
                },
            });

        if (finalTo.join(',') !== originalTo.join(',')) {
            logger.info({
                originalTo,
                overrideTo: finalTo,
                environment,
            }, 'Email recipient override active');
        }

        const response = await sesClient.send(command);

        return {
            ...response,
            messageId: response?.MessageId ?? response?.messageId ?? null,
        }
    },

    // Normalize single or multiple email addresses into an array.
    normalizeAddresses(addresses) {
        if (!addresses) {
            return [];
        }

        return Array.isArray(addresses) ? addresses.filter(Boolean) : [addresses].filter(Boolean);
    },

    // Keep raw MIME headers on one line.
    sanitizeHeaderValue(value = '') {
        return String(value).replace(/[\r\n]+/g, ' ').trim();
    },

    // Fold base64 content to MIME-friendly line lengths.
    foldBase64(value) {
        return String(value).replace(/.{1,76}/g, '$&\r\n').trim();
    },

    // Build a raw MIME email when attachments are present.
    buildRawEmail({ from, to, cc = [], bcc = [], replyTo, subject, html, text, attachments = [] }) {
        const mixedBoundary = `mixed-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const alternativeBoundary = `alternative-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const headers = [
            `From: ${this.sanitizeHeaderValue(from)}`,
            `To: ${this.normalizeAddresses(to).map((address) => this.sanitizeHeaderValue(address)).join(', ')}`,
            ...(this.normalizeAddresses(cc).length ? [`Cc: ${this.normalizeAddresses(cc).map((address) => this.sanitizeHeaderValue(address)).join(', ')}`] : []),
            ...(this.normalizeAddresses(replyTo).length ? [`Reply-To: ${this.normalizeAddresses(replyTo).map((address) => this.sanitizeHeaderValue(address)).join(', ')}`] : []),
            `Subject: ${this.sanitizeHeaderValue(subject)}`,
            'MIME-Version: 1.0',
            `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
        ];

        const parts = [
            ...headers,
            '',
            `--${mixedBoundary}`,
            `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
            '',
            `--${alternativeBoundary}`,
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            this.foldBase64(Buffer.from(text || '', 'utf8').toString('base64')),
            '',
            `--${alternativeBoundary}`,
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            this.foldBase64(Buffer.from(html || '', 'utf8').toString('base64')),
            '',
            `--${alternativeBoundary}--`,
        ];

        for (const attachment of attachments) {
            const fileName = this.sanitizeHeaderValue(attachment.fileName || 'attachment');
            const contentType = this.sanitizeHeaderValue(attachment.contentType || 'application/octet-stream');
            const contentBase64 = attachment.contentBase64 || (
                Buffer.isBuffer(attachment.content)
                    ? attachment.content.toString('base64')
                    : Buffer.from(attachment.content || '').toString('base64')
            );

            parts.push(
                '',
                `--${mixedBoundary}`,
                `Content-Type: ${contentType}; name="${fileName}"`,
                'Content-Transfer-Encoding: base64',
                `Content-Disposition: attachment; filename="${fileName}"`,
                '',
                this.foldBase64(contentBase64)
            );
        }

        parts.push('', `--${mixedBoundary}--`, '');

        return parts.join('\r\n');
    },
}