import { logger, db } from '@gnar-engine/core';

/**
 * Up
 *
 * MCP-only access tokens, linked to the user and the client app they were issued to.
 */
export const up = async () => {
    logger.info('Creating table: mcp_auth_tokens');

    await db.query(`
        CREATE TABLE mcp_auth_tokens (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            token_hash CHAR(64) NOT NULL UNIQUE,
            user_id CHAR(36) NOT NULL,
            client_id VARCHAR(2048) NOT NULL,
            client_name VARCHAR(255) NOT NULL,
            oauth_transaction_id CHAR(36) NOT NULL,
            scope VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            last_used_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_mcp_auth_tokens_user_id (user_id),
            INDEX idx_mcp_auth_tokens_oauth_transaction_id (oauth_transaction_id)
        )
    `);
}

/**
 * Down
 */
export const down = async () => {
    logger.info('Dropping table: mcp_auth_tokens');
    await db.query('DROP TABLE IF EXISTS mcp_auth_tokens');
}
