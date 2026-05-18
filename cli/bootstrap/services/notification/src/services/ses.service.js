import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { config, logger } from '@gnar-engine/core';

let sesClient = null;

export const sesService = {

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

			if (!aws.accessKeyId || !aws.secretAccessKey) {
				throw new Error('SES transport selected but AWS credentials are missing');
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

	async sendEmail({ from, to, subject, html, text }) {
        const transport = config.email?.transport || 'log';
        const environment = config.environment || 'development';
        const isProduction = environment === 'production';
        const overrideTo = config.email?.overrideTo?.trim();
        const finalTo = (!isProduction && overrideTo) ? overrideTo : to;

        if (transport === 'log') {
            logger.info({
                from,
                to: finalTo,
                subject,
                html,
                text,
                originalTo: finalTo !== to ? to : undefined,
            }, 'DEV EMAIL (NOT SENT)');

            return { messageId: 'log-dev-id' };
        }

        if (!sesClient) {
            throw new Error('SES transport selected but SES client is not initialised');
        }

		const command = new SendEmailCommand({
            Source: from,
            Destination: {
                ToAddresses: [finalTo],
            },
            Message: {
                Subject: { Data: subject },
                Body: {
                    Html: { Data: html },
                    Text: { Data: text || '' },
                },
            },
		});

        if (finalTo !== to) {
            logger.info({
                originalTo: to,
                overrideTo: finalTo,
                environment,
            }, 'Email recipient override active');
        }

        const response = await sesClient.send(command);

        return {
            ...response,
            messageId: response?.MessageId ?? response?.messageId ?? null,
        }
    }
}
