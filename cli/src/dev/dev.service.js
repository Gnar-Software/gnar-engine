import { spawn } from "child_process";
import Docker from "dockerode";
import process from "process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';
import yaml from "js-yaml";
import { gnarEngineCliConfig } from "../config.js";
import { buildImage, createContainer, createBridgeNetwork } from "../services/docker.js";
import { directories } from "../config.js";
import { exec } from 'child_process';
import { promisify } from 'util';

const docker = new Docker();
const execAsync = promisify(exec);

/**
 * Start the application locally
 * - Creates a dynamic docker-compose file based on deploy.localdev.yml and secrets.localdev.yml
 * - Runs docker-compose up
 *
 * @param {object} options
 * @param {string} options.projectDir - The project directory
 * @param {boolean} [options.build=false] - Whether to re-build images
 * @param {boolean} [options.detach=false] - Whether to run containers in background
 * @param {boolean} [options.coreDev=false] - Whether to run in core development mode (requires access to core source)
 * @param {boolean} [options.bootstrapDev=false] - Whether to set the cli/src/bootstrap directory as the project directory
 * @param {boolean} [options.test=false] - Whether to run tests with ephemeral databases
 * @param {string} [options.testService=''] - The service to run tests for (only applicable if test=true)
 * @param {boolean} [options.resetDatabases=false] - Whether to drop all service databases, re-running all migrations and seeders
 * @param {string} [options.resetDatabase=''] - The service database to drop, re-running all migrations and seeders
 * @param {boolean} [options.removeOrphans=true] - Whether to remove orphaned containers
 * @param {boolean} [options.attachAll=false] - Attach all services including database and message queues for debugging
 */
export async function up({ 
        projectDir,
        build = false,
        detach = false, 
        coreDev = false, 
        bootstrapDev = false, 
        test = false, 
        testService = '',
        testMode = 'ephemeral',
        resetDatabases = false,
        resetDatabase = '',
        removeOrphans = true, 
        attachAll = false
    }) {

    // bootstrap dev
    if (bootstrapDev) {
        const fileDir = path.dirname(new URL(import.meta.url).pathname);
        projectDir = path.resolve(fileDir, "../../bootstrap/");
    }

    // parse config
    const configPath = path.join(projectDir, "deploy.localdev.yml");
    const secretsPath = path.join(projectDir, "secrets.localdev.yml");

    const parsedConfig = yaml.load(await fs.readFile(configPath, "utf8"));
    const parsedSecrets = yaml.load(await fs.readFile(secretsPath, "utf8"));

    // assert .gnarengine directory in projectDir
    const gnarHiddenDir = path.join(projectDir, ".gnarengine");
    await assertGnarEngineHiddenDir(gnarHiddenDir);

    // create nginx.conf dynamically from configPath
    const nginxConfPath = path.join(gnarHiddenDir, "nginx", "nginx.conf");
    const serviceConfDir = path.join(gnarHiddenDir, "nginx", "service_conf")
    await fs.mkdir(serviceConfDir, { recursive: true });

    const nginxConf = await createDynamicNginxConf({
        config: parsedConfig.config,
        projectDir: projectDir,
        serviceConfDir: serviceConfDir
    });
    await fs.writeFile(nginxConfPath, nginxConf);

    // create and up containers
    const dockerComposePath = path.join(gnarHiddenDir, "docker-compose.dev.yml");
    const dockerCompose = await buildAndUpContainers({
        config: parsedConfig.config,
        secrets: parsedSecrets,
        gnarHiddenDir: gnarHiddenDir,
        projectDir: projectDir,
        coreDev: coreDev,
        bootstrapDev: bootstrapDev,
        test: test,
        testService: testService,
        testMode: testMode,
        resetDatabases: resetDatabases,
        resetDatabase: resetDatabase,
        attachAll: attachAll,
        build: build,
    });
}

/**
 * Down the containers
 *
 * @param {object} options
 * @param {string} options.projectDir - The project directory
 * @param {boolean} [options.allContainers=false] - Stop all running containers (not just Gnar Engine ones)
 */
