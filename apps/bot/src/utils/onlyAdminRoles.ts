import { Server } from '@shared/models';

export const onlyAdminRoles = async (guildId: string): Promise<string[]> => {
  const server: Server | null = await Server.findOne().byServerId(guildId);
  return server?.adminRoleIds ?? [];
};
