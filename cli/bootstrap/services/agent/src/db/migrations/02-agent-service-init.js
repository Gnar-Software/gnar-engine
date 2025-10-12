import { logger, db } from '@gnar-engine/core';

/**
 * Up
 */
export const up = async () => {
    logger.info('Creating table: agent-chats');
    await db.query(`
        CREATE TABLE agent_chats (
            id CHAR(36) PRIMARY KEY,
            user_id CHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    logger.info('Creating table: agent-chat-messages');
    await db.query(`
        CREATE TABLE agent_chat_messages (
            id CHAR(36) PRIMARY KEY,
            chat_id CHAR(36) NOT NULL,
            user_name VARCHAR(255) NOT NULL,
            context MEDIUMTEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

/**
 * Down
 */
export const down = async () => {
    logger.info('Dropping table: agents');
    await db.query('DROP TABLE IF EXISTS agents');
}