export async function down({ projectDir, allContainers = false }) {
    // list all containers
    let containers = await docker.listContainers();

    // filter containers by image name
    if (!allContainers) {
        containers = containers.filter(c => c.Image.includes("ge-localdev"));
    }

    if (containers.length === 0) {
        console.log("No running containers found.");
        return;
    }

    console.log('Stopping containers...');
    containers.forEach(c => {
        console.log(` - ${c.Names[0]} (${c.Id})`);
    });

    // stop each container
    await Promise.all(
        containers.map(c => {
            const container = docker.getContainer(c.Id);
            return container.stop().catch(err => {
                console.error(`Failed to stop ${c.Names[0]}: ${err.message}`);
            });
        })
    );

    // // remove bound mounts
    // await Promise.all(
    //     containers.map(async c => {
    //         const container = docker.getContainer(c.Id);
    //         const containerInfo = await container.inspect();
    //         await removeBindMounts({ containerInfo: containerInfo });
    //     })
    // );

    // remove each container
    await Promise.all(
        containers.map(c => {
            const container = docker.getContainer(c.Id);
            return container.remove({ force: true }).catch(err => {
                console.error(`Failed to remove ${c.Names[0]}: ${err.message}`);
            });
        })
    );

    console.log('Containers stopped and removed.');
}

/**
 * Remove bind mounts
 *
 * @param {object} containerInfo
 */
export async function removeBindMounts({containerInfo}) {

    const binds = containerInfo.HostConfig.Binds || [];

    for (const bind of binds) {
        const hostPath = bind.split(':')[0];
        try {
            await execAsync(`sudo umount ${hostPath}`);
            console.log(`Unmounted ${hostPath}`);
        } catch (err) {
            console.warn(`Failed to unmount ${hostPath}: ${err.message}`);
        }
    }
}

/**
 * Create dynamic nginx.conf file for running application locally
 * 
 * @param {object} config
 * @param {string} serviceConfDir
 * @param {string} projectDir
 */
export async function createDynamicNginxConf({ config, serviceConfDir, projectDir }) {
    // Start with the static parts of nginx.conf
    let nginxConf = `
        events { worker_connections 1024; }

        http {
            server {
                listen 80;
                server_name ${config.namespace};
                include /etc/nginx/service_conf/*.conf;

    `;

    // Loop over each service
    for (const service of config.services || []) {
        // Check if override is present and add conf to service_conf dir
        const serviceDir = path.join(projectDir, 'services', service.name);

        if (await fs.stat(serviceDir).then(() => true).catch(() => false)) {
            const overridePath = path.join(serviceDir, 'nginx.conf');
            if (await fs.stat(overridePath).then(() => true).catch(() => false)) {
                const overrideConf = await fs.readFile(overridePath, 'utf8');

                // write to service_conf directory
                const serviceConfPath = path.join(serviceConfDir, `${service.name}.conf`);
                await fs.writeFile(serviceConfPath, overrideConf);

                continue;
            }
        }

        // Otherwise create generic conf block
        const serviceName = service.name;
        const paths = service.listener_rules?.paths || [];
        const containerPort = service.ports && service.ports.length > 0 ? service.ports[0].split(':')[1] : '3000';

        for (const p of paths) {
            // normalize path without trailing slash
            const cleanPath = p.replace(/\/+$/, '');

            // build location block
            nginxConf += `
                # ${serviceName} service
                location ${cleanPath} {
                    rewrite ^${cleanPath}$ ${cleanPath}/ break;
                    proxy_pass http://${serviceName}-service:${containerPort}${cleanPath};
                }
            `;
        }
    }

    // Close server and http blocks
    nginxConf += `
            }
        }
    `;

    return nginxConf;
}

/**
 * Create dynamic docker compose file for running application locally
 * 
 * @param {object} config
 * @param {object} secrets
 * @param {string} gnarHiddenDir
 * @param {string} projectDir
 * @param {boolean} coreDev - Whether to volume mount the core source code
 * @param {boolean} bootstrapDev - Whether to set the cli/src/bootstrap directory as the project directory
 * @param {boolean} build - Whether to re-build images
 * @param {boolean} test - Whether to run tests with ephemeral databases
 * @param {string} testService - The service to run tests for (only applicable if test=true)
 * @param {boolean} resetDatabases - Whether to drop all service databases, re-running all migrations and seeders
 * @
 * @param {boolean} attachAll - Whether to attach to all containers' stdio (otherwise databases and message queue are detached)
 */
