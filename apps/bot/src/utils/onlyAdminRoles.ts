import { getCachedServer } from '@bot/cache';

export const onlyAdminRoles = async (guildId: string): Promise<string[]> => {
  const server = await getCachedServer(guildId);
  return server?.adminRoleIds ?? [];
};
