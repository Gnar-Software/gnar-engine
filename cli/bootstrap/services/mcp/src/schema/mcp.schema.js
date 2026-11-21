import { schema } from '@gnar-engine/core';
import { config } from '../config.js';


// JSON-RPC message schema (request, notification or client response, batches are not supported)
const jsonRpcMessageSchema = {
    schemaName: 'mcpService.jsonRpcMessageSchema',
    schema: {
        type: 'object',
        properties: {
            jsonrpc: { type: 'string', const: '2.0' },
            id: { type: ['string', 'integer'] },
            method: { type: 'string' },
            params: { type: 'object' },
            result: {},
            error: { type: 'object' }
        },
        required: ['jsonrpc'],
        additionalProperties: false
    }
};

// Initialize params schema
const initializeParamsSchema = {
    schemaName: 'mcpService.initializeParamsSchema',
    schema: {
        type: 'object',
        properties: {
            protocolVersion: { type: 'string' },
            capabilities: { type: 'object' },
            clientInfo: { type: 'object' }
        },
        required: ['protocolVersion']
    }
};

// Tool call params schema
const toolCallParamsSchema = {
    schemaName: 'mcpService.toolCallParamsSchema',
    schema: {
        type: 'object',
        properties: {
            name: { type: 'string' },
            arguments: { type: 'object', default: {} }
        },
        required: ['name']
    }
};

// Resource read params schema
const resourceReadParamsSchema = {
    schemaName: 'mcpService.resourceReadParamsSchema',
    schema: {
        type: 'object',
        properties: {
            uri: { type: 'string', pattern: '^' + config.mcp.schemaResourceUriPrefix }
        },
        required: ['uri']
    }
};

// MCP tool metadata schema, provided in command registration metadata as `mcp`
const toolMetadataSchema = {
    schemaName: 'mcpService.toolMetadataSchema',
    schema: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            inputSchema: { type: 'object' },
            outputSchema: { type: 'object' },
            annotations: { type: 'object' },
            timeout: { type: 'integer', default: config.mcp.toolTimeout }
        },
        required: ['description', 'inputSchema'],
        additionalProperties: false
    }
};

export const validateJsonRpcMessage = schema.compile(jsonRpcMessageSchema);
export const validateInitializeParams = schema.compile(initializeParamsSchema);
export const validateToolCallParams = schema.compile(toolCallParamsSchema);
export const validateResourceReadParams = schema.compile(resourceReadParamsSchema);
export const validateToolMetadata = schema.compile(toolMetadataSchema);
