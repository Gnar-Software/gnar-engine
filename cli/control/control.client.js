import client from '../services/client.js';
import { profiles } from "../profiles/profiles.client.js";

export const control = {

    // Run all migrations
    runMigrations: async () => {    
        try {
            const response = await client.post('/control/migrations', {});

            if (response.status !== 200) {
                throw new Error("Failed to run migrations");
            }

            return response.data;
        } catch (error) {
            return {error: "Migrations failed: " + error};
        }
    },

    // Run seeders
    runSeeders: async () => {
        try {
            const response = await client.post('/control/seeders', {});

            if (response.status !== 200) {
                throw new Error("Failed to run seeders");
            }

            return response.data;
        } catch (error) {
            return {error: "Seeders failed: " + error};
        }
    },

    // Run full reset
    runReset: async () => {    
        try {
            const response = await client.post('/control/reset', {});

            if (response.status !== 200) {
                throw new Error("Failed to run reset");
            }

            return response.data;
        } catch (error) {
            return {error: "Reset failed: " + error};
        }
    },

    // Get tasks
    getTasks: async (status) => {
        try {
            const response = await client.get(`/tasks/?status=${status}`);

            if (response.status !== 200) {
                throw new Error("Failed to get tasks");
            }

            return response.data;
        } catch (error) {
            return {error: "Failed to get tasks: " + error};
        }
    },

    // Execute tasks
    handleTaskBatch: async (status) => {
        try {
            console.log(`Executing task batch...`);
            const response = await client.post(`/tasks/execute-batch`, {
                status: status
            });

            if (response.status !== 200) {
                throw new Error("Failed to execute task batch");
            }

            if (response.data.errors && response.data.errors.length > 0) {
                throw new Error("Task batch run but had errors: " + JSON.stringify(response.data.errors, null, 2));
            }

            return response.data;
        } catch (error) {
            return {error: "Task execution failed: " + error};
        }

    },

    // Delete task by id
    deleteTask: async (id) => {
        try {
            console.log(`Deleting task with id ${id}...`);
            const response = await client.delete(`/tasks/${id}`);

            if (response.status !== 200) {
                throw new Error("Failed to delete task");
            }

            return response.data;
        } catch (error) {
            return {error: "Failed to delete task: " + error};
        }
    },

    // Delete failed tasks
    deleteFailedTasks: async () => {
        try {
            console.log(`Deleting failed tasks...`);
            const response = await client.post(`/tasks/delete-failed`, {});

            if (response.status !== 200) {
                throw new Error("Failed to delete failed tasks");
            }

            return response.data;
        } catch (error) {
            return {error: "Failed to delete failed tasks: " + error};
        }
    }
}