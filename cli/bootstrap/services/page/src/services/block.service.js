import { db, logger } from '@gnar-engine/core';
import { ObjectId } from 'mongodb';
import fs from "node:fs/promises";
import path from "node:path";

export const block = {

    // Get all blocks
    getAll: async ({ pageSize = 100, pageNum = 1 } = {}) => {
        try {
            pageSize = Number(pageSize);
            pageNum = Number(pageNum);
            const offset = (pageNum - 1) * pageSize;
            const collection = db.collection('blocks');
            const items = await collection.find().skip(offset).limit(pageSize).toArray();
            const total = await collection.countDocuments();

            return {
                data: items.map(mappings),
                pagination: {
                    pageSize,
                    pageNum,
                    total
                }
            };
        } catch (error) {
            logger.error("Error fetching blocks:", error);
            throw error;
        }
    },

    // Create a block
    create: async (data) => {
        try {
            const collection = db.collection('blocks');
            const result = await collection.insertOne(data);
            const insterted = await collection.findOne({ _id: result.insertedId });
            return mappings(insterted);
        } catch (error) {
            logger.error("Error creating block:", error);
            throw error;
        }
    },

    // Get a block by ID
    getById: async ({ id }) => {
        try {
            const collection = db.collection('blocks');
            const objectId = new ObjectId(id);
            const item = await collection.findOne({ _id: objectId });
            return mappings(item);
        } catch (error) {
            logger.error("Error fetching block:", error);
            throw error;
        }
    },

    // Update a block
    update: async ({ id, updatedData }) => {
        try {
            const collection = db.collection('blocks');
            const objectId = new ObjectId(id);
            const result = await collection.updateOne(
                { _id: objectId },
                { $set: updatedData }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            logger.error("Error updating block:", error);
            throw error;
        }
    },

    // Delete a block
    delete: async ({ id }) => {
        try {
            const collection = db.collection('blocks');
            const objectId = new ObjectId(id);
            const result = await collection.deleteOne({ _id: objectId });
            return result.deletedCount > 0;
        } catch (error) {
            logger.error("Error deleting block:", error);
            throw error;
        }
    },

    writeBackup: async ({ fileName, contents }) => {
        try {
            const folder = path.join(getBackupsRoot(), getTimestamp());
            await fs.mkdir(folder, { recursive: true });
            await fs.writeFile(path.join(folder, fileName), contents, "utf8");
        } catch (error) {
            logger.info(`Backup write skipped/failed: ${error?.message || error}`);
        }
    }
};

const mappings = (item) => {
    if (!item) {
        return item;
    }

    // _id -> id
    const { _id, ...rest } = item;
    item = { id: _id.toString(), ...rest };
    
    return item;
}

const getTimestamp = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

const getBackupsRoot = () => path.resolve(process.cwd(), "services/page/backups");
