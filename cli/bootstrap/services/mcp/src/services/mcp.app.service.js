import { commands, logger } from '@gnar-engine/core';
import { config } from '../config.js';
import { validateToolMetadata } from '../schema/mcp.schema.js';

export const mcp = {

    /**
     * Cache of MCP tools & resources built from service manifests
     */
    methodsCache: {
        tools: {},
        resources: {},
        fetchedAt: 0
    },

    /**
     * Get MCP tools & resources, built from service manifests and cached for config.mcp.manifestCacheTtl
     *
     * @param {Object} params
     * @returns {Promise<Object>} { tools: { [toolName]: tool }, resources: { [uri]: resource } }
     */
    async getMethods({}) {

        // return cached methods if still valid
        if (Date.now() - this.methodsCache.fetchedAt < config.mcp.manifestCacheTtl) {
            return { tools: this.methodsCache.tools, resources: this.methodsCache.resources };
        }

        // fetch all service manifests
        const services = await commands.execute('controlService.getServices', {
            includeManifests: true
        });

        // build tools & resources
        const tools = this.buildTools({ services });
        const resources = this.buildResources({ services });

        // update cache
        this.methodsCache.tools = tools;
        this.methodsCache.resources = resources;
        this.methodsCache.fetchedAt = Date.now();

        return { tools, resources };
    },

    /**
     * Build tools from commands registered with mcp metadata
     *
     * @param {Object} params
     * @param {Array} params.services - Registered services with manifests
     * @returns {Object} { [toolName]: tool }
     */
    buildTools({ services }) {
        const tools = {};

        for (const service of services) {
            for (const implementation of Object.values(service.manifest.commandImplementations)) {
                if (!implementation.mcp) {
                    continue;
                }

                // skip incorrectly implemented tool metadata so other tools remain available
                const { errors } = validateToolMetadata(implementation.mcp);
                if (errors) {
                    logger.error(`Invalid MCP metadata for command ${implementation.commandName}: ${errors}`);
                    continue;
                }

                // tool names cannot contain dots for all clients, e.g. userService__getSingleUser
                const toolName = implementation.commandName.replaceAll('.', '__');

                tools[toolName] = {
                    ...implementation.mcp,
                    name: toolName,
                    commandName: implementation.commandName
                };
            }
        }

        return tools;
    },

    /**
     * Build resources from schemas registered in service manifests
     *
     * @param {Object} params
     * @param {Array} params.services - Registered services with manifests
     * @returns {Object} { [uri]: resource }
     */
    buildResources({ services }) {
        const resources = {};

        for (const service of services) {
            for (const [schemaName, schema] of Object.entries(service.manifest.schemas)) {
                const uri = config.mcp.schemaResourceUriPrefix + schemaName;

                resources[uri] = {
                    uri,
                    name: schemaName,
                    description: `JSON schema ${schemaName} registered by ${service.name}`,
                    mimeType: 'application/schema+json',
                    schema
                };
            }
        }

        return resources;
    },

    /**
     * Get a tool by name
     *
     * @param {Object} params
     * @param {string} params.name - Tool name
     * @returns {Promise<Object|undefined>} Tool, or undefined if not found
     */
    async getTool({ name }) {
        const { tools } = await this.getMethods({});
        return tools[name];
    },

    /**
     * Get a resource by uri
     *
     * @param {Object} params
     * @param {string} params.uri - Resource uri
     * @returns {Promise<Object|undefined>} Resource, or undefined if not found
     */
    async getResource({ uri }) {
        const { resources } = await this.getMethods({});
        return resources[uri];
    },

    /**
     * Map a tool to an MCP tool definition, removing internal properties
     *
     * @param {Object} params
     * @param {Object} params.tool - Tool
     * @returns {Object} MCP tool definition
     */
    toToolDefinition({ tool }) {
        return {
            name: tool.name,
            title: tool.title,
            description: tool.description,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema,
            annotations: tool.annotations
        };
    },

    /**
     * Map a resource to an MCP resource definition, removing the schema content
     *
     * @param {Object} params
     * @param {Object} params.resource - Resource
     * @returns {Object} MCP resource definition
     */
    toResourceDefinition({ resource }) {
        return {
            uri: resource.uri,
            name: resource.name,
            description: resource.description,
            mimeType: resource.mimeType
        };
    },

    /**
     * Execute the command behind a tool and format the MCP tool result
     *
     * Command errors are returned as a tool result with isError: true so that the model can see the error.
     * Structured content is returned when the tool defines an output schema.
     *
     * @param {Object} params
     * @param {Object} params.tool - Tool
     * @param {Object} params.toolArguments - Tool arguments, used as the command payload
     * @returns {Promise<Object>} MCP tools/call result { content, structuredContent, isError }
     */
    async executeTool({ tool, toolArguments }) {

        // execute the tool command
        let result;
        try {
            result = await commands.execute(tool.commandName, toolArguments, { timeout: tool.timeout });
        } catch (commandError) {
            logger.error(`MCP tool ${tool.name} failed: ${commandError.message}`);

            return {
                content: [{ type: 'text', text: commandError.message }],
                isError: true
            };
        }

        // commands with no return value
        if (result === undefined) {
            return {
                content: [{ type: 'text', text: 'Command completed with no result' }],
                isError: false
            };
        }

        // return result as text, and as structured content when an output schema is defined
        const toolResult = {
            content: [{ type: 'text', text: JSON.stringify(result) }],
            isError: false
        };

        if (tool.outputSchema) {
            toolResult.structuredContent = result;
        }

        return toolResult;
    },

    /**
     * Format the MCP contents of a resource
     *
     * @param {Object} params
     * @param {Object} params.resource - Resource
     * @returns {Array} MCP resource contents
     */
    toResourceContents({ resource }) {
        return [{
            uri: resource.uri,
            mimeType: resource.mimeType,
            text: JSON.stringify(resource.schema, null, 2)
        }];
    }
};
