import { logger, db } from '@gnar-engine/core';

/**
 * Up
 */
export const up = async () => {
    logger.info('Creating table: notification_templates');

    await db.query(`
        CREATE TABLE IF NOT EXISTS notification_templates (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            version INT DEFAULT 1,
            latest BOOLEAN DEFAULT TRUE,

            name VARCHAR(255) NOT NULL,
            description VARCHAR(512),
            slug VARCHAR(255) NOT NULL,
            subject VARCHAR(512) NULL,
            content LONGTEXT NOT NULL,
            variables_schema JSON,
            data_resolvers JSON NULL,
            blocks JSON NULL,
            type VARCHAR(255) NULL,
            archived BOOLEAN DEFAULT FALSE,
            created_by CHAR(36) NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
};

/**
 * Down
 */
export const down = async () => {
    logger.info('Dropping table: notification_templates');
    await db.query('DROP TABLE IF EXISTS notification_templates');
};


/**
 * 
 *  Never modify existing templates. Instead, create a new version of the template.
 *  This allows for auditability and the ability to resend notifications using the
 *  original template if needed.
 * 
    templates
    ---------
    id (uuid / int)
    version (int) - version number of the template - on update, change latest of old version to false, create new version with
    latest (boolean) - whether this is the latest version of the template
    name
    description
    slug (unique)
    content (text / longtext) => The handlebars template content
    variables_schema (json) - defines the variables that can be used in the template
    created_by (uuid / int) - user who created the template
    created_at
    updated_at
 * 
 * 
 */
