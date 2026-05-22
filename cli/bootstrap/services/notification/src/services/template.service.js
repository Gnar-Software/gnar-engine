import fs from 'node:fs/promises';
import path from 'node:path';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const compileNotificationTemplate = async ({ templateSlug, data = {} }) => {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateSlug}.hbs`);
    const source = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(source);
    return template(data);
};
