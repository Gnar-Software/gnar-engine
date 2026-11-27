import { db, utils } from '@gnar-engine/core';

/**
 * OAuth transaction entity service
 */
export const oauthTransaction = {

    /**
     * Create an OAuth transaction
     *
     * @param {Object} params
     * @param {string} params.clientId - CIMD client id URL
     * @param {string} params.clientName
     * @param {string} params.redirectUri
     * @param {string} [params.state]
     * @param {string} params.codeChallenge - PKCE S256 challenge
     * @param {string} params.scope
     * @param {number} params.ttl - Seconds until the transaction expires
     * @returns {Promise<string>} Transaction id
     */
    async create({ clientId, clientName, redirectUri, state, codeChallenge, scope, ttl }) {
        const id = utils.uuid();

        await db.execute(
            `INSERT INTO oauth_transactions (id, client_id, client_name, redirect_uri, state, code_challenge, scope, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW() + INTERVAL ? SECOND)`,
            [id, clientId, clientName, redirectUri, state ?? null, codeChallenge, scope, ttl]
        );

        return id;
    },

    /**
     * Get an OAuth transaction by id
     *
     * @param {Object} params
     * @param {string} params.id
     * @returns {Promise<Object|null>}
     */
    async getById({ id }) {
        const [rows] = await db.execute('SELECT * FROM oauth_transactions WHERE id = ?', [id]);
        return rows[0] ? db.sql.helpers.objectToCamelCase(rows[0]) : null;
    },

    /**
     * Get an OAuth transaction by the hash of its authorisation code
     *
     * @param {Object} params
     * @param {string} params.codeHash - SHA-256 hex of the code
     * @returns {Promise<Object|null>}
     */
    async getByCodeHash({ codeHash }) {
        const [rows] = await db.execute('SELECT * FROM oauth_transactions WHERE code_hash = ?', [codeHash]);
        return rows[0] ? db.sql.helpers.objectToCamelCase(rows[0]) : null;
    },

    /**
     * Complete an unexpired, not yet completed transaction with the user's approval
     *
     * @param {Object} params
     * @param {string} params.id
     * @param {string} params.userId
     * @param {string} params.codeHash - SHA-256 hex of the code
     * @param {number} params.codeTtl - Seconds until the code expires
     * @returns {Promise<boolean>} Whether the transaction was completed
     */
    async complete({ id, userId, codeHash, codeTtl }) {
        const [result] = await db.execute(
            `UPDATE oauth_transactions
             SET user_id = ?, code_hash = ?, code_expires_at = NOW() + INTERVAL ? SECOND, completed_at = NOW()
             WHERE id = ? AND completed_at IS NULL AND expires_at > NOW()`,
            [userId, codeHash, codeTtl, id]
        );

        return result.affectedRows === 1;
    },

    /**
     * Complete an unexpired, not yet completed transaction with the user's denial
     *
     * @param {Object} params
     * @param {string} params.id
     * @returns {Promise<boolean>} Whether the transaction was completed
     */
    async deny({ id }) {
        const [result] = await db.execute(
            `UPDATE oauth_transactions
             SET completed_at = NOW()
             WHERE id = ? AND completed_at IS NULL AND expires_at > NOW()`,
            [id]
        );

        return result.affectedRows === 1;
    },

    /**
     * Mark the transaction's code used, once
     *
     * @param {Object} params
     * @param {string} params.id
     * @returns {Promise<boolean>} False when the code was already used
     */
    async markCodeUsed({ id }) {
        const [result] = await db.execute(
            'UPDATE oauth_transactions SET code_used_at = NOW() WHERE id = ? AND code_used_at IS NULL',
            [id]
        );

        return result.affectedRows === 1;
    }
}
