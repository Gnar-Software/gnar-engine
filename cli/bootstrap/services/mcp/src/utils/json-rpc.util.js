/**
 * JSON-RPC 2.0 response formatters
 */
export const jsonRpc = {

    /**
     * Format a JSON-RPC result response
     *
     * @param {Object} params
     * @param {string|number} params.id - Request id
     * @param {Object} params.result - Method result
     * @returns {Object} JSON-RPC response
     */
    result: ({ id, result }) => {
        return { jsonrpc: '2.0', id, result };
    },

    /**
     * Format a JSON-RPC error response
     *
     * @param {Object} params
     * @param {string|number|null} params.id - Request id, null if it could not be determined
     * @param {number} params.code - JSON-RPC error code
     * @param {string} params.message - Error message
     * @returns {Object} JSON-RPC response
     */
    error: ({ id, code, message }) => {
        return { jsonrpc: '2.0', id, error: { code, message } };
    }
}
