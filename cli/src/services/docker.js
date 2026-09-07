import Docker from 'dockerode';
import { Writable } from 'stream';
import path from 'path';
import tar from 'tar-fs';
import fs from 'fs';

const docker = new Docker();

/**
 * Build Docker image
 *
 * @param {Object} options
 * @param {string} options.context - The build context directory
 * @param {string} options.dockerfile - The Dockerfile path relative to the context
 * @param {string} options.imageTag - The tag to assign to the built image
 * @param {boolean} [options.nocache=true] - Whether to build without cache
 */
export async function buildImage({ context, dockerfile, imageTag, nocache = true }) {

    console.log('Building image...', imageTag);

    // Create a tar stream of the full context folder
    const tarStream = tar.pack(context);

    const stream = await docker.buildImage(tarStream, {
        t: imageTag,
        dockerfile,
        nocache
    });

    await new Promise((resolve, reject) => {
        docker.modem.followProgress(
            stream,
            (err, res) => {
                if (err) return reject(err);
                resolve(res);
            },
            (event) => {
                if (event.stream) process.stdout.write(event.stream);

                // Catch BuildKit-style errors
                if (event.error) return reject(new Error(event.error));
                if (event.errorDetail && event.errorDetail.message) {
                    return reject(new Error(event.errorDetail.message));
                }
            }
        );
    });

    console.log('Built image:', imageTag);
}

/**
 * Pull a Docker image, unless it is already in the local image store
 *
 * The engine API does not do this for us. `docker run` pulls what it is missing
 * before it starts, but the create endpoint underneath it does not: it answers
 * a 404 and leaves the caller to work out that the image was the problem. So
 * every image we do not build ourselves -- nginx, mysql, mongo, rabbitmq -- has
 * to be asked for here first, or a machine that has never run the stack before
 * fails on the first container it reaches.
 *
 * @param {Object} options
 * @param {string} options.image - The image to pull, with or without a tag
 */
export async function pullImage({ image }) {

    // Already here, from a previous run or a build. Skipped rather than pulled
    // again so a rebuild does not go back to the registry for every base image.
    try {
        await docker.getImage(image).inspect();
        return;
    } catch (err) {
        if (err.statusCode !== 404) {
            throw err;
        }
    }

    console.log('Pulling image...', image);

    const stream = await docker.pull(image);

    await new Promise((resolve, reject) => {
        docker.modem.followProgress(
            stream,
            (err, res) => {
                if (err) return reject(err);

                // A pull that fails part way through still ends the stream
                // cleanly, and says so in an event rather than in the error. A
                // tag that does not exist reads as a successful pull without
                // this, and the 404 lands on createContainer instead.
                const failed = res.find(event => event.error);

                if (failed) {
                    return reject(new Error(`Failed to pull ${image}: ${failed.error}`));
                }

                resolve(res);
            },
            (event) => {
                // Layer by layer progress carries an id and arrives thousands of
                // times. The handful of lines without one are the ones worth
                // reading: what is being pulled, and what came of it.
                if (event.status && !event.id) {
                    console.log(event.status);
                }
            }
        );
    });

    console.log('Pulled image:', image);
}

/**
 * Create docker container
 *
 * @param {Object} options
 * @param {string} options.name - Container name
 * @param {string} options.image - Docker image to use
 * @param {Array} [options.command] - Command to run in the container
 * @param {Object} [options.env] - Environment variables
 * @param {Object} [options.ports] - Port mappings (containerPort: hostPort)
 * @param {Array} [options.binds] - Volume bindings
 * @param {string} [options.restart] - Restart policy
 * @param {boolean} [options.attach] - Whether to attach to container output
 * @param {string} [options.network] - Network name
 * @param {boolean} [options.pull=false] - Whether to pull the image first. For images we do not build ourselves
 * @returns {Promise<Docker.Container>} - The started container
 */
export async function createContainer({ name, image, command = [], env = {}, ports = {}, binds = [], restart = 'always', attach = true, network, aliases = [], pull = false }) {

    // Images we build carry a tag of ours and are never pulled: a missing one
    // means the build did not run, and saying so beats a registry lookup that
    // was always going to fail.
    if (pull) {
        await pullImage({ image });
    }

    // remove container first
    try {
        const existingContainer = docker.getContainer(name);
        await existingContainer.inspect();
        await existingContainer.remove({ force: true });
    } catch (err) {
        // Container does not exist, ignore
    }

    // create container
    const containerConfig = {
        name,
        Image: image,
        Cmd: command,
        Env: Object.entries(env).map(([k, v]) => `${k}=${v}`),
        HostConfig: {
            RestartPolicy: { Name: restart },
            Binds: binds,
            PortBindings: Object.fromEntries(
                Object.entries(ports).map(([cPort, hPort]) => [
                    `${cPort}/tcp`,
                    [{ HostPort: String(hPort) }]
                ])
            ),
        },
        ExposedPorts: Object.fromEntries(
            Object.keys(ports).map(p => [`${p}/tcp`, {}])
        )
    };

    const container = await docker.createContainer(containerConfig);

    // Attach logs before starting the container
    if (attach) {
        const stream = await container.attach({ stream: true, stdout: true, stderr: true, logs: true });
        const stdoutStream = createPrefixStream(name, process.stdout);
        const stderrStream = createPrefixStream(name, process.stderr);

        container.modem.demuxStream(stream, stdoutStream, stderrStream);
    }

    await docker.getNetwork(network).connect({
        Container: container.id,
        EndpointConfig: {
            Aliases: aliases
        }
    });

    return container;
}

/**
 * Create network
 *
 * @param {String} name - Network name
 */
export async function createBridgeNetwork({ name }) {
    try {
        await docker.createNetwork({
            Name: name,
            Driver: 'bridge',
            CheckDuplicate: true
        });
    } catch (err) {
        if (err.statusCode === 409) {
            // network already exists, ignore
            return;
        }
        console.error(err);
    }
}

/**
 * Tansform stream
 *
 * @param {String} name - Container name
 * @returns {Transform} - Transform stream
 */
function createPrefixStream(name, targetStream) {
    const color = colorForName(name);
    const labelWidth = 38;
    name = '[' + name + ']';
    const paddedName = name.padEnd(labelWidth, ' ');

    return new Writable({
        write(chunk, encoding, callback) {
            const lines = chunk.toString().split(/\r?\n/);
            for (const line of lines) {
                if (line.trim()) {
                    targetStream.write(`${color}${paddedName}${RESET} ${line}\n`);
                }
            }
            callback();
        }
    });
}

/**
 * Colours for container name
 */
const COLORS = [
    '\x1b[31m', // red
    '\x1b[32m', // green
    '\x1b[33m', // yellow
    '\x1b[34m', // blue
    '\x1b[35m', // magenta
    '\x1b[36m', // cyan
    '\x1b[37m', // white
];

const RESET = '\x1b[0m';

function colorForName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}
