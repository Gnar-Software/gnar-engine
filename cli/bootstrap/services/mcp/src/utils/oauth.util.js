import { createHash, randomBytes } from 'node:crypto';

export const oauthUtil = {

    /**
     * Random token, used for authorisation codes and MCP auth tokens
     *
     * @param {Object} params
     * @returns {string} 32 random bytes, base64url encoded
     */
    randomToken({}) {
        return randomBytes(32).toString('base64url');
    },

    /**
     * SHA-256 hex digest, used to store and look up codes and tokens
     *
     * @param {Object} params
     * @param {string} params.value
     * @returns {string}
     */
    sha256Hex({ value }) {
        return createHash('sha256').update(value).digest('hex');
    },

    /**
     * Check a PKCE S256 code verifier against its code challenge
     *
     * @param {Object} params
     * @param {string} params.codeVerifier
     * @param {string} params.codeChallenge
     * @returns {boolean}
     */
    verifyPkce({ codeVerifier, codeChallenge }) {
        return createHash('sha256').update(codeVerifier).digest('base64url') === codeChallenge;
    },

    /**
     * Add OAuth response parameters to a client's redirect uri, skipping empty ones
     *
     * @param {Object} params
     * @param {string} params.redirectUri
     * @param {Object} params.params - e.g. { code, state, iss }
     * @returns {string}
     */
    buildRedirect({ redirectUri, params }) {
        const url = new URL(redirectUri);

        for (const [key, value] of Object.entries(params)) {
            if (value) {
                url.searchParams.set(key, value);
            }
        }

        return url.toString();
    }
}
