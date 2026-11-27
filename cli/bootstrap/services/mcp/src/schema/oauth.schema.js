import { schema } from '@gnar-engine/core';

// OAuth wire names are snake_case and unknown parameters must be ignored (additionalProperties: true)

// Authorize request query. Only client_id and redirect_uri are required here: once they are valid,
// other errors are reported by redirecting to the client
const authorizeQuerySchema = {
    schemaName: 'mcpService.authorizeQuerySchema',
    schema: {
        type: 'object',
        properties: {
            response_type: { type: 'string' },
            client_id: { type: 'string', maxLength: 2048 },
            redirect_uri: { type: 'string', maxLength: 2048 },
            state: { type: 'string', maxLength: 1024 },
            scope: { type: 'string' },
            code_challenge: { type: 'string', maxLength: 128 },
            code_challenge_method: { type: 'string' },
            resource: { type: 'string' }
        },
        required: ['client_id', 'redirect_uri'],
        additionalProperties: true
    }
};

// Client ID Metadata Document, fetched from the client_id URL
const clientMetadataSchema = {
    schemaName: 'mcpService.clientMetadataSchema',
    schema: {
        type: 'object',
        properties: {
            client_id: { type: 'string' },
            client_name: { type: 'string', maxLength: 255 },
            redirect_uris: { type: 'array', items: { type: 'string' }, minItems: 1 },
            token_endpoint_auth_method: { type: 'string' }
        },
        required: ['client_id', 'redirect_uris'],
        additionalProperties: true
    }
};

// Complete OAuth transaction body, sent by the portal consent page
const completeTransactionSchema = {
    schemaName: 'mcpService.completeTransactionSchema',
    schema: {
        type: 'object',
        properties: {
            decision: { type: 'string', enum: ['allow', 'deny'] }
        },
        required: ['decision'],
        additionalProperties: false
    }
};

// Token request, mapped to camelCase from the form body
const tokenRequestSchema = {
    schemaName: 'mcpService.tokenRequestSchema',
    schema: {
        type: 'object',
        properties: {
            code: { type: 'string' },
            codeVerifier: { type: 'string' },
            clientId: { type: 'string' },
            redirectUri: { type: 'string' },
            resource: { type: 'string' }
        },
        required: ['code', 'codeVerifier', 'clientId', 'redirectUri']
    }
};

export const validateAuthorizeQuery = schema.compile(authorizeQuerySchema);
export const validateClientMetadata = schema.compile(clientMetadataSchema);
export const validateCompleteTransaction = schema.compile(completeTransactionSchema);
export const validateTokenRequest = schema.compile(tokenRequestSchema);
