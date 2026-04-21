import { Command } from 'commander';
import { startUiSession } from './ui-session.js';

export function registerUiCommands(program) {
    const uiCmd = new Command('ui').description('Interactive command explorer');

    uiCmd.action(async () => {
        try {
            await startUiSession();
        } catch (error) {
            console.error('❌ UI session failed:', error.message);
            process.exit(1);
        }
    });

    program.addCommand(uiCmd);
}
