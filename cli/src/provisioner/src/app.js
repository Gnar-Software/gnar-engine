import { mysqlService } from './services/mysql.js';
import { mongoService } from './services/mongodb.js';
import { secrets } from './services/secrets.js';
import { controlService } from './services/control-service.js';
import { rabbitService } from './services/rabbit-service.js';

/**
 * Initialise service
 */
export const initService = async () => {

	console.log('G n a r  E n g i n e | Provisioner provisioning databases...');

    let provisionerSecrets;

    // get all secrets
    try {
        provisionerSecrets = JSON.parse(process.env.PROVISIONER_SECRETS);
    } catch (error) {
        throw new Error(`Error parsing provisioner secrets: ${error.message}`);
    }

    // collate databases to provision from secrets
    const mysqlDatabases = secrets.collateMysqlDatabases(provisionerSecrets);
    const mongoDatabases = secrets.collateMongoDatabases(provisionerSecrets);

    // provision mysql databases
    if (mysqlDatabases) {
        for (const value of Object.values(mysqlDatabases)) {
            await mysqlService.provisionDatabase({
                host: value.host,
                database: value.database,
                user: value.user,
                password: value.password,
                rootPassword: provisionerSecrets.provision.MYSQL_ROOT_PASSWORD
            });
        }
    } else {
        console.log('No MySQL databases to provision.');
    }

    // provision mongo databases
    if (mongoDatabases) {
        for (const value of Object.values(mongoDatabases)) {
            await mongoService.provisionDatabase({
                host: value.host,
                database: value.database,
                user: value.user,
                password: value.password,
                rootPassword: provisionerSecrets.provision.MONGO_ROOT_PASSWORD
            })
        }
    } else {
        console.log('No MongoDB databases to provision.');
    }

    // assert message queue connection
    const messageQueueSecrets = secrets.collateMessageQueueCredentials(provisionerSecrets);

    if (messageQueueSecrets?.rabbitUrl) {
        await rabbitService.assertConnection(messageQueueSecrets.rabbitUrl);
    }

    // flush old control service replicas and connections
    if (!mysqlDatabases?.control) {
        throw new Error('Control service database credentials are required to flush old replicas and connections.');
    }

    try {
        await controlService.init(mysqlDatabases.control);
        await controlService.flushOldReplicas();
        await controlService.flushOldConnections();
    } finally {
        await controlService.close();
    }

	console.log('G n a r  E n g i n e | Provisioner completed and exiting');
}

initService().catch((error) => {
    console.error('G n a r  E n g i n e | Provisioner failed:', error);
    process.exitCode = 1;
});
