import { logger } from '@gnar-engine/core';

import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';


// Function to register blocks from the blocks directory
export function registerBlocks() {

    try {
        const blocksDir = path.resolve(
            path.dirname(new URL(import.meta.url).pathname),
            '../templates/blocks'
        );
        fs.readdirSync(blocksDir).forEach(file => {
            if (file.endsWith('.hbs')) {
                const name = file.replace('.hbs', '');
                const content = fs.readFileSync(path.join(blocksDir, file), 'utf8');
                Handlebars.registerPartial(name, content);
            }
        });
        logger.info('Handlebars blocks registered successfully');
    } catch (error) {
        logger.error('Error registering Handlebars blocks', error.message);
    }
}
