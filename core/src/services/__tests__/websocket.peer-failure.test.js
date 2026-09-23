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

const timesAsked = () => execute.mock.calls
    .filter(([name]) => name === 'controlService.peerConnectionDropped').length;

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

    it('keeps asking while the control service cannot answer', async () => {
        // the control service is still coming up, as it is after a restart
        execute.mockRejectedValue(new Error('No replicas connected for service controlService'));

        wsManager.peerRetryDelays = [10, 10, 10];
        wsManager.handlePeerFailure(peer, config);
        await jest.advanceTimersByTimeAsync(100);

        expect(timesAsked()).toBe(3);
    });

    it('stops asking as soon as somebody connects in', async () => {
        execute.mockImplementation(async () => {
            // an inbound connection arrives after the first attempt
            wsManager.wsConnections.projectService = { 'project-2': {} };
            return {};
        });

        wsManager.peerRetryDelays = [10, 10, 10];
        wsManager.handlePeerFailure(peer, config);
        await jest.advanceTimersByTimeAsync(100);

        expect(timesAsked()).toBe(1);
    });
});
