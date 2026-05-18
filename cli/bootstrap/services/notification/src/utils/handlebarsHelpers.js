import { logger } from '@gnar-engine/core';

import Handlebars from 'handlebars';


// Function to register custom Handlebars helpers
export function registerHelpers() {
    try {
        Handlebars.registerHelper('or', or);
        logger.info('Handlebars helpers registered successfully!')
    } catch (error) {
        logger.error('Error registering Handlebars helpers', error.message);
    }
}


// Helper to check if a variable is empty (null, undefined, empty string, empty array, or empty object)
// if empty returns the alternative provided string, else returns the variable itself
function or(variable, alternative) {

    if (alternative === undefined || alternative === null) {
        return variable || 'N/A'
    }

    if (variable === null || variable === undefined) {
        return alternative;
    }

    if (typeof variable === 'string' && variable.trim() === '') {
        return alternative;
    }

    if (Array.isArray(variable) && variable.length === 0) {
        return alternative;
    }

    if (typeof variable === 'object' && Object.keys(variable).length === 0) {
        return alternative;
    }

    return variable;
}