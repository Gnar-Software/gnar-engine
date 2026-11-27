import { error } from '@gnar-engine/core';
import { config } from '../config.js';
import { validateClientMetadata } from '../schema/oauth.schema.js';

/**
 * OAuth clients, identified by Client ID Metadata Documents (CIMD): the client_id is an https URL
 * serving a JSON document that lists the client's name and redirect uris
 */
export const oauthClient = {

    /**
     * Fetch and validate a client's metadata document
     *
     * @param {Object} params
     * @param {string} params.clientId - CIMD client id URL
     * @returns {Promise<Object>} { clientId, clientName, redirectUris }
     */
    async getClientMetadata({ clientId }) {
        const { clientMetadataTimeout, clientMetadataMaxBytes } = config.mcp.oauth;

        let url;
        try {
            url = new URL(clientId);
        } catch (urlError) {
            throw new error.badRequest('client_id must be an https URL');
        }

        if (url.protocol !== 'https:' || url.pathname === '/') {
            throw new error.badRequest('client_id must be an https URL with a path');
        }

        // fetch the document, without following redirects
        let response;
        try {
            response = await fetch(clientId, {
                redirect: 'manual',
                signal: AbortSignal.timeout(clientMetadataTimeout)
            });
        } catch (fetchError) {
            throw new error.badRequest(`Client metadata document could not be fetched: ${fetchError.message}`);
        }

        if (response.status !== 200) {
            throw new error.badRequest(`Client metadata document could not be fetched: status ${response.status}`);
        }

        if (Number(response.headers.get('content-length')) > clientMetadataMaxBytes) {
            throw new error.badRequest('Client metadata document is too large');
        }

        const text = await response.text();

        if (Buffer.byteLength(text) > clientMetadataMaxBytes) {
            throw new error.badRequest('Client metadata document is too large');
        }

        // validate the document
        let doc;
        try {
            doc = JSON.parse(text);
        } catch (parseError) {
            throw new error.badRequest('Client metadata document is not JSON');
        }

        const { errors } = validateClientMetadata(doc);
        if (errors) {
            throw new error.badRequest(`Invalid client metadata document: ${errors}`);
        }

        if (doc.client_id !== clientId) {
            throw new error.badRequest('Client metadata document client_id does not match');
        }

        if (doc.token_endpoint_auth_method && doc.token_endpoint_auth_method !== 'none') {
            throw new error.badRequest('Client metadata document token_endpoint_auth_method must be none');
        }

        return {
            clientId,
            clientName: doc.client_name || url.host,
            redirectUris: doc.redirect_uris
        };
    },

    /**
     * Check a requested redirect uri against the client's registered redirect uris
     *
     * Loopback redirect uris may use any port (RFC 8252 7.3, CIMD draft-03 4.2), everything else is an exact match.
     * Only https, or http back to this computer, is allowed: any other scheme (javascript:, data:) would run in the
     * portal when the consent page navigates to it.
     *
     * @param {Object} params
     * @param {string} params.redirectUri - Requested redirect uri
     * @param {Array<string>} params.redirectUris - Registered redirect uris
     * @returns {boolean}
     */
    isRedirectUriAllowed({ redirectUri, redirectUris }) {
        let requested;
        try {
            requested = new URL(redirectUri);
        } catch (urlError) {
            return false;
        }

        const isLoopback = this.isLoopbackRedirect({ redirectUri });

        if (requested.protocol !== 'https:' && !isLoopback) {
            return false;
        }

        return redirectUris.some(registered => {
            if (!isLoopback) {
                return registered === redirectUri;
            }

            try {
                const allowed = new URL(registered);
                return allowed.protocol === requested.protocol && allowed.hostname === requested.hostname && allowed.pathname === requested.pathname;
            } catch (urlError) {
                return false;
            }
        });
    },

    /**
     * Whether a redirect uri goes back to an app on the user's computer
     *
     * @param {Object} params
     * @param {string} params.redirectUri
     * @returns {boolean}
     */
    isLoopbackRedirect({ redirectUri }) {
        try {
            const url = new URL(redirectUri);
            return url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
        } catch (urlError) {
            return false;
        }
    }
}
