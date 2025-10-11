
/**
 * Manifest
 */
export const manifest = {

    manifest: {
        commandList: [],
        commandImplementations: {},
        schemas: {}
    },

    /**
     * Generates a manifest of all registered commands
     */
    addCommand({ commandName, handlerFunction }) {
        manifest.manifest.commandImplementations[commandName] = {
            function: handlerFunction.toString()
        };
        manifest.manifest.commandList.push(commandName);
    },

    /**
     * Add a schema to the manifest
     * 
     * @param {Object} schemaEntry - The schema entry to add
     * @param {string} schemaEntry.schemaName - The name of the schema
     * @param {Object} schemaEntry.schema - The schema object
     */
    addSchema({ schemaName, schema }) {
        manifest.manifest.schemas[schemaName] = schema;
    }
}