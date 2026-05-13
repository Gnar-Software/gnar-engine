import { MongoClient } from 'mongodb';

const retryInterval = 5000;
const maxRetries = 5;

let db;

export const mongoService = {

    /**
     * Provision database and users
     *
     * @param {Object} params - The parameters object
     * @param {string} host - The database host
     * @param {string} database - The database name
     * @param {string} user - The database user
     * @param {string} password - The database user password
     * @param {string} rootPassword - The root user password
     * @param {number} [port=27017] - The database port
     */
    provisionDatabase: async ({host, database, user, password, rootPassword, port = 27017}) => {

        const connectionUrl = `mongodb://root:${rootPassword}@${host}:${port}/admin`;
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const dbClient = await MongoClient.connect(connectionUrl);
                db = dbClient.db(database);

                const existingUsers = await db.command({ usersInfo: 1 });

                if (!existingUsers.users.some(u => u.user === user)) {
                    await db.command({
                        createUser: user,
                        pwd: password,
                        roles: [{ role: "readWrite", db: database }]
                    });
                }

                console.log(`Successfully provisioned MongoDB database: ${database} and user: ${user}`);
                await dbClient.close();
                return;

            } catch (error) {
                console.error(`Failed provisioning Mongo database "${database}" for user "${user}" ": ${error.message}`);
                retries++;

                if (retries >= maxRetries) {
                    throw new Error(`Max retries reached. Could not provision MongoDB database "${database}".`);
                }

                await new Promise(resolve => setTimeout(resolve, retryInterval));
            }
        }
    }
}
