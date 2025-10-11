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

        console.log('Template files:', templateFiles);

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
                if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'data') {
                    scaffolder.getAllTemplateFiles({
                        dir: fullPath,
                        baseDir,
                        fileList
                    });
                }
            } else {
                const relativePath = path.relative(baseDir, fullPath);
                fileList.push({ fullPath, relativePath, extension: path.extname(entry.name) });
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
     */
    createNewProject: function ({projectName, projectDir}) {
        projectName = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');

        const fullProjectPath = path.join(projectDir, projectName);
        console.log('Creating project in:', fullProjectPath);

        // Create the project directory
        if (!fs.existsSync(fullProjectPath)) {
            fs.mkdirSync(fullProjectPath, { recursive: true });
        }

        // Copy bootstrap
        const bootstrapDir = path.join(import.meta.dirname, '../../bootstrap');
        const bootstrapFiles = scaffolder.getAllTemplateFiles({
            dir: path.join(bootstrapDir),
            baseDir: path.join(bootstrapDir)
        });

        let cliApiKey = '';

        console.log('Copying bootstrap');
        bootstrapFiles.forEach(file => {
            let sourcePath;
            let targetPath;

            sourcePath = file.fullPath;
            targetPath = path.join(projectDir, file.relativePath);

            // create random secrets
            if (file.relativePath === 'secrets.localdev.yml') {
                console.log('Creating random secrets: secrets.localdev.yml');
                const secretsPath = path.join(bootstrapDir, 'secrets.localdev.yml');
                const rawSecrets = fs.readFileSync(secretsPath, 'utf8');
                const parsedSecrets = yaml.load(rawSecrets);

                // generate random passwords
                Object.keys(parsedSecrets.services).forEach(serviceName => {
                    Object.keys(parsedSecrets.services[serviceName]).forEach(key => {
                        if (key.toLowerCase().includes('password') && (!parsedSecrets.services[serviceName][key] || parsedSecrets.services[serviceName][key] === 'changeme')) {
                            parsedSecrets.services[serviceName][key] = helpers.generateRandomString(16);
                        }
                    });
                });

                // set random root api key
                cliApiKey = helpers.generateRandomString(32);
                parsedSecrets.services.user.ROOT_ADMIN_API_KEY = cliApiKey;

                // save updated secrets file
                const newSecretsContent = yaml.dump(parsedSecrets);
                fs.writeFileSync(secretsPath, newSecretsContent, 'utf8');
            }

            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.copyFileSync(sourcePath, targetPath);
        });

        // Create the profile
        console.log('Creating new CLI profile: ' + projectName + ':local');
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

    }
}