async function buildAndUpContainers({ 
        config, 
        secrets, 
        gnarHiddenDir, 
        projectDir, 
        coreDev = false, 
        bootstrapDev = false, 
        build = false, 
        test = false, 
        testService,
        testMode = 'ephemeral',
        resetDatabases = false,
        resetDatabase = '',
        attachAll = false 
    }) {
    
    let mysqlPortsCounter = 3306;
    let mongoPortsCounter = 27017;
    let mysqlHostsRequired = [];
    let mongoHostsRequired = [];
    const services = {};
    const databaseServices = {};

    console.log('========   g n a r   e n g i n e   ========');
    console.log('⛏️  Starting development environment...');

    // env var adjustments
    for (const svc of config.services) {
        // Tests
        if (test && testMode === 'ephemeral') {
            if (secrets.services?.[svc.name]?.MYSQL_HOST) {
                secrets.services[svc.name].MYSQL_HOST = 'db-mysql-test';
            }

            if (secrets.services?.[svc.name]?.MONGO_HOST) {
                secrets.services[svc.name].MONGO_HOST = 'db-mongo-test';
            }

            if (secrets.services?.[svc.name]) {
                secrets.services[svc.name].NODE_ENV = 'test';

                if (testService && svc.name === testService) {
                    secrets.services[svc.name].RUN_TESTS = testMode;
                }
            }

        } else if (test) {
            if (secrets.services?.[svc.name]) {
                if (testService && svc.name === testService) {
                    secrets.services[svc.name].RUN_TESTS = testMode;
                }
            }
        }

        // Reset all databases
        if (resetDatabases) {
            if (secrets.services?.[svc.name]) {
                secrets.services[svc.name].RESET_DATABASE = true;
            }
        }

        // Reset specific database
        else if (resetDatabase) {
            if (svc.name === resetDatabase) {
                if (secrets.services?.[svc.name]) {
                    secrets.services[svc.name].RESET_DATABASE = true;
                }
            }
        }
    }

    // create bridge network
    const networkName = `ge-${config.environment}-${config.namespace}`;
    await createBridgeNetwork({
        name: networkName
    });

    // provision the provisioner service
    const provisionerTag = `ge-${config.environment}-${config.namespace}-provisioner`;
    
    if (build) {
        await buildImage({
            context: directories.provisioner,
            dockerfile: 'Dockerfile',
            imageTag: provisionerTag,
            nocache: false
        });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const provisionerBinds = [
        `${path.resolve(__dirname, '../provisioner', 'src')}:/usr/gnar_engine/app/src`
    ];

    if (coreDev) {
        provisionerBinds.push(`${gnarEngineCliConfig.coreDevPath}:${gnarEngineCliConfig.corePath}`);
    }

    const provisioner = await createContainer({
        name: provisionerTag,
        image: provisionerTag,
        env: {
            PROVISIONER_SECRETS: JSON.stringify(secrets)
        },
        ports: {},
        binds: provisionerBinds,
        restart: 'no',
        attach: true,
        network: networkName
    });

    // Nginx
    const nginxName = `ge-${config.environment}-${config.namespace}-nginx`;
    services[nginxName] = await createContainer({
        name: nginxName,
        image: 'nginx:latest',
        ports: { 80: 80, 443: 443 },
        binds: [
            `${gnarHiddenDir}/nginx/nginx.conf:/etc/nginx/nginx.conf`,
            `${gnarHiddenDir}/nginx/service_conf:/etc/nginx/service_conf`
        ],
        attach: attachAll,
        network: networkName
    });

    // Rabbit MQ 
    const rabbitMqName = `ge-${config.environment}-${config.namespace}-rabbitmq`;
    services[rabbitMqName] = await createContainer({
        name: rabbitMqName,
        image: 'rabbitmq:management',
        env: {
            RABBITMQ_DEFAULT_USER: secrets.global.RABBITMQ_USER || '',
            RABBITMQ_DEFAULT_PASS: secrets.global.RABBITMQ_PASS || ''
        },
        ports: { 5672: 5672, 15672: 15672 },
        binds: [],
        attach: attachAll,
        network: networkName,
        aliases: ['rabbitmq']
    });

    // services
    for (const svc of config.services) {

        // build service image
        const svcTag = `ge-${config.environment}-${config.namespace}-${svc.name}`;

        if (build) {
            await buildImage({
                context: path.resolve(projectDir, 'services', svc.name),
                dockerfile: 'Dockerfile',
                imageTag: svcTag,
                nocache: false
            });
        }

        // env variables
        const serviceEnvVars = secrets.services?.[svc.name] || {};
        const localisedServiceEnvVars = {};

        for (const [key, value] of Object.entries(serviceEnvVars)) {
            localisedServiceEnvVars[svc.name.toUpperCase() + '_' + key] = value;
        }

        const env = {
            ...(secrets.global || {}),
            ...(localisedServiceEnvVars || {})
        };

        // test mode adjustments
        if (test && testMode === 'ephemeral') {
            if (svc.depends_on && svc.depends_on.includes('db-mysql')) {
                svc.depends_on = svc.depends_on.filter(d => d !== 'db-mysql');
                svc.depends_on.push('db-mysql-test');
            }

            if (svc.depends_on && svc.depends_on.includes('db-mongo')) {
                svc.depends_on = svc.depends_on.filter(d => d !== 'db-mongo');
                svc.depends_on.push('db-mongo-test');
            }
        }

        // add the core source code mount if in coreDev mode
        const serviceVolumes = [
            `${path.resolve(projectDir, 'services', svc.name, 'src')}:/usr/gnar_engine/app/src`
        ];

        if (coreDev) {
            serviceVolumes.push(`${gnarEngineCliConfig.coreDevPath}:${gnarEngineCliConfig.corePath}`);
        }

        if (svc.extra_binds) {
            svc.extra_binds.forEach((bind, index) => {
                bind = `${gnarHiddenDir}/data/${svc.name}-data/bind-${index}/:${bind}`;
                serviceVolumes.push(bind);
            })
        }

        // split from "port:port" to { port: port }
        const ports = {};
        for (const portMapping of svc.ports || []) {
            const [hostPort, containerPort] = portMapping.split(':').map(p => parseInt(p, 10));
            ports[containerPort] = hostPort;
        }

        services[svcTag] = await createContainer({
            name: svcTag,
            image: svcTag,
            command: svc.command || [],
            env: env,
            ports: ports,
            binds: serviceVolumes,
            restart: 'no',
            attach: svc.detach ? !svc.detach : true,
            network: networkName,
            aliases: [`${svc.name}-service`]
        });

        // check if mysql service required
        if (
            serviceEnvVars.MYSQL_HOST &&
            secrets.provision?.MYSQL_ROOT_PASSWORD
        ) {
            mysqlHostsRequired.push(serviceEnvVars.MYSQL_HOST);
        }

        // add a mongodb instance if required
        if (
            serviceEnvVars.MONGO_HOST &&
            secrets.provision?.MONGO_ROOT_PASSWORD
        ) {
            mongoHostsRequired.push(serviceEnvVars.MONGO_HOST);
        }
    }

    // add mysql if required
    if (mysqlHostsRequired.length > 0) {
        for (const host of mysqlHostsRequired) {
            if (services[host]) {
                continue;
            }

            const binds = [];
            binds.push(`${gnarHiddenDir}/data/${host}-data:/var/lib/mysql`)

            const mysqlContainerName = `ge-${config.environment}-${config.namespace}-${host}`;
            databaseServices[mysqlContainerName] = await createContainer({
                name: `ge-${config.environment}-${config.namespace}-${host}`,
                image: 'mysql',
                env: {
                    MYSQL_HOST: host,
                    MYSQL_ROOT_PASSWORD: secrets.provision.MYSQL_ROOT_PASSWORD
                },
                ports: {
                    [mysqlPortsCounter]: mysqlPortsCounter
                },
                binds: binds,
                restart: 'always',
                attach: attachAll,
                network: networkName,
                aliases: [host]
            });

            mysqlPortsCounter++;
        }
    }

    // add mongo hosts if required
    if (mongoHostsRequired.length > 0) {
        for (const host of mongoHostsRequired) {
            if (services[host]) {
                continue;
            }

            const binds = [];
            binds.push(`${gnarHiddenDir}/data/${host}-data:/data/db`);

            const mongoContainerName = `ge-${config.environment}-${config.namespace}-${host}`;
            databaseServices[mongoContainerName] = await createContainer({
                name: `ge-${config.environment}-${config.namespace}-${host}`,
                image: 'mongo:latest',
                env: {
                    MONGO_INITDB_ROOT_USERNAME: 'root',
                    MONGO_INITDB_ROOT_PASSWORD: secrets.provision.MONGO_ROOT_PASSWORD
                },
                ports: {
                    [mongoPortsCounter]: 27017
                },
                binds: binds,
                restart: 'always',
                attach: attachAll,
                network: networkName,
                aliases: [host]
            });

            // increment mongo port for next service as required
            mongoPortsCounter++;
        }
    }

    // start RabbitMQ alongside the database containers, but only wait on databases
    services[rabbitMqName].start();

    // start the database containers
    await Promise.all(
        Object.values(databaseServices).map(container => container.start())
    );

    // start the provisioner container and wait for it to finish before starting the rest of the services
    await provisioner.start();
    const provisionerResult = await provisioner.wait();

    if (provisionerResult.StatusCode !== 0) {
        throw new Error(`Provisioner exited with status code ${provisionerResult.StatusCode}. Services were not started.`);
    }

    // start the containers
    await Promise.all(
        Object.entries(services)
            .filter(([name]) => name !== rabbitMqName)
            .map(([, container]) => container.start())
    );
}

/**
 * Assert the .gnarengine directory in the project directory
 */
async function assertGnarEngineHiddenDir(gnarHiddenDir) {
    await fs.mkdir(gnarHiddenDir, { recursive: true });
}
