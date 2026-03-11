// BotClient
export { BotClient } from './BotClient/BotClient';

// PokeSandbox-specific AdminMenu extensions (v1 — retained for reference)
export { AdminMenu } from './AdminMenu/AdminMenu';
export { AdminMenuBuilder } from './AdminMenu/AdminMenuBuilder';

// v2 AdminMenu builder
export { AdminMenuBuilderV2 } from './AdminMenu/AdminMenuBuilderV2';
export type {
  AdminHelpers,
  AdminMenuContext,
} from './AdminMenu/AdminMenuBuilderV2';

// Re-export menu types and constants for backward compatibility
// For framework classes (Menu, Session, MenuBuilder, MenuWorkflow), import directly from @flowcord
export * from './types';
