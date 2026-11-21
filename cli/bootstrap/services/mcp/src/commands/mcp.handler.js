import { commands, error } from '@gnar-engine/core';
import { config } from '../config.js';
import { mcp } from '../services/mcp.app.service.js';
import { validateInitializeParams, validateToolCallParams, validateResourceReadParams } from '../schema/mcp.schema.js';


/**
 * Get MCP methods
 *
 * Fetches all registered service manifests from the control service and builds the MCP tools
 * and resources from them. Results are cached for config.mcp.manifestCacheTtl.
 *
 * Commands are exposed as tools when they are registered with an `mcp` metadata block, e.g.
 * commands.register('userService.getSingleUser', handler, {
 *     mcp: { description: 'Get a single user', inputSchema: { type: 'object', properties: {...} } }
 * });
 * See mcpService.toolMetadataSchema for the full metadata schema.
 *
 * Schemas registered in service manifests are exposed as resources.
 *
 * @param {Object} params
 * @returns {Promise<Object>} { tools: { [toolName]: tool }, resources: { [uri]: resource } }
 */
commands.register('mcpService.getMcpMethods', async ({}) => {
    return await mcp.getMethods({});
});


/**
 * Initialize
 *
 * Negotiates the protocol version and returns the server capabilities and info. The client's
 * requested protocol version is used if supported, otherwise the latest supported version.
 *
 * @param {Object} params
 * @param {Object} params.params - MCP initialize params
 * @param {string} params.params.protocolVersion - Protocol version requested by the client
 * @returns {Promise<Object>} MCP initialize result
 */
commands.register('mcpService.initialize', async ({ params }) => {

    // validate params
    const { errors } = validateInitializeParams(params);
    if (errors) {
        throw new error.badRequest(`Invalid initialize params: ${errors}`);
    }

    // negotiate protocol version
    let protocolVersion = config.mcp.protocolVersions[0];
    if (config.mcp.protocolVersions.includes(params.protocolVersion)) {
        protocolVersion = params.protocolVersion;
    }

    return {
        protocolVersion,
        capabilities: {
            tools: { listChanged: false },
            resources: { listChanged: false, subscribe: false }
        },
        serverInfo: {
            name: config.mcp.serverName,
            version: config.mcp.serverVersion
        },
        instructions: config.mcp.instructions
    };
});


/**
 * List tools
 *
 * Lists all tools, built from commands registered with mcp metadata.
 *
 * @param {Object} params
 * @returns {Promise<Object>} MCP tools/list result { tools: [{ name, title, description, inputSchema, outputSchema, annotations }] }
 */
commands.register('mcpService.listTools', async ({}) => {
    const { tools } = await mcp.getMethods({});

    return {
        tools: Object.values(tools).map(tool => mcp.toToolDefinition({ tool }))
    };
});


/**
 * Call tool
 *
 * Executes the command behind the tool with the tool arguments as the command payload. Command
 * errors are returned as a tool result with isError: true so that the model can see the error.
 * Structured content is returned when the tool defines an output schema.
 *
 * @param {Object} params
 * @param {Object} params.params - MCP tools/call params
 * @param {string} params.params.name - Tool name
 * @param {Object} [params.params.arguments] - Tool arguments
 * @returns {Promise<Object>} MCP tools/call result { content, structuredContent, isError }
 */
commands.register('mcpService.callTool', async ({ params }) => {

    // validate params
    const { errors } = validateToolCallParams(params);
    if (errors) {
        throw new error.badRequest(`Invalid tool call params: ${errors}`);
    }

    // get tool
    const tool = await mcp.getTool({ name: params.name });
    if (!tool) {
        throw new error.badRequest(`Unknown tool: ${params.name}`);
    }

    // execute tool
    return await mcp.executeTool({ tool, toolArguments: params.arguments });
});


/**
 * List resources
 *
 * Lists all resources, built from the schemas registered in service manifests.
 *
 * @param {Object} params
 * @returns {Promise<Object>} MCP resources/list result { resources: [{ uri, name, description, mimeType }] }
 */
commands.register('mcpService.listResources', async ({}) => {
    const { resources } = await mcp.getMethods({});

    return {
        resources: Object.values(resources).map(resource => mcp.toResourceDefinition({ resource }))
    };
});


/**
 * Read resource
 *
 * Returns the content of a resource by uri.
 *
 * @param {Object} params
 * @param {Object} params.params - MCP resources/read params
 * @param {string} params.params.uri - Resource uri, e.g. gnar://schemas/userService.userSchema
 * @returns {Promise<Object>} MCP resources/read result { contents: [{ uri, mimeType, text }] }
 */
commands.register('mcpService.readResource', async ({ params }) => {

    // validate params
    const { errors } = validateResourceReadParams(params);
    if (errors) {
        throw new error.badRequest(`Invalid resource read params: ${errors}`);
    }

    // get resource
    const resource = await mcp.getResource({ uri: params.uri });
    if (!resource) {
        throw new error.notFound(`Resource not found: ${params.uri}`);
    }

    return {
        contents: mcp.toResourceContents({ resource })
    };
});
