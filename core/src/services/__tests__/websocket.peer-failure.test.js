import { jest } from '@jest/globals';

jest.unstable_mockModule('ws', () => ({ default: {}, WebSocketServer: class {} }));
jest.unstable_mockModule('../logger.service.js', () => ({
    loggerService: { info: () => {}, error: () => {}, warn: () => {} }
}));

const execute = jest.fn(async () => ({}));
jest.unstable_mockModule('../../commands/command-bus.js', () => ({ commandBus: { execute } }));

const { wsManager } = await import('../websocket.service.js');

const config = { serviceName: 'userService', hostname: 'user-1' };
const peer = { name: 'projectService', hostname: 'project-1' };

const askedForAnother = () => execute.mock.calls
    .filter(([name]) => name === 'controlService.peerConnectionDropped')
    .map(([, args]) => args.getNewPeer);

describe('a peer connection that drops', () => {

    beforeEach(() => {
        execute.mockClear();
        wsManager.wsConnections = {};
        jest.useFakeTimers();
    });

    afterEach(() => jest.useRealTimers());

    it('asks for another peer when that was the last connection to the service', async () => {
        wsManager.wsConnections.projectService = {};

        await wsManager.handlePeerFailure(peer, config);
        await jest.advanceTimersByTimeAsync(3500);

        expect(askedForAnother()).toEqual([true]);
    });

    it('asks for another peer when it never had one', async () => {
        await wsManager.handlePeerFailure(peer, config);
        await jest.advanceTimersByTimeAsync(3500);

        expect(askedForAnother()).toEqual([true]);
    });

    it('leaves well alone while another replica of that service is still connected', async () => {
        wsManager.wsConnections.projectService = { 'project-2': {} };

        await wsManager.handlePeerFailure(peer, config);
        await jest.advanceTimersByTimeAsync(3500);

        expect(askedForAnother()).toEqual([false]);
    });
});
