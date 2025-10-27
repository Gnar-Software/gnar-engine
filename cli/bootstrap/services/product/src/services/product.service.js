import { db } from '@gnar-engine/core';

export const product = {
    async getById({ id }) {
        const [result] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        return result || null;
    },

    async getByEmail({ email }) {
        // Placeholder: implement if your service uses email
        return null;
    },

    async getAll() {
        return await db.query('SELECT * FROM products');
    },

    async create(data) {
        const { insertId } = await db.query('INSERT INTO products (created_at, updated_at) VALUES (CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        return await this.getById({ id: insertId });
    },

    async update({ id, ...data }) {
        await db.query('UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        return await this.getById({ id });
    },

    async delete({ id }) {
        await db.query('DELETE FROM products WHERE id = ?', [id]);
        return true;
    },
};
