import { spawn } from "child_process";
import process from "process";
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

/**
 * Start the application locally
 * - Creates a dynamic docker-compose file based on deploy.localdev.yml and secrets.localdev.yml
 * - Runs docker-compose up
 *
 * @param {object} options
 * @param {string} options.projectDir - The project directory
 * @param {boolean} [options.noCache=false] - Whether to build images without cache
 * @param {boolean} [options.detached=false] - Whether to run containers in background
 */
export async function up({ projectDir, noCache = false, detached = false }) {
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
    const nginxConf = await createDynamicNginxConf({
        config: parsedConfig.config
    });
    await fs.writeFile(nginxConfPath, nginxConf);

    // create docker-compose.yml dynamically from parsed config and secrets
    const dockerComposePath = path.join(gnarHiddenDir, "docker-compose.dev.yml");
    const dockerCompose = await createDynamicDockerCompose({
        config: parsedConfig.config,
        secrets: parsedSecrets,
        gnarHiddenDir: gnarHiddenDir,
        projectDir: projectDir
    });
    await fs.writeFile(dockerComposePath, yaml.dump(dockerCompose));

    // up docker-compose
    const args = ["-f", dockerComposePath, "up"];

    if (noCache) {
        args.push("--build");
    }

    if (detached) {
        args.push("-d");
    }

    const processRef = spawn(
        "docker-compose",
        args,
        {
            cwd: projectDir,
            stdio: "inherit",
            shell: "/bin/sh"
        }
    );

    // handle exit
    const exitCode = await new Promise((resolve) => {
        processRef.on("close", resolve);
    });

    if (exitCode !== 0) {
        throw new Error(`docker-compose up exited with code ${exitCode}`);
    }
}

/**
 * Create dynamic nginx.conf file for running application locally
 * 
 * @param {object} config
 * @param {string} outputPath - where to write nginx.conf
 */
export async function createDynamicNginxConf({ config, outputPath }) {
    // Start with the static parts of nginx.conf
    let nginxConf = `events {}

    http {
        server {
            listen 80;
            server_name ${config.namespace}.gnar.co.uk;
    `;

    // Loop over each service
    for (const service of config.services || []) {
        const serviceName = service.name;
        const paths = service.listener_rules?.paths || [];
        const containerPort = service.ports && service.ports.length > 0 ? service.ports[0].split(':')[1] : '3000';

        for (const p of paths) {
            // normalize path without trailing slash
            const cleanPath = p.replace(/\/+$/, '');
            const containerPort = 

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
 */
async function createDynamicDockerCompose({ config, secrets, gnarHiddenDir, projectDir }) {
    let mysqlPortsCounter = 3306;
    let mongoPortsCounter = 27017;
    const services = {};
    
    // nginx
    services['nginx'] = {
        image: 'nginx:latest',
        container_name: `ge-${config.environment}-${config.namespace}-nginx`,
        ports: [
            "80:80",
            "443:443"
        ],
        volumes: [
            `${gnarHiddenDir}/nginx/nginx.conf:/etc/nginx/nginx.conf`
        ],
        restart: 'always'
    }

    // rabbit
    services['rabbitmq'] = {
        image: 'rabbitmq:management',
        container_name: `ge-${config.environment}-${config.namespace}-rabbitmq`,
        ports: [
            "5672:5672",
            "15672:15672"
        ],
        environment: {
            RABBITMQ_DEFAULT_USER: secrets.global.RABBITMQ_DEFAULT_USER || '',
            RABBITMQ_DEFAULT_PASS: secrets.global.RABBITMQ_DEFAULT_PASS || ''
        },
        restart: 'always'
    }

    // services
    for (const svc of config.services) {

        // service name snake case
        const serviceNameSnakeCase = svc.name.charAt(0).toUpperCase() + svc.name.slice(1);

        // env variables
        const env = {
            ...(secrets.global || {}),
            ...(secrets.services?.[svc.name] || {})
        };
        const serviceEnvVars = secrets.services?.[svc.name] || {};

        // service block
        services[`${svc.name}-service`] = {
            container_name: `ge-${config.environment}-${config.namespace}-${svc.name}`,
            image: `ge-${config.environment}-${config.namespace}-${svc.name}`,
            build: {
                context: projectDir,
                dockerfile: `./Services/${serviceNameSnakeCase}/Dockerfile`
            },
            command: svc.command || [],
            environment: env,
            ports: svc.ports || [],
            depends_on: svc.depends_on || [],
            volumes: [
                `${projectDir}/Services/${serviceNameSnakeCase}/src:/usr/gnar_engine/app/src`
            ],
            restart: 'always'
        };

        // add a mysql instance if required
        if (
            serviceEnvVars.MYSQL_HOST &&
            serviceEnvVars.MYSQL_DATABASE &&
            serviceEnvVars.MYSQL_USER &&
            serviceEnvVars.MYSQL_PASSWORD &&
            serviceEnvVars.MYSQL_RANDOM_ROOT_PASSWORD
        ) {
            services[`${svc.name}-db`] = {
                container_name: `ge-${config.environment}-${config.namespace}-${svc.name}-db`,
                image: 'mysql',
                ports: [
                    `${mysqlPortsCounter}:${mysqlPortsCounter}`
                ],
                restart: 'always',
                environment: {
                    MYSQL_HOST: serviceEnvVars.MYSQL_HOST,
                    MYSQL_DATABASE: serviceEnvVars.MYSQL_DATABASE,
                    MYSQL_USER: serviceEnvVars.MYSQL_USER,
                    MYSQL_PASSWORD: serviceEnvVars.MYSQL_PASSWORD,
                    MYSQL_RANDOM_ROOT_PASSWORD: serviceEnvVars.MYSQL_RANDOM_ROOT_PASSWORD,
                },
                volumes: [
                    `${gnarHiddenDir}/Data/${svc.name}-db-data:/var/lib/mysql`
                ]
            }; 

            // increment mysql port for next service as required
            mysqlPortsCounter++;
        }

        // add a mongodb instance if required
        if (
            serviceEnvVars.MONGO_URL &&
            serviceEnvVars.MONGO_ROOT_PASSWORD &&
            serviceEnvVars.MONGO_USER &&
            serviceEnvVars.MONGO_PASSWORD
        ) {
            services[`${svc.name}-mongo`] = {
                container_name: `ge-${config.environment}-${config.namespace}-${svc.name}-mongo`,
                image: `ge-${config.environment}-${config.namespace}-${svc.name}-mongo`,
                ports: [
                    `${mongoPortsCounter}:${mongoPortsCounter}`
                ],
                restart: 'always',
                environment: {
                    [`${svc.name.toUpperCase()}_MONGO_URL`]: serviceEnvVars.MONGO_URL,
                    [`${svc.name.toUpperCase()}_MONGO_ROOT_PASSWORD`]: serviceEnvVars.MONGO_ROOT_PASSWORD,
                    [`${svc.name.toUpperCase()}_MONGO_USER`]: serviceEnvVars.MONGO_USER,
                    [`${svc.name.toUpperCase()}_MONGO_PASSWORD`]: serviceEnvVars.MONGO_PASSWORD,
                },
                volumes: [
                    `${gnarHiddenDir}/Data/${svc.name}-mongo-data:/data/db`
                ]
            };

            // increment mongo port for next service as required
            mongoPortsCounter++;
        }
        
    }

    return {
        version: "3.9",
        services
    }
}

/**
 * Assert the .gnarengine directory in the project directory
 */
async function assertGnarEngineHiddenDir(gnarHiddenDir) {
    await fs.mkdir(gnarHiddenDir, { recursive: true });
}
