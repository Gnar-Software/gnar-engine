import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { manifest } from '../commands/command-manifest.js';

const ajv = new Ajv({ allErrors: true, useDefaults: true });
addFormats(ajv);
ajv.addFormat('mysql-date', /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

const schemaService = {

    compile: (schema) => {
        // Push to manifest
        manifest.addSchema(schema);

        // Compile the schema using AJV
        const validate = ajv.compile(schema.schema);
        return (data) => {
            const valid = validate(data);
            if (!valid) {
                const errorMessages = [];

                validate.errors.map((error) => {
                    errorMessages.push(error.instancePath + ' ' + error.message);
                });

                return { errors: errorMessages.join(', ') };
            }
            return false;
        };
    }
}

export default schemaService;