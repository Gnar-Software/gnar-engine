

export const secrets = {

    /**
     * Collate MySQL databases from provisioner secrets
     *
     * @param {Object} provisionerSecrets - The provisioner secrets object
     * @returns {Object} - Collated MySQL databases
     */
    collateMysqlDatabases: (provisionerSecrets) => {

        const mysqlDatabases = {};

        for (const [serviceKey, service] of Object.entries(provisionerSecrets.services)) {
            for (const key of Object.keys(service)) {
                if (key.startsWith('MYSQL_')) {
                    mysqlDatabases[serviceKey] = true;
                    break;
                }
            }
        }

        for (const [key, value] of Object.entries(mysqlDatabases)) {
            try {
                mysqlDatabases[key] = {};
                mysqlDatabases[key].host = provisionerSecrets.services[key].MYSQL_HOST;
                mysqlDatabases[key].database = provisionerSecrets.services[key].MYSQL_DATABASE;
                mysqlDatabases[key].user = provisionerSecrets.services[key].MYSQL_USER;
                mysqlDatabases[key].password = provisionerSecrets.services[key].MYSQL_PASSWORD;
            } catch (error) {
                console.error(`Missing database credentials for ${key} service. Please include: MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD.`);
                return;
            }
        }

        if (!provisionerSecrets.provision.MYSQL_ROOT_PASSWORD) {
            console.error('Missing MYSQL_ROOT_PASSWORD in provisioner secrets. Cannot provision databases.');
            return;
        }

        return mysqlDatabases;
    },

    /**
     * Collate MongoDB databases from provisioner secrets
     *
     * @param {Object} provisionerSecrets - The provisioner secrets object
     * @returns {Object} - Collated MongoDB databases
     */
    collateMongoDatabases: (provisionerSecrets) => {

        const mongoDatabases = {};

        for (const [serviceKey, service] of Object.entries(provisionerSecrets.services)) {
            for (const key of Object.keys(service)) {
                if (key.startsWith('MONGO_')) {
                    mongoDatabases[serviceKey] = true;
                    break;
                }
            }
        }

        for (const [key, value] of Object.entries(mongoDatabases)) {
            try {
                mongoDatabases[key] = {};
                mongoDatabases[key].host = provisionerSecrets.services[key].MONGO_HOST;
                mongoDatabases[key].database = provisionerSecrets.services[key].MONGO_DATABASE;
                mongoDatabases[key].user = provisionerSecrets.services[key].MONGO_USER;
                mongoDatabases[key].password = provisionerSecrets.services[key].MONGO_PASSWORD;
            } catch (error) {
                console.error(`Missing database credentials for ${key} service. Please include: MONGO_DATABASE, MONGO_USER, and MONGO_PASSWORD.`);
                return;
            }
        }

        if (!provisionerSecrets.provision.MONGO_ROOT_PASSWORD) {
            console.error('Missing MONGO_ROOT_PASSWORD in provisioner secrets. Cannot provision databases.');
            return;
        }

        return mongoDatabases;
    },

    /**
     * Collate message queue credentials
    */
    collateMessageQueueCredentials: (provisionerSecrets) => {
        
        const messageQueueCredentials = {
            rabbitUrl: provisionerSecrets.global.RABBITMQ_URL || null,
        };

        return messageQueueCredentials;
    }
}
