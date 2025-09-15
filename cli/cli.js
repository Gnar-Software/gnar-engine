#!/usr/bin/env node

import { Command } from 'commander';
import { registerProfileCommand } from './profiles/command.js';
import { registerDevCommands } from './dev/commands.js';
import { registerControlCommands } from './control/commands.js';
import { registerScaffolderCommands } from './scaffolder/commands.js';
import { registerAgentCommands } from './agent/commands.js';

// Create a new program
const program = new Command();

// Register CLI commands
registerDevCommands(program);
registerProfileCommand(program);
registerControlCommands(program);
registerScaffolderCommands(program);
registerAgentCommands(program);

// Parse CLI input
program.parse(process.argv);
