import { findServer, type Server } from '@shared';

export const onlyAdminRoles = async (guildId: string): Promise<string[]> => {
  const server: Server | null = await findServer({ serverId: guildId });
  return server?.adminRoleIds ?? [];
};
