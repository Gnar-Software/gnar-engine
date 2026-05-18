/**
 * Converts an arbitrary string into a safe SQL-style slug.
 * Example:
 *   "User Templates v2" -> "user_templates_v2"
 */
export function slugifyIdentifier(input, options = {}) {
    if (typeof input !== 'string') {
        throw new TypeError('slugifyIdentifier expects a string');
    }

    const {
        separator = '_',
        maxLength = 64,
        lowercase = true
    } = options;

    let slug = input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, separator)
        .replace(new RegExp(`${separator}{2,}`, 'g'), separator)
        .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '');

    if (lowercase) {
        slug = slug.toLowerCase();
    }

    if (!slug) {
        throw new Error('Slugified value is empty');
    }

    return slug.slice(0, maxLength);
}
