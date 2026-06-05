import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

/**
 * CLI helper functions
 */
export const helpers = {

    assertTrailingSlash: (path) => {
        if (!path.endsWith('/')) {
            return path + '/';
        }
        return path;
    },

    pascalCase: (str) => {
        return str
            .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
            .replace(/^(.)/, (_, c) => c.toUpperCase());
    },

    pascalCasePlural: (str) => {
        const plural = helpers.lowerCasePlural(str);
        return helpers.pascalCase(plural);
    },

    lowerCase: (str) => {
        return str.toLowerCase();
    },

    upperCase: (str) => {
        return str.toUpperCase();
    },

    plural: (str) => {
        if (str.endsWith('y') && !/[aeiou]y$/i.test(str)) {
            return str.slice(0, -1).toLowerCase() + 'ies';
        }
        return str + 's'; 
    },

    lowerCasePlural: (str) => {
        // A very simple pluralization. For production, use a proper pluralization lib.
        if (str.endsWith('y') && !/[aeiou]y$/i.test(str)) {
            return str.slice(0, -1).toLowerCase() + 'ies';
        }
        return str.toLowerCase() + 's';
    },

    capitaliseFirstLetter: (str) => {
        if (typeof str !== 'string' || str.length === 0) {
            return str;
        }
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    generateRandomString: (length) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    getDbTypeFromSecrets: async (serviceName, projectDir) => {
        let dbType;
        const secretsPath = path.join(projectDir, "secrets.localdev.yml");
        const parsedSecrets = yaml.load(await fs.readFile(secretsPath, "utf8"));
        const serviceSecrets = parsedSecrets.services[serviceName.toLowerCase()];

        Object.keys(serviceSecrets).forEach(key => {
            if (key.toLowerCase().includes('host')) {
                const host = serviceSecrets[key].toLowerCase();

                if (host.includes('mongo')) {
                    dbType = 'mongodb';
                } else if (host.includes('mysql')) {
                    dbType = 'mysql';
                }
            }
        });

        return dbType;
    }
}
