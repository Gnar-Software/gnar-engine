import { logger } from '../../services/logger.service.js';
import { emailSendingService, emailHeaderLogoUrl } from './../../config.js';
import { helpers } from '@gnar-engine/helpers';
import fs from 'fs';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import { getSesClient } from '../../services/ses.service.js';
import { SendEmailCommand } from '@aws-sdk/client-ses';


/**
 * Send a notification
 * 
 * @param {Object} params
 * @param {string} params.templateName - Name of the template file (without extension)
 * @param {string} params.to - Recipient email address
 * @param {Object} params.params - Parameters to be passed to the template
 * @param {string} params.subject - Subject of the email
 */
export const sendNotification = async ({ templateName, to, params, subject }) => {
    let source;
    let template;

    // get the requested template
    try {
        const workingDir = process.cwd();
        const path = workingDir + '/src/templates/' + templateName + '.hbs';    
        source = fs.readFileSync(path, 'utf8');
    } catch (error) {
        logger.error('Error reading template file: ' + error.message);
        throw new Error('Template not found');
    }

    // compile the template
    try {
        template = handlebars.compile(source);
    } catch (error) {
        logger.error('Error compiling template: ' + error.message);
        throw new Error('Template compilation failed');
    }

    // append other params
    params = prepareParams(params, templateName);

    // prepare the template
    const html = template(params);

    // send the email
    switch (emailSendingService) {
        case 'SMTP':
            await sendSmtpEmail({ to, subject, html });
            break;

        case 'SES':
            await sendSesEmail({ to, subject, html });
            break;

        case 'Direct':
            logger.error('Email sending service not implemented: ' + emailSendingService);
            throw new Error('Email sending service not implemented');
        
        default:
            logger.error('Invalid email sending service: ' + emailSendingService);
            throw new Error('Invalid email sending service');
    }
}

/**
 * Send SMTP email
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content of the email
 */
export const sendSmtpEmail = async ({ to, subject, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: `"Your App Name" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        logger.error('SMTP email send error: ' + error.message);
        throw new Error('SMTP email failed to send');
    }
}

/**
 * Send SES email
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content of the email
 */
export const sendSesEmail = async ({ to, subject, html }) => {
    try {
        const sesClient = getSesClient();

        const command = new SendEmailCommand({
            Source: process.env.NOTIFICATION_SES_SOURCE_EMAIL,
            Destination: {
                ToAddresses: [to]
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: html,
                        Charset: 'UTF-8'
                    }
                }
            }
        });

        await sesClient.send(command);
    } catch (error) {
        logger.error('Error sending email with SES: ' + error.message);
        throw new Error('SES email failed to send');
    }
}

/**
 * Prepare parameters for the template
 * 
 * @param {Object} params - Parameters to be passed to the template
 * @param {string} templateName - Name of the template file (without extension)
 * @returns {Object} - Prepared parameters
 */
const prepareParams = (params, templateName) => {

    // add shop logo
    params.logoUrl = emailHeaderLogoUrl;

    if (params.order?.currency) {
        params.currencySymbol = helpers.ecommerce.getCurrencySymbol(params.order.currency);
    }

    return params
}