import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { profiles } from '../profiles/profiles.client.js';
import { helpers } from '../helpers/helpers.js';
import Handlebars from 'handlebars';

/**
 * Gnar Engine Scaffolder
 */
export const scaffolder = {

    /**
     * Create a new service
     * 
     * @param {object} param
     * @param {string} param.serviceName - The name of the service to create
     * @param {string} param.database - The database type (e.g., 'mysql', 'mongodb')
     * @param {string} param.projectDir - The project directory where the service will be created 
     * @returns {object} - An object containing a success message and the service path
     */
    createNewService: function ({serviceName, database, projectDir}) {
        const serviceDir = projectDir + 'services/' + serviceName;
        console.log('Service directory:', serviceDir);

        // Check if the service directory already exists
        if (fs.existsSync(serviceDir)) {
            throw new Error(`Service "${serviceName}" already exists at ${serviceDir}`);
        }

        // Create the service directory
        fs.mkdirSync(serviceDir, { recursive: true });

        // Get all files in the templates directory
        const templatesDir = path.join(import.meta.dirname, '../../templates/service');
        const templateFiles = scaffolder.getAllTemplateFiles({
            dir: templatesDir,
            baseDir: templatesDir
        }); 

        // Register Handlebars helpers
        Object.entries(helpers).forEach(([name, fn]) => {
            Handlebars.registerHelper(name, fn);
        });

        // Write the files to the service directory
        templateFiles.forEach(file => {
            let sourcePath;
            let targetPath;
            const templateArgs = {
                serviceName,
                database
            };

            switch (file.extension) {
                case '.hbs':
                    // Compile the Handlebars template for content
                    const templateContent = fs.readFileSync(file.fullPath, 'utf8');
                    const compiledTemplate = Handlebars.compile(templateContent);
                    const renderedContent = compiledTemplate(templateArgs);

                    // Compile the Handlebars template for the filename (excluding .hbs)
                    const filenameTemplate = Handlebars.compile(file.relativePath.replace(/\.hbs$/, ''));
                    const renderedFilename = filenameTemplate(templateArgs);
                    targetPath = path.join(serviceDir, renderedFilename);

                    // Ensure directory exists
                    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                    fs.writeFileSync(targetPath, renderedContent, 'utf8');
                    break;
                default:
                    // By default, copy the file to the service directory
                    sourcePath = file.fullPath;
                    targetPath = path.join(serviceDir, file.relativePath);
                    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                    fs.copyFileSync(sourcePath, targetPath);
                    break;
            }
        });

        // Scaffold deploy.yml
        scaffolder.scaffoldServiceDeployYml({
            deployPath: path.join(projectDir, 'deploy.localdev.yml'),
            serviceName: serviceName,
            database: database
        });

        // Scaffold secrets.yml
        scaffolder.scaffoldServiceSecrets({
            secretsPath: path.join(projectDir, 'secrets.localdev.yml'),
            serviceName: serviceName,
            database: database
        });

        return {
            message: `Service "${serviceName}" created successfully at ${serviceDir}`,
            servicePath: serviceDir
        };
    },

    /**
     * Create new front-end service
     * 
     * @param {object} param
     * @param {string} param.serviceName - The name of the service to create
     * @param {string} param.projectDir - The project directory where the service will be created 
     * @returns {object} - An object containing a success message and the service path
     */
    createNewFrontEndService: function ({serviceName, projectDir}) {
        const serviceDir = projectDir + 'services/' + serviceName;
        console.log('Service directory:', serviceDir);

        // Check if the service directory already exists
        if (fs.existsSync(serviceDir)) {
            throw new Error(`Service "${serviceName}" already exists at ${serviceDir}`);
        }

        // Create the service directory
        fs.mkdirSync(serviceDir, { recursive: true });
    },

    /**
     * Recursively get all template files in a directory
     * 
     * @param {object} params
     * @param {string} params.dir - The directory to search for template files
     * @param {string} [params.baseDir=dir] - The base directory for relative paths
     * @param {Array} [params.fileList=[]] - The list to store found files
     * @returns {Array} - An array of objects containing full and relative paths of template files
     */
    getAllTemplateFiles: function ({dir, baseDir = dir, fileList = []}) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        entries.forEach(entry => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== 'data') {
                    if (!entry.name.startsWith('.') || entry.name == '.gnarengine') {
                        scaffolder.getAllTemplateFiles({
                            dir: fullPath,
                            baseDir,
                            fileList
                        });
                    }
                }
            } else {
                const relativePath = path.relative(baseDir, fullPath);

                if (entry.name !== 'docker-compose.dev.yml') {
                    fileList.push({ fullPath, relativePath, extension: path.extname(entry.name) });
                }
            }
        });

        return fileList;
    },

    /**
     * Create a new project
     * 
     * @param {object} param 
     * @param {string} param.projectName - The name of the project to create
     * @param {string} param.projectDir - The directory where the project will be created
     * @param {string} param.rootAdminEmail - The email for the root admin user
     */
    createNewProject: function ({projectName, projectDir, rootAdminEmail}) {
        projectName = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');

        const fullProjectPath = path.join(projectDir, projectName);
        console.log('Creating project in:', fullProjectPath);

        // Check to make sure there isn't already a profile with this project name
        const profileName = projectName + ':local';
        const allProfiles = profiles.getAllProfiles();

        if (allProfiles && allProfiles.profiles) {
            if (allProfiles.profiles[profileName]) {
                throw new Error(`A profile with the name "${projectName}:local" already exists. Please choose a different project name or delete the existing profile.`);
            }
        }

        // Create the project directory
        if (!fs.existsSync(fullProjectPath)) {
            fs.mkdirSync(fullProjectPath, { recursive: true });
            fs.mkdirSync(path.join(fullProjectPath, 'data'), { recursive: true });
        }

        // Copy bootstrap
        const bootstrapDir = path.join(import.meta.dirname, '../../bootstrap');
        const bootstrapFiles = scaffolder.getAllTemplateFiles({
            dir: path.join(bootstrapDir),
            baseDir: path.join(bootstrapDir)
        });

        let cliApiKey = '';

        console.log('Copying bootstrap');
        
        if (!bootstrapFiles || bootstrapFiles.length === 0) {
            throw new Error('No bootstrap files found');
        }

        bootstrapFiles.forEach(file => {
            let sourcePath;
            let targetPath;

            sourcePath = file.fullPath;
            targetPath = path.join(fullProjectPath, file.relativePath);

            // create random secrets
            if (file.relativePath === 'secrets.localdev.yml') {
                console.log('Creating random secrets: secrets.localdev.yml');

                const scaffoldedSecrets = scaffolder.scaffoldProjectSecrets({
                    secretsPath: sourcePath,
                    bootstrapDir: path.dirname(sourcePath),
                    projectName: projectName,
                    rootAdminEmail: rootAdminEmail
                });
                cliApiKey = scaffoldedSecrets.cliApiKey;
                sourcePath = path.join(path.dirname(sourcePath), 'secrets.localdev.yml.temp');
            }

            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.copyFileSync(sourcePath, targetPath);
        });

        // Create the profile
        console.log('Creating new CLI profile: ' + profileName);
        const config = {
            CLI_API_URL: 'http://localhost',
            CLI_API_USERNAME: 'gnarlyroot',
            CLI_API_KEY: cliApiKey,
            PROJECT_DIR: fullProjectPath
        };
        
        // save profile to config file
        profiles.createProfile({ 
            profileName: profileName,
            config: config
        });

        // set active profile if required
        console.log('Setting CLI profile to active');
        profiles.setActiveProfile({
            profileName: profileName
        });

        console.log('g n a r  e n g i n e - Created new project: ' + projectName);
        console.log('Run `gnar dev up` to start the development server');
    },

    /**
     * Scaffold secrets for a new project
     *
     * @param {object} param
     * @param {string} param.bootstrapDir - The bootstrap directory path
     * @param {string} param.projectName - The project name
     * @param {string} param.rootAdminEmail - The root admin email
     * @returns {object} - An object containing the CLI API key
     */
    scaffoldProjectSecrets: function ({bootstrapDir, projectName, rootAdminEmail}) {
        const secretsPath = path.join(bootstrapDir, 'secrets.localdev.yml');
        const rawSecrets = fs.readFileSync(secretsPath, 'utf8');
        const parsedSecrets = yaml.load(rawSecrets);

        // generate random passwords
        Object.keys(parsedSecrets.services).forEach(serviceName => {
            Object.keys(parsedSecrets.services[serviceName]).forEach(key => {
                if (key.toLowerCase().includes('pass')) {
                    parsedSecrets.services[serviceName][key] = helpers.generateRandomString(16);
                }
            });
        });

        // set random root api key
        const cliApiKey = helpers.generateRandomString(32);
        parsedSecrets.services.user.ROOT_ADMIN_API_KEY = cliApiKey;
        parsedSecrets.services.user.ROOT_ADMIN_EMAIL = rootAdminEmail || 'admin@' + projectName + '.local';

        // save updated secrets file to a temp file version (so we don't overwrite the original in templates)
        const newSecretsContent = yaml.dump(parsedSecrets);
        fs.writeFileSync(secretsPath + '.temp', newSecretsContent, 'utf8');

        return { cliApiKey };
    },

    /**
     * Scaffold secrets for a new service
     *
     * @param {object} param
     * @param {string} param.secretsPath - The path to the secrets file
     * @param {string} param.serviceName - The service name
     * @param {string} param.database - The database type
     */
    scaffoldServiceSecrets: function ({secretsPath, serviceName, database}) {
        const rawSecrets = fs.readFileSync(secretsPath, 'utf8');
        const parsedSecrets = yaml.load(rawSecrets);

        if (!parsedSecrets.services) {
            parsedSecrets.services = {};
        }

        parsedSecrets.services[serviceName] = {};

        // generate random passwords
        switch (database) {
            case 'mysql':
                parsedSecrets.services[serviceName]['MYSQL_USER'] = serviceName + '_user';
                parsedSecrets.services[serviceName]['MYSQL_PASSWORD'] = helpers.generateRandomString(16);
                parsedSecrets.services[serviceName]['MYSQL_DATABASE'] = serviceName + '_db';
                parsedSecrets.services[serviceName]['MYSQL_HOST'] = serviceName + '-db';
                parsedSecrets.services[serviceName]['MYSQL_RANDOM_ROOT_PASSWORD'] = helpers.generateRandomString(16);
                break;
            case 'mongodb':
                parsedSecrets.services[serviceName]['MONGO_USER'] = serviceName + '_user';
                parsedSecrets.services[serviceName]['MONGO_PASSWORD'] = helpers.generateRandomString(16);
                parsedSecrets.services[serviceName]['MONGO_NAME'] = serviceName + '_db';
                parsedSecrets.services[serviceName]['MONGO_HOST'] = serviceName + '-db';
                break;
            default:
                throw new Error(`Unsupported database type in secret scaffolder: ${database}`);
        }

        // save updated secrets file
        const newSecretsContent = yaml.dump(parsedSecrets);
        fs.writeFileSync(secretsPath, newSecretsContent, 'utf8');
    },

    /**
     * Scaffold deploy.yml for a new service
     *
     * @param {object} param
     * @param {string} param.deployPath - The path to the deploy.yml file
     * @param {string} param.serviceName - The service name
     * @param {string} param.database - The database type
     * @param {number} [param.hostPort=null] - The host port (optional)
     */
    scaffoldServiceDeployYml: function ({deployPath, serviceName, database, hostPort = null}) {
        // parse existing deploy.yml
        let deploy = yaml.load(fs.readFileSync(deployPath, 'utf8'));

        if (!hostPort) {
            // get next available host port
            const hostPorts = [];

            deploy.config.services.forEach(svc => {
                if (svc.ports && svc.ports.length > 0) {
                    svc.ports.forEach(portMapping => {
                        const [hostPort, containerPort] = portMapping.split(':').map(p => parseInt(p, 10));
                        hostPorts.push(hostPort);
                    });
                }
            });

            hostPorts.sort((a, b) => a - b);
            hostPort = hostPorts[hostPorts.length - 1] + 1;
        }

        // prepare new service config
        const serviceConfig = {
            name: serviceName,
            listener_rules: {
                paths: [
                    `/${serviceName}`
                ]
            },
            min_tasks: 1,
            max_tasks: 1,
            command: ["npm", "run", "start:dev"],
            ports: [
                `${hostPort}:3000`
            ]
        }

        // add database service if required
        if (database) {
            serviceConfig.depends_on = [
                `${serviceName}-db`
            ]
        }

        // add to deploy config
        deploy.config.services.push(serviceConfig);

        // write deploy.yml file
        const deployYmlContent = yaml.dump(deploy);
        fs.writeFileSync(deployPath, deployYmlContent, 'utf8');
    }
}
