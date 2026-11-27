import { db, utils } from '@gnar-engine/core';

/**
 * MCP auth token entity service
 */
export const mcpAuthToken = {

    /**
     * Create an MCP auth token
     *
     * @param {Object} params
     * @param {string} params.tokenHash - SHA-256 hex of the token
     * @param {string} params.userId
     * @param {string} params.clientId - CIMD client id URL
     * @param {string} params.clientName
     * @param {string} params.oauthTransactionId
     * @param {string} params.scope
     * @param {number} params.ttl - Seconds until the token expires
     * @returns {Promise<string>} Token id
     */
    async create({ tokenHash, userId, clientId, clientName, oauthTransactionId, scope, ttl }) {
        const id = utils.uuid();

        await db.execute(
            `INSERT INTO mcp_auth_tokens (id, token_hash, user_id, client_id, client_name, oauth_transaction_id, scope, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW() + INTERVAL ? SECOND)`,
            [id, tokenHash, userId, clientId, clientName, oauthTransactionId, scope, ttl]
        );

        return id;
    },

    /**
     * Get an MCP auth token by its hash
     *
     * @param {Object} params
     * @param {string} params.tokenHash - SHA-256 hex of the token
     * @returns {Promise<Object|null>}
     */
    async getByTokenHash({ tokenHash }) {
        const [rows] = await db.execute('SELECT * FROM mcp_auth_tokens WHERE token_hash = ?', [tokenHash]);
        return rows[0] ? db.sql.helpers.objectToCamelCase(rows[0]) : null;
    },

    /**
     * Record that a token was used
     *
     * @param {Object} params
     * @param {string} params.id
     */
    async updateLastUsed({ id }) {
        await db.execute('UPDATE mcp_auth_tokens SET last_used_at = NOW() WHERE id = ?', [id]);
    },

    /**
     * Delete the tokens issued from a transaction
     *
     * @param {Object} params
     * @param {string} params.oauthTransactionId
     */
    async deleteByOauthTransactionId({ oauthTransactionId }) {
        await db.execute('DELETE FROM mcp_auth_tokens WHERE oauth_transaction_id = ?', [oauthTransactionId]);
    }
}
