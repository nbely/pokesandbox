import { RegionsCommand } from './regions';
import { ServerCommand } from './server';
import { DiscoveryCommand } from './server/submenus/discoveryMenu/discoveryMenu';

export const slashCommands = [DiscoveryCommand, RegionsCommand, ServerCommand];
